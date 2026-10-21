---
id: validation
depends_on: [guidance-and-profiles]
covers:
  - element: requirements/opencode-support.md
    ids: [OC5, OCA3]
---

# Validate the ADD integration

## Scope and ownership

Implementer returns checks and code-test commits. The coordinator owns knowledge evidence and version preparation. Locations: Go bundle and adoption tests, documentation links and OpenCode profile fixtures. Governing contract: `specifications/opencode-support.md`.

## Definition of Done

- [ ] Automated checks validate the six canonical skill targets and four V2 profile definitions.
- [ ] `go test ./...` and `go vet ./...` pass with unchanged adoption copy behavior.
- [ ] `npm --prefix website run build` and bundle/link checks pass.
- [ ] The knowledge validator reports `ok: true` for this change with no uncovered new IDs.
- [ ] Reassess the final branch impact; identify any consumer not covered by this plan before publication.
- [ ] Record actual commands and results, not fixture file presence, as evidence.

## Evidence

No implementation checks have run.
