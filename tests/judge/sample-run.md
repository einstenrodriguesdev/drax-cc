# LLM-judge — live N=3 sample run (golden BRANDING.md)

Recorded demonstration that the judge layer produces real, parseable scores with measurable variance
and surfaces a **subjective quality gap the structural checks cannot**.

## Setup

- Artifact: `tests/fixtures/golden-run/workspace/marketing/branding/BRANDING.md` (lints CLEAN in #9,
  passes the #7 structural verifier).
- Judges: **3 fresh, independent** general-purpose agent-judges, each given the `BRANDING` rubric +
  product/persona context + the artifact, each returning a final-line JSON of 0-5 criterion scores.

## Raw samples

| sample | positioning_clarity | distinctiveness | audience_fit | voice_consistency |
| --- | --- | --- | --- | --- |
| 1 | 3 | 2 | 4 | 4 |
| 2 | 4 | 2 | 4 | 3 |
| 3 | 4 | 2 | 4 | 4 |

## Aggregated (harness output)

```
marketing/branding/BRANDING.md  [BRANDING]  n=3
  score: 3.33 ± 0.12  (threshold 3.5, band 0.75) → FLAG: BELOW-THRESHOLD
    - positioning_clarity: 3.67 ± 0.47
    - distinctiveness:     2.00 ± 0.00
    - audience_fit:        4.00 ± 0.00
    - voice_consistency:   3.67 ± 0.47
```

## Why this is the point of Task #10

- **Structure passed, quality flagged.** The artifact is structurally complete and lints clean, yet
  the judge flags it **below the 3.5 threshold** — exactly the case equality-checks miss.
- **Not a lucky/unlucky single run.** `sd = 0.12` (well under the 0.75 instability band): all three
  independent judges converged. The signal is *stable*, so it's a real quality gap, not judge noise.
- **The breakdown localizes it.** `distinctiveness: 2.00 ± 0.00` — every judge independently flagged
  the unresolved **"Caixa" bank name-collision** (mitigated only at the visual level, not the name).
  This is the same risk the name-clearance gate is designed to raise, now caught at the brand-quality
  layer too.

> Interpretation: the golden fixture is *structurally* exemplary by design; its brand prose is
> deliberately terse. The judge correctly distinguishes "structurally complete" from "professionally
> strong" — which is precisely the layer #10 adds. The remedy in a real run would be to strengthen the
> brand's distinctiveness (or revisit the name) until the judged mean clears the threshold.
