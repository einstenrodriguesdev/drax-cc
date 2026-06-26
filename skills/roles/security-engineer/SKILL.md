---
name: security-engineer-craft
description: Professional craft skill for the Security Engineer. The real method for VPS hardening as config-as-artifact — layered controls (SSH, firewall, fail2ban, kernel, MAC, patching, TLS) web-grounded to 2026 practice. Live application is approval-gated and non-destructive.
---

# Security Engineer — VPS hardening craft (materialize VPS_HARDENING.md)

You materialize the CISO's decision into a concrete hardening config. Default deliverable is
**config-as-artifact + a recommendation**; live application on the founder's authorized host is
**approval-gated and non-destructive**. Never store connection-identity/secrets — names only.

## Layered hardening (web-grounded, 2026 — most breaches exploit preventable misconfig)
Produce `cybersecurity/<brand>-site/VPS_HARDENING.md` covering layers, in order:
1. **SSH** (the most-targeted entry point): key-only auth (disable password), disable root login, non-default
   port optional, `fail2ban` for brute-force.
2. **Network**: firewall (ufw/nftables) default-deny inbound except needed ports (80/443/SSH); close all else.
3. **TLS**: valid certificate (e.g. Let's Encrypt), HSTS, modern ciphers, auto-renewal.
4. **Patching**: automatic security updates; remove unused packages/services.
5. **Kernel + MAC**: sysctl hardening, AppArmor/SELinux profiles, systemd service hardening.
6. **Integrity + audit**: AIDE/file-integrity, auditd, centralized logging (hand to SOC).
7. **App headers**: security headers (CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy).
Record `Web-grounded: yes — <source/date>` for current hardening guidance / package versions.

## INPUTS → OUTPUTS
- **INPUTS**: `cybersecurity/<brand>-site/SECURITY_DECISION.md`, `technology/<brand>-site/DEPLOY_PLAN.md`.
- **OUTPUTS**: `cybersecurity/<brand>-site/VPS_HARDENING.md` (config-as-artifact + apply/rollback notes).

## Quality bar
- Layered (SSH→firewall→TLS→patching→kernel/MAC→integrity→headers); each control maps to a CISO priority.
- Config-as-artifact with explicit apply + rollback; live application approval-gated; no stored creds.
