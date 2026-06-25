#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// DRAX VALIDATION-PHASE SEQUENTIAL EXECUTION LOCK — TEMPORARY / REMOVABLE
//
// PreToolUse enforcement. Mechanically intercepts DRAX sub-agent dispatch BEFORE
// the Task/Agent tool runs and enforces STRICTLY ONE-AT-A-TIME execution during
// agent-by-agent validation. It ONLY gates WHICH agent may run and WHEN — it does
// not judge output quality, change protocol content, or pick the next agent.
//
// Disable: set "validationSequentialLockEnabled": false in drax-lock.config.json
// (this hook then passes through silently). Remove: delete the PreToolUse entry
// from hooks/hooks.json. Intended to be REPLACED by controlled parallelism later.
//
// Blocking mechanism (confirmed against the official hooks docs): a PreToolUse
// hook denies by printing JSON to stdout with hookSpecificOutput.permissionDecision
// = "deny" and exiting 0. Passing through = exit 0 with no output.
// ─────────────────────────────────────────────────────────────────────────────

import {
  lockEnabled,
  findWorkspace,
  safeJson,
  isDraxDispatch,
  brandSlug,
  computeCurrentSlice,
  SLICE_PRECONDITION,
  resolveExpectedArtifact,
  readLock,
  writeLockAtomic,
  activeRunId,
  idleLock,
  nowIso,
} from "./drax-lock-core.mjs";
import path from "node:path";
import fs from "node:fs";

// ESM: read the hook payload synchronously from stdin (fd 0).
function input() {
  try {
    return JSON.parse(fs.readFileSync(0, "utf8"));
  } catch {
    return {};
  }
}

function passThrough() {
  // Silent allow: no output, exit 0 → normal permission flow proceeds unchanged.
  process.exit(0);
}

function deny(reason) {
  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: "PreToolUse",
        permissionDecision: "deny",
        permissionDecisionReason: reason,
      },
      systemMessage: reason,
    })
  );
  process.exit(0);
}

function main() {
  // (a) Disabled → pass through silently, no lock checks.
  if (!lockEnabled()) passThrough();

  const evt = input();
  const toolName = evt.tool_name;
  const toolInput = evt.tool_input || {};

  // (b) Not a Task/Agent dispatch, or (c) not a DRAX sub-agent → pass through.
  const agent = isDraxDispatch(toolName, toolInput);
  if (!agent) passThrough();

  // (e) It IS a DRAX dispatch — enforce the lock.
  const base = evt.cwd || process.env.CLAUDE_PROJECT_DIR || process.cwd();
  const ws = findWorkspace(base);
  if (!ws) {
    // No workspace yet (e.g. opening a brand-new run). Nothing to gate against;
    // the run is not yet materialized. Pass through.
    passThrough();
  }

  const state = safeJson(path.join(ws, "init", "STATE.json"));
  const stateRunId = activeRunId(state);

  // (i) Read lock; absent => IDLE.
  let lock = readLock(ws);
  if (!lock) lock = idleLock(stateRunId);

  // (iii) Run-identity guard: never auto-adopt a different run's lock.
  if (lock.runId && stateRunId && lock.runId !== stateRunId) {
    deny(
      `BLOCKED: lock belongs to a different run (${lock.runId} vs active ${stateRunId}). ` +
        `Resolve before proceeding (e.g. node \${CLAUDE_PLUGIN_ROOT}/bin/drax-lock.mjs reset --reason "...").`
    );
  }

  // (iv) Slice precondition — checked BEFORE lock status.
  const slug = brandSlug(state);
  const slice = computeCurrentSlice(state);
  const resolved = resolveExpectedArtifact(slice, agent, ws, slug);

  if (!resolved.inSlice) {
    // The agent has no role in the current slice. Either its slice is already
    // complete, or it is a later-slice agent dispatched before its slice's
    // precondition is met. Surface the precondition that is not satisfied.
    const precondFlag = SLICE_PRECONDITION[slice];
    const why = precondFlag
      ? `precondition ${precondFlag} not satisfied for the current slice ${slice}`
      : `agent '${agent}' has no defined role in the current slice ${slice}`;
    deny(`BLOCKED: missing precondition — ${why}. Dispatch of '${agent}' is not valid here.`);
  }

  // (v) RUNNING → block ALL dispatch, including the same agent.
  if (lock.status === "RUNNING") {
    deny(
      `BLOCKED: dispatch cannot run. Current lock held by ${lock.currentAgent} at step ${lock.currentStep}.`
    );
  }

  // (vi) AWAITING_CONFIRMATION → block ALL dispatch until human confirms.
  if (lock.status === "AWAITING_CONFIRMATION") {
    deny(
      `BLOCKED: awaiting confirmation for ${lock.lastCompletedArtifact}. ` +
        `Run \`drax-lock confirm --artifact "${lock.lastCompletedArtifact}"\` after user approval.`
    );
  }

  // (vii) Allowed (IDLE / BLOCKED→re-entrant). Atomically take the lock as RUNNING
  // with the expectedArtifact set NOW (never inferred later), then allow.
  const next = {
    runId: stateRunId || lock.runId || null,
    currentSlice: `slice${slice}`,
    currentAgent: agent,
    currentStep: `slice${slice}:${agent}:${path.basename(resolved.expectedArtifact)}`,
    expectedArtifact: resolved.expectedArtifact,
    status: "RUNNING",
    lastCompletedAgent: lock.lastCompletedAgent ?? null,
    lastCompletedArtifact: lock.lastCompletedArtifact ?? null,
    awaitingConfirmation: false,
    lockedAt: nowIso(),
    lockedBy: "claude-code",
    lastConfirmedAt: lock.lastConfirmedAt ?? null,
  };
  writeLockAtomic(ws, next);

  // Silent allow (do NOT force-approve; let the normal permission flow proceed).
  passThrough();
}

main();
