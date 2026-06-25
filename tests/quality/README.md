# Quality — per-artifact linter (Task #9)

A cheap, deterministic quality layer (no LLM) applied to every generated `.md` artifact. Runnable
**per slice** (lenient — open `NEEDS_DECISION` allowed) and **at end of run** (`--final` — strict).

## Rules

1. **Forbidden placeholders** — `lorem ipsum`, `TBD`, `placeholder`, an unsubstituted `<brand>`
   template token, and (final only) any residual `NEEDS_DECISION`.
2. **§5 test-and-metrics** — taste/contested decisions (`BRANDING_DECISION.md`,
   `DESIGN_DECISION.md`) must carry **variations + a metric + a change trigger**.
3. **§5.1 external-fact gate** — `NAME_CLEARANCE.md`, `LEGAL_REQUIREMENTS.md`, `BUILD_PLAN.md` must
   carry `Web-grounded: yes — <source/date>` (or, mid-run only, a `NEEDS_DECISION`).
4. **Executed evidence** — `VERIFICATION_REPORT.md` must cite ≥2 distinct executed-evidence tokens
   (screenshot / axe / HTTP 200 / viewport / console), not prose.

## Self-test

```bash
tests/quality/run.sh
```

The golden completed run (`tests/fixtures/golden-run/`) lints **CLEAN** (26 artifacts), and eight
injected defects — one per rule, plus the unsubstituted token and the prose-only verification report
— are each caught. The `NEEDS_DECISION` lenience is verified both ways: tolerated per-slice, flagged
`--final`.

## Lint a real run

```bash
tests/quality/run.sh /path/to/drax-workspace            # per slice
tests/quality/run.sh /path/to/drax-workspace --final    # at end of run (strict)
# or: node tests/quality/artifact-linter.mjs <wsRoot> [--final]
```

Exit 0 = clean; non-zero lists `file: issue` per finding.

> Building this linter surfaced two real gaps in the reference fixtures (a minimal `DESIGN_DECISION`
> missing §5 fields; a prose-only `VERIFICATION_REPORT`) and one unsubstituted `<brand>` token in a
> seed note — all fixed so the golden baseline is genuinely exemplary. The gate engine
> (`tests/gate/verify-gate.mjs`) now also writes the executed-evidence section into the
> `VERIFICATION_REPORT` it produces.
