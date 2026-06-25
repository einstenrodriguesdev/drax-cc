# DRAX validation — exit criteria (definition of done)

The contract for when we **trust the pipeline**. The pipeline is accepted only when all five
thresholds below hold. Each maps to the test(s) that prove it; run them with `tests/run-all.sh`
(plus the two founder-triggered live steps at the end).

## The five thresholds

### 1. Happy path passes every structural assertion
A correct end-to-end run produces every artifact at its correct sectorial path, flips all four flags
in order, ends with `VERIFICATION_REPORT = VERIFIED`, a clean IDLE lock, and a built site meeting the
mobile-viewport bar.
- **Proven by:** `tests/full-chain` (golden end state → PASS, 6 broken variants → FAIL) and the
  happy-path scenario in `tests/chain-faults` (every gate PASS, both flags flip).
- **On a real run:** capture the run and `tests/full-chain/run.sh <run-root>` must exit 0.

### 2. 100% of injected faults are caught by the *correct* gate
Every defect halts the chain at its intended gate — not an earlier/wrong one, and never propagates.
- **Proven by:** `tests/chain-faults` (acceptance: 4/4 faults at the intended gate; build vs viewport
  distinguished by sub-gate), reinforced by `tests/coverage` (3 faults → correct C-level owner),
  `tests/gate` (known-bad → BLOCKED), `tests/lock` + `tests/lock-slice` (precondition / parallelism /
  awaiting / run-identity), and `tests/full-chain` negatives.
- **Read it as:** `100% of faults caught at the intended gate (N/N)` in the chain-faults output.

### 3. Zero false-BLOCK on the happy path
No gate fires on a legitimate, correct dispatch/build.
- **Proven by:** `tests/chain-faults` happy path (run in parallel with the faulty ones — all gates
  PASS), `tests/gate` (known-good → VERIFIED, zero defects), `tests/lock-slice` (legitimate slice-1
  and slice-3 dispatches → allow), `tests/coverage` (complete package → READY).

### 4. LLM-judge ≥ threshold across 3 runs, with acceptable variance
For subjective quality, every artifact's judged **mean ≥ its rubric threshold AND std-dev ≤ the
instability band** over **N=3** fresh independent judges. A high mean with high variance does **not**
pass (lucky-run risk).
- **Proven by:** `tests/judge` (harness mechanics: stable-high → PASS, below-threshold → FLAG,
  high-mean-unstable → FLAG). The math is deterministic; the judgment is supplied by real judges.
- **On a real run (founder-triggered):** spawn N=3 judges per artifact, aggregate with
  `tests/judge/run.sh <samples.json>`; **exit 0 = all artifacts clear the bar**. (The recorded demo
  `tests/judge/sample-run.md` deliberately shows a sub-threshold artifact being flagged — that is the
  layer working, and such a run is **not** accepted until the artifact is strengthened.)

### 5. Lock reset count = 0 on the happy path
A clean run needs no lock resets. Frequent resets = lock/protocol miscalibration — a red flag even if
everything else passed.
- **Proven by:** `tests/observability` (golden → reset count 0; an injected reset → flagged) and the
  `tests/full-chain` reset-count assertion.
- **On a real run:** `tests/observability/run.sh <run-root>` must report `lock reset count: 0`.

## How to run the whole suite

```bash
tests/run-all.sh
```

Runs everything automatable (L0 environment → L1 unit → L2 slice gates → L3 full chain → quality +
observability). **Exit 0 = the whole pyramid is green.** Each level also has its own `run.sh`.

Two steps are **founder-triggered and billable** (real LLM / real browser build), not in `run-all.sh`:

1. **Live full-chain run** — drive `/drax → /drax-site → /drax-build → /drax-secure` to completion,
   keep `drax-workspace/` + `drax-site/`, then:
   ```bash
   tests/full-chain/run.sh   <run-root>      # criteria 1, 5 (structure + reset count)
   tests/observability/run.sh <run-root>     # criteria 5 + process health
   tests/quality/run.sh      <run-root>/drax-workspace --final   # placeholder/§5/§5.1 hygiene
   ```
2. **Live LLM-judge N=3 sweep** — judge each artifact with 3 fresh judges, then
   `tests/judge/run.sh <samples.json>` (criterion 4).

## How to interpret results

- **`run-all.sh` exits 0** → criteria 1–3 and 5 hold against the fixtures, and the judge/linter
  machinery (criterion 4's math) is sound. This is the gate for trusting the *harness and the
  invariants*.
- **A real run is accepted** only when, against its captured output: the full-chain verifier is PASS
  (1), observability shows reset count 0 (5), the artifact linter is clean `--final`, and the N=3
  judge sweep clears every rubric (4) — with the chain-faults/gate suites standing as the proof that
  faults *would* have been caught (2) without false-blocking (3).
- **Any FAIL is a stop.** A flagged judge artifact, a non-zero reset count, a fault caught at the
  wrong gate, or a false-BLOCK each fails the contract — fix before trusting the pipeline.
