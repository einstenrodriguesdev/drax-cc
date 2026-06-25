// ─────────────────────────────────────────────────────────────────────────────
// Run observability reporter (Task #11).
//
// Consolidates the per-run signals that reveal PROCESS HEALTH beyond pass/fail:
//   • which agents activated per slice (and the demand-test activate/skip/reuse
//     decision + recorded reason — DRAX_SYSTEM §4)
//   • wall-clock per slice (from STATE.flagHistory timestamps)
//   • the lock RESET COUNT (from init/LOCK_RESET_LOG.md) — frequent resets signal
//     lock/protocol miscalibration and are a red flag even in a run that "passed"
//
// Canonical inputs (see DRAX_SYSTEM "Observability"):
//   drax-workspace/init/STATE.json            (.flagHistory: [{flag, at}])
//   drax-workspace/init/ACTIVATION_LOG.jsonl  ({slice, agent, decision, reason, at})
//   drax-workspace/init/LOCK_RESET_LOG.md     (append-only reset log)
// ─────────────────────────────────────────────────────────────────────────────
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const FLAG_BY_SLICE = { 1: "brandingLoopComplete", 2: "siteBuildPackageComplete", 3: "siteBuildComplete", 4: "securityComplete" };
const read = (p) => { try { return fs.readFileSync(p, "utf8"); } catch { return null; } };
const fmtMs = (ms) => (ms == null ? "n/a" : ms < 0 ? "n/a" : `${Math.round(ms / 60000)}m`);

export function observeRun(runRoot) {
  const ws = path.join(runRoot, "drax-workspace");
  const state = (() => { try { return JSON.parse(read(path.join(ws, "init", "STATE.json"))); } catch { return {}; } })();
  const flags = [];

  // ── wall-clock per slice (from flagHistory) ───────────────────────────────────
  const hist = Array.isArray(state.flagHistory) ? state.flagHistory : null;
  const at = {};
  if (hist) for (const e of hist) at[e.flag] = Date.parse(e.at);
  const boundaries = [Date.parse(state.createdAt), at.brandingLoopComplete, at.siteBuildPackageComplete, at.siteBuildComplete, at.securityComplete];
  const wallClock = {};
  for (let s = 1; s <= 4; s++) {
    const start = boundaries[s - 1], end = boundaries[s];
    wallClock[s] = (hist && start != null && end != null) ? end - start : null;
  }
  const total = (hist && boundaries[0] != null && boundaries[4] != null) ? boundaries[4] - boundaries[0] : null;

  // ── activation log: agents per slice + demand-test decisions ──────────────────
  const events = [];
  const logRaw = read(path.join(ws, "init", "ACTIVATION_LOG.jsonl"));
  if (logRaw) for (const line of logRaw.trim().split("\n").filter(Boolean)) {
    try { events.push(JSON.parse(line)); } catch { flags.push(`unparseable ACTIVATION_LOG line: ${line.slice(0, 60)}`); }
  }
  const perSlice = {};
  for (let s = 1; s <= 4; s++) perSlice[s] = { activate: [], skip: [], reuse: [], noReason: [] };
  for (const e of events) {
    const bucket = perSlice[e.slice];
    if (!bucket) { flags.push(`activation event for unknown slice ${e.slice}`); continue; }
    (bucket[e.decision] || (bucket[e.decision] = [])).push(e.agent);
    if (!e.reason || String(e.reason).trim() === "") bucket.noReason.push(`${e.agent}/${e.decision}`);
  }

  // ── lock reset count ──────────────────────────────────────────────────────────
  const resetRaw = read(path.join(ws, "init", "LOCK_RESET_LOG.md"));
  const resetCount = resetRaw ? (resetRaw.match(/lock reset/g) || []).length : 0;

  // ── health flags ──────────────────────────────────────────────────────────────
  if (resetCount > 0) flags.push(`lock reset count = ${resetCount} (lock/protocol miscalibration — red flag)`);
  for (let s = 1; s <= 4; s++) {
    if (state[FLAG_BY_SLICE[s]] === true) {
      const b = perSlice[s];
      const total = b.activate.length + b.skip.length + b.reuse.length;
      if (logRaw && total === 0) flags.push(`slice ${s} completed but no activations logged (un-instrumented)`);
      if (b.noReason.length) flags.push(`slice ${s}: demand-test decisions missing a reason: ${b.noReason.join(", ")}`);
    }
  }
  if (!hist) flags.push("STATE.flagHistory absent — wall-clock per slice unavailable (instrument it)");
  if (!logRaw) flags.push("ACTIVATION_LOG.jsonl absent — agent activations / demand-test decisions not captured");

  return { healthy: flags.length === 0, flags, resetCount, wallClock, total, perSlice, hasHistory: !!hist, hasActivationLog: !!logRaw };
}

export function printRun(r) {
  console.log("# Run observability report");
  console.log(`\nverdict: ${r.healthy ? "HEALTHY" : `${r.flags.length} FLAG(S)`}`);
  console.log(`lock reset count: ${r.resetCount}`);
  console.log(`\nwall-clock per slice:`);
  for (let s = 1; s <= 4; s++) console.log(`  slice ${s}: ${fmtMs(r.wallClock[s])}`);
  console.log(`  total: ${fmtMs(r.total)}`);
  console.log(`\nagents + demand-test per slice:`);
  for (let s = 1; s <= 4; s++) {
    const b = r.perSlice[s];
    console.log(`  slice ${s}: activate[${b.activate.join(", ") || "—"}]` +
      (b.skip.length ? ` skip[${b.skip.join(", ")}]` : "") +
      (b.reuse.length ? ` reuse[${b.reuse.join(", ")}]` : ""));
  }
  if (!r.healthy) { console.log(`\nflags:`); for (const f of r.flags) console.log(`  - ${f}`); }
}

// CLI: node observe.mjs <runRoot>
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const r = observeRun(process.argv[2] || process.cwd());
  printRun(r);
  process.exit(r.healthy ? 0 : 1);
}
