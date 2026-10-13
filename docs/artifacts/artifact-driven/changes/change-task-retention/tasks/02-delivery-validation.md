---
id: delivery-validation
depends_on: ["guidance"]
---

# Validate and prepare ADD delivery

## Scope and ownership

Repository: this repository. Locations: internal/adopt tests, website delivery, ADD member change, and coordinator-owned unit brief.

Run existing adoption/fidelity and documentation checks. Record actual results in these change tasks. After user version confirmation, prepare a task-free version with source_change and delivery_tasks: change, linked to this retained plan. Prepare consistent root/DAG and the upstream PR. Stop for team review/merge.

## Governing contracts and prerequisites

Requirements R1–R5 in requirements/task-retention.md; specifications/task-retention.md; decisions/006-change-owned-delivery.md. No upstream artifact gate. Explicit plan approval is required. Internal prerequisites: guidance. Required predecessor DoD must pass before starting.

## Definition of Done

- [x] GOCACHE=/tmp/software-engineering-retention-go-cache go test ./... and go vet ./... pass.
- [x] npm run build in website passes; existing delivery/fidelity checks cover changed guidance.
- [x] Markdown links, hierarchy, YAML/task DAG, git diff --check, and snapshot-content checks pass; established snapshots are unchanged.
- [ ] Record evidence and prepare the proposed version/PR without claiming establishment. Plane work remains gated until upstream merge and recheck.

## Evidence

GOCACHE=/tmp/software-engineering-retention-go-cache go test ./... passed all adoption, CLI, bundle filesystem, and canonical fidelity tests. go vet ./... passed. npm run build in website passed with static output after using an isolated worktree dependency directory. The initial linked-dependency build failed during static rendering; it was replaced with a local dependency copy and the clean retry passed. No website source or dependency lock change was needed.

The user confirmed ADD 2.0.0. Its proposed snapshot contains only README, requirements, specifications, and applicable decisions; provenance identifies change-task-retention and delivery_tasks: change. The plan and both task records remain solely in that originating change. Publication and final link/snapshot checks are recorded below.

Final preparation checks: node /tmp/check-add-delivery.mjs passed task-free snapshot content/provenance/plan links, 146 relative Markdown links and hierarchy checks, complete bundle fidelity, task DAG and unit metadata. git diff --check passed. Git comparison found no edits to established version files or prior outcome briefs. The artifact DAG was rederived from unchanged root dependencies: artifact-driven has none and artifact-plane depends on artifact-driven, so dag.yaml is unchanged.
