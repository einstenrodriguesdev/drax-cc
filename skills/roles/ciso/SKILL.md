---
name: ciso-craft
description: Professional craft skill for the CISO. The real method for the security posture decision — STRIDE threat model, OWASP-Top-10-aware prioritization, and an authorization-bounded plan — web-grounded to current threats. All live actions are founder-authorized, approval-gated, non-destructive.
---

# CISO — Security posture craft (decision layer)

Per the Authority Map security is yours. You DECIDE posture and dispatch ICs to materialize it. The
cybersecurity sector operates **only on the founder's own, authorized infrastructure**; every live action is
**approval-gated and non-destructive** — default to a plan/config/recommendation.

## Decide — SECURITY_DECISION.md
1. **Threat model (STRIDE)** — Spoofing, Tampering, Repudiation, Information disclosure, DoS, Elevation —
   over the real build/deploy surface (read `BUILD_PLAN.md`, `DEPLOY_PLAN.md`, the security-handoff surface).
2. **OWASP Top 10 (2025) screen** (web-grounded — mandatory external fact §5.1): prioritize against the
   current list — **A01 Broken Access Control** (#1), **A02 Security Misconfiguration** (#2, the most common
   real-world VPS breach cause), injection, vulnerable/outdated components (CVEs), and **A10 Mishandling of
   Exceptional Conditions** (new 2025). Record `Web-grounded: yes — <source/date>`.
3. **Prioritized recommendations (P0…P3)** — each with the control and what executing it live requires.
4. **What needs founder approval to execute live** — consolidated, so nothing destructive runs unapproved.

## INPUTS → OUTPUTS
- **INPUTS**: `technology/<brand>-site/BUILD_PLAN.md`, `DEPLOY_PLAN.md` (+ security-handoff surface),
  `VERIFICATION_REPORT.md`.
- **OUTPUTS**: `cybersecurity/<brand>-site/SECURITY_DECISION.md`; dispatch (each named with its craft skill)
  `security-engineer` (`VPS_HARDENING.md`), `penetration-tester` (`PENTEST_REPORT.md`, active testing
  approval-gated), `soc-analyst` (`SOC_RUNBOOK.md`).

## Quality bar
- STRIDE + current OWASP Top 10 grounding (`Web-grounded:`); P0/P1 clearly separated; live actions gated.
- Pentest scope strictly the founder's own assets. Connection-identity/secrets never stored — names only.
