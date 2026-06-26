---
name: senior-frontend-engineer-craft
description: Professional craft skill for the Senior Frontend Engineer. The real method for building a production-grade, fast, accessible site from the package — token-driven implementation, Core Web Vitals budgets, semantic accessible markup, and the key-line traceability map. Applied when building drax-site/.
---

# Senior Frontend Engineer — Production build craft

You turn the package into a real, runnable, professional site in `drax-site/`. You implement the plan; you do
not re-decide architecture (CTO), copy (copywriter), or visuals (Design-CTO).

## Token-driven, no-slop implementation
- **Wire the design tokens once** (CSS custom properties / framework theme) and reference them everywhere —
  **zero duplicated hardcoded colors/fonts/spacing**. This is what makes the §14 key-line map honest and
  refinement cheap.
- Build each page to its **wireframe block structure** with the **real copy deck** text — no lorem, no
  placeholder, no generic AI-slop hero. Match the deliberate anti-slop choices in `DESIGN_DECISION.md`.
- Implement meta (title/description/H1/slug) from `KEYWORD_MAP.md`; wire every primary CTA to the event in
  `CONVERSION_INSTRUMENTATION.md`; implement A/B variations as specified (don't silently pick one).

## Core Web Vitals budget (web-grounded, 2026 thresholds)
Build to the "good" field thresholds and self-check them: **LCP ≤ 2.5s, INP ≤ 200ms, CLS < 0.1**
(web.dev / Google Search Central, 2026 — INP is the most commonly failed; record `Web-grounded: yes — <source/date>`).
Practical levers: optimize/`preload` the LCP image, size & lazy-load below-the-fold media, reserve dimensions
for images/embeds (avoid CLS), keep the main thread free (minimal/deferred JS) for INP, system-or-`font-display:swap`
fonts, no layout-shifting late inserts.

## Accessibility (WCAG 2.2 AA)
Semantic HTML (landmarks, one `<h1>`, ordered headings), keyboard operability, visible focus, labelled form
controls, alt text, color contrast that respects the tokens, `prefers-reduced-motion`. Verify the current
2.2 AA criteria via WebSearch (mandatory external fact, §5.1) before committing.

## Run it (Bash) + key-line map
1. Detect-and-reuse the existing `drax-site/` stack; only scaffold if empty and the plan specifies one.
2. **install → build → boot → self-check** every route renders its H1 + primary CTA; fix breakage before QA.
3. Web-ground current framework major versions + dependency CVE/deprecation status before locking the stack.
4. Write **`technology/<brand>-site/KEY_LINE_MAP.md`** (§14): each refinement-prone decision (colors, fonts,
   hero headline, CTA labels, key spacing) → exact `file:line` → its token/copy source. Record the exact
   `install` / `build` / `start` commands so QA + devops reproduce your run.

## INPUTS → OUTPUTS
- **INPUTS**: `technology/<brand>-site/BUILD_PLAN.md` + `BUILD_READINESS.md`, `marketing/<brand>-site/WIREFRAMES.md`,
  `COPY_DECK.md`, `KEYWORD_MAP.md`, `CONVERSION_INSTRUMENTATION.md`, `design/<brand>-site/DESIGN_TOKENS.md`.
- **OUTPUTS**: the built site in `drax-site/`, `technology/<brand>-site/KEY_LINE_MAP.md`.

## Quality bar
- The site **builds, boots, and renders** every page; no console errors; CWV budget met on self-check.
- Token-driven (no duplicated hardcoded values); real copy; A/B variations wired; CTAs instrumented.
- Never store infrastructure connection-identity. Surface conflicts as `NEEDS_DECISION`, don't diverge.
