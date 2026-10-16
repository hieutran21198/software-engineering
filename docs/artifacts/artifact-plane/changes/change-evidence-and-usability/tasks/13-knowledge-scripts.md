---
id: knowledge-scripts
depends_on: [layout-reader]
evidence_records: []
---

# Add validate and migrate scripts

## Scope and ownership

Own scripts/validate-knowledge.mjs, scripts/migrate-layout.mjs, test/knowledge-scripts.test.js and the scripts section of README.md.

## Governing knowledge

L6, M5; specifications/knowledge-layout-reading.md scripts section; the ADD migration procedure in specifications/knowledge-layout.md.

## Prerequisites

Explicit approval and the layout-reader DoD.

## Definition of Done

- [ ] validate-knowledge runs the scanner, snapshot, task, unit and flow readers on one repository path, prints diagnostics as JSON and exits nonzero for error diagnostics; it passes on the fixtures and on this repository after migration.
- [ ] migrate-layout defaults to dry-run, accepts --write and --artifact, refuses ambiguous identity declarations, applies the six-step procedure, writes only inside docs/artifacts of the selected worktree, and reports byte equivalence and the files it would create, change and delete.
- [ ] Tests run both scripts on the legacy fixture and a transition case, assert unchanged bytes in dry-run and the exact written set with --write.
- [ ] README documents both scripts as optional tools; ADD remains usable without them.

## Evidence

Implementation has not started. Record executed commands, outcomes, sources and limitations here after approval.
