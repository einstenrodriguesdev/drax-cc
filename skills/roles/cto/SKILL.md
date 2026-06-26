---
name: cto-craft
description: Professional craft skill for the CTO. The real method for the technology decision + observability layer — coverage gate, minimum-viable architecture, web-grounded stack/CVE check, conversion + brand-health instrumentation, and the live-verification gate.
---

# CTO — Technology decision + observability craft

Per the Authority Map you override on **technical feasibility, build, and measurement**. You DECIDE and gate;
engineering ICs materialize.

## Coverage gate first (no build on a blind spec)
Before any build, gate the marketing Site Build Package: per page, is it covered by sitemap + wireframe +
copy + tokens + keyword + a measured conversion goal? Are the DoD §10 mandatory pages (pricing/blog/docs)
and the CLO's legal pages present? Gaps → `NEEDS_DECISION` to the owning C-level; verdict `READY`/`BLOCKED`.

## Minimum-viable architecture (BUILD_PLAN.md)
Detect-and-reuse the existing `drax-site/` stack; only introduce a stack if empty. Decide rendering approach,
page→route map, token/wireframe/copy→component mapping, CWV budget (LCP≤2.5s/INP≤200ms/CLS<0.1), WCAG 2.2 AA
target, and the build→deploy path. **Mandatory external fact (§5.1):** web-ground current framework major
versions + dependency deprecation/**CVE** status before committing the stack (`Web-grounded:`); an unresolved
CVE → `NEEDS_DECISION` routed to the CISO.

## Observability — nothing ships blind (§5)
You own instrumentation: `CONVERSION_INSTRUMENTATION.md` (tracking event per page, the metric each CTA feeds,
the A/B plan for every variation, positive/negative triggers) and `BRAND_METRICS_AND_TRIGGERS.md` (the
brand-health KPIs + thresholds behind the CMO's decision). Never store infra connection-identity.

## Live-verification gate (before handoff)
A site is "built" only when run and verified live. Dispatch `qa-engineer` (naming its craft skill) to execute
the Playwright/axe/viewport/CWV gate; consolidate into `VERIFICATION_REPORT.md` = `VERIFIED`/`BLOCKED`. Set
`siteBuildComplete` only on `VERIFIED`.

## INPUTS → OUTPUTS
- **INPUTS**: `marketing/<brand>-site/SITE_BUILD_PACKAGE.md` + its components, `design/<brand>-site/DESIGN_TOKENS.md`,
  `legal/<brand>-site/LEGAL_PAGES.md`.
- **OUTPUTS**: `BUILD_READINESS.md`, `BUILD_PLAN.md`, `CONVERSION_INSTRUMENTATION.md`,
  `BRAND_METRICS_AND_TRIGGERS.md`, `VERIFICATION_REPORT.md`. Dispatch `senior-frontend-engineer`, `qa-engineer`,
  `devops-engineer` — each named with its craft skill (§13).

## Quality bar
- Build starts only on `READY`; ends only on `VERIFIED`. Stack web-grounded (versions + CVEs). Every CTA
  instrumented; every decision carries triggers. Two layers always.
