# E2E validation — environment precondition (Task #1)

**Question this gate answers:** can the environment where a `drax-cc` run executes actually
install `npm` packages and install/run Playwright browsers? If not, `qa-engineer` records
`NEEDS_DECISION` by design and the Step 3.5 live-verification gate never reaches `VERIFIED` —
so the L2-Playwright harness (Task #4) and the full L3 chain (Tasks #7, #8) are only *real*
where the browser runs. This is their precondition.

## Verdict — **GO**

The live-browser capability the `qa-engineer` gate depends on works end-to-end here. A real
DRAX run in this environment can install Playwright + Chromium and drive a headless browser,
including the raw-HTML `<meta viewport>` assertion (the documented mobile blind spot).

| Check | Result |
| --- | --- |
| `node` | v22.22.2 |
| `npm` | 10.9.7 |
| `npm install @playwright/test` | OK — Playwright **1.61.1** |
| `npx playwright install chromium` | OK — downloaded to `~/.cache/ms-playwright` (no apt / `--with-deps` needed) |
| Browser launch | OK — Chrome Headless Shell **149.0.7827.55** |
| Render + console-error capture + screenshot | OK — HTTP 200, `#hero` renders, 0 console errors, 6713-byte PNG |
| Live `<meta viewport>` on raw HTML | OK — `width=device-width, initial-scale=1`, `initial-scale=1` asserted |

Verified **2026-06-25** in this runtime.

## Notes / caveats

- **No `--with-deps`.** Chromium launched without installing OS packages, so the required
  system shared libraries are already present here. A different runtime (minimal container,
  different distro) may still fail at launch on missing libs — that failure is the real
  signal, and it is exactly what this check surfaces. Re-run there before trusting L2/L3.
- **Browser cache is shared** at `~/.cache/ms-playwright` (outside any run workspace), so the
  ~116 MiB download is paid once per machine, not per run.
- This proves *capability*, not that any specific built site passes — that is Task #4
  (known-good ⇒ `VERIFIED`, known-bad ⇒ `BLOCKED`).

## How to reproduce

One command (works from a clean checkout; uses a throwaway temp project):

```bash
tests/env/run-precondition.sh      # exit 0 = GO
```

Or just the live-browser smoke against an already-installed Playwright:

```bash
node tests/env/playwright-smoke.mjs   # prints JSON {pass:true,...}, exit 0 = pass
```

`run-precondition.sh` installs `@playwright/test`, runs `playwright install chromium`, then
executes `playwright-smoke.mjs`, which boots a tiny HTTP server, drives headless Chromium
(render + console errors + screenshot), and asserts the live viewport meta on the raw served
HTML — the same capability the Step 3.5 gate uses.
