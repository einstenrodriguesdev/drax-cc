#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// DRAX VALIDATION-PHASE SEQUENTIAL EXECUTION LOCK — TEMPORARY / REMOVABLE
//
// PostToolUse verification. After a DRAX sub-agent dispatch (Task/Agent) returns,
// it verifies the EXACT protocol artifact the lock recorded as expectedArtifact
// actually exists, then moves the lock RUNNING -> AWAITING_CONFIRMATION so the
// next dispatch is gated behind an explicit human `drax-lock confirm`.
//
// It does NOT auto-confirm, does NOT judge artifact quality, and does NOT pick the
// next agent. If the artifact is missing it keeps status = RUNNING and reports the
// failure (no automatic retry).
//
// Disable: set "validationSequentialLockEnabled": false in drax-lock.config.json.
// Remove: delete the PostToolUse entry from hooks/hooks.json. Intended to be
// REPLACED by controlled parallelism later.
// ─────────────────────────────────────────────────────────────────────────────

import fs from "node:fs";
import path from "node:path";
import {
  lockEnabled,
  findWorkspace,
  isDraxDispatch,
  readLock,
  writeLockAtomic,
  nowIso,
} from "./drax-lock-core.mjs";

function input() {
  try {
    return JSON.parse(fs.readFileSync(0, "utf8"));
  } catch {
    return {};
  }
}

function passThrough() {
  process.exit(0);
}

// PostToolUse: surface a message back to Claude via systemMessage (exit 0).
function report(message) {
  process.stdout.write(JSON.stringify({ systemMessage: message }));
  process.exit(0);
}

function main() {
  if (!lockEnabled()) passThrough();

  const evt = input();
  const agent = isDraxDispatch(evt.tool_name, evt.tool_input || {});
  if (!agent) passThrough();

  const base = evt.cwd || process.env.CLAUDE_PROJECT_DIR || process.cwd();
  const ws = findWorkspace(base);
  if (!ws) passThrough();

  const lock = readLock(ws);
  if (!lock || lock.status !== "RUNNING") passThrough();
  // Only act on the agent that currently holds the lock.
  if (lock.currentAgent !== agent) passThrough();

  const expected = lock.expectedArtifact;
  const exists = expected
    ? (() => {
        try {
          return fs.existsSync(path.join(ws, expected));
        } catch {
          return false;
        }
      })()
    : false;

  if (!exists) {
    // Keep RUNNING; do not retry automatically.
    report(
      `DRAX LOCK: ${agent} returned but expected artifact is MISSING: ${expected}. ` +
        `Lock stays RUNNING. Once the artifact is actually written, run ` +
        `\`drax-lock complete\` to re-verify, or \`drax-lock reset --reason "..."\` to clear.`
    );
  }

  const next = {
    ...lock,
    status: "AWAITING_CONFIRMATION",
    lastCompletedAgent: agent,
    lastCompletedArtifact: expected,
    awaitingConfirmation: true,
  };
  writeLockAtomic(ws, next);

  report(
    `DRAX LOCK: ${agent} completed and produced ${expected}. ` +
      `Status is now AWAITING_CONFIRMATION — all further DRAX dispatch is blocked until you evaluate it. ` +
      `After approval run: drax-lock confirm --artifact "${expected}"`
  );
}

main();
