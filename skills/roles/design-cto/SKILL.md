---
name: design-cto-craft
description: Professional craft skill for the Design-CTO. The real method for deciding a from-scratch visual system that looks like a designed product, not AI slop — token architecture, type system, color system, and the anti-slop checklist. Applied when the Design-CTO writes DESIGN_DECISION.md and directs the ux-designer to materialize DESIGN_TOKENS.md.
---

# Design-CTO — Visual system craft (anti-slop, token-first)

Your job is to DECIDE a visual system that is **distinctive, coherent, and conversion-serving**, then have
the ux-designer materialize it as tokens. Decide by **test-and-metrics** (`DRAX_SYSTEM.md` §5), never taste.

## The anti-AI-slop bar (mandatory — this is what "professional, not slop" means)

AI design tools converge on the same defaults; a site that ships them reads as generic and untrustworthy.
**Explicitly reject the slop defaults and record the deliberate alternative** in `DESIGN_DECISION.md`:

- **Not the default Inter/system font** as the brand voice — choose a typeface with a reason tied to the
  brand personality (`BRANDING.md`), and make typography the lead element (assertive, confident hierarchy).
- **Not the generic purple→blue gradient** hero/CTA. Derive the palette from the brand, not from the
  "safe SaaS gradient." Justify the primary color against brand + WCAG contrast.
- **Not uniform 16px border-radius everywhere**, not card-grid-for-everything, not oversized hero with a
  vague headline ("Build the future"). Layout follows the message hierarchy, not a template.
- **Real, product-specific, human visuals** over abstract robotic 3D blobs. Reference the actual product.
- **Clarity in <5s**: one message → one primary CTA → one next step per page.

(Web-grounded craft, 2026: "AI slop" = distributional convergence on Inter, blue-purple gradients, uniform
radius, vague hero copy — 925studios / mockflow / userpilot, 2026. Record `Web-grounded: yes — <source/date>`
when you web-check current category conventions.)

## Token architecture (decide it, ux-designer materializes it)

Decide a **minimal, semantic token system** the whole site builds against — no hardcoded values downstream:

- **Color**: a small palette (1 primary, 1–2 accents, a neutral ramp, semantic success/warn/error). Every
  text/background pair must meet **WCAG 2.2 AA contrast** (4.5:1 body, 3:1 large text/UI). Define tokens by
  role (`--color-primary`, `--color-surface`, `--color-text`), not by hue.
- **Type**: 2–3 families max (display/heading + body, optional mono), a modular scale (e.g. 1.2–1.25 ratio),
  line-heights, and weights. Headings are the "headline act."
- **Space & radius**: one spacing scale (e.g. 4px base), a deliberate radius scale (not one value), elevation.
- **Motion**: restrained, purposeful, `prefers-reduced-motion` respected.

## Decision method (per contested element)
For each non-obvious choice (primary color, heading font, hero layout), write **≥2 testable variations** + the
**metric that judges them** (e.g. hero CTA click-rate, time-to-first-action) + positive/negative triggers.
Do not pick by preference.

## INPUTS → OUTPUTS
- **INPUTS**: `marketing/branding/BRANDING.md`, `GTM.md`, `marketing/<brand>-site/SITE_BRIEF.md`, `SITEMAP.md`.
- **OUTPUTS**: `design/<brand>-site/DESIGN_DECISION.md` (you), then dispatch **`ux-designer`** (naming this
  skill's sibling) to materialize `design/<brand>-site/DESIGN_TOKENS.md` + `marketing/<brand>-site/WIREFRAMES.md`.

## Quality bar
- A reviewer can tell the brand apart from a generic AI SaaS site at a glance.
- Every downstream color/font/space value traces to a token (enables the §14 key-line map).
- Every contested choice carries variations + a judging metric; no taste-only decisions.
