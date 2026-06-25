// ─────────────────────────────────────────────────────────────────────────────
// L2 — execution-lock NEGATIVES as slice-level scenarios (Task #6).
// Complements the L1 unit suite (tests/lock) by framing the denials as real slice
// situations, and adds the cross-cutting guarantee: none of these block a
// legitimate happy-path dispatch (zero false-BLOCK).
//
//   (1) precondition — dispatch a slice-2 agent with brandingLoopComplete=false → BLOCK
//   (2) parallelism  — a second DRAX dispatch while RUNNING → BLOCK
//   (3) awaiting     — any dispatch while AWAITING_CONFIRMATION → BLOCK
//   (4) run-identity — STATE.createdAt changed (no runId) → BLOCK 'different run'
//   (X) happy path   — legitimate dispatch at slices 1 and 3 → ALLOW (no false BLOCK)
// ─────────────────────────────────────────────────────────────────────────────
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { readLock, writeLockAtomic, idleLock } from "../../hooks/drax-lock-core.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.join(HERE, "..", "..");
const PRE = path.join(REPO, "hooks", "pre-tool-use-lock.mjs");
const SEED = path.join(REPO, "tests", "fixtures", "workspace-seed");

let failures = 0;
const ok = (cond, msg) => { console.log(`  ${cond ? "✓" : "✗"} ${msg}`); if (!cond) failures++; };

function project(stateMutate) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "drax-slice-"));
  const ws = path.join(dir, "drax-workspace");
  fs.cpSync(SEED, ws, { recursive: true });
  if (stateMutate) {
    const sp = path.join(ws, "init", "STATE.json");
    const s = JSON.parse(fs.readFileSync(sp, "utf8"));
    fs.writeFileSync(sp, JSON.stringify(stateMutate(s), null, 2));
  }
  return { dir, ws };
}
function pre(proj, agent) {
  const r = spawnSync("node", [PRE], {
    input: JSON.stringify({ tool_name: "Task", tool_input: { subagent_type: agent }, cwd: proj }),
    encoding: "utf8",
  });
  return { code: r.status, stdout: r.stdout || "" };
}
const denied = (out) => { try { return JSON.parse(out).hookSpecificOutput?.permissionDecision === "deny"; } catch { return false; } };
const reason = (out) => { try { return JSON.parse(out).hookSpecificOutput?.permissionDecisionReason || ""; } catch { return ""; } };

// ── (1) precondition: slice-2 agent dispatched before branding is done ───────────
console.log("\n# (1) precondition — slice-2 agent with brandingLoopComplete=false");
{
  const { dir } = project((s) => ({ ...s, brandingLoopComplete: false }));
  const r = pre(dir, "content-strategist"); // slice-2 agent; current slice is now 1
  ok(denied(r.stdout), "content-strategist dispatched at slice 1 → deny");
  ok(/missing precondition/i.test(reason(r.stdout)), `reason cites missing precondition [${reason(r.stdout).slice(0, 80)}…]`);
}

// ── (2) parallelism: a second dispatch while one is RUNNING ───────────────────────
console.log("\n# (2) parallelism — second DRAX dispatch while RUNNING");
{
  const { dir, ws } = project();
  const first = pre(dir, "qa-engineer"); // IDLE → RUNNING
  ok(!denied(first.stdout) && readLock(ws).status === "RUNNING", "first dispatch takes the lock (RUNNING)");
  const second = pre(dir, "devops-engineer"); // different agent, same slice
  ok(denied(second.stdout) && /BLOCKED/.test(reason(second.stdout)), "second concurrent dispatch → deny");
  ok(readLock(ws).currentAgent === "qa-engineer", "lock still held by the first agent (no preemption)");
}

// ── (3) awaiting: AWAITING_CONFIRMATION blocks all dispatch ───────────────────────
console.log("\n# (3) awaiting — AWAITING_CONFIRMATION blocks dispatch");
{
  const { dir, ws } = project();
  writeLockAtomic(ws, {
    ...idleLock("fixture-meicaixa-001"),
    status: "AWAITING_CONFIRMATION",
    lastCompletedArtifact: "technology/meicaixa-site/QA_REPORT.md",
  });
  const r = pre(dir, "qa-engineer");
  ok(denied(r.stdout) && /awaiting confirmation/i.test(reason(r.stdout)), "dispatch while AWAITING → deny until confirm");
}

// ── (4) run-identity via STATE.createdAt (no runId) ───────────────────────────────
console.log("\n# (4) run-identity — STATE.createdAt changed");
{
  // STATE without runId → activeRunId falls back to createdAt.
  const { dir, ws } = project((s) => { const { runId, ...rest } = s; return { ...rest, createdAt: "2026-01-01T00:00:00.000Z" }; });
  // Lock stamped to the ORIGINAL createdAt.
  writeLockAtomic(ws, { ...idleLock("2026-01-01T00:00:00.000Z"), status: "IDLE" });
  // Now the run's createdAt changes (a fresh run rewrote STATE).
  const sp = path.join(ws, "init", "STATE.json");
  const s = JSON.parse(fs.readFileSync(sp, "utf8"));
  fs.writeFileSync(sp, JSON.stringify({ ...s, createdAt: "2026-02-02T00:00:00.000Z" }, null, 2));
  const r = pre(dir, "qa-engineer");
  ok(denied(r.stdout) && /different run/i.test(reason(r.stdout)), "lock from a different createdAt → deny 'different run'");
}

// ── (X) cross-cutting: zero false-BLOCK on legitimate dispatches ──────────────────
console.log("\n# (X) zero false-BLOCK — legitimate dispatches must pass");
{
  // slice 1 happy: branding pending, a slice-1 agent runs.
  const a = project((s) => ({ ...s, brandingLoopComplete: false }));
  const r1 = pre(a.dir, "brand-strategist");
  ok(!denied(r1.stdout) && readLock(a.ws).status === "RUNNING", "slice-1 brand-strategist at slice 1 → allow");

  // slice 3 happy: the seed is at slice 3, a slice-3 agent runs.
  const b = project();
  const r3 = pre(b.dir, "qa-engineer");
  ok(!denied(r3.stdout) && readLock(b.ws).status === "RUNNING", "slice-3 qa-engineer at slice 3 → allow");
}

console.log(`\n${failures === 0 ? "PASS" : "FAIL"} — ${failures} assertion failure(s).`);
process.exit(failures === 0 ? 0 : 1);
