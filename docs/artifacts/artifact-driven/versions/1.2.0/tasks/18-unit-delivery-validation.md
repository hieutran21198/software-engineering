---
id: unit-delivery-validation
depends_on: [unit-knowledge]
---

# Validate ADD delivery and prepare upstream publication

## Scope and location

src/archs/artifact-driven tests, internal/adopt tests, website delivery; coordinator-owned docs/artifacts. Work only on this task's scope; preserve unrelated edits. The coordinator controls artifact and shared brief updates.

## Governing knowledge

- [Requirements](../requirements/units-of-work.md)
- [Specification](../specifications/units-of-work.md)

## Prerequisites

No upstream artifact prerequisite. Explicit user plan approval gates implementation.

Internal prerequisites must satisfy applicable DoD before this task starts.

## Definition of Done

- [x] Add meaningful contract/delivery fixtures for brief examples, provenance, and reserved-directory conventions.
- [x] Run go test ./...; run npm run build in website with dependencies installed.
- [x] Check canonical/packaged fidelity and local Markdown links; record actual results with tasks.
- [x] Create the agreed outcome brief for these two changes and record applicable shared validation criteria using the new contract.
- [x] Propose ADD 1.2.0 for user confirmation; prepare full snapshot with source_change, root, and index consistently.
- [ ] Open the upstream PR and stop for team merge; do not treat proposed publication as establishment.

## Evidence

Validation passed: GOCACHE=/tmp/software-engineering-unit-go-cache go test ./... and npm run build in website. The initial repeated Go run encountered a read-only default cache; using the permitted /tmp cache passed the full suite. Website generation and production compilation passed; Docusaurus reported only its optional update-cache notice.

TestCanonicalBundleFidelity checks every canonical file against the embedded bundle. TestAdoptFullBundlePreservesKnowledge checks full adoption bytes and confirms adoption creates no project artifacts. A local check parsed membership, provenance, and shared evidence examples, verified the two-member brief, and resolved 174 links in 118 documents without ancestor references. The project-adoption links also resolve. git diff --check passed.

The user confirmed ADD 1.2.0. The full proposed snapshot declares source_change: change-units-of-work. Root links are prepared consistently; ADD dependencies remain empty and the established DAG requires no edge change. Source-change provenance in a branch remains proposed until team merge. KISS and STE self-checks passed. Plane implementation and shared integration checks have not started because upstream establishment is required.

PR handoff will be recorded after publication; no merge, deployment, or tag is authorized.
