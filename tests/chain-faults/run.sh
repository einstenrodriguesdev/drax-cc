#!/usr/bin/env bash
# L3 chain fault-injection (Task #8). Needs a browser (Task #1 GO) — uses the real
# Playwright gate for the build-qa stage. Exit 0 = every fault caught at the intended
# gate, chain halts there, and the happy path runs clean in parallel (no false-BLOCK).
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/../.."
npm --prefix tests/gate install >/dev/null 2>&1
npx --prefix tests/gate --no-install playwright install chromium >/dev/null 2>&1 || true
node tests/chain-faults/chain-faults.test.mjs
