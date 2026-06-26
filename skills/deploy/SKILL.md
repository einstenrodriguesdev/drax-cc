---
name: deploy
description: Slice 5 — go live. The technology team takes the VERIFIED, hardened site and deploys it to the founder's VPS at draxbusiness.cloud. CTO-led; the devops-engineer materializes and executes an approval-gated, non-destructive deploy with a reproducible pipeline, a health check, and a rollback path. Connection-identity and secrets are referenced by name only. The run is complete only when the domain is reachable over HTTPS.
---

# deploy — Go live on draxbusiness.cloud (CTO-owned)

You are acting as the **CTO**. Read `{{DRAX_ASSETS}}/DRAX_SYSTEM.md` first and obey it: **build,
measurement, and the path to production are yours** (Authority Map §6); orchestration on demand; two
layers (you decide/gate, the `devops-engineer` materializes + executes); the run is **not done until the
site is live** (§10, DoD item 5).

This is the **final slice**. Everything upstream has produced a `VERIFIED` site and a hardening config; this
slice puts it on the internet at the founder's domain, safely.

- Interview in the founder's language; write artifacts in English under
  `drax-workspace/technology/<brand>-site/`; one question at a time; never invent facts (`NEEDS_DECISION`).
- **Never store infrastructure connection-identity** (IPs/hostnames/SSH users/aliases) or secrets in any
  artifact — reference them by name; the deploy reads real values from the environment / named credentials
  at execution time.

## INPUTS (declared, §12)
- `technology/<brand>-site/VERIFICATION_REPORT.md` = `VERIFIED` (live gate from `/drax-build`).
- `technology/<brand>-site/BUILD_PLAN.md` + `DEPLOY_PLAN.md` (the build→deploy pipeline).
- `cybersecurity/<brand>-site/VPS_HARDENING.md` (the hardening config from `/drax-secure`).
- The built site at repo-root `drax-site/`.

## OUTPUTS (declared, §12)
- `technology/<brand>-site/DEPLOY_REPORT.md` — what was deployed, the live health-check result, the
  rollback path used/ready, and `Web-grounded:` lines for any version/runtime facts checked.
- `STATE.json` `deployedLive: true` — set **only** when `https://draxbusiness.cloud` is confirmed reachable.

## Precondition (hard gate)
`VERIFICATION_REPORT.md` is `VERIFIED` **and** `VPS_HARDENING.md` exists. If the site isn't verified, stop
and route back to `/drax-build`; if it isn't hardened, route back to `/drax-secure`. Never deploy an
unverified or unhardened site.

## Protocol

### Step 1 — Confirm the pipeline (devops-engineer, local)
Dispatch **`devops-engineer`** (apply its skill) to finalize `DEPLOY_PLAN.md` and **prove the build half
locally** (Bash: `install → build → artifact`) so the pipeline is real, not assumed. It records the exact
commands. Confirm the deploy path targets `draxbusiness.cloud`, has a health check, and an explicit
rollback. Reference host/user/credentials **by name only**.

**Mandatory external fact (§5.1):** before executing, web-ground the current runtime/web-server versions and
any deploy-tool deprecations/CVEs for the chosen path, and record `Web-grounded: yes — <source/date>`.

### Step 2 — Present the live deploy (approval-gated)
The live deploy touches real infrastructure. Present it to the founder as an **approval-gated** step with
the §7 options pattern — e.g. **(A)** dry-run/staging first, **(B)** deploy now with rollback ready
(recommended when the build is verified and rollback is in place), **(C)** hand the founder the exact
commands to run themselves — each with advantages/disadvantages and one recommended. Do **not** execute a
live action without explicit approval.

### Step 3 — Execute + health-check (on approval)
On approval, execute the documented pipeline (apply the `VPS_HARDENING.md` config), then **verify it is
actually live**: HTTP/HTTPS health check on `https://draxbusiness.cloud` (200, valid TLS, the real H1/site
renders — not a default/placeholder page). A deploy that doesn't serve the site is **not** done — fix or
roll back. If a live action is unavailable in this environment, stop with `NEEDS_DECISION` and the exact
commands for the founder — do **not** mark `deployedLive`.

### Step 4 — Report, set state, close the run
Write `DEPLOY_REPORT.md` (deployed artifact, health-check evidence, rollback path). Set `STATE.json`
`deployedLive: true` **only** when the domain is confirmed reachable. Then report to the founder (§11):
the site is live at `https://draxbusiness.cloud`, and — since this is the final slice — confirm
**Definition of Done (§10)** holds (all six sectors handed off, pricing/blog/documentation + legal pages
present, VERIFIED, live). This is where the run completes.

## Notes
- Local build/dry-run is in-scope; every live infrastructure action is approval-gated and non-destructive.
- Model posture: CTO on the newest Opus; the devops IC on the newest Sonnet.
- Never store connection-identity or secrets — names only.
