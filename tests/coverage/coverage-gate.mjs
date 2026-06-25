// ─────────────────────────────────────────────────────────────────────────────
// tech-build Step 1 — coverage gate, deterministic engine (L2 harness).
//
// The runnable, deterministic core of the coverage gate the CTO runs in
// skills/tech-build Step 1: does the marketing Site Build Package actually cover
// everything needed to build, before any code is written? It reads the seeded
// package + its components and emits BUILD_READINESS.md = READY / BLOCKED, routing
// every gap (NEEDS_DECISION) to the owning C-level. NOT a replacement for the CTO
// agent — the executable reference its verdict must reproduce.
//
// WIREFRAMES is read from marketing/<brand>-site/ — canonical per the site-build
// skill (what the ux-designer executes) and the lock ARTIFACT_MAP. Task #6 aligned
// DRAX_SYSTEM.md §8 to this. (Owner stays Design-CTO — path != ownership.)
// ─────────────────────────────────────────────────────────────────────────────
import fs from "node:fs";
import path from "node:path";

// Mandatory legal pages for this jurisdiction (LGPD): privacy + terms.
const REQUIRED_LEGAL = ["privacidade", "termos"];

function read(wsRoot, rel) {
  try { return fs.readFileSync(path.join(wsRoot, rel), "utf8"); } catch { return null; }
}

export function coverageGate(wsRoot, brand) {
  const P = (rel) => rel.replace(/\$\{brand\}/g, brand);
  const COMPONENTS = [
    { key: "SITE_BUILD_PACKAGE", rel: P("marketing/${brand}-site/SITE_BUILD_PACKAGE.md"), owner: "CMO" },
    { key: "SITEMAP", rel: P("marketing/${brand}-site/SITEMAP.md"), owner: "CMO" },
    { key: "COPY_DECK", rel: P("marketing/${brand}-site/COPY_DECK.md"), owner: "CMO" },
    { key: "KEYWORD_MAP", rel: P("marketing/${brand}-site/KEYWORD_MAP.md"), owner: "CMO" },
    { key: "CONVERSION", rel: P("marketing/${brand}-site/CONVERSION_INSTRUMENTATION.md"), owner: "CMO" },
    { key: "DESIGN_TOKENS", rel: P("design/${brand}-site/DESIGN_TOKENS.md"), owner: "Design-CTO" },
    { key: "DESIGN_DECISION", rel: P("design/${brand}-site/DESIGN_DECISION.md"), owner: "Design-CTO" },
    { key: "WIREFRAMES", rel: P("marketing/${brand}-site/WIREFRAMES.md"), owner: "Design-CTO" },
    { key: "LEGAL_PAGES", rel: P("legal/${brand}-site/LEGAL_PAGES.md"), owner: "CLO" },
    { key: "LEGAL_REQUIREMENTS", rel: P("legal/${brand}-site/LEGAL_REQUIREMENTS.md"), owner: "CLO" },
    { key: "COMPLIANCE_BASELINE", rel: "legal/COMPLIANCE_BASELINE.md", owner: "CLO" },
  ];

  const gaps = [];
  const gap = (owner, detail) => gaps.push({ owner, detail });
  const doc = {};
  for (const c of COMPONENTS) doc[c.key] = read(wsRoot, c.rel);

  // 1. Presence — every component file exists and is non-empty.
  for (const c of COMPONENTS) {
    if (doc[c.key] === null || doc[c.key].trim() === "") {
      gap(c.owner, `missing/empty component ${c.key} (${c.rel})`);
    }
  }

  // Helper extractors (tolerant of missing docs).
  const sitemap = doc.SITEMAP || "";
  const copy = doc.COPY_DECK || "";
  const legalPages = doc.LEGAL_PAGES || "";
  const conversion = doc.CONVERSION || "";

  const pages = [...sitemap.matchAll(/^-\s+(\/\S*)/gm)].map((m) => m[1]); // e.g. "/", "/termos.html"
  const declaredLegal = REQUIRED_LEGAL.filter((p) => new RegExp(`/${p}`, "i").test(legalPages));
  const isLegalPage = (pg) => REQUIRED_LEGAL.some((p) => pg.includes(p));

  // 2. Mandatory legal pages present in BOTH the legal deck AND the sitemap (CLO owns).
  for (const p of REQUIRED_LEGAL) {
    if (!declaredLegal.includes(p)) gap("CLO", `mandatory legal page "/${p}" not declared in LEGAL_PAGES.md`);
    if (!pages.some((pg) => pg.includes(p))) gap("CLO", `mandatory legal page "/${p}" missing from SITEMAP.md`);
  }

  // 3. Disclosures — cookie notice + footer legal block referenced (CLO owns).
  if (!/cookie/i.test(legalPages)) gap("CLO", "cookie notice/disclosure not referenced in LEGAL_PAGES.md");
  if (!/footer|rodap[eé]/i.test(legalPages)) gap("CLO", "footer legal block not referenced in LEGAL_PAGES.md");

  // 4. Content-page coverage — each non-legal page must have copy (CMO),
  //    plus the build needs tokens (Design-CTO), a conversion goal + keyword (CMO).
  for (const pg of pages) {
    if (isLegalPage(pg)) continue;
    const slug = pg === "/" ? "home" : pg.replace(/^\/+|\.html$/g, "");
    const referenced = pg === "/" ? /h1|hero|home/i.test(copy) : new RegExp(slug, "i").test(copy);
    if (!referenced) gap("CMO", `SITEMAP lists "${pg}" but COPY_DECK has no copy for it (sitemap/copy contradiction)`);
  }
  if (!/goal|signup|conversion/i.test(conversion)) gap("CMO", "no measured conversion goal in CONVERSION_INSTRUMENTATION.md");
  if (!/keyword|intent|primary/i.test(doc.KEYWORD_MAP || "")) gap("CMO", "no keyword/intent mapping in KEYWORD_MAP.md");

  // 5. CTA contradiction — a CTA instrumented for conversion must exist in the copy.
  const cta = (conversion.match(/data-cta="([^"]+)"/) || [])[1];
  if (cta && !copy.includes(cta)) gap("CMO", `CONVERSION instruments CTA "${cta}" that is absent from COPY_DECK (contradiction)`);

  const verdict = gaps.length === 0 ? "READY" : "BLOCKED";
  const mayBuild = verdict === "READY";

  const report = [
    `# BUILD_READINESS — coverage gate (Step 1)`,
    `Verdict: ${verdict === "READY" ? "READY" : `BLOCKED (${gaps.length} gap[s])`}`,
    `May proceed to architecture/build: ${mayBuild}`,
    ``,
    `## Gaps / NEEDS_DECISION`,
    gaps.length
      ? gaps.map((g) => `- NEEDS_DECISION: ${g.detail} → route to ${g.owner}`).join("\n")
      : "- none — package fully covers the build.",
    ``,
  ].join("\n");

  const outRel = P("technology/${brand}-site/BUILD_READINESS.md");
  fs.mkdirSync(path.join(wsRoot, path.dirname(outRel)), { recursive: true });
  fs.writeFileSync(path.join(wsRoot, outRel), report);

  return { verdict, mayBuild, gaps, owners: [...new Set(gaps.map((g) => g.owner))], report };
}
