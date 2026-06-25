// Quality linter test (Task #9): the golden completed run lints CLEAN; each injected
// quality defect is caught; and NEEDS_DECISION is allowed mid-run but forbidden final.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { lintWorkspace } from "./artifact-linter.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const GOLDEN_WS = path.join(HERE, "..", "fixtures", "golden-run", "workspace");

let failures = 0;
const ok = (cond, msg) => { console.log(`  ${cond ? "✓" : "✗"} ${msg}`); if (!cond) failures++; };

function freshWs(mutate) {
  const ws = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "drax-qa-")), "drax-workspace");
  fs.cpSync(GOLDEN_WS, ws, { recursive: true });
  if (mutate) mutate(ws);
  return ws;
}
const append = (ws, rel, s) => fs.appendFileSync(path.join(ws, rel), s);
const overwrite = (ws, rel, s) => fs.writeFileSync(path.join(ws, rel), s);
const strip = (ws, rel, re) => { const p = path.join(ws, rel); fs.writeFileSync(p, fs.readFileSync(p, "utf8").split("\n").filter((l) => !re.test(l)).join("\n")); };

// ── golden lints clean (final) ───────────────────────────────────────────────────
console.log("\n# golden completed run (final)");
{
  const r = lintWorkspace(freshWs(), { final: true });
  ok(r.clean, `CLEAN — 0 issues across ${r.fileCount} artifacts [${r.issues.map((i) => i.file + ":" + i.issue).join("; ") || "none"}]`);
}

// ── each quality defect is caught ─────────────────────────────────────────────────
function expectIssue(label, mutate, matcher) {
  const r = lintWorkspace(freshWs(mutate), { final: true });
  ok(!r.clean && r.issues.some((i) => matcher.test(i.issue)), `${label} → caught [${r.issues.map((i) => i.issue).find((x) => matcher.test(x)) || "NOT FOUND"}]`);
}

console.log("\n# injected quality defects (must be caught)");
expectIssue("lorem ipsum", (ws) => append(ws, "marketing/branding/BRANDING.md", "\nLorem ipsum dolor sit amet."), /lorem/);
expectIssue("TBD", (ws) => append(ws, "marketing/meicaixa-site/COPY_DECK.md", "\nPricing: TBD"), /TBD/);
expectIssue("placeholder", (ws) => append(ws, "marketing/meicaixa-site/SITEMAP.md", "\nplaceholder section"), /placeholder/);
expectIssue("unsubstituted <brand>", (ws) => append(ws, "marketing/meicaixa-site/SITE_BRIEF.md", "\nWelcome to <brand>."), /<brand>/);
expectIssue("residual NEEDS_DECISION (final)", (ws) => append(ws, "technology/meicaixa-site/BUILD_PLAN.md", "\nNEEDS_DECISION: pick a CDN"), /NEEDS_DECISION/);
expectIssue("§5 design decision missing variations/metric/trigger",
  (ws) => overwrite(ws, "design/meicaixa-site/DESIGN_DECISION.md", "# Design decision\nmobile-first, high-contrast. WCAG AA."),
  /§5/);
expectIssue("§5.1 missing Web-grounded on NAME_CLEARANCE",
  (ws) => strip(ws, "marketing/branding/NAME_CLEARANCE.md", /Web-grounded/i),
  /§5\.1/);
expectIssue("VERIFICATION_REPORT prose-only (no executed evidence)",
  (ws) => overwrite(ws, "technology/meicaixa-site/VERIFICATION_REPORT.md", "# VERIFICATION_REPORT\nVerdict: VERIFIED\nLooks good, ship it."),
  /executed evidence/);

// ── NEEDS_DECISION: allowed per-slice, forbidden final ───────────────────────────
console.log("\n# NEEDS_DECISION lenience: per-slice OK, final fails");
{
  const mut = (ws) => append(ws, "technology/meicaixa-site/BUILD_PLAN.md", "\nNEEDS_DECISION: pick a CDN");
  const perSlice = lintWorkspace(freshWs(mut), { final: false });
  ok(!perSlice.issues.some((i) => /NEEDS_DECISION/.test(i.issue)), "per-slice run tolerates an open NEEDS_DECISION");
  const final = lintWorkspace(freshWs(mut), { final: true });
  ok(final.issues.some((i) => /NEEDS_DECISION/.test(i.issue)), "final run flags the residual NEEDS_DECISION");
}

console.log(`\n${failures === 0 ? "PASS" : "FAIL"} — ${failures} assertion failure(s).`);
process.exit(failures === 0 ? 0 : 1);
