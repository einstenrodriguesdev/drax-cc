// ─────────────────────────────────────────────────────────────────────────────
// LLM-judge aggregation harness (Task #10).
//
// Splits the problem: the JUDGMENT is supplied by N fresh, independent agent-judges
// (orchestrated outside this file — each reads the rubric + artifact and returns a
// {criterion: score} object); THIS file owns the deterministic, testable part —
// rubric lookup, weighted scoring, and VARIANCE across the N samples. Running N=3
// (or more) measures whether quality is stable, not lucky in one run.
//
// A type passes only if mean >= threshold AND std-dev <= instabilityBand: a high
// mean with high variance is flagged as UNSTABLE even though structure passed.
// ─────────────────────────────────────────────────────────────────────────────
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export function stats(nums) {
  if (!nums.length) return { mean: 0, sd: 0, n: 0 };
  const mean = nums.reduce((a, b) => a + b, 0) / nums.length;
  const variance = nums.reduce((a, b) => a + (b - mean) ** 2, 0) / nums.length;
  return { mean, sd: Math.sqrt(variance), n: nums.length };
}

const round = (x) => Math.round(x * 100) / 100;

// samplesByArtifact: { "<rel path>": { type, samples: [ {crit:score,...}, ... ] } }
export function aggregate(samplesByArtifact, rubrics) {
  const band = rubrics.instabilityBand ?? 0.75;
  const report = [];
  for (const [file, entry] of Object.entries(samplesByArtifact)) {
    const rubric = rubrics.types[entry.type] || rubrics.types.default;
    const crits = rubric.criteria.map((c) => c.name);
    // Per sample: equal-weighted mean of its criterion scores (0-5).
    const sampleScores = entry.samples.map((s) => stats(crits.map((c) => Number(s[c] ?? 0))).mean);
    const { mean, sd, n } = stats(sampleScores);
    // Per-criterion mean across samples (to see WHICH criterion drags/varies).
    const perCriterion = {};
    for (const c of crits) {
      const cs = stats(entry.samples.map((s) => Number(s[c] ?? 0)));
      perCriterion[c] = { mean: round(cs.mean), sd: round(cs.sd) };
    }
    const passThreshold = mean >= rubric.threshold;
    const stable = sd <= band;
    report.push({
      file, type: entry.type, n,
      mean: round(mean), sd: round(sd),
      threshold: rubric.threshold, band,
      passThreshold, stable, pass: passThreshold && stable,
      perCriterion,
    });
  }
  const allPass = report.every((r) => r.pass);
  return { allPass, report };
}

export function printReport({ allPass, report }) {
  console.log("# LLM-judge — quality scores (mean ± sd over N samples)");
  for (const r of report) {
    const flags = [r.passThreshold ? null : "BELOW-THRESHOLD", r.stable ? null : "UNSTABLE"].filter(Boolean);
    console.log(`\n${r.file}  [${r.type}]  n=${r.n}`);
    console.log(`  score: ${r.mean} ± ${r.sd}  (threshold ${r.threshold}, band ${r.band}) → ${r.pass ? "PASS" : "FLAG: " + flags.join(", ")}`);
    for (const [c, s] of Object.entries(r.perCriterion)) console.log(`    - ${c}: ${s.mean} ± ${s.sd}`);
  }
  console.log(`\n${allPass ? "PASS" : "FLAG"} — ${report.filter((r) => !r.pass).length} artifact(s) flagged for quality.`);
}

// CLI: node judge.mjs <samples.json> [rubrics.json]
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const HERE = path.dirname(fileURLToPath(import.meta.url));
  const samples = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
  const rubrics = JSON.parse(fs.readFileSync(process.argv[3] || path.join(HERE, "rubrics.json"), "utf8"));
  const result = aggregate(samples, rubrics);
  printReport(result);
  process.exit(result.allPass ? 0 : 1);
}
