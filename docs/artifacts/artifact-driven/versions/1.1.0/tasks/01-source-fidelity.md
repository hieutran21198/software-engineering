# Source and knowledge fidelity

## Scope and location

Review and correct recovered knowledge under docs/artifacts/artifact-driven/changes/change-initial. Read existing canonical guidance, delivered sources and harness files without editing them. No code or bundle changes.

## Governing knowledge

- Requirements and acceptance criteria: R1–R4, R6, R8–R9; A1–A4.
- Source inventory.
- Knowledge contract.
- Delivery contract.
- Boundary decision.

## Prerequisites

Explicit user approval of this plan. Inspect latest origin/main and preserve unrelated work. If main changes a governing source, recheck recovery against it before proceeding.

## Method

Compare every local docs/artifact-driven bundle file with its packaged src/archs/artifact-driven equivalent; map required-skills to src/utils/agents/skills. Inspect exact relative references and required metadata. Verify local harness registrations resolve to the supplied roles and required skills. Review all recovered contracts against their named sources and existing tests. Resolve documentation links before classifying hierarchy violations. Do not run adoption over the repository's local bundle.

## Definition of Done

- [x] Source inventory covers every recovered requirement and applicable contract; statements distinguish implemented behavior, guidance and absent/unverified capabilities.
- [x] Local bundle and packaged inputs correspond byte-for-byte, or all discrepancies are explained and no governing conflict remains unresolved.
- [x] Full bundle role/pattern/utility references and new artifact links resolve. New child documents do not link to ancestors; sibling references are valid.
- [x] Harness paths resolve to the four roles and two required skills. File availability is distinguished from actual universal tool support.
- [x] Boundary and empty dependency decisions are supported; Artifact Plane and generic utility resources are not duplicated into new artifacts.
- [x] ADRs distinguish observed choices and reconstructed alternatives from historical proof. KISS/STE checks preserve meaning and limits.

## Evidence

Executed source review against current main and the combined recovery branch. Compared all 38 files in docs/artifact-driven to src/archs/artifact-driven, mapping required-skills to src/utils/agents/skills: byte-for-byte parity passed. Resolved 51 local bundle links, six .agents skill registrations and four .codex role-profile references: passed. Registration checks prove file availability, not universal harness execution.

Reviewed baseline requirements and both contracts against the named guidance, Go implementation/tests, website generator/configuration and CI. Five phases, ownership, explicit gates and source/generated boundaries match. Recovered alternatives are labelled; no original approvals or rationale are asserted. No missing baseline contract or conflicting source was found. New artifact links were checked as resolved paths, including sibling references; all 32 passed without ancestor links. One ADD capability and unchanged Artifact Plane ownership introduce no upstream prerequisite. KISS and STE self-checks passed.
