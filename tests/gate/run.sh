#!/usr/bin/env bash
# L2 gate harness (Task #4) — one command: install deps + browser, run the gate test.
# Exit 0 = the gate correctly discriminates the fixture seeds (VERIFIED vs BLOCKED).
# Precondition: Task #1 (tests/env/run-precondition.sh) must be GO in this environment.
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")"
npm install >/dev/null 2>&1
npx --no-install playwright install chromium >/dev/null 2>&1
node gate.test.mjs
