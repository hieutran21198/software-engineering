---
id: artifact-change-operations
depends_on: [knowledge-writer]
evidence_records: []
---

# Artifact, change and document operations

## Scope and ownership

Own apps/artifact-plane/server/knowledge-operations.js (service core, identifier generation, templates, validation harness) and the operations artifact.create, artifact.dependencies.set, change.start, document.add, document.save, document.delete, document.properties.set, reference.add, reference.remove and selfcheck.record, with their tests.

## Governing knowledge

specifications/knowledge-editing.md, sections Operation service and Operations. ADD knowledge-layout.md, evidence-records.md and writing-artifacts guidance for templates.

## Prerequisites

Task knowledge-writer.

## Definition of Done

- [ ] The service resolves the registered worktree, checks the branch, scans, plans, builds the post-image, validates with buildSnapshot and the declared-evidence checks, rejects post-images with new error diagnostics (422 with diagnostics), supports dryRun and returns the specified response with digests.
- [ ] Identifier generation follows the NFKD, lowercase and hyphen rules with collision suffixes and the change- prefix; explicit IDs pass the same rules.
- [ ] Each listed operation writes exactly the files in the operations table with the specified derived values; templates contain no passed self-check or checked item; change.start refuses a second open change and can create or join a unit.
- [ ] reference.add resolves the target in the checked-out tree and labels it; selfcheck.record derives the source fragment and writes the Self-check section; document.properties.set validates structural fields and keeps the body.
- [ ] Tests cover success, invalid input, cycle rejection for dependencies, digest conflict, dry run and round-trip line diffs for every operation on in-place fixtures; legacy fixtures are refused.

## Evidence

Implementation has not started.
