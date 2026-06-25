// LLM-judge harness self-test (Task #10) — DETERMINISTIC, no LLM.
// Validates the aggregation/variance mechanics with synthetic samples so the math
// and the flagging logic are trustworthy before real judges feed it. Covers the
// three outcomes the harness must distinguish:
//   • stable & high → PASS
//   • below threshold → FLAG (BELOW-THRESHOLD)
//   • high mean but high variance → FLAG (UNSTABLE)  ← the "lucky run" signal
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { aggregate, stats } from "./judge.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const rubrics = JSON.parse(fs.readFileSync(path.join(HERE, "rubrics.json"), "utf8"));

let failures = 0;
const ok = (cond, msg) => { console.log(`  ${cond ? "✓" : "✗"} ${msg}`); if (!cond) failures++; };

// sanity: stats()
console.log("\n# stats()");
{
  const s = stats([5, 5, 5]);
  ok(s.mean === 5 && s.sd === 0, "identical samples → sd 0");
  const u = stats([1, 5]);
  ok(u.mean === 3 && u.sd === 2, "1 and 5 → mean 3, sd 2");
}

// Build N=3 synthetic samples per artifact using the default rubric (3 criteria).
const triple = (a, b, c) => [a, b, c].map((v) => ({ clarity: v, completeness: v, internal_consistency: v }));
const samples = {
  "good/STABLE_HIGH.md": { type: "default", samples: triple(5, 4, 5) },     // mean ~4.67, sd low
  "bad/BELOW_THRESHOLD.md": { type: "default", samples: triple(2, 3, 2) },   // mean ~2.33 < 3.0
  "bad/UNSTABLE.md": { type: "default", samples: triple(1, 5, 1) },          // mean ~2.33 AND high sd
  "good/HIGH_MEAN_UNSTABLE.md": { type: "default", samples: triple(5, 1, 5) }, // mean ~3.67 (>3) but sd high → UNSTABLE
};

console.log("\n# aggregate() outcomes");
const { report } = aggregate(samples, rubrics);
const by = Object.fromEntries(report.map((r) => [r.file, r]));

ok(by["good/STABLE_HIGH.md"].pass === true, "stable & high → PASS");
ok(by["good/STABLE_HIGH.md"].stable === true && by["good/STABLE_HIGH.md"].passThreshold === true, "  (both stable and above threshold)");

ok(by["bad/BELOW_THRESHOLD.md"].pass === false && by["bad/BELOW_THRESHOLD.md"].passThreshold === false, "below threshold → FLAG (BELOW-THRESHOLD)");

ok(by["good/HIGH_MEAN_UNSTABLE.md"].passThreshold === true, "high-mean-unstable is ABOVE threshold…");
ok(by["good/HIGH_MEAN_UNSTABLE.md"].stable === false, "  …but flagged UNSTABLE (variance caught the lucky-run risk)");
ok(by["good/HIGH_MEAN_UNSTABLE.md"].pass === false, "  …so it does NOT pass");

ok(by["bad/UNSTABLE.md"].n === 3, "N is reported (n=3)");

// per-criterion breakdown is present (shows WHICH criterion varies)
ok(Object.keys(by["good/STABLE_HIGH.md"].perCriterion).length === 3, "per-criterion breakdown present");

console.log(`\n${failures === 0 ? "PASS" : "FAIL"} — ${failures} assertion failure(s).`);
process.exit(failures === 0 ? 0 : 1);
