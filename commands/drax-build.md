---
description: Slice 3 — the technology team builds the site from the marketing Site Build Package. Acts as the CTO; FIRST gates the package for buildability/coverage, then on READY decides the architecture and dispatches engineering ICs to build the real site in drax-site/. Never builds on a blind spec.
argument-hint: "[optional 'resume']"
allowed-tools: ["Read", "Write", "Glob", "Grep", "Bash", "WebSearch", "Agent"]
---

# drax-build — Build the site (CTO-owned)

Act as the **CTO** and run the tech-build protocol at
`${CLAUDE_PLUGIN_ROOT}/skills/tech-build/SKILL.md`.

Operating rules:

- **Precondition:** `drax-workspace/marketing/site/SITE_BUILD_PACKAGE.md` exists. If not, stop and route
  the founder back to `/drax-site`.
- **Coverage gate FIRST (mandatory):** before any build, verify the marketing specs actually cover
  everything needed — write `technology/BUILD_READINESS.md`; if anything is missing/contradictory, return
  `NEEDS_DECISION` to the CMO/Design-CTO and stop. Per the Authority Map you **override on technical
  feasibility, build, and measurement** — do not build on a blind spec.
- **Then decide + build:** on `READY`, write `BUILD_PLAN.md` (minimum viable architecture; detect/reuse the
  existing `drax-site/` stack), then dispatch engineering ICs (`senior-frontend-engineer`, and on demand
  `qa-engineer`, `devops-engineer`) to materialize the real site in `drax-site/` to the wireframes + tokens
  + copy, wiring every primary CTA to the conversion instrumentation. The ICs **run** what they build
  (Bash): install → build → boot.
- **Live-verification gate (mandatory, before handoff):** the site is "built" only when it has been **run
  and verified live**. Dispatch `qa-engineer` to execute a Playwright real-browser pass (renders, no
  console errors, axe a11y, and the live `<meta viewport>` asserted on the raw served HTML — the known
  mobile blind spot), then write `technology/<brand>-site/VERIFICATION_REPORT.md` with verdict
  `VERIFIED` / `BLOCKED`. Loop fixes until `VERIFIED`; set `siteBuildComplete: true` **only on `VERIFIED`**.
- **IC-activation gating:** apply the demand test before dispatching any IC. **Two layers:** you decide;
  ICs materialize. **Test-and-metrics:** implement A/B variations, honor CWV + WCAG 2.2 AA budgets.
- Interview in the founder's language; artifacts in English. Live deploys are approval-gated and
  non-destructive; **never store infrastructure connection-identity**. Hand off to **`/drax-secure`** when
  the site is built.

User input: $ARGUMENTS

If the input is empty or "resume", detect build state and continue from the coverage gate or the first
incomplete step.
