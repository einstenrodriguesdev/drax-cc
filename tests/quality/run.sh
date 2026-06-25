#!/usr/bin/env bash
# Per-artifact quality linter (Task #9) — deterministic, no deps, no LLM.
#   no args              → self-test (golden lints clean; injected defects caught)
#   <wsRoot> [--final]   → lint a real drax-workspace (per-slice, or --final at run end)
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/../.."
if [ "$#" -ge 1 ]; then
  node tests/quality/artifact-linter.mjs "$@"
else
  node tests/quality/quality.test.mjs
fi
