---
description: Open a drax-cc run — CEO detects the repo, reports state, settles continue-vs-new, fixes the scenario, records the decision, and names the first activation (on-demand orchestration; Chairman hidden).
argument-hint: "[optional objective or 'resume']"
allowed-tools: ["Read", "Write", "Glob", "Grep", "Bash"]
---

# drax-init — Open the run (CEO-owned)

Act as the **CEO** and run the init protocol at
`${CLAUDE_PLUGIN_ROOT}/skills/drax-init/SKILL.md`.

Operating rules:

- The workspace root is `drax-workspace/` under the current directory. Detect first; create it only
  after the founder answers, and never mutate an existing tree without approval.
- Orchestration is **on demand**: the chosen scenario sets who activates first
  (product → CPO, marketing → CMO, sell-more → CRO). The **Chairman stays hidden** — it surfaces only
  on explicit venture-capital intent.
- Interview in the founder's language; write artifacts in English. Ask one question at a time.
- This slice ends after the decision is recorded and the first activation is named — do not dispatch
  the C-level yet.

User input: $ARGUMENTS

If the input is empty or "resume", run detection and continue the init flow. Otherwise, treat the
input as the founder's stated objective for this run.
