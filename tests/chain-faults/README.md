# L3 — full-chain fault injection / gate attribution (Task #8)

Proves that across the **whole chain**, each injected defect is caught by the **intended** gate —
not an earlier wrong one, and it never propagates downstream. The happy path runs **in parallel** to
confirm the gates don't false-trip.

`chain-pipeline.mjs` runs the real engines in chain order and reports where it halts:

```
lock → coverage → build-qa → secure → complete
```

- **lock** — `hooks/pre-tool-use-lock.mjs` (dispatch ordering / parallelism)
- **coverage** — `tests/coverage/coverage-gate.mjs` (tech-build Step 1)
- **build-qa** — `tests/gate/verify-gate.mjs` (Step 3 build half + Step 3.5 Playwright half)
- **secure** — `/drax-secure` precondition: accepts iff `VERIFICATION = VERIFIED`

## Result (passing)

| Injected fault | halts at | earlier gates | propagated? | secure |
| --- | --- | --- | --- | --- |
| happy path (known-good) | complete | all PASS | n/a (flags flip) | accepts |
| legal page removed | **coverage** | lock PASS | no | not reached |
| viewport broken | **build-qa** (QA half — `viewport`/`axe` defects) | lock, coverage PASS | no | **refuses** |
| build failed | **build-qa** (build half — `build-error`, QA never runs) | lock, coverage PASS | no | **refuses** |
| out-of-order dispatch | **lock** | — | no | not reached |

**Acceptance met:** 100% of faults caught at the intended gate (4/4); happy path all-PASS with both
downstream flags flipped (zero false-BLOCK). "viewport" vs "build failed" both land at the build-qa
stage but are distinguished by sub-gate: a build failure produces `build-error` and QA never runs
(frontend doesn't hand off), while a viewport regression is caught by the Playwright half.

## Run

```bash
tests/chain-faults/run.sh        # installs gate deps + chromium, then runs
# or: node tests/chain-faults/chain-faults.test.mjs   (if tests/gate deps already installed)
```

Each scenario runs in an isolated temp run, in parallel — which also confirms no cross-bleed
between a faulty run and the clean happy path.
