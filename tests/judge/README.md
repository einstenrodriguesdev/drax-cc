# Quality — LLM judge with rubric + N=3 variance (Task #10)

For what equality-checks can't assert — *is the branding good? is the copy good? is the site
professional?* — a **fresh, independent agent-judge** scores each artifact against a per-type rubric.
Running **N=3** measures **variance**: a high score in one run can be luck; instability across
independent judges is a real quality risk even when the structure passes.

## Split of responsibility

- **The judgment** is supplied by N fresh agent-judges (orchestrated by the operator / Claude via the
  Agent tool). Each reads the rubric + the artifact and returns a `{criterion: score}` object (0-5).
  Independent cold spawns → independent samples.
- **The harness** (`judge.mjs`) owns the deterministic part: rubric lookup, weighted scoring, and
  variance. A type **passes only if `mean ≥ threshold` AND `sd ≤ instabilityBand`** — a high mean with
  high variance is flagged **UNSTABLE**, not passed.

## Rubrics

`rubrics.json` defines criteria + threshold per artifact type (`BRANDING`, `COPY_DECK`, `SITEMAP`,
`DESIGN_TOKENS`, `VERIFICATION_REPORT`, + a `default`). `VERIFICATION_REPORT` carries the strictest
threshold (4.0) since its job is to certify the live build.

## Self-test (deterministic, no LLM)

```bash
tests/judge/run.sh
```

Validates the math and the three outcomes the harness must distinguish: **stable & high → PASS**,
**below threshold → FLAG**, and **high mean but high variance → FLAG UNSTABLE** (the lucky-run
signal).

## Score real artifacts (N fresh judges)

1. For each artifact, spawn **N independent judges** (N=3+) with the rubric for its type + the artifact
   text; collect each judge's final-line JSON.
2. Assemble a samples file:

   ```json
   {
     "marketing/branding/BRANDING.md": {
       "type": "BRANDING",
       "samples": [ {"positioning_clarity":3,"distinctiveness":2,"audience_fit":4,"voice_consistency":4}, … ]
     }
   }
   ```

3. Aggregate + report:

   ```bash
   tests/judge/run.sh /path/to/samples.json          # prints mean ± sd + flags; exit 0 = all pass
   # or: node tests/judge/judge.mjs samples.json [rubrics.json]
   ```

A live N=3 run on the golden `BRANDING.md` is recorded in `sample-run.md` — the three independent
judges all converged on the **distinctiveness/Caixa-collision** weakness, showing the judge surfaces a
real subjective gap the structural linters cannot. Running the full N=3 sweep over every artifact of a
real run is the founder-triggered, billable step.
