# L3 — full-chain structural verifier (Task #7)

Verifies the **end state** of a happy-path run of the whole chain
(`/drax` → `/drax-site` → `/drax-build` → `/drax-secure`) is structurally correct. The chain itself
is LLM-driven and **founder-triggered** (interactive interview + dozens of real subagent dispatches +
a live Playwright build) — it is not run autonomously here. What *is* deterministic, repeatable, and
owned by this harness is the set of **structural assertions** over whatever the run produced.

## What it asserts

- **Artifacts per slice** exist at the correct **sectorial paths** — `marketing/branding/`,
  `marketing/<brand>-site/`, `design/<brand>-site/`, `legal/<brand>-site/` + `legal/COMPLIANCE_BASELINE.md`,
  `technology/<brand>-site/`, `cybersecurity/<brand>-site/`.
- **All four flags true**, and flipped **in order** — enforced two ways: the *dependency chain*
  (you cannot have `siteBuildComplete` without a `VERIFIED` report, nor `securityComplete` without
  slice-4 outputs) and, when present, an explicit `STATE.flagHistory` in canonical order with
  non-decreasing timestamps. (Order *enforcement* is separately proven in Tasks #5/#6.)
- **`VERIFICATION_REPORT.md` = VERIFIED**; the built `drax-site/` meets the mobile-viewport bar.
- **Lock ended IDLE** and the **reset count = 0**.

## Self-test (proves the verifier discriminates)

```bash
tests/full-chain/run.sh
```

Runs the verifier against the **golden** completed-run fixture (`tests/fixtures/golden-run/`,
→ PASS) and six broken variants (out-of-order flags, `BLOCKED` verification, a logged reset, a
missing slice-2 artifact, scrambled `flagHistory`, a regressed viewport) — each must **FAIL** with a
named cause. A verifier that always passes is useless.

## Capture & verify a REAL run

1. In a clean working dir, run the chain to completion (founder drives the interview, the lock
   sequences agents 1-at-a-time; keep the `drax-workspace/` and the built `drax-site/`).
2. Point the verifier at that run root:

   ```bash
   tests/full-chain/run.sh /path/to/run-root      # dir containing drax-workspace/ + drax-site/
   # or: node tests/full-chain/assert-full-chain.mjs /path/to/run-root
   ```

   Exit 0 = the happy-path run is structurally complete and ordered; non-zero prints each issue.

## Note on `flagHistory`

The golden fixture carries `STATE.flagHistory` to make ordering explicit and inspectable. The live
runtime does not yet write it — when absent, the verifier falls back to the dependency-chain order
proxy (still sufficient). Instrumenting `flagHistory` (and a reset counter) in real runs is **Task
#11** (observability); doing so upgrades the order check from proxy to exact.
