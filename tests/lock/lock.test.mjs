// ─────────────────────────────────────────────────────────────────────────────
// L1 — deterministic unit/integration tests for the validation execution lock.
// No LLM, runs in seconds. Drives the REAL core, hook, and CLI processes.
//
// Covers (Task #3):
//   • pure core: normalizeSubagent, isDraxDispatch, brandSlug, computeCurrentSlice,
//     SLICE_PRECONDITION, activeRunId, idleLock
//   • ARTIFACT_MAP resolution by (slice, agent) incl. the new slice-3 VERIFICATION_REPORT.md
//   • atomic write integrity (no leftover .tmp, valid JSON, roundtrip)
//   • state machine via real hooks/CLI: IDLE→RUNNING→AWAITING_CONFIRMATION→IDLE
//   • run-identity guard (lock.runId != active run → deny)
//   • reset append-only log + reason required
//   • config flag on/off (enabled→enforces, disabled→silent passthrough)
// ─────────────────────────────────────────────────────────────────────────────
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import {
  normalizeSubagent,
  isDraxDispatch,
  brandSlug,
  computeCurrentSlice,
  SLICE_PRECONDITION,
  resolveExpectedArtifact,
  activeRunId,
  idleLock,
  writeLockAtomic,
  readLock,
  lockPath,
} from "../../hooks/drax-lock-core.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.join(HERE, "..", "..");
const PRE = path.join(REPO, "hooks", "pre-tool-use-lock.mjs");
const POST = path.join(REPO, "hooks", "post-tool-use-lock.mjs");
const BIN = path.join(REPO, "bin", "drax-lock.mjs");
const CONFIG = path.join(REPO, "drax-lock.config.json");
const SEED = path.join(REPO, "tests", "fixtures", "workspace-seed");

let failures = 0;
let group = "";
const section = (s) => console.log(`\n# ${(group = s)}`);
const ok = (cond, msg) => { console.log(`  ${cond ? "✓" : "✗"} ${msg}`); if (!cond) failures++; };
const eq = (a, b, msg) => ok(JSON.stringify(a) === JSON.stringify(b), `${msg} → ${JSON.stringify(a)}`);

const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), "drax-lock-"));
function tmpProject() {
  const dir = tmp();
  fs.cpSync(SEED, path.join(dir, "drax-workspace"), { recursive: true });
  return dir; // contains drax-workspace/ (currentSlice 3, runId fixture-meicaixa-001)
}
const ws = (proj) => path.join(proj, "drax-workspace");
const touch = (root, rel) => { fs.mkdirSync(path.join(root, path.dirname(rel)), { recursive: true }); fs.writeFileSync(path.join(root, rel), "x"); };

function runHook(script, evt) {
  const r = spawnSync("node", [script], { input: JSON.stringify(evt), encoding: "utf8" });
  return { code: r.status, stdout: r.stdout || "", stderr: r.stderr || "" };
}
function runCli(args, projDir) {
  const r = spawnSync("node", [BIN, ...args], {
    encoding: "utf8",
    env: { ...process.env, CLAUDE_PROJECT_DIR: projDir },
  });
  return { code: r.status, stdout: r.stdout || "", stderr: r.stderr || "" };
}
const isDeny = (out) => { try { return JSON.parse(out).hookSpecificOutput?.permissionDecision === "deny"; } catch { return false; } };

// ─── 1. pure core ──────────────────────────────────────────────────────────────
section("pure core");
eq(normalizeSubagent("drax:cmo"), "cmo", "normalizeSubagent strips namespace");
eq(normalizeSubagent("CMO"), "cmo", "normalizeSubagent lowercases");
eq(normalizeSubagent(null), null, "normalizeSubagent(null)");
eq(isDraxDispatch("Task", { subagent_type: "cto" }), "cto", "isDraxDispatch Task→cto");
eq(isDraxDispatch("Agent", { subagent_type: "drax:qa-engineer" }), "qa-engineer", "isDraxDispatch Agent namespaced");
eq(isDraxDispatch("Bash", { subagent_type: "cto" }), null, "isDraxDispatch non-Task→null");
eq(isDraxDispatch("Task", { subagent_type: "not-a-real-agent" }), null, "isDraxDispatch unknown agent→null");
eq(brandSlug({ productName: "MeiCaixa" }), "meicaixa", "brandSlug MeiCaixa");
eq(brandSlug({ productName: "DRAX" }), "drax", "brandSlug DRAX");
eq(brandSlug({}), "brand", "brandSlug fallback");
eq(computeCurrentSlice({}), 1, "slice 1 (nothing done)");
eq(computeCurrentSlice({ brandingLoopComplete: true }), 2, "slice 2");
eq(computeCurrentSlice({ brandingLoopComplete: true, siteBuildPackageComplete: true }), 3, "slice 3");
eq(computeCurrentSlice({ brandingLoopComplete: true, siteBuildPackageComplete: true, siteBuildComplete: true }), 4, "slice 4");
eq(SLICE_PRECONDITION, { 2: "brandingLoopComplete", 3: "siteBuildPackageComplete", 4: "siteBuildComplete" }, "SLICE_PRECONDITION map");
eq(activeRunId({ runId: "x", createdAt: "t" }), "x", "activeRunId prefers runId");
eq(activeRunId({ createdAt: "t" }), "t", "activeRunId falls back to createdAt");
eq(activeRunId(null), null, "activeRunId(null)");
const idle = idleLock("r1");
ok(idle.status === "IDLE" && idle.runId === "r1" && idle.currentAgent === null, "idleLock shape");

