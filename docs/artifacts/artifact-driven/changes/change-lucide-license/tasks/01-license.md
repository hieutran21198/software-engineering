---
id: license
depends_on: []
covers:
  - element: requirements/diagram-scopes.md
    ids: [DS11]
---

# Name the MIT part in the guide and validate

## Scope and ownership

Coordinator in the implementer role. Edit the `lucide` row of the Icons table in docs/artifact-driven/06-guidelines/visual-representations.md and add one sentence after the table, as the diagram scopes contract states.

## Definition of Done

- [ ] The guide's `lucide` row names ISC and MIT for the five Feather-derived names, and says that a reader keeps the whole license file.
- [ ] The five names in the guide, in the contract and in the Lucide license file are the same.
- [ ] `go test ./docs/artifact-driven` passes, and the changed bundle page has no broken link.
- [ ] validate-knowledge reports `ok: true` for the change.

## Evidence

Pending.
