// ─────────────────────────────────────────────────────────────────────────────
// DRAX Step 3.5 live-verification gate — deterministic engine (L2 harness).
//
// This is the mechanical core of what the qa-engineer is INSTRUCTED to do in
// skills/tech-build Step 3.5, made runnable and deterministic so we can prove the
// gate discriminates a professional build from a broken one. It is NOT a
// replacement for the qa-engineer agent; it is the executable reference the agent's
// Playwright pass must reproduce, and the assertion target for the seeds.
//
// Pipeline per seed:
//   1. build  (node fixtures/lib/build.mjs <seed>) — non-zero exit => BLOCKED (build-error)
//   2. serve  (node fixtures/lib/serve.mjs <seed>) — boot the built dist/
//   3. browser (Playwright): HTTP 200, single H1 renders, zero console errors,
//      axe a11y filtered to serious+critical, screenshot evidence
//   4. raw-HTML <meta viewport> must contain initial-scale=1  (the mobile blind spot
//      a forced-viewport browser hides — asserted against the RAW served HTML)
//   5. verdict VERIFIED iff zero defects, else BLOCKED. Models the governance facts:
//      siteBuildComplete = (verdict===VERIFIED); /drax-secure accepts iff VERIFIED.
//
// Writes evidence-backed QA_REPORT.md + VERIFICATION_REPORT.md to <outDir>.
// ─────────────────────────────────────────────────────────────────────────────
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFile, spawn } from "node:child_process";
import { chromium } from "playwright";
import * as axeMod from "@axe-core/playwright";

const AxeBuilder = axeMod.default ?? axeMod.AxeBuilder;
const HERE = path.dirname(fileURLToPath(import.meta.url));
const FIXTURES = path.join(HERE, "..", "fixtures");
const PAGES = ["/"]; // the seeds ship a single page; extend when seeds add routes

const sh = (cmd, args) =>
  new Promise((resolve) =>
    execFile(cmd, args, { encoding: "utf8" }, (err, stdout, stderr) =>
      resolve({ code: err ? (err.code ?? 1) : 0, stdout, stderr })
    )
  );

function startServer(seedDir) {
  return new Promise((resolve, reject) => {
    const child = spawn("node", [path.join(FIXTURES, "lib", "serve.mjs"), seedDir, "0"]);
    let buf = "";
    const onData = (d) => {
      buf += d.toString();
      const m = buf.match(/LISTENING (http:\/\/127\.0\.0\.1:\d+)/);
      if (m) { child.stdout.off("data", onData); resolve({ child, url: m[1] }); }
    };
    child.stdout.on("data", onData);
    child.on("error", reject);
    setTimeout(() => reject(new Error("server did not start")), 8000);
  });
}

