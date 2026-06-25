#!/usr/bin/env bash
# LLM-judge harness (Task #10).
#   no args            → self-test the aggregation/variance mechanics (deterministic)
#   <samples.json>     → aggregate real judge samples and print mean ± sd + flags
# Real judge samples are produced by N fresh independent agent-judges (see README);
# this harness owns the rubrics + variance math, not the judgment.
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/../.."
if [ "$#" -ge 1 ]; then
  node tests/judge/judge.mjs "$@"
else
  node tests/judge/judge.test.mjs
fi
