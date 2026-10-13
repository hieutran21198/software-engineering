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

- [x] Run npm test, npm run build, and npm run test:browser in apps/artifact-plane; run applicable repository adoption/fidelity checks from the repository root.
- [x] Integrated hook-to-store-to-API-to-browser test shows concurrent bound attempts and recovery after server restart and worktree removal; no live model inference is required for fixture acceptance.
- [x] Review actual installed Codex hook smoke evidence and report any capability/trust limitation separately from simulated integration evidence.
- [x] Check documentation links/hierarchy, task DAG, unit membership, unchanged established snapshots, and git diff --check.
- [x] Record shared acceptance evidence and exact delivered task evidence. Suggest 1.7.0 with compatibility reasons for user confirmation; prepare source_change provenance and linked PR for team review. No merge or establishment claim.

## Evidence

npm test passed 103 Node tests; npm run build passed; npm run test:browser passed all 15 Chromium cases on the final integrated runtime revisions. Browser tests run with an isolated state directory and system Chromium. Root GOCACHE=/tmp/software-engineering-codex-go-cache go test ./... and go vet ./... passed.

The hook-to-store-to-SSE-to-browser fixture covers concurrent tasks, permission waits, returned execution, reported validation, failures, interruption, stale observations, offline/online recovery, unchanged viewport/selection, safe rendering, and history after worktree removal/reload. Wide, narrow, and archived screenshots were inspected. Repository fingerprints remained unchanged.

Installed codex-cli 0.160.1 initialized in a disposable CODEX_HOME; hooks/list discovered ten enabled command handlers without warnings/errors. They remained untrusted. No live model turn or hook trust change was performed; actual activation requires the user's /hooks review. Fixture evidence is not live-model execution evidence.

The user confirmed 1.7.0. Full snapshot and source_change provenance are prepared on the feature branch. Publication evidence is recorded below after PR creation; establishment still requires team merge. KISS/STE checks retain the observation boundary and clear evidence labels.

## Knowledge validation

The actual Plane reader accepted the proposed 1.7.0 snapshot and originating change: five tasks, seven prerequisite edges, no unit diagnostics, and establishment correctly reported as proposed. All 34 local links in the new change/snapshot resolved without ancestor references; YAML checks and git diff --check passed. The artifact DAG remains artifact-driven -> artifact-plane. Existing 1.6.0 snapshots, ADD contracts/bundle, and harness configuration have no changes relative to main.

## Review handoff

[PR #12](https://github.com/hieutran21198/software-engineering/pull/12) contains the approved implementation, shared validation evidence, and user-confirmed proposed 1.7.0 snapshot. The branch was published to the verified existing origin. Stop for team review and merge; no merge, deployment, tag, or establishment is claimed.
