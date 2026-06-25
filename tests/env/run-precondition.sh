#!/usr/bin/env bash
# DRAX E2E validation — environment precondition check (Task #1).
# Proves the runtime can do what the qa-engineer live-verification gate needs:
# install Playwright + a browser, launch it, render a page, and read the live
# <meta viewport> off raw HTML. Exit 0 = GO (L2-Playwright + L3 are real here).
#
# Repeatable: works in a throwaway dir; installs into ~/.cache/ms-playwright.
# Note: intentionally does NOT use --with-deps (apt is usually blocked in-sandbox);
# if the browser fails to launch on missing system libs, that is the real signal.
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

echo "== versions =="
node --version
npm --version

echo "== install @playwright/test =="
cd "$WORK"
npm init -y >/dev/null 2>&1
npm install @playwright/test@latest >/dev/null 2>&1
npx --no-install playwright --version

echo "== install chromium browser =="
npx --no-install playwright install chromium >/dev/null 2>&1
echo "browser cache: $(ls ~/.cache/ms-playwright 2>/dev/null | tr '\n' ' ')"

echo "== live-browser smoke =="
cp "$HERE/playwright-smoke.mjs" "$WORK/smoke.mjs"
node "$WORK/smoke.mjs"
