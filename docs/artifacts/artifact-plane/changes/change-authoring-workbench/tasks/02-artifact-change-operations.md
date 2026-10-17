---
id: artifact-change-operations
depends_on: [knowledge-writer]
evidence_records:
  - id: operation-tests
    method: node --test test/knowledge-operations.test.js
    result: passed
    source: docs/artifacts/artifact-plane/changes/change-authoring-workbench/tasks/02-artifact-change-operations.md#operation-tests
---

# Artifact, change and document operations

## Scope and ownership

Own apps/artifact-plane/server/knowledge-operations.js (service core, identifier generation, templates, validation harness) and the operations artifact.create, artifact.dependencies.set, change.start, document.add, document.save, document.delete, document.properties.set, reference.add, reference.remove and selfcheck.record, with their tests.

## Governing knowledge

specifications/knowledge-editing.md, sections Operation service and Operations. ADD knowledge-layout.md, evidence-records.md and writing-artifacts guidance for templates.

## Prerequisites

Task knowledge-writer.

## Definition of Done

- [x] The service resolves the registered worktree, checks the branch, scans, plans, builds the post-image, validates with buildSnapshot and the declared-evidence checks, rejects post-images with new error diagnostics (422 with diagnostics), supports dryRun and returns the specified response with digests.
- [x] Identifier generation follows the NFKD, lowercase and hyphen rules with collision suffixes and the change- prefix; explicit IDs pass the same rules.
- [x] Each listed operation writes exactly the files in the operations table with the specified derived values; templates contain no passed self-check or checked item; change.start refuses a second open change and can create or join a unit.
- [x] reference.add resolves the target in the checked-out tree and labels it; selfcheck.record derives the source fragment and writes the Self-check section; document.properties.set validates structural fields and keeps the body.
- [x] Tests cover success, invalid input, cycle rejection for dependencies, digest conflict, dry run and round-trip line diffs for every operation on in-place fixtures; legacy fixtures are refused.

## Evidence

### operation-tests

Checked in apps/artifact-plane at commit 8514ef3: 8 of 8 tests passed. Every tested operation runs as preview then apply; the preview leaves the fingerprint unchanged, the apply changes exactly the listed files with the previewed bytes. Covered for this task: identifier rules and suffixes, change.start with a new unit and the refusal of a second open change, document.add for requirement and numbered decisions, selfcheck.record, reference.add with the established label, duplicate (409) and missing target (422), reference.remove, document.save keeping front matter, refusal of a save that removes a recorded self-check section (new missing-evidence), digest conflict 409 with current text, document.properties.set with invalid YAML and invalid structural fields, document.delete with warnings, artifact.create, artifact.dependencies.set with cycle rejection naming the path, legacy refusal. Templates contain no passed self-check or checked item. Implementation: server/knowledge-operations.js.
