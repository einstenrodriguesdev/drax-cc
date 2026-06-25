#!/usr/bin/env bash
# Run observability reporter (Task #11).
#   no args      → self-test (golden HEALTHY; injected health problems flagged)
#   <run-root>   → report on a real run (dir containing drax-workspace/)
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/../.."
if [ "$#" -ge 1 ]; then
  node tests/observability/observe.mjs "$1"
else
  node tests/observability/observe.test.mjs
fi
