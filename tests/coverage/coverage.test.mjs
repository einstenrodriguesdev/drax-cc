// L2 coverage-gate test (Task #5): run Step 1 against the seeded package (happy) and
// three fault-injected variants, asserting READY vs BLOCKED + correct C-level routing.
// Proves "never build on a blind spec" is mechanical, not prose.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { coverageGate } from "./coverage-gate.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SEED = path.join(HERE, "..", "fixtures", "workspace-seed");
const BRAND = "meicaixa";

let failures = 0;
const ok = (cond, msg) => { console.log(`  ${cond ? "✓" : "✗"} ${msg}`); if (!cond) failures++; };

function freshWs(mutate) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "drax-cov-"));
  const ws = path.join(dir, "drax-workspace");
  fs.cpSync(SEED, ws, { recursive: true });
  if (mutate) mutate(ws);
  return ws;
}
const rel = (ws, r) => path.join(ws, `${r.replace("BRAND", BRAND)}`);
const edit = (ws, r, fn) => { const p = rel(ws, r); fs.writeFileSync(p, fn(fs.readFileSync(p, "utf8"))); };

// ── happy path: complete package → READY ─────────────────────────────────────────
console.log("\n# happy path (complete package)");
{
  const r = coverageGate(freshWs(), BRAND);
  ok(r.verdict === "READY", `verdict = ${r.verdict} (expected READY) [gaps: ${r.gaps.map((g) => g.detail).join("; ") || "none"}]`);
  ok(r.mayBuild === true, "may proceed to architecture/build");
  ok(r.gaps.length === 0, "zero gaps");
}

// ── fault A: mandatory legal page removed from LEGAL_PAGES → BLOCKED, route CLO ────
console.log("\n# fault A: legal page removed from LEGAL_PAGES");
{
  const ws = freshWs((ws) => edit(ws, "legal/BRAND-site/LEGAL_PAGES.md", (t) =>
    t.split("\n").filter((l) => !/termos/i.test(l)).join("\n")));
  const r = coverageGate(ws, BRAND);
  ok(r.verdict === "BLOCKED", `verdict = ${r.verdict} (expected BLOCKED)`);
  ok(!r.mayBuild, "does NOT build");
  ok(r.owners.includes("CLO"), `routed to CLO [owners: ${r.owners.join(", ")}]`);
  ok(r.gaps.some((g) => /termos/i.test(g.detail)), "gap names the missing legal page");
}

// ── fault B: a component missing entirely → BLOCKED, route Design-CTO ──────────────
console.log("\n# fault B: DESIGN_TOKENS component missing");
{
  const ws = freshWs((ws) => fs.rmSync(rel(ws, "design/BRAND-site/DESIGN_TOKENS.md")));
  const r = coverageGate(ws, BRAND);
  ok(r.verdict === "BLOCKED", `verdict = ${r.verdict} (expected BLOCKED)`);
  ok(!r.mayBuild, "does NOT build");
  ok(r.owners.includes("Design-CTO"), `routed to Design-CTO [owners: ${r.owners.join(", ")}]`);
  ok(r.gaps.some((g) => /DESIGN_TOKENS/.test(g.detail)), "gap names the missing component");
}

// ── fault C: sitemap/copy contradiction → BLOCKED, route CMO ───────────────────────
console.log("\n# fault C: sitemap lists a page with no copy");
{
  const ws = freshWs((ws) => edit(ws, "marketing/BRAND-site/SITEMAP.md", (t) =>
    t + "\n- /precos.html (pricing page)\n"));
  const r = coverageGate(ws, BRAND);
  ok(r.verdict === "BLOCKED", `verdict = ${r.verdict} (expected BLOCKED)`);
  ok(!r.mayBuild, "does NOT build");
  ok(r.owners.includes("CMO"), `routed to CMO [owners: ${r.owners.join(", ")}]`);
  ok(r.gaps.some((g) => /precos/.test(g.detail) && /contradiction/i.test(g.detail)), "gap is the sitemap/copy contradiction");
}

console.log(`\n${failures === 0 ? "PASS" : "FAIL"} — ${failures} assertion failure(s).`);
process.exit(failures === 0 ? 0 : 1);
