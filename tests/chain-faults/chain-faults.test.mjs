// L3 fault-injection across the whole chain (Task #8). For each injected defect,
// prove the INTENDED gate catches it and the chain halts there (earlier gates passed,
// later flags never flip). Run the happy path IN PARALLEL to confirm zero false-BLOCK.
//
// Acceptance: 100% of faults caught at the intended stage; happy path all-PASS.
import path from "node:path";
import { fileURLToPath } from "node:url";
import { runChain } from "./chain-pipeline.mjs";

let failures = 0;
const ok = (cond, msg) => { console.log(`  ${cond ? "✓" : "✗"} ${msg}`); if (!cond) failures++; };

const STAGE_ORDER = ["lock", "coverage", "buildQa", "secure"];
const stageKey = { lock: "lock", coverage: "coverage", "build-qa": "buildQa", secure: "secure" };

// Scenarios: one happy + four faults, each tagged with the gate intended to catch it.
const scenarios = [
  { name: "happy path (known-good)", expectHalt: "complete" },

  { name: "legal page removed → COVERAGE gate", expectHalt: "coverage",
    workspaceMutate: (ws) => editFile(ws, "legal/meicaixa-site/LEGAL_PAGES.md", (t) =>
      t.split("\n").filter((l) => !/termos/i.test(l)).join("\n")) },

  { name: "viewport broken → PLAYWRIGHT gate (+ secure refuses)", expectHalt: "build-qa",
    siteSeed: "known-bad-render", expectDefect: /viewport/, forbidDefect: /build-error/ },

  { name: "build failed → FRONTEND no handoff (+ secure refuses)", expectHalt: "build-qa",
    siteSeed: "known-bad-build", expectDefect: /build-error/, forbidDefect: /viewport|axe/ },

  { name: "out-of-order dispatch → LOCK", expectHalt: "lock",
    // slice-3 agent dispatched while the package isn't done → current slice is 2 → lock denies
    dispatchAgent: "qa-engineer",
    workspaceMutate: (ws) => editState(ws, (s) => ({ ...s, siteBuildPackageComplete: false })) },
];

import fs from "node:fs";
function editFile(ws, rel, fn) { const p = path.join(ws, rel); fs.writeFileSync(p, fn(fs.readFileSync(p, "utf8"))); }
function editState(ws, fn) { const p = path.join(ws, "init", "STATE.json"); fs.writeFileSync(p, JSON.stringify(fn(JSON.parse(fs.readFileSync(p, "utf8"))), null, 2)); }

// Run every scenario IN PARALLEL (isolated temp dirs → also proves no cross-bleed,
// and that the happy path's gates don't false-trip alongside the faulty ones).
const results = await Promise.all(scenarios.map(runChain));

let faultsTotal = 0;
let faultsCaughtAtIntended = 0;

for (let i = 0; i < scenarios.length; i++) {
  const sc = scenarios[i];
  const r = results[i];
  console.log(`\n# ${sc.name}`);
  console.log(`  stages: lock=${r.stages.lock} coverage=${r.stages.coverage} buildQa=${r.stages.buildQa} secure=${r.stages.secure} → halt:${r.haltStage}`);

  if (sc.expectHalt === "complete") {
    // happy path: every gate passes, both flags flip, no false-BLOCK
    ok(r.haltStage === "complete", "happy path runs to completion (no false-BLOCK)");
    ok(Object.values(r.stages).every((s) => s === "PASS"), "every gate PASSED on the happy path");
    ok(r.flags.siteBuildComplete && r.flags.securityComplete, "both downstream flags flipped");
    ok(r.secureAccepts === true, "/drax-secure accepts a verified build");
    continue;
  }

  faultsTotal++;
  // (a) halted at the INTENDED gate
  const atIntended = r.haltStage === sc.expectHalt;
  if (atIntended) faultsCaughtAtIntended++;
  ok(atIntended, `caught at the intended gate (${sc.expectHalt}), not elsewhere`);

  // (b) every stage BEFORE the intended gate passed (right gate, not an earlier wrong one)
  const idx = STAGE_ORDER.indexOf(stageKey[sc.expectHalt]);
  const earlierAllPass = STAGE_ORDER.slice(0, idx).every((k) => r.stages[k] === "PASS");
  ok(earlierAllPass, "all earlier gates passed (no wrong-gate misfire)");

  // (c) the chain did NOT propagate — later flags never flipped
  ok(!r.flags.siteBuildComplete && !r.flags.securityComplete, "chain did not propagate (downstream flags stay false)");

  // (d) /drax-secure refuses for build/render faults
  if (sc.expectHalt === "build-qa") ok(r.secureAccepts === false, "/drax-secure refuses the unverified build");

  // (e) sub-stage attribution: build-half (frontend no handoff) vs QA-half (Playwright)
  if (sc.expectDefect) ok((r.defects || []).some((d) => sc.expectDefect.test(d)), `defect matches the intended sub-gate [${(r.defects || []).join(", ")}]`);
  if (sc.forbidDefect) ok(!(r.defects || []).some((d) => sc.forbidDefect.test(d)), "no defect from the wrong sub-gate");
}

console.log(`\n# acceptance`);
ok(faultsCaughtAtIntended === faultsTotal, `100% of faults caught at the intended gate (${faultsCaughtAtIntended}/${faultsTotal})`);

console.log(`\n${failures === 0 ? "PASS" : "FAIL"} — ${failures} assertion failure(s).`);
process.exit(failures === 0 ? 0 : 1);
