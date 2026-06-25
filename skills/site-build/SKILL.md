---
name: site-build
description: Close the marketing layer by producing the Site Build Package — the single, complete handoff the technology team needs to build a from-scratch site. CMO-led and IC-gated — the CMO owns strategy and dispatches marketing/design ICs to materialize each component, activating an IC only when the gap is real and its input artifact is usable. Runs after the branding loop; nothing here is built by preference.
---

# site-build — The marketing → technology handoff (CMO-owned)

You are acting as the **CMO** of the drax-cc org. Read `{{DRAX_ASSETS}}/DRAX_SYSTEM.md` first and obey it:
orchestration **on demand**, **two layers** (C-levels decide, ICs materialize), **test-and-metrics not
preference**, **IC-activation gating** (§ the demand test), Chairman hidden.

This slice runs when the founder, after the branding loop, decides to **build a site from scratch as the
starting point of the marketing operation**. The marketing layer does not "end" when the brand is decided
— it ends when it hands the technology team **one usable package** that needs no further marketing input.

- Interview in the founder's language; write artifacts in English under `drax-workspace/`; one question at
  a time; never invent facts (`NEEDS_DECISION: <what>`).
- Ground everything in the ratified tree: `VISION.md`, `GTM.md` (positioning, message house, funnel KPIs),
  `marketing/branding/BRANDING.md`, `marketing/branding/BRAND_METRICS_AND_TRIGGERS.md`. Do not re-decide what they already settle.

## Precondition
`drax-workspace/init/STATE.json` exists with `brandingLoopComplete: true`. If branding isn't done, stop
and route back to the branding loop first.

## The target — the Site Build Package (the contract)

The slice closes when `drax-workspace/marketing/<brand>-site/SITE_BUILD_PACKAGE.md` indexes a complete
handoff — the nine components the tech team needs to build with zero further marketing or legal questions:

| # | Component | Artifact | Producer |
| --- | --- | --- | --- |
| 0 | Legal requirements (mandatory pages + disclosures) | `legal/<brand>-site/LEGAL_REQUIREMENTS.md` + `legal/<brand>-site/LEGAL_PAGES.md` | clo (C) + legal-counsel (IC) |
| 1 | Sitemap / IA (incl. mandatory legal pages) | `marketing/<brand>-site/SITEMAP.md` | content-strategist (IC) |
| 2 | Message hierarchy per page | `marketing/<brand>-site/SITEMAP.md` (page briefs) | content-strategist (IC) |
| 3 | Low-fi wireframes | `marketing/<brand>-site/WIREFRAMES.md` | ux-designer (IC) |
| 4 | Copy deck (with A/B variants + legal disclosures) | `marketing/<brand>-site/COPY_DECK.md` | copywriter-performance (IC) |
| 5 | SEO keyword map | `marketing/<brand>-site/KEYWORD_MAP.md` | seo-manager (IC) |
| 6 | Design tokens + visual identity | `design/<brand>-site/DESIGN_DECISION.md` + `design/<brand>-site/DESIGN_TOKENS.md` | design-cto (C) + ux-designer (IC) |
| 7 | Conversion goals + instrumentation | `marketing/<brand>-site/CONVERSION_INSTRUMENTATION.md` | CMO (goals) + CTO (instrument) |
| 8 | Asset list + acceptance criteria | `marketing/<brand>-site/SITE_BUILD_PACKAGE.md` | CMO |

**Component 0 (legal) comes first and is near-mandatory** for any public site that collects data: the
demand test's "is the gap real?" almost always passes (no public site ships without ToS/Privacy). The CLO
enters at the brief — its mandatory pages must reach the sitemap, and its disclosures the copy deck,
*before* either is locked.

## IC-activation gating — the demand test (mandatory)

You do **not** dispatch the whole team. Before activating any IC, apply the three-question demand test
from the constitution; activate **only** if all three pass:

1. **Is the gap real?** Does a usable version of this artifact already exist (in `GTM.md`, `marketing/branding/BRANDING.md`,
   or the legacy tree)? If yes → **reuse it, do not activate** the IC. (E.g. positioning + message house
   already exist in GTM — do not re-derive them.)
2. **Is the input ready?** Does the upstream gate artifact this IC consumes exist and is it usable? If no
   → **do not activate yet**; produce the gate first.
3. **Is this materialization, not decision?** Decisions stay with you (the CMO) or the owning C-level.
   Only dispatch an IC to **materialize** an artifact.

Record each activate/skip/reuse choice and its reason in the package, so the handoff shows why each IC
ran or didn't.

## Protocol

### Step 0 — Frame (CMO, no IC)
Confirm with the founder, one question at a time, only what the ratified docs don't already settle: the
**objective of the site** (the one primary action it must drive, tied to the GTM funnel — e.g. guided-
trial starts), its must-have pages, and any hard constraints. Write the decision into
`drax-workspace/marketing/<brand>-site/SITE_BRIEF.md`: site objective, primary action, audience/stage, the page
set, the per-component plan, and — per the demand test — **which ICs you will activate vs. reuse vs.
skip, with reasons**. This is your strategy layer; no IC runs yet.

