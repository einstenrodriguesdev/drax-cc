# L2 — live-verification gate harness (Task #4)

The highest-leverage test in the suite. It runs the **Step 3.5 live-verification gate** (the
mechanical core of what `qa-engineer` does in `skills/tech-build`) against the three fixture seeds
and asserts each lands on its expected verdict. **A gate that only passes isn't a gate** — this
proves the gate *discriminates* a professional build from a broken one.

## What it does

`verify-gate.mjs` is a deterministic, runnable reference of the gate pipeline:

1. **build** (`fixtures/lib/build.mjs`) — non-zero exit ⇒ `BLOCKED (build-error)`, QA never runs.
2. **serve** the built `dist/`.
3. **browser** (Playwright): HTTP 200, single `<h1>`, zero console errors, **axe** a11y filtered to
   serious+critical, full-page screenshot.
4. **raw-HTML `<meta viewport>`** must contain `initial-scale=1` — asserted on the RAW served HTML,
   because a forced-viewport browser hides a broken viewport (the known mobile blind spot).
5. verdict `VERIFIED` iff zero defects; models the governance facts
   `siteBuildComplete = (verdict===VERIFIED)` and `/drax-secure accepts iff VERIFIED`.

It writes evidence-backed `QA_REPORT.md` + `VERIFICATION_REPORT.md` (+ screenshots, axe JSON) per
seed to `.out/` (gitignored). `gate.test.mjs` asserts the verdicts.

## Result (passing)

| Seed | verdict | siteBuildComplete | /drax-secure | defects caught |
| --- | --- | --- | --- | --- |
| known-good | VERIFIED | true | accepts | none (no false BLOCK) |
| known-bad-render | BLOCKED | false | refuses | `viewport-missing-initial-scale` (serious), `axe:image-alt` (critical) |
| known-bad-build | BLOCKED | false | refuses | `build-error` — QA/axe never ran on a broken build |

This is the executable proof that the "professional bar" is **verified-live, not asserted**.

## Run

```bash
tests/gate/run.sh        # installs deps + browser, runs the test; exit 0 = gate discriminates
# or, deps already present:
node tests/gate/gate.test.mjs
```

## Relation to the real run

This is **not** a replacement for the `qa-engineer` agent — it is the deterministic reference its
Playwright pass must reproduce, and the assertion target for the seeds. The agent's job (Step 3.5)
is to produce the same evidence and the same verdict on the real built site; this harness proves the
*methodology and the seeds* are sound so the agent has a correct target. Wiring the agent's own
output into these assertions is the L3 full-chain test (Tasks #7/#8).
