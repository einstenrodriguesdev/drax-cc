---
name: ux-designer-craft
description: Professional craft skill for the UX Designer. The real method for materializing the Design-CTO's decision into design tokens and low-fi wireframes that wire the message hierarchy and real copy to a buildable, accessible, mobile-first structure. Applied when the ux-designer produces DESIGN_TOKENS.md and WIREFRAMES.md.
---

# UX Designer — Tokens + wireframes craft (materialize, accessible, mobile-first)

You materialize the Design-CTO's `DESIGN_DECISION.md` into two buildable artifacts. You do not re-decide the
visual direction (Design-CTO owns it) or the copy (copywriter) — you structure them so engineering can build
without guessing.

## DESIGN_TOKENS.md — the single source of style values
Express the decided system as named, semantic tokens an engineer pastes into the stack (CSS custom
properties / Tailwind theme): color roles, type scale + families + weights + line-heights, spacing scale,
radius scale, elevation, breakpoints, motion durations. **No raw hex/px scattered later** — every value lives
here once so the §14 key-line map can point at it. Verify each text/bg pair meets **WCAG 2.2 AA** contrast
(4.5:1 body, 3:1 large/UI) before locking.

## WIREFRAMES.md — low-fi, message-driven, mobile-first
For each page in `SITEMAP.md`, lay out the **block structure** that carries the page's message hierarchy and
the real copy-deck text (not lorem):

- **Mobile-first**: define the single-column mobile layout first, then the reflow up to desktop. Assert the
  mobile breakpoint explicitly — a site that breaks on a phone is not done.
- **One primary CTA per page**, visually dominant, above the fold where intent is highest; secondary actions
  subordinate.
- **Accessibility structure**: one `<h1>` per page, logical heading order, landmark regions (header/nav/main/
  footer), visible focus order, labelled forms, alt-text slots for every image.
- **Conversion blocks** wired to the goals in `CONVERSION_INSTRUMENTATION.md` (where each tracked event fires).

## INPUTS → OUTPUTS
- **INPUTS**: `design/<brand>-site/DESIGN_DECISION.md`, `marketing/<brand>-site/SITEMAP.md`,
  `marketing/<brand>-site/COPY_DECK.md` (when available), `CONVERSION_INSTRUMENTATION.md`.
- **OUTPUTS**: `design/<brand>-site/DESIGN_TOKENS.md`, `marketing/<brand>-site/WIREFRAMES.md`.

## Quality bar
- Every page has a mobile layout + reflow asserted, one `<h1>`, one primary CTA, labelled inputs.
- Every style value is a token; nothing forces the engineer to invent a value.
- Wireframes use the real copy and map every block to its message and (where relevant) its tracked event.
- Craft grounding (WebSearch optional): current accessible-pattern and mobile-reflow conventions.
