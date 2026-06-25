// L2 gate test (Task #4): run the Step 3.5 engine against all three seeds and assert
// each lands on its expected verdict — proving the gate discriminates, not just passes.
//   known-good       → VERIFIED, siteBuildComplete=true,  /drax-secure accepts
//   known-bad-render → BLOCKED (viewport + axe image-alt), no advance, /drax-secure refuses
//   known-bad-build  → BLOCKED (build-error before QA),    no advance, /drax-secure refuses
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { verifyGate } from "./verify-gate.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(HERE, ".out");
const FIXTURES = path.join(HERE, "..", "fixtures");

let failures = 0;
const ok = (cond, msg) => { console.log(`  ${cond ? "✓" : "✗"} ${msg}`); if (!cond) failures++; };

const cases = ["known-good", "known-bad-render", "known-bad-build"];

for (const seed of cases) {
  const meta = JSON.parse(fs.readFileSync(path.join(FIXTURES, "seeds", seed, "meta.json"), "utf8"));
  console.log(`\n# ${seed} (expect ${meta.expectGate})`);
  const r = await verifyGate(seed, path.join(OUT, seed));

  ok(r.verdict === meta.expectGate, `verdict = ${r.verdict} (expected ${meta.expectGate})`);
  const shouldAdvance = meta.expectGate === "VERIFIED";
  ok(r.siteBuildComplete === shouldAdvance, `siteBuildComplete = ${r.siteBuildComplete} (expected ${shouldAdvance})`);
  ok(r.secureAccepts === shouldAdvance, `/drax-secure ${r.secureAccepts ? "accepts" : "refuses"} (expected ${shouldAdvance ? "accepts" : "refuses"})`);

  const defectIds = r.defects.map((d) => d.id);
  if (seed === "known-bad-render") {
    ok(defectIds.includes("viewport-missing-initial-scale"), `caught viewport defect [${defectIds.join(", ") || "none"}]`);
    ok(defectIds.some((id) => id.startsWith("axe:")), `caught an axe a11y violation [${defectIds.join(", ") || "none"}]`);
  }
  if (seed === "known-bad-build") {
    ok(defectIds.includes("build-error"), `caught build-error before QA [${defectIds.join(", ") || "none"}]`);
    ok(!defectIds.some((id) => id.startsWith("axe:")), `did NOT run QA/axe on a broken build`);
  }
  if (seed === "known-good") {
    ok(r.defects.length === 0, `zero defects (no false BLOCK) [${defectIds.join(", ") || "none"}]`);
  }
}

console.log(`\n${failures === 0 ? "PASS" : "FAIL"} — ${failures} assertion failure(s). Evidence in tests/gate/.out/`);
process.exit(failures === 0 ? 0 : 1);
