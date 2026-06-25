# Fixture product — MeiCaixa (pinned)

A fake-but-realistic product used to make DRAX runs comparable. Pinned: do not edit casually —
changing it invalidates cross-run comparisons. It is deliberately Brazilian so the run exercises
INPI trademark clearance and LGPD, and the name is chosen to produce a **predictable** clearance
signal (see below).

## Identity (what `/drax` would be told)

- **productName:** `MeiCaixa`  (slug → `meicaixa`; site initiative → `meicaixa-site`)
- **One-liner:** A mobile-first cash-flow app that tells a Brazilian MEI, in one glanceable number,
  whether they made or lost money today.
- **Objective (anchored to the product, not to the run):** *Make MeiCaixa the simplest way for a
  Brazilian MEI to know — today, without accounting knowledge — if they are making or losing money,
  turning daily cash chaos into one number they trust.*
- **Scenario:** `marketing` (product exists, no marketing operation) → CMO leads first.
- **Jurisdiction:** Brazil. Trademark: **INPI** (software / financial-information services).
  Privacy: **LGPD** (handles financial data → sensitive-ish; consent + DPO contact + data-subject
  rights pages required). These are the *mandatory external facts* the run must web-ground (§5.1).
- **Persona:** *Dona Cláudia*, 42 — owns a neighborhood salão de beleza, registered MEI. Low
  financial literacy, distrusts complex finance apps, lives on WhatsApp, mid-range Android phone on
  patchy mobile data. Mobile correctness (viewport, performance, a11y) is existential for her.

## Why this name is a good fixture (expected name-clearance signal)

`MeiCaixa` = **MEI** + **Caixa**. "Caixa" is also **Caixa Econômica Federal**, a major Brazilian
state bank, and a generic word for "cash register". A correct `brand-strategist` + `clo`
name-clearance pass **should flag** a confusion / dilution risk with the Caixa bank brand in a
financial-services context, and note "caixa" is descriptive. This gives the clearance gate a
**known, repeatable thing to catch** — a run that returns "no issues" on this name has a real gap.

Expected clearance verdict: `NAME_CLEARANCE.md` ≈ *"PROCEED-WITH-CAUTION"* — usable but with a
documented collision risk and a recommendation (e.g., distinctive logotype, avoid bank-adjacent
visual cues, consider a coined alternative). Not a clean PASS, not a hard BLOCK.

## How the levels use this

- **Name-clearance / quality (L1, L3, #9, #10):** assert the clearance signal above is produced.
- **Slice isolation (L2, #5, #6):** `../workspace-seed/` is a `drax-workspace/` pre-populated to
  `currentSlice = 3` (branding + site-package done, build not) so the build slice can be run alone.
- **Build/QA gate (L2 #4, L3 #7/#8):** `../seeds/` holds the three site seeds the gate runs against.
