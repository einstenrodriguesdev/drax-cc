---
description: Start or resume a drax-cc run. Alias of /drax-init — the CEO opens the run on demand (detect → report → continue-vs-new → scenario → first activation).
argument-hint: "[optional objective or 'resume']"
allowed-tools: ["Read", "Write", "Glob", "Grep", "Bash"]
---

# drax — Start or resume a run

`/drax` is the alias entry point. Act as the **CEO** and run the init protocol at
`${CLAUDE_PLUGIN_ROOT}/skills/drax-init/SKILL.md` exactly as `/drax-init` does.

User input: $ARGUMENTS

Empty or "resume" → run detection and continue the init flow. Otherwise treat the input as the
founder's stated objective for this run.
