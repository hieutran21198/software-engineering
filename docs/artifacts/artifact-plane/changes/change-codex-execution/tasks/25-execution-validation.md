---
id: execution-validation
depends_on: ["codex-hooks","runtime-api","runtime-graphs"]
---

# Validate integrated Codex visibility and prepare publication

## Scope and location

Own integrated fixtures, shared evidence, task evidence, package version preparation, full knowledge snapshot consistency, and review handoff. Coordinator controls artifact files and version updates.

## Governing contracts

Artifact Plane elements requirements/codex-execution.md, specifications/codex-execution.md, and decisions/006-codex-observer.md in change-codex-execution. Existing knowledge contracts remain applicable. Consume established artifact-driven 1.2.0 task and unit contracts; no proposed upstream contract is required.

## Prerequisites

Explicit user approval of this plan; upstream contracts rechecked; internal dependencies above satisfy their applicable DoD.

## Definition of Done

- [ ] Run npm test, npm run build, and npm run test:browser in apps/artifact-plane; run applicable repository adoption/fidelity checks from the repository root.
- [ ] Integrated hook-to-store-to-API-to-browser test shows concurrent bound attempts and recovery after server restart and worktree removal; no live model inference is required for fixture acceptance.
- [ ] Review actual installed Codex hook smoke evidence and report any capability/trust limitation separately from simulated integration evidence.
- [ ] Check documentation links/hierarchy, task DAG, unit membership, unchanged established snapshots, and git diff --check.
- [ ] Record shared acceptance evidence and exact delivered task evidence. Suggest 1.7.0 with compatibility reasons for user confirmation; prepare source_change provenance and linked PR for team review. No merge or establishment claim.

## Evidence

No implementation or task validation has run.
