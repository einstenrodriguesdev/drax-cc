// L3 full-chain test (Task #7): run the structural verifier against the golden
// completed-run end state (→ PASS) and deliberately-broken variants (→ FAIL).
// A verifier that always passes is useless — the negatives prove it discriminates.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { assertFullChain } from "./assert-full-chain.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const GOLDEN = path.join(HERE, "..", "fixtures", "golden-run");

let failures = 0;
const ok = (cond, msg) => { console.log(`  ${cond ? "✓" : "✗"} ${msg}`); if (!cond) failures++; };

// Assemble a real run root (drax-workspace/ + drax-site/) from the golden source,
// then optionally mutate it to inject a fault.
function runRoot(mutate) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "drax-chain-"));
  fs.cpSync(path.join(GOLDEN, "workspace"), path.join(dir, "drax-workspace"), { recursive: true });
  fs.cpSync(path.join(GOLDEN, "site"), path.join(dir, "drax-site"), { recursive: true });
  if (mutate) mutate(dir);
  return dir;
}
const stateFile = (root) => path.join(root, "drax-workspace", "init", "STATE.json");
const editState = (root, fn) => { const s = JSON.parse(fs.readFileSync(stateFile(root), "utf8")); fs.writeFileSync(stateFile(root), JSON.stringify(fn(s), null, 2)); };

// ── happy path: golden end state → PASS ──────────────────────────────────────────
console.log("\n# happy path (golden completed run)");
{
  const r = assertFullChain(runRoot());
  ok(r.pass === true, `verifier PASS [failures: ${r.failures.join("; ") || "none"}]`);
  ok(r.resetCount === 0, "lock reset count = 0");
}

// ── negatives — each must be caught ──────────────────────────────────────────────
function expectFail(label, mutate, matcher) {
  const r = assertFullChain(runRoot(mutate));
  ok(!r.pass, `${label} → FAIL (verifier catches it)`);
  ok(r.failures.some((f) => matcher.test(f)), `   ↳ failure names it [${r.failures.find((f) => matcher.test(f)) || "NOT FOUND"}]`);
}

console.log("\n# negatives (verifier must catch each)");
expectFail("flags out of order (siteBuildComplete=false, securityComplete=true)",
  (root) => editState(root, (s) => ({ ...s, siteBuildComplete: false })),
  /siteBuildComplete/);

expectFail("VERIFICATION_REPORT = BLOCKED",
  (root) => fs.writeFileSync(path.join(root, "drax-workspace/technology/meicaixa-site/VERIFICATION_REPORT.md"), "# VERIFICATION_REPORT\nVerdict: BLOCKED (1 defect)\n"),
  /VERIFIED/);

expectFail("a lock reset was logged (reset count != 0)",
  (root) => fs.writeFileSync(path.join(root, "drax-workspace/init/LOCK_RESET_LOG.md"), "# reset log\n\n## 2026-06-25 — lock reset\nReason: x\n"),
  /reset count/);

expectFail("missing slice-2 artifact (SITEMAP)",
  (root) => fs.rmSync(path.join(root, "drax-workspace/marketing/meicaixa-site/SITEMAP.md")),
  /SITEMAP/);

expectFail("flagHistory out of order",
  (root) => editState(root, (s) => ({ ...s, flagHistory: [
    { flag: "siteBuildComplete", at: "2026-06-25T01:00:00.000Z" },
    { flag: "brandingLoopComplete", at: "2026-06-25T02:00:00.000Z" },
    { flag: "siteBuildPackageComplete", at: "2026-06-25T03:00:00.000Z" },
    { flag: "securityComplete", at: "2026-06-25T04:00:00.000Z" },
  ] })),
  /flagHistory order/);

expectFail("built site viewport regressed",
  (root) => fs.writeFileSync(path.join(root, "drax-site/index.html"), '<!doctype html><html><head><meta name="viewport" content="width=1024"></head><body><h1>x</h1></body></html>'),
  /viewport/);

console.log(`\n${failures === 0 ? "PASS" : "FAIL"} — ${failures} assertion failure(s).`);
process.exit(failures === 0 ? 0 : 1);
