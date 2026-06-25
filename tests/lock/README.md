# L1 — execution-lock unit tests (Task #3)

Deterministic, no LLM, no external deps, runs in seconds. Drives the **real** lock core
(`hooks/drax-lock-core.mjs`), the **real** hook entry scripts (`pre-/post-tool-use-lock.mjs`) by
piping hook payloads to stdin, and the **real** CLI (`bin/drax-lock.mjs`) — so it tests shipped
behavior, not a reimplementation.

## What it asserts (53 checks)

- **Pure core:** `normalizeSubagent`, `isDraxDispatch` (Task/Agent + namespaced + unknown→null),
  `brandSlug`, `computeCurrentSlice`, `SLICE_PRECONDITION`, `activeRunId`, `idleLock`.
- **`ARTIFACT_MAP` resolution** by `(slice, agent)`, including the **new slice-3
  `VERIFICATION_REPORT.md`** (first-missing logic surfaces it once `BUILD_READINESS` + `BUILD_PLAN`
  exist), the augmenting-agent last-path case (slice-1 `clo` → `NAME_CLEARANCE.md`), and
  `inSlice=false` for an agent with no role in the slice.
- **Atomic write integrity:** no leftover `.tmp`, target parses as valid JSON, `readLock` roundtrip.
- **State machine** through the real processes: `IDLE → RUNNING` (PreToolUse allows + records
  `expectedArtifact`), RUNNING blocks any second dispatch, `RUNNING → AWAITING_CONFIRMATION`
  (PostToolUse once the artifact exists), AWAITING blocks dispatch, `confirm` requires the matching
  artifact, `AWAITING → IDLE` clears in-flight fields and stamps `lastConfirmedAt`.
- **`complete` backstop** refuses unless RUNNING.
- **Run-identity guard:** a lock owned by a different run → deny.
- **Reset:** `--reason` required; the reset log is **append-only** (two resets ⇒ two preserved
  entries); lock returns to IDLE.
- **Config flag:** enabled → enforces (deny); disabled → **silent passthrough** (exit 0, no output,
  lock untouched). The test snapshots and restores `drax-lock.config.json` exactly.

The integration cases run against a throwaway copy of `tests/fixtures/workspace-seed/`
(`currentSlice 3`, `runId fixture-meicaixa-001`) in the OS temp dir — the repo is never mutated
(except the config flip, which is restored and re-asserted).

## Run

```bash
tests/lock/run.sh           # or: node tests/lock/lock.test.mjs
```
