#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# DRAX validation suite — run everything automatable, in one command.
# Exit 0 = the whole pyramid is green. See tests/EXIT_CRITERIA.md for the contract.
#
# NOT run here (founder-triggered, billable — see EXIT_CRITERIA.md):
#   • a real full-chain run (/drax → … → /drax-secure), then verify with
#     tests/full-chain/run.sh <run-root> and tests/observability/run.sh <run-root>
#   • the live LLM-judge N=3 sweep over a real run's artifacts (tests/judge)
# ─────────────────────────────────────────────────────────────────────────────
set -uo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/.."

echo "== preparing browser deps for the Playwright levels =="
npm --prefix tests/gate install >/dev/null 2>&1 || true
npx --prefix tests/gate --no-install playwright install chromium >/dev/null 2>&1 || true

pass=0; fail=0; failed=()
run() {
  printf "  %-32s" "$1"
  if node "$2" >/tmp/drax-suite.out 2>&1; then echo "PASS"; pass=$((pass+1));
  else echo "FAIL"; fail=$((fail+1)); failed+=("$1"); sed 's/^/      /' /tmp/drax-suite.out | tail -6; fi
}

echo; echo "== L0 environment precondition =="
printf "  %-32s" "env (npm + Playwright)"
if tests/env/run-precondition.sh >/tmp/drax-suite.out 2>&1; then echo "PASS"; pass=$((pass+1)); else echo "FAIL"; fail=$((fail+1)); failed+=("env precondition"); fi

echo; echo "== L1 unit =="
run "lock state machine"        tests/lock/lock.test.mjs

echo; echo "== L2 slice-isolated gates =="
run "lock slice-negatives"      tests/lock-slice/slice-negatives.test.mjs
run "coverage gate"             tests/coverage/coverage.test.mjs
run "Playwright live gate"      tests/gate/gate.test.mjs

echo; echo "== L3 full chain =="
run "full-chain verifier"       tests/full-chain/full-chain.test.mjs
run "chain fault injection"     tests/chain-faults/chain-faults.test.mjs

echo; echo "== quality + observability =="
run "artifact linter"           tests/quality/quality.test.mjs
run "LLM-judge harness"         tests/judge/judge.test.mjs
run "run observability"         tests/observability/observe.test.mjs

echo
echo "──────────────────────────────────────────────"
echo "SUITE: $pass passed, $fail failed"
if [ "$fail" -ne 0 ]; then printf "FAILED: %s\n" "${failed[*]}"; exit 1; fi
echo "ALL GREEN — see tests/EXIT_CRITERIA.md to map this to the acceptance contract."
