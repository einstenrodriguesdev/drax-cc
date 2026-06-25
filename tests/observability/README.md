# Run observability reporter (Task #11)

Consolidates the per-run signals that reveal **process health beyond pass/fail** into one report:

- **Agents per slice + demand-test decisions** — activate / skip / reuse, each with its recorded
  reason (DRAX_SYSTEM §4).
- **Wall-clock per slice** — from `STATE.flagHistory` timestamps.
- **Lock reset count** — from `init/LOCK_RESET_LOG.md`. Frequent resets mean lock/protocol
  miscalibration and are a **red flag even in a run that passed**.

## Canonical inputs (now specified in DRAX_SYSTEM "Observability")

| Signal | Source |
| --- | --- |
| completion order + wall-clock | `init/STATE.json` → `flagHistory: [{flag, at}]` |
| agent activations + demand test | `init/ACTIVATION_LOG.jsonl` → `{slice, agent, decision, reason, at}` |
| reset count | `init/LOCK_RESET_LOG.md` (append-only, written by `drax-lock reset`) |

Task #11 made these canonical so the live runtime emits exactly what this reporter reads — which also
upgrades the Task #7 order check from a dependency proxy to **exact** (via `flagHistory`).

## Self-test

```bash
tests/observability/run.sh
```

The golden run reports **HEALTHY** with full signals (reset 0, wall-clock per slice, every slice's
activations incl. a real `reuse` and `skip` demand-test decision). Injected health problems are each
flagged even though the *structure* passed: a logged reset (miscalibration), a demand-test decision
with no reason, a missing activation log, and a missing `flagHistory`.

## Report a real run

```bash
tests/observability/run.sh /path/to/run-root      # dir containing drax-workspace/
# or: node tests/observability/observe.mjs /path/to/run-root
```

Sample report (golden):

```
verdict: HEALTHY
lock reset count: 0
wall-clock per slice:  slice 1: 60m  slice 2: 60m  slice 3: 60m  slice 4: 60m  total: 240m
agents + demand-test per slice:
  slice 2: activate[cmo, content-strategist, …] reuse[brand-strategist]
  slice 3: activate[cto, senior-frontend-engineer, qa-engineer, devops-engineer] skip[senior-backend-engineer]
```
