// ─────────────────────────────────────────────────────────────────────────────
// Per-artifact quality linter (Task #9) — cheap, deterministic, no LLM.
// Runnable per slice (lenient) and at end of run (strict / final).
//
// Enforces:
//   (1) Forbidden placeholders: lorem ipsum, TBD, "placeholder", an unsubstituted
//       "<brand>" template token, and — when final — any residual NEEDS_DECISION.
//   (2) §5 test-and-metrics: taste/contested decisions (BRANDING_DECISION,
//       DESIGN_DECISION) must carry variations + a metric + a trigger.
//   (3) §5.1 external-fact gate: NAME_CLEARANCE, LEGAL_REQUIREMENTS, BUILD_PLAN must
//       carry "Web-grounded: yes — <source/date>" (or, mid-run only, a NEEDS_DECISION).
//   (4) VERIFICATION_REPORT must cite EXECUTED evidence (screenshot / axe / HTTP 200 /
//       viewport / console), not prose — at least two distinct evidence tokens.
// ─────────────────────────────────────────────────────────────────────────────
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const FORBIDDEN = [
  { re: /lorem ipsum/i, id: "lorem" },
  { re: /\bTBD\b/, id: "TBD" },
  { re: /placeholder/i, id: "placeholder" },
  { re: /<brand>/, id: "unsubstituted <brand> token" },
];

const DECISION_TASTE = new Set(["BRANDING_DECISION.md", "DESIGN_DECISION.md"]);
const EXTERNAL_FACT = new Set(["NAME_CLEARANCE.md", "LEGAL_REQUIREMENTS.md", "BUILD_PLAN.md"]);
const EVIDENCE_TOKENS = [/screenshot/i, /\baxe\b/i, /\b200\b|HTTP/i, /viewport|initial-scale/i, /console/i];

export function lintArtifact(absPath, { final = false } = {}) {
  const base = path.basename(absPath);
  const text = fs.readFileSync(absPath, "utf8");
  const issues = [];
  const add = (m) => issues.push(m);

  // (1) forbidden placeholders
  for (const f of FORBIDDEN) if (f.re.test(text)) add(`forbidden: ${f.id}`);
  if (final && /NEEDS_DECISION/.test(text)) add("residual NEEDS_DECISION in a final artifact");

  // (2) §5 test-and-metrics on taste decisions
  if (DECISION_TASTE.has(base)) {
    if (!/variation|A\/B|\bvs\b/i.test(text)) add("§5: missing variations to test");
    if (!/metric|kpi|rate|ctr|recall|awareness/i.test(text)) add("§5: missing a metric");
    if (!/trigger|scale|threshold/i.test(text)) add("§5: missing a change trigger");
  }

  // (3) §5.1 external-fact gate
  if (EXTERNAL_FACT.has(base)) {
    const grounded = /Web-grounded:\s*yes/i.test(text);
    const deferred = !final && /NEEDS_DECISION/.test(text);
    if (!grounded && !deferred) add("§5.1: missing 'Web-grounded: yes — <source/date>'");
  }

  // (4) VERIFICATION_REPORT must cite executed evidence
  if (base === "VERIFICATION_REPORT.md") {
    const hits = EVIDENCE_TOKENS.filter((re) => re.test(text)).length;
    if (hits < 2) add(`Step 3.5: VERIFICATION_REPORT lacks executed evidence (found ${hits} token[s], need ≥2)`);
  }

  return { file: absPath, base, issues };
}

export function lintWorkspace(wsRoot, { final = false } = {}) {
  const results = [];
  const walk = (d) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.name.endsWith(".md")) results.push(lintArtifact(p, { final }));
    }
  };
  walk(wsRoot);
  const issues = results.flatMap((r) => r.issues.map((i) => ({ file: path.relative(wsRoot, r.file), issue: i })));
  return { clean: issues.length === 0, issues, fileCount: results.length };
}

// CLI: node artifact-linter.mjs <wsRoot> [--final]
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const wsRoot = process.argv[2] || process.cwd();
  const final = process.argv.includes("--final");
  const r = lintWorkspace(wsRoot, { final });
  console.log(`# artifact linter — ${wsRoot} (${final ? "final" : "per-slice"}, ${r.fileCount} files)`);
  if (r.clean) console.log("CLEAN — all artifacts pass the quality bar.");
  else { console.log(`ISSUES — ${r.issues.length}:`); for (const i of r.issues) console.log(`  - ${i.file}: ${i.issue}`); }
  process.exit(r.clean ? 0 : 1);
}
