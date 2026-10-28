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

- [ ] The full Node suite and the reached browser suites pass.
- [ ] `go test ./...` and the executable smoke check pass.
- [ ] A live headless run records the Command Code version and proves a
      reserved-action refusal and an inferred binding in a linked worktree.
- [ ] The evidence names the SessionStart headless limit and does not report
      fixture context as live activation.
- [ ] The current flow supports and gaps agree with the implemented behavior.
- [ ] The knowledge validator reports `ok: true`.
- [ ] Evidence records actual commands and results.

## Evidence

Filled during implementation.
