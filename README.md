# drax-cc

Lean, **on-demand** agentic orchestration for a solo founder, native to Claude Code. Unlike the
gate-driven `drax-plugin-cc` (Chairman-first, full governance suite up front), drax-cc **reduces gaps
toward the single most important objective**, building the chain only as far as that objective needs.

## How a run works

`/drax-init` (or `/drax`) — owned by the **CEO** (the Chairman stays hidden; it surfaces only on explicit
venture-capital intent):

1. **Detect** a prior run (`drax-workspace/` in the current dir or its parent) and read which drax version
   ran here.
2. **Report** what was found.
3. **Continue vs. new** (reuse files, non-destructive) or start fresh.
4. **Scenario** sets the order. Current focus: **marketing** — a product that exists but has no marketing
   operation → activates the **CMO**.
5. **Record** the scenario in `drax-workspace/init/` (this is "the drax-init folder").
6. **Branding loop** (two layers, on demand):
   - **CMO decides** the brand foundation — core / positioning / persona — branding first, **nothing
     technical** (no sitemap). → `marketing/BRANDING_DECISION.md`
   - **Brand IC materializes** the decision into a real artifact. → `marketing/BRANDING.md`
   - **CTO instruments** brand-health metrics + positive/negative change triggers. →
     `marketing/BRAND_METRICS_AND_TRIGGERS.md`

## Principles

- **Two layers** — C-levels DECIDE, ICs MATERIALIZE. A decision isn't done until an IC turned it into a
  real file.
- **Test-and-metrics, not preference** — every contested element ships as a testable variation with
  brand-health metrics and explicit +/− change triggers. Observability is the CTO's.
- **On demand** — capability added only when the objective needs it.
- Interview in the founder's language; artifacts in English under `drax-workspace/`.

## Status

**Slice 1** — the marketing scenario's **branding loop**, end to end: CEO opens the run and records the
scenario; CMO decides the brand foundation; a brand IC materializes `BRANDING.md`; the CTO instruments
metrics + triggers. Agents are purpose-built and lean: `ceo`, `cmo`, `brand-strategist`, `cto`.

**Future paths** (added on demand): copy foundations, personas + persuasion, audience-attraction
priority; then the technical materialization (site) and the other scenarios (`product` → CPO,
`sell_more` → CRO chain).

See `DRAX_SYSTEM.md` for the constitution.
