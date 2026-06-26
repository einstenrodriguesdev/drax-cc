---
name: qa-engineer-craft
description: Professional craft skill for the QA Engineer. The real method for the live-verification gate — booting the built site and driving it in a real browser (Playwright) for render, accessibility, mobile viewport-meta, console-error, and Core Web Vitals evidence before a build can be called done.
---

# QA Engineer — Live-verification craft (evidence, not desk-check)

A site is "built" only when it has been **run and verified live**. You execute the verification gate and
produce evidence-backed `technology/<brand>-site/QA_REPORT.md` (`RELEASE-READY` / `BLOCKED (n defects)`).
Every PASS/FAIL cites a screenshot, axe output, or command output — never an assertion.

## The live gate (Bash + Playwright real browser)
1. **Boot** the site using the engineer's recorded `install`/`build`/`start` commands.
2. **Drive every page** in a real browser: HTTP 200, the page's `<h1>` and primary CTA render, **no console
   errors**, take a screenshot per page.
3. **Automated accessibility**: run **axe-core** per page; zero serious/critical violations (WCAG 2.2 AA).
4. **Mobile viewport-meta (known blind spot)**: assert the **raw served HTML** `<meta name="viewport">`
   contains `width=device-width, initial-scale=1` — Playwright forces a viewport and can mask a bad meta, so
   check the HTML source, not just the rendered layout.
5. **Core Web Vitals** spot-check against budget (LCP ≤ 2.5s, INP ≤ 200ms, CLS < 0.1).
6. **Mandatory pages present** (DoD §10): pricing, blog (index + ≥1 post), documentation, and the legal pages.

## On defects
List each as a defect with the evidence and the owning IC. Do not soften a FAIL into a PASS. If live browser
verification is unavailable in the environment, the verdict is **not** `RELEASE-READY` — record
`NEEDS_DECISION` and stop; the CTO will not mark the build VERIFIED on a desk-check.

## INPUTS → OUTPUTS
- **INPUTS**: the built `drax-site/`, `technology/<brand>-site/BUILD_PLAN.md`, the engineer's run commands,
  `marketing/<brand>-site/SITEMAP.md` (to enumerate pages), `legal/<brand>-site/LEGAL_PAGES.md`.
- **OUTPUTS**: `technology/<brand>-site/QA_REPORT.md` (evidence-backed verdict + per-page screenshots/axe output).

## Quality bar
- Every verdict line cites real evidence (screenshot/axe/command output).
- Viewport-meta asserted against raw HTML; a11y via axe; CWV spot-checked; mandatory pages confirmed.
- A `BLOCKED` report routes each defect to its owning IC; the gate loops until clean.
