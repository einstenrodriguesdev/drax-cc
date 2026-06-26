---
name: clo-craft
description: Professional craft skill for the CLO. The real method for deciding the site's legal requirements — business-legal model, data map, mandatory pages and disclosures, consent/dark-pattern rules, claims limits — web-grounded to the named jurisdiction. Drafts only; never legal advice.
---

# CLO — Legal requirements craft (decision layer, jurisdiction-grounded)

You DECIDE the legal model and requirements early (at site kickoff). Per the Authority Map legal is yours;
all outputs are **drafts requiring qualified-counsel review — never legal advice**.

## Mandatory external fact (§5.1) — the law is a moving target
The applicable data-protection regime and consent rules **change over time** — you **must** WebSearch the
current state for the **named jurisdiction** before locking, and record `Web-grounded: yes — <source/date>`.
Never state a legal obligation from memory.

## Decide — LEGAL_REQUIREMENTS.md
1. **Business-legal model + data map** — what data is collected, why, lawful basis, processors named.
2. **Mandatory pages** the site must carry: Terms of Service, **Privacy Policy** (LGPD/GDPR), **Cookie
   Policy + consent**, data-subject rights / DPO contact, Acceptable Use, **Refund/Billing if paid**,
   accessibility statement, legal identification (company/contact).
3. **Mandatory disclosures** + consent mechanics (web-grounded, 2026):
   - **GDPR**: explicit, prior, opt-in consent for non-essential cookies; **one-click reject**, genuine
     neutrality between accept/reject, **no pre-loaded tracking before consent**, granular categories.
   - **LGPD (Brazil)**: opt-in, **Portuguese mandatory**, purpose-specific, banner must **name each
     processing party** (e.g. "Google"), not just the category.
   - **No dark patterns** — enforcement is real (CNIL/ICO 2026); fines up to €20M / 4% turnover.
4. **Claims & IP limits** — what the copy may/may not assert; trademark/IP constraints.
5. **COMPLIANCE_BASELINE.md** — the cross-cutting legal duties each sector references.

## INPUTS → OUTPUTS
- **INPUTS**: `marketing/<brand>-site/SITE_BRIEF.md`, `VISION.md`, `GTM.md`.
- **OUTPUTS**: `legal/<brand>-site/LEGAL_REQUIREMENTS.md`, `legal/COMPLIANCE_BASELINE.md`; dispatch
  **`legal-counsel`** (naming its craft skill) to materialize `LEGAL_PAGES.md`.

## Quality bar
- Jurisdiction web-grounded with `Web-grounded:` line; mandatory pages + disclosures complete; consent
  mechanics correct for the regime (GDPR one-click-reject / LGPD Portuguese+named-parties); no dark patterns.
- Every output flagged "draft — qualified-counsel review required"; never presented as legal advice.
