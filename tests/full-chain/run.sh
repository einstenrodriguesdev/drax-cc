#!/usr/bin/env bash
# L3 full-chain verifier (Task #7).
#   no args      → self-test: verify the golden end state PASSES and broken variants FAIL
#   <run-root>   → verify a real captured run (dir containing drax-workspace/ + drax-site/)
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/../.."
if [ "$#" -ge 1 ]; then
  node tests/full-chain/assert-full-chain.mjs "$1"
else
  node tests/full-chain/full-chain.test.mjs
fi
