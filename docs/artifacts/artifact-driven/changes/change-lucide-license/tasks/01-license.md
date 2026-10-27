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

- [x] The guide's `lucide` row names ISC and MIT for the five Feather-derived names, and says that a reader keeps the whole license file.
- [x] The five names in the guide, in the contract and in the Lucide license file are the same.
- [x] `go test ./docs/artifact-driven` passes, and the changed bundle page has no broken link.
- [x] validate-knowledge reports `ok: true` for the change.

## Evidence

The coordinator performed the task in the implementer role on branch claude/lucide-license.

| DoD item | Check | Result | Source |
| --- | --- | --- | --- |
| Guide row | Read the `lucide` row and the sentence after the Icons table | ISC, MIT for the five Feather-derived names, and the whole license file | docs/artifact-driven/06-guidelines/visual-representations.md |
| Same five names | Script that reads the Feather list of the Lucide license file and intersects it with the 24 supported names, compared with the guide and the contract | `database`, `lock`, `monitor`, `server` and `smartphone` in all three | this task |
| Tests and links | `go test ./docs/artifact-driven`; the guide edit adds no link | Pass; no link changed | this task |
| Validator | `scripts/validate-knowledge.mjs --change artifact-driven/change-lucide-license` | `ok: true`, no diagnostic | this task |
