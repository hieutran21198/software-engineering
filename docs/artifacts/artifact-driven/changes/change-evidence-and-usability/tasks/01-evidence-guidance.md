---
id: evidence-guidance
depends_on: []
---

# Publish structured evidence and reconciliation guidance

## Scope and ownership

Own canonical docs/artifact-driven methodology and evidence guidance, the corresponding src/archs/artifact-driven bundle files, and focused bundle tests. Add optional structured fields and legacy/failure rules; reconcile current root publication wording only from verified scope and protected-ref evidence.

## Governing knowledge

A1, A2, A4; specifications/evidence-records.md; decisions/009-evidence-in-existing-records.md.

## Prerequisites

Explicit approval of this concrete plan is required before implementation. No new artifact prerequisite is proposed. Listed internal prerequisites must satisfy their DoD.

## Definition of Done

- [x] Canonical and embedded guidance agree on every field, failure rule and claim/verification boundary.
- [x] Examples cover passed, failed, incomplete, malformed, missing-source and conflicting claims; no example supplies approval or treats a PR URL as proof.
- [x] Verify PR #27 knowledge, bundle and retained-delivery scope against main; retain failed Plane checks as a separate fact and preserve historical snapshots.
- [x] Run focused Go bundle/adoption checks and document source/link review results.

## Evidence

Checks passed: GOCACHE=/tmp/add-plane-go-cache go test ./src/archs/artifact-driven ./internal/adopt ./cmd/se-adopt; git diff --check; canonical Markdown target/hierarchy review (83 links). Canonical bundle fidelity compares every delivered file byte with its canonical source. The new evidence guide covers passed/failed/incomplete records, malformed explicit fields, missing detail and conflicting claims; illustrative passed evidence is separate from fresh authoring.

Publication reconciliation checked GitHub PR #27 as merged to main, local protected main against its merge revision, and remote main agreement. The complete 2.2.0 snapshot, originating model-explanations tasks and required canonical/embedded guidance are unchanged from the merged scope. GitHub reports successful Go/docs checks and a failed Plane browser job; no passing Plane claim is made. Root wording now identifies the merged 2.2.0 delivery without changing its snapshot or tasks. New evidence rules remain proposed until this delivery merges. KISS/STE and source/claim separation checks passed.
