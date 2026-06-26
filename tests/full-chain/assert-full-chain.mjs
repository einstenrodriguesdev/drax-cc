// ─────────────────────────────────────────────────────────────────────────────
// L3 — full-chain structural verifier (Task #7).
//
// Deterministic assertions over the END STATE of a happy-path run
// (/drax → /drax-site → /drax-build → /drax-secure → /drax-deploy). The chain itself
// is LLM-driven and founder-triggered; THIS verifies the captured result is correct:
//   • every slice produced its artifacts at the correct sectorial paths
//   • all FIVE completion flags are true, and (via the dependency chain + optional
//     flagHistory) flipped IN ORDER — you cannot reach a later flag without the
//     earlier slice's outputs (order enforcement itself is proven in Tasks #5/#6)
//   • VERIFICATION_REPORT = VERIFIED, the built site meets the mobile-viewport bar
//   • Definition of Done (§10): DEPLOY_REPORT names draxbusiness.cloud with a passing
//     health check + rollback, deployedLive=true, and the SITEMAP carries the
//     mandatory enterprise pages (pricing/blog/documentation + legal)
//   • the lock ended clean (IDLE) and the reset count is 0
//
// Point it at a real captured run root (containing drax-workspace/ + drax-site/),
// or at the golden fixture. Returns { pass, failures[] }.
// ─────────────────────────────────────────────────────────────────────────────
import fs from "node:fs";
import path from "node:path";

const CANONICAL_FLAG_ORDER = [
  "brandingLoopComplete",
  "siteBuildPackageComplete",
  "siteBuildComplete",
  "securityComplete",
  "deployedLive",
];

// Mandatory enterprise pages the Definition of Done (DRAX_SYSTEM.md §10) requires
// the shipped site to carry, matched against the SITEMAP (PT/EN aliases).
const REQUIRED_PAGES = [
  { key: "pricing", aliases: ["pricing", "preco", "plano"] },
  { key: "blog", aliases: ["blog"] },
  { key: "documentation", aliases: ["documenta", "/docs", "/doc"] },
  { key: "privacy (legal)", aliases: ["privac"] },
  { key: "terms (legal)", aliases: ["termos", "terms"] },
];

function artifactManifest(b) {
  return {
    1: [
      "marketing/branding/BRANDING_DECISION.md",
      "marketing/branding/BRANDING.md",
      "marketing/branding/NAME_CLEARANCE.md",
      "marketing/branding/BRAND_METRICS_AND_TRIGGERS.md",
    ],
    2: [
      `marketing/${b}-site/SITE_BRIEF.md`,
      `marketing/${b}-site/SITEMAP.md`,
      `marketing/${b}-site/KEYWORD_MAP.md`,
      `marketing/${b}-site/COPY_DECK.md`,
      `marketing/${b}-site/WIREFRAMES.md`,
      `marketing/${b}-site/CONVERSION_INSTRUMENTATION.md`,
      `marketing/${b}-site/SITE_BUILD_PACKAGE.md`,
      `design/${b}-site/DESIGN_DECISION.md`,
      `design/${b}-site/DESIGN_TOKENS.md`,
      `legal/${b}-site/LEGAL_REQUIREMENTS.md`,
      `legal/${b}-site/LEGAL_PAGES.md`,
      "legal/COMPLIANCE_BASELINE.md",
    ],
    3: [
      `technology/${b}-site/BUILD_READINESS.md`,
      `technology/${b}-site/BUILD_PLAN.md`,
      `technology/${b}-site/QA_REPORT.md`,
      `technology/${b}-site/VERIFICATION_REPORT.md`,
    ],
    4: [
      `cybersecurity/${b}-site/SECURITY_DECISION.md`,
      `cybersecurity/${b}-site/VPS_HARDENING.md`,
      `cybersecurity/${b}-site/PENTEST_REPORT.md`,
      `cybersecurity/${b}-site/SOC_RUNBOOK.md`,
    ],
    5: [
      `technology/${b}-site/DEPLOY_REPORT.md`,
    ],
  };
}

const read = (p) => { try { return fs.readFileSync(p, "utf8"); } catch { return null; } };
const exists = (p) => { try { return fs.existsSync(p); } catch { return false; } };

