#!/usr/bin/env bash
# L2 lock slice-negatives (Task #6) — deterministic, no deps, no LLM, runs in seconds.
# Exit 0 = precondition / parallelism / awaiting / run-identity all BLOCK as specified,
# and no legitimate happy-path dispatch is falsely blocked.
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/../.."
node tests/lock-slice/slice-negatives.test.mjs
