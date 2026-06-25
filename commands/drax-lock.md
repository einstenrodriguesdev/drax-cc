---
description: "[VALIDATION-PHASE, TEMPORARY] Operate the Drax sequential execution lock — status / complete / confirm / reset. The lock gates DRAX sub-agent dispatch to one-at-a-time during agent-by-agent validation; it is removable/disableable and meant to be replaced by controlled parallelism later."
argument-hint: "status | complete | confirm --artifact \"<path>\" | reset --reason \"<text>\""
allowed-tools: ["Bash"]
---

# drax-lock — Operate the validation execution lock

This is a **temporary, validation-phase** control surface. The lock mechanically
gates which DRAX sub-agent may run and when (strictly one at a time). It does not
judge artifact quality and does not choose the next agent.

Run the lock CLI with the user's arguments via Bash, exactly as given:

```
node ${CLAUDE_PLUGIN_ROOT}/bin/drax-lock.mjs $ARGUMENTS
```

Subcommands:

- `status` — print the current `EXECUTION_LOCK.json` (read-only).
- `complete` — manual backstop for the PostToolUse check: re-verify the exact
  `expectedArtifact` exists, then move `RUNNING → AWAITING_CONFIRMATION`.
- `confirm --artifact "<workspace-relative path>"` — human approval gate: requires
  status `AWAITING_CONFIRMATION` and an exact match of the pending artifact; moves
  `AWAITING_CONFIRMATION → IDLE` and releases the gate only.
- `reset --reason "<text>"` — logs the prior lock state to the append-only
  `drax-workspace/init/LOCK_RESET_LOG.md` and forces the lock back to `IDLE`.

Report the CLI output verbatim to the user. Do not advance the protocol or pick the
next agent from here — releasing the gate is all this command does.
