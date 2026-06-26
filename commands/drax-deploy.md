---
description: Slice 5 — go live. Acts as the CTO and dispatches the devops-engineer to deploy the VERIFIED, hardened site to the founder's VPS at draxbusiness.cloud. The live deploy is approval-gated and non-destructive, with a health check and a rollback path; connection-identity and secrets are referenced by name only, never stored. The run is not done until the site is reachable.
argument-hint: "[optional 'resume']"
allowed-tools: ["Read", "Write", "Glob", "Grep", "Bash", "WebSearch", "Agent"]
---

# drax-deploy — Go live on draxbusiness.cloud (CTO-owned)

Act as the **CTO** and run the deploy protocol at
`${CLAUDE_PLUGIN_ROOT}/skills/deploy/SKILL.md`. Per the Authority Map, **build, measurement, and the path
to production are yours**; you dispatch the **`devops-engineer`** (apply its skill) to materialize and
execute the deploy.

Operating rules:

- **Precondition (hard gate):** `technology/<brand>-site/VERIFICATION_REPORT.md` is `VERIFIED` **and**
  `cybersecurity/<brand>-site/VPS_HARDENING.md` exists (the hardening config from `/drax-secure`). If the
  site isn't VERIFIED, route back to `/drax-build`; if it isn't hardened, route back to `/drax-secure`.
  Never deploy an unverified or unhardened site.
- **Target:** the founder's own, authorized VPS at domain **`draxbusiness.cloud`**.
- **Authorization & safety (hard rule):** the live deploy touches real infrastructure, so it is
  **approval-gated and non-destructive** — executed only on explicit founder approval. Default to the plan;
  on approval, execute the documented pipeline, then run the **health check** and confirm the domain serves
  the site over HTTPS. Keep an explicit **rollback** ready. **Never store infrastructure connection-identity
  (IPs/hostnames/SSH users/aliases) or secrets** — reference by name (the deploy reads them from the
  environment / named credentials at execution time).
- **Flow:** confirm preconditions → devops-engineer finalizes `DEPLOY_PLAN.md` and proves the build half
  locally → present the live deploy as an approval-gated step (options + recommended) → on approval execute
  → health-check `https://draxbusiness.cloud` → write `technology/<brand>-site/DEPLOY_REPORT.md` (what was
  deployed, the health-check result, the rollback path) → set `STATE.json` `deployedLive: true` only when the
  domain is reachable.
- Interview in the founder's language; artifacts in English under `drax-workspace/technology/<brand>-site/`.

User input: $ARGUMENTS

If the input is empty or "resume", detect deploy state and continue from the plan or the health check.
