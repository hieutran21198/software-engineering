---
id: guidance-validation
depends_on: [pages]
covers:
  - element: requirements/human-guidance.md
    ids: [HGA1, HGA2, HGA3, HGA4, HGA5, HGA6, HGA7, HGA8, HGA9]
---

# Guidance validation

## Scope and ownership

Coordinator. Browser tests in `test/browser/human-guidance.spec.js`, screenshots and the owner look.

## Governing knowledge

specifications/human-guidance.md: Validation; requirements/human-guidance.md, acceptance criteria.

## Definition of Done

- [x] Browser tests cover HGA1 to HGA7 on fixtures.
- [x] The full browser suite passes on the local Chromium and on the Playwright 1.64 headless shell (Chromium 156).
- [x] Screenshots at 1440 and 390 pixels of the work, artifact, change and flow pages of a disposable clone are taken, and the owner looked at them.
- [x] `npm test` passes; existing route, tool and packet tests pass without edits.

## Evidence

| DoD item | Check | Result |
| --- | --- | --- |
| HGA1 to HGA7 | test/browser/human-guidance.spec.js: "HGA1: in progress and ready for version…", "HGA1/HGA2/HGA3: a prepared version with an unchecked item stays in Current work…", "HGA1: ready for team review without an upstream, waiting for merge when the upstream equals HEAD, and back after a new commit" (also the check of claim upstream-from-local-refs), "HGA4: the change brief and the PR description name what they count", "HGA5: every glossary term on the six pages opens its explanation with Enter, Space and a pointer, once per page" (22 of 27 terms on fixture pages; the Node test covers all), "HGA6: links, quiet actions, primary and danger buttons…", two HGA7 tests including the Impact page | Passed |
| Both browsers | Full browser suite 117 of 117 on the Nix Chromium 149 and 117 of 117 on the Playwright 1.64 headless shell (Chromium 156); no existing test edited in this step | Passed |
| Node suite | `npm test` 430 tests: 429 passed, 0 failed, 1 skipped on two reruns; one earlier run failed one test once (the known flaky SQLite test) | Passed |
| Owner look | On 19 October 2026 the owner looked at screenshots of the work, change, artifact, flow and unit pages at 1440 and 390 pixels of a disposable clone of the branch at 8ca59d2 (artifact https://claude.ai/artifact/8nBqgYhS9SCbGmobvwF82N), with a review server of the branch on port 4341, and answered "accepted" | Passed |

Limits: five glossary terms (Retained change, direct, transitive, small, large) appear on no fixture page and are covered only by the Node test; style checks skip disabled controls.
