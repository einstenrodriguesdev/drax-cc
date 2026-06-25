# L2 — coverage gate fault injection (Task #5)

Proves the tech-build **Step 1 coverage gate** ("never build on a blind spec") is **mechanical, not
prose**. `coverage-gate.mjs` is the deterministic, runnable core of what the CTO does in Step 1: it
reads the seeded Site Build Package + its components and emits `BUILD_READINESS.md` =
`READY` / `BLOCKED`, routing every gap (`NEEDS_DECISION`) to the owning C-level.

## Checks encoded

- **Presence** of every component (sitemap, copy, keyword, conversion, design tokens/decision/
  wireframes, legal pages/requirements, compliance baseline).
- **Mandatory legal pages** (`/privacidade`, `/termos`) declared in `LEGAL_PAGES.md` **and** present
  in `SITEMAP.md`; cookie + footer-legal disclosures referenced.
- **Content-page coverage** — every non-legal sitemap page has copy; a conversion goal + keyword
  mapping exist.
- **Contradictions** — a sitemap page with no copy; a CTA instrumented for conversion that is absent
  from the copy deck.

## Routing (the key claim)

| Gap kind | Routed to |
| --- | --- |
| missing/contradictory marketing component (sitemap, copy, keyword, conversion) | **CMO** |
| missing design component (tokens, decision, wireframes) | **Design-CTO** |
| missing legal page / disclosure | **CLO** |

## Result (passing)

| Scenario | verdict | builds? | routed to |
| --- | --- | --- | --- |
| complete package | READY | yes | — |
| `/termos` removed from `LEGAL_PAGES` | BLOCKED | no | CLO |
| `DESIGN_TOKENS.md` deleted | BLOCKED | no | Design-CTO |
| sitemap lists `/precos.html` with no copy | BLOCKED | no | CMO |

## Note on WIREFRAMES location (resolved, Task #6)

This engine reads `WIREFRAMES.md` from `marketing/<brand>-site/` — canonical per the site-build
skill (what the `ux-designer` executes) and the lock `ARTIFACT_MAP`. Task #6 aligned the lone
outlier (`DRAX_SYSTEM.md §8`) to match. `DESIGN_TOKENS` stays in `design/`; ownership of wireframes
remains Design-CTO (path ≠ ownership).

## Run

```bash
tests/coverage/run.sh        # or: node tests/coverage/coverage.test.mjs
```

Runs against throwaway copies of `tests/fixtures/workspace-seed/` in the OS temp dir; the repo is
never mutated.
