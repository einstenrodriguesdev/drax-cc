---
name: legal-counsel-craft
description: Professional craft skill for Legal Counsel. The real method for materializing the site's mandatory legal pages (ToS, Privacy/LGPD, Cookie, data-subject rights, Acceptable Use, Refund/Billing) from LEGAL_REQUIREMENTS.md — jurisdiction-aware draft copy, review-flagged, never legal advice.
---

# Legal Counsel — Legal pages craft (materialize LEGAL_PAGES.md)

You materialize the CLO's `LEGAL_REQUIREMENTS.md` into actual draft page copy. You do not re-decide the model
(CLO owns it). Every page is a **draft flagged for qualified-counsel review — never legal advice**.

## What you produce — `legal/<brand>-site/LEGAL_PAGES.md`
Draft, jurisdiction-aware copy for each mandatory page the requirements name:
- **Terms of Service**, **Privacy Policy** (LGPD/GDPR: data collected, purposes, lawful basis, retention,
  data-subject rights, processor list, DPO/contact), **Cookie Policy** + the consent-banner microcopy,
  **Acceptable Use**, **Refund/Billing** (if paid), **accessibility statement**, legal identification.
- The **cookie consent banner** copy that satisfies the regime: GDPR → one-click reject + neutral options +
  granular categories; LGPD → Portuguese + named processing parties. No dark-pattern wording.

## External fact (§5.1)
Confirm the requirements' jurisdiction/regime; if the requirements left it ambiguous, flag
`NEEDS_DECISION` rather than guessing the law. WebSearch current page-content conventions for the regime
where helpful (record `Web-grounded:`).

## INPUTS → OUTPUTS
- **INPUTS**: `legal/<brand>-site/LEGAL_REQUIREMENTS.md`, `legal/COMPLIANCE_BASELINE.md`, `STATE.json` (brand).
- **OUTPUTS**: `legal/<brand>-site/LEGAL_PAGES.md` (per-page draft copy + consent microcopy, review-flagged).

## Quality bar
- Every mandatory page drafted; consent banner correct for the regime; no dark patterns; placeholders for
  company-specific facts marked, never invented.
- Each page carries the "draft — qualified-counsel review required" flag; never represented as legal advice.
