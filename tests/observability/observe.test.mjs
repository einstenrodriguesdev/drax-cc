// Observability reporter test (Task #11): the golden run reports HEALTHY with full
// signals; injected process-health problems are flagged even though structure passed.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { observeRun } from "./observe.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const GOLDEN = path.join(HERE, "..", "fixtures", "golden-run");

let failures = 0;
const ok = (cond, msg) => { console.log(`  ${cond ? "✓" : "✗"} ${msg}`); if (!cond) failures++; };

function runRoot(mutate) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "drax-obs-"));
  fs.cpSync(path.join(GOLDEN, "workspace"), path.join(dir, "drax-workspace"), { recursive: true });
  if (mutate) mutate(path.join(dir, "drax-workspace"));
  return dir;
}
const initPath = (ws, f) => path.join(ws, "init", f);

// ── golden → HEALTHY with full signals ───────────────────────────────────────────
console.log("\n# golden run → HEALTHY");
{
  const r = observeRun(runRoot());
  ok(r.healthy, `HEALTHY [flags: ${r.flags.join("; ") || "none"}]`);
  ok(r.resetCount === 0, "reset count = 0");
  ok(r.hasHistory && r.total > 0, `wall-clock computed (total ${Math.round(r.total / 60000)}m)`);
  ok(r.hasActivationLog, "activation log captured");
  // agents per slice present and the demand-test decisions parsed
  ok(r.perSlice[1].activate.includes("brand-strategist"), "slice 1 records brand-strategist activation");
  ok(r.perSlice[2].reuse.includes("brand-strategist"), "slice 2 records a REUSE decision (demand test)");
  ok(r.perSlice[3].skip.includes("senior-backend-engineer"), "slice 3 records a SKIP decision (demand test)");
  ok([1, 2, 3, 4].every((s) => r.perSlice[s].activate.length > 0), "every slice has ≥1 activation");
}

// ── reset count > 0 → red flag even though everything else is fine ────────────────
console.log("\n# injected: a lock reset was logged");
{
  const r = observeRun(runRoot((ws) => fs.writeFileSync(initPath(ws, "LOCK_RESET_LOG.md"),
    "# reset log\n\n## 2026-06-25 — lock reset\nReason: agent got stuck\n")));
  ok(!r.healthy && r.resetCount === 1, "reset count = 1 detected");
  ok(r.flags.some((f) => /miscalibration/.test(f)), "flagged as miscalibration red flag");
}

// ── a demand-test decision missing its reason → flagged ──────────────────────────
console.log("\n# injected: demand-test decision with no reason");
{
  const r = observeRun(runRoot((ws) => fs.appendFileSync(initPath(ws, "ACTIVATION_LOG.jsonl"),
    '\n{"slice":2,"agent":"affiliate-marketing-manager","decision":"skip","reason":""}\n')));
  ok(!r.healthy && r.flags.some((f) => /missing a reason/.test(f)), "flagged: demand-test decision missing a reason");
}

// ── activation log absent → un-instrumented signal ───────────────────────────────
console.log("\n# injected: activation log missing");
{
  const r = observeRun(runRoot((ws) => fs.rmSync(initPath(ws, "ACTIVATION_LOG.jsonl"))));
  ok(!r.healthy && r.flags.some((f) => /ACTIVATION_LOG\.jsonl absent/.test(f)), "flagged: activations not captured");
}

// ── flagHistory absent → wall-clock unavailable ──────────────────────────────────
console.log("\n# injected: STATE.flagHistory removed");
{
  const r = observeRun(runRoot((ws) => {
    const p = initPath(ws, "STATE.json"); const s = JSON.parse(fs.readFileSync(p, "utf8")); delete s.flagHistory;
    fs.writeFileSync(p, JSON.stringify(s, null, 2));
  }));
  ok(r.flags.some((f) => /flagHistory absent/.test(f)), "flagged: wall-clock unavailable without flagHistory");
  ok(r.wallClock[1] === null, "wall-clock falls back to n/a");
}

console.log(`\n${failures === 0 ? "PASS" : "FAIL"} — ${failures} assertion failure(s).`);
process.exit(failures === 0 ? 0 : 1);
