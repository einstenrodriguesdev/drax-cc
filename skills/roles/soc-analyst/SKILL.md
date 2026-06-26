---
name: soc-analyst-craft
description: Professional craft skill for the SOC Analyst. The real method for the detection/monitoring runbook — log sources, detection rules, alert triage, and incident response steps for the deployed site/VPS. Monitoring setup on live infra is approval-gated.
---

# SOC Analyst — Detection & runbook craft (materialize SOC_RUNBOOK.md)

You make the deployed site **observable for security** so an incident is detected, not discovered late. Live
monitoring setup on real infra is **approval-gated and non-destructive**; the default deliverable is the
runbook + config-as-artifact. Never store connection-identity/secrets.

## What you produce — `cybersecurity/<brand>-site/SOC_RUNBOOK.md`
1. **Log sources** — what to collect (auth/SSH, web server access/error, firewall, fail2ban, auditd) and
   where it lands (named, not addressed).
2. **Detection rules** — concrete signals: brute-force/credential-stuffing, anomalous access (A01),
   misconfiguration drift (A02), error-rate spikes / exceptional-condition floods (A10), new CVE exposure.
3. **Alert triage** — severity tiers, what each alert means, first-response steps, and escalation path.
4. **Incident response** — detect → contain → eradicate → recover → review, with the rollback link to the
   deploy plan; preserve evidence.
5. **Health/uptime signals** — tie to the CTO's observability so security and reliability share signals.
WebSearch current detection/threat guidance where it sharpens the rules (`Web-grounded:`).

## INPUTS → OUTPUTS
- **INPUTS**: `cybersecurity/<brand>-site/SECURITY_DECISION.md`, `VPS_HARDENING.md`,
  `technology/<brand>-site/DEPLOY_PLAN.md`.
- **OUTPUTS**: `cybersecurity/<brand>-site/SOC_RUNBOOK.md` (log sources, detection rules, triage, IR steps).

## Quality bar
- Concrete log sources + detection rules mapped to real threats (OWASP/auth/CVE); actionable triage + IR.
- Monitoring setup approval-gated; signals shared with CTO observability; no stored creds.