// ─── 2. ARTIFACT_MAP resolution (incl. new slice-3 VERIFICATION_REPORT) ─────────
section("ARTIFACT_MAP resolution");
{
  const root = tmp();
  const r1 = resolveExpectedArtifact(3, "cto", root, "meicaixa");
  eq(r1.expectedArtifact, "technology/meicaixa-site/BUILD_READINESS.md", "slice3 cto first-missing = BUILD_READINESS");
  touch(root, "technology/meicaixa-site/BUILD_READINESS.md");
  touch(root, "technology/meicaixa-site/BUILD_PLAN.md");
  const r2 = resolveExpectedArtifact(3, "cto", root, "meicaixa");
  eq(r2.expectedArtifact, "technology/meicaixa-site/VERIFICATION_REPORT.md", "slice3 cto → VERIFICATION_REPORT (the new gate artifact)");
  touch(root, "technology/meicaixa-site/VERIFICATION_REPORT.md");
  const r3 = resolveExpectedArtifact(3, "cto", root, "meicaixa");
  eq(r3.expectedArtifact, "technology/meicaixa-site/VERIFICATION_REPORT.md", "slice3 cto all-present → last (VERIFICATION_REPORT)");
  eq(resolveExpectedArtifact(3, "qa-engineer", root, "meicaixa").expectedArtifact, "technology/meicaixa-site/QA_REPORT.md", "slice3 qa-engineer → QA_REPORT");
  eq(resolveExpectedArtifact(3, "devops-engineer", root, "meicaixa").expectedArtifact, "technology/meicaixa-site/DEPLOY_PLAN.md", "slice3 devops → DEPLOY_PLAN");
  ok(resolveExpectedArtifact(3, "cmo", root, "meicaixa").inSlice === false, "slice3 cmo → inSlice false (no role)");

  const root2 = tmp();
  touch(root2, "marketing/branding/NAME_CLEARANCE.md");
  eq(resolveExpectedArtifact(1, "clo", root2, "meicaixa").expectedArtifact, "marketing/branding/NAME_CLEARANCE.md", "slice1 clo augmenting → NAME_CLEARANCE (last when present)");
}

// ─── 3. atomic write integrity ──────────────────────────────────────────────────
section("atomic write integrity");
{
  const root = tmp();
  fs.mkdirSync(path.join(root, "init"), { recursive: true });
  const lk = idleLock("r-atomic");
  writeLockAtomic(root, lk);
  ok(fs.existsSync(lockPath(root)), "lock file written");
  ok(!fs.existsSync(lockPath(root) + ".tmp"), "no leftover .tmp after atomic write");
  let parsed = null;
  try { parsed = JSON.parse(fs.readFileSync(lockPath(root), "utf8")); } catch {}
  ok(parsed && parsed.runId === "r-atomic", "written lock parses as valid JSON");
  eq(readLock(root).status, "IDLE", "readLock roundtrip");
}

// ─── 4. state machine via real hooks + CLI ──────────────────────────────────────
section("state machine: IDLE→RUNNING→AWAITING→IDLE");
{
  const proj = tmpProject();
  const W = ws(proj);
  // IDLE → RUNNING (PreToolUse allows + writes RUNNING)
  const a = runHook(PRE, { tool_name: "Task", tool_input: { subagent_type: "qa-engineer" }, cwd: proj });
  ok(a.code === 0 && !isDeny(a.stdout), "PreToolUse on first dispatch → allow (passthrough)");
  let lock = readLock(W);
  ok(lock.status === "RUNNING" && lock.currentAgent === "qa-engineer", "lock RUNNING, agent qa-engineer");
  eq(lock.expectedArtifact, "technology/meicaixa-site/QA_REPORT.md", "expectedArtifact set at dispatch time");
  ok(/QA_REPORT\.md$/.test(lock.currentStep), "currentStep carries artifact basename");

  // RUNNING blocks a second, different dispatch
  const b = runHook(PRE, { tool_name: "Task", tool_input: { subagent_type: "cto" }, cwd: proj });
  ok(isDeny(b.stdout), "second dispatch while RUNNING → deny");
  ok(/BLOCKED/.test(b.stdout), "deny reason mentions BLOCKED");
  ok(readLock(W).currentAgent === "qa-engineer", "lock unchanged by blocked dispatch");

  // RUNNING → AWAITING via PostToolUse once the artifact exists
  touch(W, "technology/meicaixa-site/QA_REPORT.md");
  const c = runHook(POST, { tool_name: "Task", tool_input: { subagent_type: "qa-engineer" }, cwd: proj });
  ok(c.code === 0, "PostToolUse exit 0");
  lock = readLock(W);
  ok(lock.status === "AWAITING_CONFIRMATION", "post-verify → AWAITING_CONFIRMATION");
  eq(lock.lastCompletedArtifact, "technology/meicaixa-site/QA_REPORT.md", "lastCompletedArtifact recorded");

  // AWAITING blocks dispatch
  const d = runHook(PRE, { tool_name: "Task", tool_input: { subagent_type: "cto" }, cwd: proj });
  ok(isDeny(d.stdout) && /awaiting confirmation/i.test(d.stdout), "dispatch while AWAITING → deny (awaiting confirmation)");

  // confirm requires the matching artifact
  const wrong = runCli(["confirm", "--artifact", "technology/meicaixa-site/WRONG.md"], proj);
  ok(wrong.code !== 0, "confirm with wrong artifact → non-zero");
  ok(readLock(W).status === "AWAITING_CONFIRMATION", "lock stays AWAITING after bad confirm");
  const good = runCli(["confirm", "--artifact", "technology/meicaixa-site/QA_REPORT.md"], proj);
  ok(good.code === 0, "confirm with matching artifact → exit 0");
  lock = readLock(W);
  ok(lock.status === "IDLE" && lock.currentAgent === null && lock.expectedArtifact === null, "AWAITING→IDLE, in-flight cleared");
  ok(typeof lock.lastConfirmedAt === "string", "lastConfirmedAt stamped");
}

