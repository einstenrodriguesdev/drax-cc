# DRAX validation suite

End-to-end validation that the DRAX pipeline (`/drax → /drax-site → /drax-build → /drax-secure`)
produces a professional result, with every gate proven to discriminate. A 3-level pyramid plus a
quality/observability layer, all deterministic except the founder-triggered live steps.

```bash
tests/run-all.sh          # run everything automatable; exit 0 = green
```

The acceptance contract is **`EXIT_CRITERIA.md`** (5 thresholds = definition of done).

## Layout

| Path | Level | What it proves | Browser? |
| --- | --- | --- | --- |
| `env/` | L0 | the runtime can install + run Playwright (gate of L2/L3) | builds it |
| `fixtures/` | — | pinned product + 3 site seeds + `workspace-seed` + `golden-run` | — |
| `lock/` | L1 | lock state machine, ARTIFACT_MAP, atomicity, config on/off | no |
| `lock-slice/` | L2 | lock negatives as slice scenarios + zero false-BLOCK | no |
| `coverage/` | L2 | coverage gate (Step 1) blocks faults → correct C-level | no |
| `gate/` | L2 ⭐ | live Playwright gate: known-good VERIFIED, known-bad BLOCKED | yes |
| `full-chain/` | L3 | structural verifier over a completed run (golden + 6 negatives) | no |
| `chain-faults/` | L3 | each fault caught at the intended gate; happy path clean | yes |
| `quality/` | quality | per-artifact linter (placeholders, §5, §5.1, evidence) | no |
| `judge/` | quality | LLM-judge rubric + N=3 variance harness | judge = LLM |
| `observability/` | health | per-run report: agents/slice, demand test, wall-clock, reset count | no |

Each directory has its own `README.md` and `run.sh`. `fixtures/` is shared and never mutated by the
tests (they work on temp copies). Browser deps and `*/.out/` are gitignored.

## What this suite is (and isn't)

- It proves the **gates and invariants** are real and discriminating — a gate that only ever passes is
  not a gate, so every level pairs a happy case with caught faults.
- The **live LLM-driven chain run** and the **N=3 judge sweep over a real run** are founder-triggered
  and billable; this suite provides the verifiers those runs are checked against. See `EXIT_CRITERIA.md`.
