# Source and knowledge fidelity

## Scope and location

Review and correct recovered knowledge under docs/artifacts/artifact-driven/changes/change-initial. Read existing canonical guidance, delivered sources and harness files without editing them. No code or bundle changes.

## Governing knowledge

- [Requirements and acceptance criteria](../requirements/baseline.md): R1–R4, R6, R8–R9; A1–A4.
- [Source inventory](../requirements/evidence.md).
- [Knowledge contract](../specifications/knowledge.md).
- [Delivery contract](../specifications/delivery.md).
- [Boundary decision](../decisions/001-knowledge-and-boundary.md).

## Prerequisites

Explicit user approval of this plan. Inspect latest origin/main and preserve unrelated work. If main changes a governing source, recheck recovery against it before proceeding.

## Method

Compare every local docs/artifact-driven bundle file with its packaged src/archs/artifact-driven equivalent; map required-skills to src/utils/agents/skills. Inspect exact relative references and required metadata. Verify local harness registrations resolve to the supplied roles and required skills. Review all recovered contracts against their named sources and existing tests. Resolve documentation links before classifying hierarchy violations. Do not run adoption over the repository's local bundle.

## Definition of Done

- [ ] Source inventory covers every recovered requirement and applicable contract; statements distinguish implemented behavior, guidance and absent/unverified capabilities.
- [ ] Local bundle and packaged inputs correspond byte-for-byte, or all discrepancies are explained and no governing conflict remains unresolved.
- [ ] Full bundle role/pattern/utility references and new artifact links resolve. New child documents do not link to ancestors; sibling references are valid.
- [ ] Harness paths resolve to the four roles and two required skills. File availability is distinguished from actual universal tool support.
- [ ] Boundary and empty dependency decisions are supported; Artifact Plane and generic utility resources are not duplicated into new artifacts.
- [ ] ADRs distinguish observed choices and reconstructed alternatives from historical proof. KISS/STE checks preserve meaning and limits.

## Evidence

Not executed. Record actual review methods, counts, outcomes and unresolved findings after approval. Existing configuration and historical test names are not completion evidence.
