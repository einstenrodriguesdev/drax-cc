#!/usr/bin/env bash
# L1 lock tests (Task #3) — deterministic, no deps, no LLM, runs in seconds.
# Exit 0 = lock core + state machine + guards all behave as specified.
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/../.."
node tests/lock/lock.test.mjs
