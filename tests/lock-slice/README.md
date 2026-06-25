# L2 — execution-lock negatives as slice scenarios (Task #6)

Frames the lock's denials as real slice situations (complementing the L1 unit suite in
`tests/lock`) and adds the cross-cutting guarantee that none of them block a legitimate dispatch.
Drives the **real** `pre-tool-use-lock.mjs` against throwaway copies of
`tests/fixtures/workspace-seed/`.

## Scenarios (passing)

| # | Scenario | Expectation |
| --- | --- | --- |
| 1 | precondition — `content-strategist` (slice-2) dispatched with `brandingLoopComplete=false` | deny — "missing precondition" |
| 2 | parallelism — second DRAX dispatch while one is `RUNNING` | deny; first agent keeps the lock (no preemption) |
| 3 | awaiting — any dispatch while `AWAITING_CONFIRMATION` | deny until `drax-lock confirm` |
| 4 | run-identity — `STATE.createdAt` changed (no `runId`) | deny — "different run" |
| X | zero false-BLOCK — legitimate dispatch at slice 1 and slice 3 | **allow** |

Scenario 4 specifically exercises **createdAt-based** run identity (the `activeRunId` fallback when
`STATE` has no `runId`), complementing the `runId`-based case in `tests/lock`.

## Run

```bash
tests/lock-slice/run.sh      # or: node tests/lock-slice/slice-negatives.test.mjs
```

## WIREFRAMES discrepancy — resolved here

Task #6 also resolved the `WIREFRAMES.md` location: canonical is `marketing/<brand>-site/` (per the
site-build skill the `ux-designer` executes and the lock `ARTIFACT_MAP`); `DRAX_SYSTEM.md §8` was
the lone outlier and was aligned. See the fixtures + coverage READMEs.
