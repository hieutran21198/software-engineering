---
id: validation
depends_on: [representations]
evidence_records:
  - id: dod
    method: Link and anchor check, record diff, Markdown table parse and Plane rendering of the changed specifications, validate-knowledge.
    result: passed
    source: docs/artifacts/artifact-driven/changes/change-visual-artifacts/tasks/02-validation.md#evidence
---

# Validate the changed knowledge

## Scope and ownership

Coordinator. Read-only checks over the changed specifications and the documents that link to them.

## Governing knowledge

AVA1 to AVA3 in requirements/visual-artifacts.md; the Validation section of specifications/visual-artifacts.md.

## Prerequisites

Task representations meets its DoD.

## Definition of Done

- [x] Every relative link and anchor of the changed files and of the documents that link to them resolves.
- [x] `git diff main -- docs/artifacts/artifact-driven/versions docs/artifacts/artifact-driven/changes` shows only this change's records.
- [x] Each table renders as a table in GitHub-flavored Markdown and in the Artifact Plane document page.
- [x] validate-knowledge reports no error.

## Evidence

Executed on 18 October 2026 on branch claude/visual-artifacts after the user approved the plan.

- Links: the relative-link and anchor check over docs/artifacts covers 335 links and finds no broken link or anchor.
- Records: `git diff main -- docs/artifacts/artifact-driven/versions docs/artifacts/artifact-driven/changes` shows only change-visual-artifacts and the version record of this change.
- Tables: the GitHub-flavored Markdown lexer of marked 18.1.1, which the Plane uses, finds 10 new tables in the seven files: agent-efficiency 1, evidence-records 2, knowledge-layout 1 (inside list item 5 of Migration, which stays one ordered list), model-explanations 2, system-flows 2, task-dag 1, units-of-work 1. The legacy listing is a text block. The Plane document page shows the tables in the browser suite run of the artifact-plane validation task.
- validate-knowledge reports 0 errors and the existing info diagnostic retained-legacy-change.
