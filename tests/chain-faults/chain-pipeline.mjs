// ─────────────────────────────────────────────────────────────────────────────
// L3 — staged chain pipeline (Task #8).
//
// Runs the real gates in chain order on a scenario and reports WHERE the chain
// halts, so we can prove each fault is caught by the INTENDED gate (not an earlier
// wrong one) and does not propagate. Reuses the actual engines already validated:
//   • lock      → hooks/pre-tool-use-lock.mjs   (dispatch ordering / parallelism)
//   • coverage  → tests/coverage/coverage-gate.mjs   (tech-build Step 1)
//   • build-qa  → tests/gate/verify-gate.mjs    (Step 3 build + Step 3.5 Playwright)
//   • secure    → /drax-secure precondition: accepts iff VERIFICATION = VERIFIED
//
// Stage order: lock → coverage → build-qa → secure → complete.
// A halt at stage S means S's gate fired; all stages before S passed.
// ─────────────────────────────────────────────────────────────────────────────
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { coverageGate } from "../coverage/coverage-gate.mjs";
import { verifyGate } from "../gate/verify-gate.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.join(HERE, "..", "..");
const PRE = path.join(REPO, "hooks", "pre-tool-use-lock.mjs");
const SEED = path.join(REPO, "tests", "fixtures", "workspace-seed");
const BRAND = "meicaixa";

function lockDispatch(projDir, agent) {
  const r = spawnSync("node", [PRE], {
    input: JSON.stringify({ tool_name: "Task", tool_input: { subagent_type: agent }, cwd: projDir }),
    encoding: "utf8",
  });
  let denied = false;
  try { denied = JSON.parse(r.stdout || "{}").hookSpecificOutput?.permissionDecision === "deny"; } catch {}
  return denied;
}

export async function runChain({ name, siteSeed = "known-good", workspaceMutate, dispatchAgent = "qa-engineer" }) {
  const proj = fs.mkdtempSync(path.join(os.tmpdir(), "drax-chain8-"));
  const ws = path.join(proj, "drax-workspace");
  fs.cpSync(SEED, ws, { recursive: true });
  if (workspaceMutate) workspaceMutate(ws);

  const stages = { lock: "—", coverage: "—", buildQa: "—", secure: "—" };
  const flags = { siteBuildComplete: false, securityComplete: false };
  const halt = (stage, extra = {}) => ({ name, haltStage: stage, stages, flags, ...extra });

  // 1) lock — dispatch ordering / parallelism
  const denied = lockDispatch(proj, dispatchAgent);
  stages.lock = denied ? "BLOCK" : "PASS";
  if (denied) return halt("lock");

  // 2) coverage gate (Step 1)
  const cov = coverageGate(ws, BRAND);
  stages.coverage = cov.verdict === "READY" ? "PASS" : "BLOCK";
  if (cov.verdict !== "READY") return halt("coverage", { owners: cov.owners });

  // 3) build + Playwright gate (Step 3 / 3.5)
  const gate = await verifyGate(siteSeed, path.join(proj, "gate-out"));
  stages.buildQa = gate.verdict === "VERIFIED" ? "PASS" : "BLOCK";
  flags.siteBuildComplete = gate.verdict === "VERIFIED";
  if (gate.verdict !== "VERIFIED") {
    stages.secure = "BLOCK"; // /drax-secure refuses an unverified build
    return halt("build-qa", { secureAccepts: false, defects: gate.defects.map((d) => d.id) });
  }

  // 4) /drax-secure precondition
  stages.secure = gate.secureAccepts ? "PASS" : "BLOCK";
  flags.securityComplete = gate.secureAccepts;
  if (!gate.secureAccepts) return halt("secure", { secureAccepts: false });

  flags.siteBuildComplete = true;
  flags.securityComplete = true;
  return halt("complete", { secureAccepts: true });
}
