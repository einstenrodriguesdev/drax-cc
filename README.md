# drax-cc

Lean, **on-demand** agentic orchestration for a solo founder, native to Claude Code. Unlike the
gate-driven `drax-plugin-cc` (Chairman-first, G0→G8, full governance suite up front), drax-cc
**reduces gaps toward the single most important objective**, building the C-suite chain only as far
as that objective needs.

## How a run opens

`/drax-init` (or `/drax`) — owned by the **CEO** (the Chairman stays hidden; it surfaces only on
explicit venture-capital intent):

1. **Detect** a prior run — `drax-workspace/` in the current dir or its parent — and read which drax
   version ran here.
2. **Report** what was found (version, documents, prior scenario).
3. **Continue vs. new** — continue the project (reuse files, non-destructive, approval-gated) or
   start fresh.
4. **Scenario** sets the orchestration order:
   - product fabrication/refinement → **CPO** first
   - marketing construction → **CMO** first
   - sell even more → **CRO** chain (CRO + CFO + CMO + CTO + CISO …)
5. **Record** the decision to `drax-workspace/init/DECISION.md` + `.drax/state.json`.
6. **Name** the first activation — and stop (current slice).

## Principles

- **Test-and-metrics, not preference** — even a color or font is chosen by test; every funnel layer
  carries an observability demand.
- **On demand** — capability is added when the objective needs it, never as ceremony.
- Interview in the founder's language; artifacts written in English under `drax-workspace/`.

## Status

**Slice 1** — `drax-workspace/` + the CEO's `/drax-init` flow (detect → report → continue/new →
scenario → record → name first activation). Dispatching the first C-level and building the
`marketing/` · `technology/` · `legal/` · `security/` departments are subsequent slices.

See `DRAX_SYSTEM.md` for the constitution.
