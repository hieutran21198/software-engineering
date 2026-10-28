---
id: integration-validation
depends_on: [hook-input, project-setup]
covers:
  - element: requirements/commandcode-support.md
    ids: [CP8, CPA4, CPA5]
---

# Validate the Plane integration

## Scope and ownership

Implementer returns checks and commits. The coordinator owns evidence, flow
records and version preparation. Locations: the full Node suite, the browser
suites reached by the branch, the Go suite, the executable smoke check and a
disposable ADD fixture for the live headless run. Governing contract:
`specifications/commandcode-support.md`.

## Definition of Done

- [ ] The full Node suite and the reached browser suites pass. The Node suite
      passed. The browser suite could not launch Chromium locally; CI runs it.
- [x] `go test ./...` and the executable smoke check pass.
- [x] A live headless run records the Command Code version and proves a
      reserved-action refusal and an inferred binding in a linked worktree.
- [x] The evidence names the SessionStart headless limit and does not report
      fixture context as live activation.
- [x] The current flow supports and gaps agree with the implemented behavior.
- [x] The knowledge validator reports `ok: true`.
- [x] Evidence records actual commands and results.

## Evidence

### Automated checks

`npm test` passed 573 of 574 tests with one skipped and no failure. `npm run
build` completed the Vite production build. `npm run build:app` built
`release/artifact-plane-linux-amd64`, and `node scripts/app-smoke.mjs
release/artifact-plane-linux-amd64` passed every check: version, serve, page,
explore route, SIGTERM, MCP tools, a `SessionStart` hook answer and a runtime
query. `go test -count=1 ./...` and `go vet ./...` passed with go1.26.8.

`npm run test:browser` did not run the suites: every case failed at browser
launch because the local Chromium build cannot load `libnspr4.so`, followed by
`libnss3.so` and other desktop libraries. The worktree has no browser source
change. This is a local environment blocker, and CI installs the Playwright
browser with its dependencies and runs the suite.

`node apps/artifact-plane/scripts/validate-knowledge.mjs --change
artifact-plane/change-commandcode-support` returned `ok: true`. Remaining
diagnostics are `open-change-conflict` warnings from retained local and remote
branches.

### Live headless check

Command Code `1.85.1` ran twice in a disposable ADD fixture with the committed
hook file and an `artifact-plane` shim over the changed source. The fixture had a
`main` worktree and a linked `live` worktree.

Refusal run: in the `main` worktree the agent asked to run
`git commit --allow-empty -m cc-probe`. The repository stayed at one commit. The
session transcript holds "ADD reserves commits to main for people (AGENTS.md).
Work on a change branch and stop for team review." and the agent reported that
the hook refused the commit.

Binding run: in the linked worktree the agent read
`docs/artifacts/demo/changes/change-live/tasks/a.md`. `artifact-plane runtime
query` returned an attempt for session `edb3bec5-32a3-4c4e-8a9e-b7ad51d86a1a`
with `binding: inferred`, an empty agent, and path
`docs/artifacts/demo/changes/change-live/tasks/a.md`.

The store rows for both runs are `PreToolUse`, `PostToolUse`, `Stop` and `bind`.
No `SessionStart` row exists on startup or resume, so the context output remains
a recorded-payload check. Plan-mode hook skipping and the absent agent identity
match the contract.
