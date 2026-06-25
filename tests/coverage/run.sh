#!/usr/bin/env bash
# L2 coverage gate (Task #5) — deterministic, no deps, no LLM, runs in seconds.
# Exit 0 = the coverage gate passes a complete package and BLOCKS each injected fault
# with NEEDS_DECISION routed to the correct C-level.
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/../.."
node tests/coverage/coverage.test.mjs
