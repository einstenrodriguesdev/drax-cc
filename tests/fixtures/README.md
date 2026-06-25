# DRAX validation fixtures (pinned)

A versioned, repeatable fixture so DRAX runs are **comparable** across levels (L1/L2/L3) and over
time. Nothing here is a live workspace — it lives under `tests/` and the seeded workspace is named
`workspace-seed/` (not `drax-workspace/`), so a session's SessionStart hook never auto-detects it.
Never copy any of this into `~/drax-on` (production run env).

## Contents

```
tests/fixtures/
├── product/PRODUCT.md         # the fake-but-realistic product (MeiCaixa); identity + expected signals
├── lib/
│   ├── build.mjs              # node build.mjs <seedDir>  → builds src→dist, or fails if meta.expectBuild=fail
│   └── serve.mjs              # node serve.mjs <seedDir> [port]  → serves dist/, prints "LISTENING <url>"
├── seeds/                     # three drax-site/ seeds the build/QA gate runs against
│   ├── known-good/            # builds; viewport initial-scale=1; clean a11y      → expect VERIFIED
│   ├── known-bad-render/      # builds; viewport width=1024 (no initial-scale); img w/o alt → expect BLOCKED
│   └── known-bad-build/       # build exits non-zero                              → expect BLOCKED
├── workspace-seed/            # a drax-workspace pre-populated through slice 2 (currentSlice = 3)
└── golden-run/                # a COMPLETED happy-path run end state (all 4 slices), for the L3 verifier
    ├── workspace/             # → becomes drax-workspace/ at test time (all flags true + flagHistory + IDLE lock)
    └── site/                  # → becomes drax-site/ (the built known-good deliverable)
```

Each seed carries a `meta.json` that is **self-describing and behavior-driving**:
`expectBuild` (`pass`/`fail`) drives `build.mjs`; `expectGate` (`VERIFIED`/`BLOCKED`) and `faults[]`
are the assertions the gate harness checks. The seeds are pure-node, zero-dependency, so they are
fast and deterministic (no per-seed `npm install`).

## Verified behavior (sanity-checked 2026-06-25)

| Seed | `build` exit | served `<meta viewport>` | gate must |
| --- | --- | --- | --- |
| known-good | 0 | `width=device-width, initial-scale=1` | **VERIFIED** |
| known-bad-render | 0 | `width=1024` (no `initial-scale=1`) + img w/o alt | **BLOCKED** |
| known-bad-build | 1 (compile error) | — (never reaches dist/) | **BLOCKED** |

`known-bad-render` is the key seed: it **builds and serves fine**, so a desk check or a naive
Playwright run (which forces its own viewport) would pass it. Only the raw-HTML viewport assertion
+ axe catch it. It is the proof that the gate sees what a forced-viewport browser hides.

## How each level uses it

- **L2 ⭐ gate harness (Task #4):** run `build.mjs`+`serve.mjs`+Playwright per seed, assert
  `expectGate`. Blocked by Task #1 (browser must run here).
- **L2 coverage gate (Task #5):** copy `workspace-seed/` → a temp `drax-workspace/`, run slice-3
  Step 1, assert `READY`; then delete/contradict one upstream artifact and assert `BLOCKED`.
- **L2 lock negatives (Task #6):** use `workspace-seed/` (`currentSlice = 3`, `runId`
  `fixture-meicaixa-001`) to drive precondition / parallelism / run-identity denials.
- **L3 full chain (Tasks #7/#8):** feed `product/PRODUCT.md` as the run input; the built site is
  expected to match the `known-good` shape.
- **Quality (Tasks #9/#10):** the expected name-clearance signal in `product/PRODUCT.md`
  ("PROCEED-WITH-CAUTION" on the Caixa-bank collision) is a known thing the run must catch.

## WIREFRAMES location (resolved, Task #6)

Canonical is `marketing/<brand>-site/WIREFRAMES.md` — per the site-build skill (what the
`ux-designer` executes) and the lock `ARTIFACT_MAP`. Task #6 aligned the lone outlier
(`DRAX_SYSTEM.md §8`, which had said `design/`) and moved the seed here. `DESIGN_TOKENS` stays in
`design/`; wireframe ownership remains Design-CTO (path ≠ ownership).

## Reproduce the sanity check

```bash
cd tests/fixtures
node lib/build.mjs seeds/known-good        # exit 0
node lib/build.mjs seeds/known-bad-build   # exit 1
node lib/serve.mjs seeds/known-good 0      # prints LISTENING http://127.0.0.1:<port>
```
