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

`/drax-site` — owned by the **CMO**, after the branding loop, when the founder decides to **build a site
from scratch** as the marketing starting point. It **closes the marketing layer** by producing the
**Site Build Package** — the single, complete handoff the technology team needs to build, with no further
marketing questions. CMO-led and **IC-gated** (the demand test): an IC is activated only when the gap is
real, its input is usable, and the work is materialization (not decision); whatever `GTM.md`/`BRANDING.md`
already settle is reused, not re-derived.

The package's eight components and who produces each:

| Component | Artifact | Producer |
| --- | --- | --- |
| **Legal requirements + pages (mandatory)** | `legal/<brand>-site/LEGAL_REQUIREMENTS.md`, `LEGAL_PAGES.md` | clo (C) + legal-counsel (IC) |
| Sitemap / IA + page briefs (message hierarchy) | `marketing/<brand>-site/SITEMAP.md` | content-strategist (IC) |
| SEO keyword map | `marketing/<brand>-site/KEYWORD_MAP.md` | seo-manager (IC) |
| Copy deck (with A/B variants) | `marketing/<brand>-site/COPY_DECK.md` | copywriter-performance (IC) |
| Visual system decision | `design/<brand>-site/DESIGN_DECISION.md` | design-cto (C) |
| Design tokens + low-fi wireframes | `design/<brand>-site/DESIGN_TOKENS.md`, `WIREFRAMES.md` | ux-designer (IC) |
| Conversion goals + instrumentation | `marketing/<brand>-site/CONVERSION_INSTRUMENTATION.md` | CMO + CTO |
| Indexed handoff + asset list + acceptance criteria | `marketing/<brand>-site/SITE_BUILD_PACKAGE.md` | CMO |

The **CLO enters early** (at the site brief, before the sitemap locks): its mandatory pages — Terms of
Service, Privacy Policy (LGPD), Cookie Policy + consent, data-subject rights, Acceptable Use,
Refund/Billing — flow into the sitemap and copy deck, and the CTO's coverage gate (Slice 3) **blocks** the
build if they're missing. The technology team then materializes the real site in `drax-site/` against the
package + acceptance criteria.

### Layout convention

Every artifact lives under `drax-workspace/<sector>/<initiative>/<ARTIFACT>.md` — a subfolder per
initiative, never loose at a sector root. For the site, `<initiative>` is `<brand>-site` (e.g.
`drax-site`), so you can read one initiative **across** sectors: `marketing/drax-site/`,
`design/drax-site/`, `legal/drax-site/`, `technology/drax-site/`, `cybersecurity/drax-site/`. Brand work is
its own initiative (`marketing/branding/`). The built site code stays at the repo root `drax-site/`.

## Principles

- **Two layers** — C-levels DECIDE, ICs MATERIALIZE. A decision isn't done until an IC turned it into a
  real file.
- **IC-activation gating (the demand test)** — activate an IC only when the gap is real, its input is
  usable, and the work is materialization; reuse what's already settled, skip what isn't needed, record
  why. Strategy stays with the C-level.
- **Test-and-metrics, not preference** — every contested element (copy, title, color, token) ships as a
  testable variation with metrics and explicit +/− change triggers. Observability is the CTO's.
- **On demand** — capability added only when the objective needs it.
- Interview in the founder's language; artifacts in English under `drax-workspace/`.

## Status

**Slice 1** — the marketing scenario's **branding loop**, end to end: CEO opens the run and records the
scenario; CMO decides the brand foundation; a brand IC materializes `BRANDING.md`; the CTO instruments
metrics + triggers. Agents: `ceo`, `cmo`, `brand-strategist`, `cto`.

**Slice 2** (`/drax-site`) — closes the marketing layer with the **Site Build Package**: the CMO-led,
IC-gated handoff the technology team builds a from-scratch site against. Adds purpose-built ICs activated
only on demand: `content-strategist`, `seo-manager`, `copywriter-performance`, a design layer
(`design-cto` + `ux-designer`), and a **legal layer** (`clo` + `legal-counsel`) that enters early for the
mandatory legal pages.

**Slice 3** (`/drax-build`) — the **technology team** turns the package into a real site. The CTO **first
gates the package for buildability/coverage** (`BUILD_READINESS.md` — does marketing actually cover
everything needed?), and only on `READY` decides the architecture (`BUILD_PLAN.md`) and dispatches
engineering ICs (`senior-frontend-engineer`, and on demand `qa-engineer`, `devops-engineer`) to build the
real site in `drax-site/`. Never builds on a blind spec.

**Slice 4** (`/drax-secure`) — the **cybersecurity sector** secures the deployment. The CISO decides the
posture (STRIDE threat model + prioritized recommendations) and dispatches `security-engineer` (VPS
hardening), `penetration-tester` (authorized pentest), and `soc-analyst` (SOC/detection). It operates on
the founder's own authorized infrastructure; **every live infra action is approval-gated and
non-destructive, and connection-identity is never stored**.

**Slice order:** `/drax` (branding) → `/drax-site` (package) → `/drax-build` (coverage-gate + build) →
`/drax-secure` (secure). **Future paths** (on demand): personas + persuasion and audience-attraction
within marketing; the other scenarios (`product` → CPO, `sell_more` → CRO chain).

See `DRAX_SYSTEM.md` for the constitution.
