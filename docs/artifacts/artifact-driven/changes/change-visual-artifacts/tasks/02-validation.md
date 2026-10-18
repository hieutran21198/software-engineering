---
id: validation
depends_on: [representations]
evidence_records: []
---

# Validate the changed knowledge

## Scope and ownership

Coordinator. Read-only checks over the changed specifications and the documents that link to them.

## Governing knowledge

AVA1 to AVA3 in requirements/visual-artifacts.md; the Validation section of specifications/visual-artifacts.md.

## Prerequisites

Task representations meets its DoD.

## Definition of Done

- [ ] Every relative link and anchor of the changed files and of the documents that link to them resolves.
- [ ] `git diff main -- docs/artifacts/artifact-driven/versions docs/artifacts/artifact-driven/changes` shows only this change's records.
- [ ] Each table renders as a table in GitHub-flavored Markdown and in the Artifact Plane document page.
- [ ] validate-knowledge reports no error.

## Evidence

Implementation has not started.