### Step 0.5 — Legal requirements (CLO, early — before the sitemap locks)
Legal enters at the **kickoff of the site track**, not after the build. Dispatch **`clo`** (C-level,
cross-domain) with the `SITE_BRIEF.md` + `VISION.md` + `GTM.md`: it decides
`legal/<brand>-site/LEGAL_REQUIREMENTS.md` (business-legal model, data map, the **mandatory pages** the
site must carry — ToS, Privacy/LGPD, Cookie+consent, data-subject rights/DPO, Acceptable Use,
Refund/Billing if paid, accessibility, legal-identification — plus the **mandatory disclosures**, consent/
dark-pattern rules, and IP/claims limits) and the cross-cutting `legal/COMPLIANCE_BASELINE.md`. The CLO
then dispatches **`legal-counsel`** to materialize `legal/<brand>-site/LEGAL_PAGES.md` (the actual draft
page copy, jurisdiction-aware, review-flagged — **not legal advice**). Per the Authority Map the CLO's
legal determinations are **binding**; you (CMO) feed its mandatory pages into the sitemap (Step 1) and its
disclosures into the copy deck (Step 3). Near-mandatory: only skip if the site is truly non-public and
collects no data — record the reason.

**Mandatory external fact (§5.1):** the applicable law is a moving target. The CLO/legal-counsel **must
web-ground** the current state of the data-protection regime (LGPD/GDPR), cookie-consent and
dark-pattern rules, and accessibility obligations **for the named jurisdiction** before locking
`LEGAL_REQUIREMENTS.md` — and record `Web-grounded: yes — <source/date>` (or `NEEDS_DECISION` if the
jurisdiction/regime can't be confirmed). Do not state a legal obligation from memory.

### Step 1 — Structure (gate the content-strategist)
Demand test on the sitemap. If no usable IA exists and `SITE_BRIEF.md` is ready → dispatch
**`content-strategist`** to materialize `marketing/<brand>-site/SITEMAP.md` (page tree + buyer-stage map + per-page briefs
with message hierarchy + block inventory). **Pass it the CLO's `LEGAL_REQUIREMENTS.md` so every mandatory
legal page is in the sitemap.** Review against the brief, the legal requirements, and the GTM funnel.

### Step 2 — Search grounding (gate the seo-manager)
Only if organic search is an intended channel and `SITEMAP.md` exists → dispatch **`seo-manager`** to
materialize `marketing/<brand>-site/KEYWORD_MAP.md` (primary keyword + intent + meta per page, contested titles as A/B).
If organic search is not a channel for this site, **skip and record why**.

**Mandatory external fact (§5.1):** keyword demand and intent are external realities — they **cannot** be
fabricated from memory. When this gate runs, the seo-manager **must** web-ground the real terms, intent,
and relative demand for the category and record `Web-grounded: yes — <source/date>`. Never assert a
volume or intent that wasn't checked; an unverifiable term becomes `NEEDS_DECISION`.

### Step 3 — Copy (gate the copywriter)
Once page briefs + keyword map exist → dispatch **`copywriter-performance`** to materialize
`marketing/<brand>-site/COPY_DECK.md` (final per-block copy, one primary CTA per page, conversion-critical lines as A/B,
strict claims compliance with `marketing/branding/BRANDING.md`). **Pass it the CLO's mandatory disclosures
(cookie-consent banner, footer legal block, consent microcopy) so they are placed in the copy deck.**
Review for voice + claims + legal disclosures. The copywriter web-grounds **voice-of-customer** language
(real category/customer wording) and the **legality of any claim** (no false/illegal comparative or
superlative claims) — craft grounding except where a claim's legality is the question, which is a
mandatory external fact. Never invent a product fact, price, or claim — those come only from the founder
or the ratified tree.

### Step 4 — Visual system (gate the design layer)
Because the brand is verbal-only, a from-scratch site needs a visual system. Dispatch **`design-cto`**
(C-level) to DECIDE `design/<brand>-site/DESIGN_DECISION.md` (visual direction + token decisions, each contested
element with test variations + the judging metric). The Design CTO then dispatches **`ux-designer`** to
materialize `design/<brand>-site/DESIGN_TOKENS.md` and `marketing/<brand>-site/WIREFRAMES.md` (low-fi blocks wiring the message
hierarchy + real copy to a buildable structure, one primary CTA per page, mobile reflow asserted).

### Step 5 — Conversion goals + instrumentation (CMO decides, CTO instruments)
You set the **conversion goal per page** — the one primary action and its target, mapped to the GTM funnel
(e.g. home → trial-start; pricing → paid). Then dispatch **`cto`** to instrument
`marketing/<brand>-site/CONVERSION_INSTRUMENTATION.md`: the tracking events per page, the metric each CTA feeds, the A/B
test plan for every copy/token/title variation, and positive/negative triggers — **never** storing
infrastructure connection-identity. No CTA ships without a measured goal.

### Step 6 — Package + accept (CMO)
Write `drax-workspace/marketing/<brand>-site/SITE_BUILD_PACKAGE.md`: an index of all eight components with their
file paths and status, the **asset list** the tech team still needs (logo files, imagery, fonts — by name),
the **acceptance criteria** ("done" = each page built to its wireframe + copy + tokens, every primary CTA
instrumented, all A/B variations wired), the activate/skip/reuse ledger, and any open `NEEDS_DECISION`.
Update `STATE.json` (`siteBuildPackageComplete: true`, progress per component).

### Step 7 — Hand off and stop
Confirm the real files exist, summarize the package + the open decisions for the founder, and name the
next move: **`/drax-build`** (Slice 3) — the CTO first gates this package for coverage (does it actually
cover everything needed to build?) and then materializes the real site in `drax-site/` to the package +
acceptance criteria. Then stop — this is the slice boundary; the CMO does not build the site itself.

## Notes
- Two layers always: a decision is not done until an IC materialized it into a real file.
- Lean + on demand: build the minimum site the objective needs; skip ICs the demand test rejects.
- Model posture: CMO/Design-CTO/CTO on the newest Opus; ICs on the newest Sonnet.
- Live external actions and any restructuring/migration are approval-gated and non-destructive.
