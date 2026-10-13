---
id: integration
depends_on: ["navigation"]
---

# Validate integrated Plane and prepare delivery

## Scope and ownership

Repository: this repository. Locations: apps/artifact-plane test/build, Plane member knowledge, and coordinator-owned unit brief.

Run the full integrated regression suites against the established ADD contract. Record shared evidence centrally. After user version confirmation, prepare the task-free Plane snapshot with linked retained plan and proposed root/DAG. Open the downstream PR and stop for team review.

## Governing contracts and prerequisites

Requirements R1–R5 in requirements/task-retention.md; specifications/task-retention.md. Requires established ADD specifications/task-retention.md from change-task-retention and a recorded contract recheck before any implementation. Explicit plan approval is also required. Internal prerequisites: navigation. Required predecessor DoD must pass before starting.

## Definition of Done

- [x] npm test, npm run build, and npm run test:browser in apps/artifact-plane pass on the integrated revision.
- [x] Repository go test ./..., go vet ./..., website build and contract/link checks pass where affected; no required CI check is skipped.
- [x] Unit shared evidence references retained member tasks and combined integration details; historical outcomes/snapshots remain untouched.
- [x] Proposed version has no tasks directory, has valid source_change/delivery_tasks, and resolves its delivered plan; publication is not claimed before merge.

## Evidence

Integrated validation passed on the 1.8.0 implementation: npm test (120 Node checks), npm run build, and npm run test:browser (17 Chromium cases) in apps/artifact-plane. The installed system Chromium executable was selected through PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH. GOCACHE=/tmp/software-engineering-retention-go-cache go test ./... and go vet ./... passed; npm run build in website passed.

Browser checks cover both primary tabs without standalone Workflow, retained unit Workflow, exact task sources for both layouts, modified delivery evidence, legacy ungrouped tasks/phases, full commit IDs, worktree opening/unavailable states, histories, selection/refresh, responsive layout, runtime and archived attempts, and read-only file/Git fingerprints. Node fixtures cover invalid/missing sources, publication byte/path mismatches, protected refs, and honest completion. No required local check was skipped. Final snapshot/links and review handoff are recorded below.

Final preparation: node /tmp/check-plane-delivery.mjs passed 25 relative Markdown links and hierarchy checks, exact task-free version content/provenance, package/lock version agreement, the three-task/two-edge graph, shared evidence metadata, and preservation of legacy snapshots/outcomes. git diff --check passed. A real repository explore recheck resolved ADD 2.0.0 as established and Plane 1.8.0 as proposed, with exact change-owned plans, no unit diagnostics, and incomplete outcome pending downstream merge. Existing artifact dependencies rederive the unchanged dag.yaml.

The validated downstream branch is published in [PR #14](https://github.com/hieutran21198/software-engineering/pull/14), following merged upstream [PR #13](https://github.com/hieutran21198/software-engineering/pull/13). All task DoD criteria are satisfied. Stop for team review and merge; the version and shared outcome remain proposed/incomplete until the required merge.
