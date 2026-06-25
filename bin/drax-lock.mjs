#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// DRAX VALIDATION-PHASE SEQUENTIAL EXECUTION LOCK — TEMPORARY / REMOVABLE
//
// CLI for the temporary sequential execution lock. Provides the explicit
// human-in-the-loop controls the hooks cannot perform autonomously:
//
//   drax-lock complete                  re-verify the expected artifact exists and
//                                       move RUNNING -> AWAITING_CONFIRMATION
//                                       (manual backstop for the PostToolUse hook)
//   drax-lock confirm --artifact "<p>"  human approval gate: AWAITING_CONFIRMATION
//                                       -> IDLE (releases the gate only)
//   drax-lock reset   --reason "<text>" log + force the lock back to IDLE
//   drax-lock status                    print the current lock (read-only)
//
// This tool ONLY gates WHICH agent may run and WHEN. It never judges artifact
// quality, never chooses the next agent, and never advances protocol order — the
// existing dispatch mechanism remains responsible for selecting the next step.
//
// Disable the whole lock: set "validationSequentialLockEnabled": false in
// drax-lock.config.json. Intended to be REPLACED by controlled parallelism later.
// ─────────────────────────────────────────────────────────────────────────────

import fs from "node:fs";
import path from "node:path";
import {
  findWorkspace,
  safeJson,
  readLock,
  writeLockAtomic,
  activeRunId,
  idleLock,
  nowIso,
} from "../hooks/drax-lock-core.mjs";

function parseArgs(argv) {
  const cmd = argv[0];
  const opts = {};
  for (let i = 1; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith("--")) {
      const key = a.slice(2);
      const val = argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[++i] : "true";
      opts[key] = val;
    }
  }
  return { cmd, opts };
}

function die(msg, code = 1) {
  process.stderr.write(msg + "\n");
  process.exit(code);
}

function ok(msg) {
  process.stdout.write(msg + "\n");
  process.exit(0);
}

function resolveWs() {
  const ws = findWorkspace(process.env.CLAUDE_PROJECT_DIR || process.cwd());
  if (!ws) die("BLOCKED: no drax-workspace found in the current directory or its parent.");
  return ws;
}

function loadState(ws) {
  return safeJson(path.join(ws, "init", "STATE.json"));
}

// ── status ─────────────────────────────────────────────────────────────────────
function cmdStatus(ws) {
  const lock = readLock(ws);
  if (!lock) ok("DRAX LOCK: no EXECUTION_LOCK.json — treated as IDLE.");
  ok("DRAX LOCK:\n" + JSON.stringify(lock, null, 2));
}

// ── complete (manual post-artifact verification backstop) ──────────────────────
function cmdComplete(ws) {
  const lock = readLock(ws);
  if (!lock || lock.status !== "RUNNING") {
    die(
      `BLOCKED: 'complete' requires status == RUNNING (current: ${lock ? lock.status : "IDLE"}).`
    );
  }
  const expected = lock.expectedArtifact;
  if (!expected) die("BLOCKED: lock has no expectedArtifact to verify.");

  const exists = (() => {
    try {
      return fs.existsSync(path.join(ws, expected));
    } catch {
      return false;
    }
  })();

  if (!exists) {
    // Keep RUNNING; never infer a substitute path; never judge quality.
    die(
      `FAILED: expected artifact does not exist: ${expected}. Lock stays RUNNING. ` +
        `Write the exact artifact, then re-run 'drax-lock complete'.`
    );
  }

  writeLockAtomic(ws, {
    ...lock,
    status: "AWAITING_CONFIRMATION",
    lastCompletedAgent: lock.currentAgent,
    lastCompletedArtifact: expected,
    awaitingConfirmation: true,
  });
  ok(
    `VERIFIED: ${expected} exists. Status -> AWAITING_CONFIRMATION. ` +
      `All DRAX dispatch is blocked until you run: drax-lock confirm --artifact "${expected}"`
  );
}

// ── confirm (human approval gate: AWAITING_CONFIRMATION -> IDLE) ────────────────
function cmdConfirm(ws, opts) {
  const lock = readLock(ws);
  if (!lock || lock.status !== "AWAITING_CONFIRMATION") {
    die(
      `BLOCKED: 'confirm' requires status == AWAITING_CONFIRMATION (current: ${
        lock ? lock.status : "IDLE"
      }).`
    );
  }
  const artifact = opts.artifact;
  if (!artifact || artifact === "true") {
    die('BLOCKED: --artifact "<path>" is required and must match the pending artifact.');
  }
  if (artifact !== lock.lastCompletedArtifact) {
    die(`BLOCKED: confirmed artifact does not match pending artifact ${lock.lastCompletedArtifact}.`);
  }

  writeLockAtomic(ws, {
    ...lock,
    status: "IDLE",
    awaitingConfirmation: false,
    lastConfirmedAt: nowIso(),
    // Clear the in-flight fields; the dispatch layer chooses the next agent.
    currentSlice: null,
    currentAgent: null,
    currentStep: null,
    expectedArtifact: null,
  });
  ok(
    `CONFIRMED: ${artifact}. Status -> IDLE. The lock gate is released; ` +
      `the existing dispatch mechanism decides the next agent/step.`
  );
}

// ── reset (logged, append-only, force back to IDLE) ────────────────────────────
function cmdReset(ws, opts) {
  const reason = opts.reason;
  if (!reason || reason === "true" || String(reason).trim() === "") {
    die('BLOCKED: --reason "<text>" is required (non-empty).');
  }
  const priorLock = readLock(ws);
  const state = loadState(ws);
  const runId = activeRunId(state);

  // Append-only reset log — never overwrite or truncate.
  const logPath = path.join(ws, "init", "LOCK_RESET_LOG.md");
  const entry =
    `\n## ${nowIso()} — lock reset\n\n` +
    `**Reason:** ${reason}\n\n` +
    "**Prior lock state:**\n\n```json\n" +
    JSON.stringify(priorLock ?? { status: "IDLE (no lock file)" }, null, 2) +
    "\n```\n";
  try {
    fs.mkdirSync(path.join(ws, "init"), { recursive: true });
  } catch {
    /* ignore */
  }
  if (!fs.existsSync(logPath)) {
    fs.writeFileSync(
      logPath,
      "# DRAX Execution Lock — Reset Log (append-only)\n\n" +
        "_Frequent resets are a signal of protocol/lock miscalibration, not something to hide._\n",
      "utf8"
    );
  }
  fs.appendFileSync(logPath, entry, "utf8");

  writeLockAtomic(ws, idleLock(runId));
  ok(`RESET logged to init/LOCK_RESET_LOG.md and lock forced to IDLE. Reason: ${reason}`);
}

function main() {
  const { cmd, opts } = parseArgs(process.argv.slice(2));
  const ws = resolveWs();
  switch (cmd) {
    case "status":
      return cmdStatus(ws);
    case "complete":
      return cmdComplete(ws);
    case "confirm":
      return cmdConfirm(ws, opts);
    case "reset":
      return cmdReset(ws, opts);
    default:
      die(
        "Usage: drax-lock <status|complete|confirm|reset>\n" +
          '  drax-lock complete\n' +
          '  drax-lock confirm --artifact "<workspace-relative path>"\n' +
          '  drax-lock reset --reason "<text>"'
      );
  }
}

main();