export async function verifyGate(seedName, outDir) {
  const seedDir = path.join(FIXTURES, "seeds", seedName);
  const meta = JSON.parse(fs.readFileSync(path.join(seedDir, "meta.json"), "utf8"));
  fs.mkdirSync(outDir, { recursive: true });
  const defects = [];
  const evidence = [];

  // ── 1. build ────────────────────────────────────────────────────────────────
  const build = await sh("node", [path.join(FIXTURES, "lib", "build.mjs"), seedDir]);
  if (build.code !== 0) {
    defects.push({ id: "build-error", impact: "blocker", detail: (build.stderr || build.stdout).trim() });
    return finalize(seedName, meta, defects, evidence, outDir); // never serve/QA a broken build
  }
  evidence.push(`build: OK (exit 0) — ${build.stdout.trim()}`);

  // ── 2. serve ─────────────────────────────────────────────────────────────────
  const { child, url } = await startServer(seedDir);
  try {
    // ── 4. raw-HTML viewport (browserless; catches what forced viewport hides) ──
    const rawHome = await (await fetch(url + "/")).text();
    const vp = rawHome.match(/<meta\s+name=["']viewport["']\s+content=["']([^"']+)["']/i);
    const vpValue = vp ? vp[1] : "(none)";
    if (!vp || !/initial-scale=1\b/.test(vp[1])) {
      defects.push({ id: "viewport-missing-initial-scale", impact: "serious", detail: `raw <meta viewport> = "${vpValue}"` });
    } else {
      evidence.push(`raw viewport: "${vpValue}" — initial-scale=1 OK`);
    }

    // ── 3. browser pass ─────────────────────────────────────────────────────────
    const browser = await chromium.launch();
    const context = await browser.newContext(); // axe requires an explicit context
    const page = await context.newPage();
    const consoleErrors = [];
    page.on("console", (m) => m.type() === "error" && consoleErrors.push(m.text()));
    page.on("pageerror", (e) => consoleErrors.push(String(e)));

    for (const route of PAGES) {
      const resp = await page.goto(url + route, { waitUntil: "networkidle" });
      const status = resp ? resp.status() : 0;
      if (status !== 200) defects.push({ id: "http-status", impact: "serious", detail: `${route} → HTTP ${status}` });
      else evidence.push(`GET ${route} → 200`);

      const h1Count = await page.locator("h1").count();
      if (h1Count !== 1) defects.push({ id: "h1", impact: "serious", detail: `${route} has ${h1Count} <h1> (expected 1)` });
      else evidence.push(`${route}: single <h1> "${(await page.locator("h1").first().textContent())?.trim()}"`);

      const shot = path.join(outDir, `screenshot${route === "/" ? "-home" : route.replace(/\W+/g, "-")}.png`);
      await page.screenshot({ path: shot, fullPage: true });
      evidence.push(`screenshot: ${path.relative(HERE, shot)}`);

      const axe = await new AxeBuilder({ page }).analyze();
      const serious = axe.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
      fs.writeFileSync(path.join(outDir, `axe${route === "/" ? "-home" : route.replace(/\W+/g, "-")}.json`), JSON.stringify(axe.violations, null, 2));
      for (const v of serious) defects.push({ id: `axe:${v.id}`, impact: v.impact, detail: `${v.help} (${v.nodes.length} node[s])` });
      evidence.push(`axe ${route}: ${serious.length} serious/critical violation(s)` + (serious.length ? ` [${serious.map((v) => v.id).join(", ")}]` : ""));
    }

    if (consoleErrors.length) defects.push({ id: "console-errors", impact: "serious", detail: consoleErrors.join(" | ") });
    else evidence.push("console: 0 errors");

    await browser.close();
  } finally {
    child.kill("SIGTERM");
  }

  return finalize(seedName, meta, defects, evidence, outDir);
}

function finalize(seedName, meta, defects, evidence, outDir) {
  const verdict = defects.length === 0 ? "VERIFIED" : "BLOCKED";
  const siteBuildComplete = verdict === "VERIFIED"; // tech-build Step 4: only on VERIFIED
  const secureAccepts = verdict === "VERIFIED"; // /drax-secure precondition

  const qa = [
    `# QA_REPORT — ${seedName}`,
    `Verdict: ${verdict === "VERIFIED" ? "RELEASE-READY" : `BLOCKED (${defects.length} defect[s])`}`,
    ``,
    `## Evidence (executed)`,
    ...evidence.map((e) => `- ${e}`),
    ``,
    `## Defects`,
    defects.length ? defects.map((d) => `- [${d.impact}] ${d.id} — ${d.detail}`).join("\n") : "- none",
    ``,
  ].join("\n");
  fs.writeFileSync(path.join(outDir, "QA_REPORT.md"), qa);

  const vr = [
    `# VERIFICATION_REPORT — ${seedName}`,
    `Verdict: ${verdict}`,
    `siteBuildComplete: ${siteBuildComplete}`,
    `/drax-secure accepts: ${secureAccepts}`,
    ``,
    `## Executed evidence`,
    ...evidence.map((e) => `- ${e}`),
    ``,
    verdict === "VERIFIED"
      ? "Real render + mobile <meta viewport> + a11y verified live. Slice may advance."
      : `Routed back to build. Defects: ${defects.map((d) => d.id).join(", ")}. Slice does NOT advance.`,
    ``,
  ].join("\n");
  fs.writeFileSync(path.join(outDir, "VERIFICATION_REPORT.md"), vr);

  return { seed: seedName, verdict, defects, siteBuildComplete, secureAccepts, outDir };
}