// ─── 5. complete backstop guard ──────────────────────────────────────────────────
section("complete backstop");
{
  const proj = tmpProject();
  const fromIdle = runCli(["complete"], proj);
  ok(fromIdle.code !== 0 && /requires status == RUNNING/.test(fromIdle.stderr), "complete from IDLE → refused");
}

// ─── 6. run-identity guard ───────────────────────────────────────────────────────
section("run-identity guard");
{
  const proj = tmpProject();
  const W = ws(proj);
  // Plant a lock owned by a DIFFERENT run; active STATE runId is fixture-meicaixa-001.
  writeLockAtomic(W, { ...idleLock("SOME-OTHER-RUN"), status: "IDLE" });
  const r = runHook(PRE, { tool_name: "Task", tool_input: { subagent_type: "qa-engineer" }, cwd: proj });
  ok(isDeny(r.stdout) && /different run/i.test(r.stdout), "lock from a different run → deny");
}

// ─── 7. reset: append-only + reason required ─────────────────────────────────────
section("reset append-only");
{
  const proj = tmpProject();
  const W = ws(proj);
  const noReason = runCli(["reset"], proj);
  ok(noReason.code !== 0 && /--reason/.test(noReason.stderr), "reset without --reason → refused");
  runCli(["reset", "--reason", "first reset"], proj);
  runCli(["reset", "--reason", "second reset"], proj);
  const log = fs.readFileSync(path.join(W, "init", "LOCK_RESET_LOG.md"), "utf8");
  const count = (log.match(/lock reset/g) || []).length;
  ok(count === 2, `reset log append-only (2 entries, found ${count})`);
  ok(/first reset/.test(log) && /second reset/.test(log), "both reset reasons preserved");
  ok(readLock(W).status === "IDLE", "lock IDLE after reset");
}

// ─── 8. config flag on/off ───────────────────────────────────────────────────────
section("config flag on/off");
{
  const original = fs.readFileSync(CONFIG, "utf8");
  try {
    // Build an AWAITING workspace that WOULD deny a dispatch while enabled.
    const proj = tmpProject();
    const W = ws(proj);
    writeLockAtomic(W, { ...idleLock("fixture-meicaixa-001"), status: "AWAITING_CONFIRMATION", lastCompletedArtifact: "x.md" });

    // enabled → enforces (deny)
    fs.writeFileSync(CONFIG, JSON.stringify({ validationSequentialLockEnabled: true }, null, 2));
    const on = runHook(PRE, { tool_name: "Task", tool_input: { subagent_type: "qa-engineer" }, cwd: proj });
    ok(isDeny(on.stdout), "config enabled → enforces (deny)");

    // disabled → silent passthrough (no output, exit 0, lock untouched)
    fs.writeFileSync(CONFIG, JSON.stringify({ validationSequentialLockEnabled: false }, null, 2));
    const off = runHook(PRE, { tool_name: "Task", tool_input: { subagent_type: "qa-engineer" }, cwd: proj });
    ok(off.code === 0 && off.stdout.trim() === "", "config disabled → silent passthrough");
    ok(readLock(W).status === "AWAITING_CONFIRMATION", "disabled hook leaves lock untouched");
  } finally {
    fs.writeFileSync(CONFIG, original); // restore exactly
  }
  ok(fs.readFileSync(CONFIG, "utf8") === original, "config restored to original");
}

console.log(`\n${failures === 0 ? "PASS" : "FAIL"} — ${failures} assertion failure(s).`);
process.exit(failures === 0 ? 0 : 1);