export function assertFullChain(runRoot) {
  const ws = path.join(runRoot, "drax-workspace");
  const site = path.join(runRoot, "drax-site");
  const failures = [];
  const fail = (m) => failures.push(m);

  const state = (() => { try { return JSON.parse(read(path.join(ws, "init", "STATE.json"))); } catch { return null; } })();
  if (!state) return { pass: false, failures: ["STATE.json missing or invalid"] };
  const brand = String(state.productName || "brand").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "brand";

  // 1. all flags true
  for (const f of CANONICAL_FLAG_ORDER) if (state[f] !== true) fail(`flag ${f} is not true`);

  // 2. artifacts present at correct sectorial paths
  const manifest = artifactManifest(brand);
  for (const slice of [1, 2, 3, 4, 5]) {
    for (const rel of manifest[slice]) if (!exists(path.join(ws, rel))) fail(`slice ${slice}: missing artifact ${rel}`);
  }

  // 3. order proxy — each completion flag requires its slice's defining output.
  if (state.siteBuildPackageComplete && !exists(path.join(ws, `marketing/${brand}-site/SITE_BUILD_PACKAGE.md`)))
    fail("siteBuildPackageComplete=true but SITE_BUILD_PACKAGE.md absent (order violation)");
  const vr = read(path.join(ws, `technology/${brand}-site/VERIFICATION_REPORT.md`));
  if (state.siteBuildComplete && !(vr && /Verdict:\s*VERIFIED/.test(vr)))
    fail("siteBuildComplete=true but VERIFICATION_REPORT is not VERIFIED (order/quality violation)");
  if (state.securityComplete && !exists(path.join(ws, `cybersecurity/${brand}-site/SOC_RUNBOOK.md`)))
    fail("securityComplete=true but slice-4 outputs absent (order violation)");
  const deployReport = read(path.join(ws, `technology/${brand}-site/DEPLOY_REPORT.md`));
  if (state.deployedLive && !state.securityComplete)
    fail("deployedLive=true but securityComplete is not (order violation — never deploy an unhardened site)");
  if (state.deployedLive && !deployReport)
    fail("deployedLive=true but DEPLOY_REPORT.md absent (order violation)");

  // 3b. Definition of Done — the deploy actually went live and is reachable.
  if (!deployReport) fail("DEPLOY_REPORT.md missing (run is not done until deployed)");
  else {
    if (!/draxbusiness\.cloud/.test(deployReport)) fail("DEPLOY_REPORT does not name the target domain draxbusiness.cloud");
    if (!/(health[\s-]*check|reachable|200\b|HEALTHY|live)/i.test(deployReport))
      fail("DEPLOY_REPORT records no successful health check / reachability evidence");
    if (!/rollback/i.test(deployReport)) fail("DEPLOY_REPORT records no rollback path");
  }
  if (state.deployedLive !== true) fail("deployedLive is not true (the site is not live)");

  // 3c. Mandatory enterprise pages present in the shipped SITEMAP (DoD §10).
  const sitemap = read(path.join(ws, `marketing/${brand}-site/SITEMAP.md`)) || "";
  const smLc = sitemap.toLowerCase();
  for (const pg of REQUIRED_PAGES) {
    if (!pg.aliases.some((a) => smLc.includes(a))) fail(`mandatory page "${pg.key}" absent from SITEMAP (DoD requires pricing/blog/documentation + legal pages)`);
  }

  // 4. VERIFICATION_REPORT = VERIFIED
  if (!vr) fail("VERIFICATION_REPORT.md missing");
  else if (!/Verdict:\s*VERIFIED/.test(vr)) fail(`VERIFICATION_REPORT is not VERIFIED`);

  // 5. lock ended clean (IDLE or absent)
  const lock = (() => { try { return JSON.parse(read(path.join(ws, "init", "EXECUTION_LOCK.json"))); } catch { return null; } })();
  if (lock && lock.status !== "IDLE") fail(`lock did not end IDLE (status: ${lock.status})`);

  // 6. reset count = 0
  const resetLog = read(path.join(ws, "init", "LOCK_RESET_LOG.md"));
  const resetCount = resetLog ? (resetLog.match(/lock reset/g) || []).length : 0;
  if (resetCount !== 0) fail(`lock reset count = ${resetCount} (expected 0)`);

  // 7. flagHistory (optional) — canonical order + non-decreasing timestamps
  if (Array.isArray(state.flagHistory)) {
    const seq = state.flagHistory.map((e) => e.flag);
    if (JSON.stringify(seq) !== JSON.stringify(CANONICAL_FLAG_ORDER))
      fail(`flagHistory order ${JSON.stringify(seq)} != canonical ${JSON.stringify(CANONICAL_FLAG_ORDER)}`);
    const ts = state.flagHistory.map((e) => Date.parse(e.at));
    for (let i = 1; i < ts.length; i++) if (!(ts[i] >= ts[i - 1])) fail(`flagHistory timestamps not monotonic at index ${i}`);
  }

  // 8. built deliverable meets the mobile-viewport bar (ties L3 to the known-good standard)
  const html = read(path.join(site, "index.html"));
  if (!html) fail("built site drax-site/index.html missing");
  else {
    const vp = html.match(/<meta\s+name=["']viewport["']\s+content=["']([^"']+)["']/i);
    if (!vp || !/initial-scale=1\b/.test(vp[1])) fail(`built site viewport not initial-scale=1 (got "${vp ? vp[1] : "none"}")`);
  }

  return { pass: failures.length === 0, failures, resetCount, brand };
}

// CLI: point at a real captured run root (containing drax-workspace/ + drax-site/).
//   node assert-full-chain.mjs /path/to/run-root
import { fileURLToPath as _f } from "node:url";
if (process.argv[1] && path.resolve(process.argv[1]) === _f(import.meta.url)) {
  const runRoot = process.argv[2] || process.cwd();
  const r = assertFullChain(runRoot);
  console.log(`# full-chain structural check — ${runRoot}`);
  console.log(`brand: ${r.brand} | reset count: ${r.resetCount}`);
  if (r.pass) console.log("PASS — happy-path run is structurally complete and ordered.");
  else { console.log(`FAIL — ${r.failures.length} issue(s):`); for (const f of r.failures) console.log(`  - ${f}`); }
  process.exit(r.pass ? 0 : 1);
}
