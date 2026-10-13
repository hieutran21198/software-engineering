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

- [ ] GOCACHE=/tmp/software-engineering-retention-go-cache go test ./... and go vet ./... pass.
- [ ] npm run build in website passes; existing delivery/fidelity checks cover changed guidance.
- [ ] Markdown links, hierarchy, YAML/task DAG, git diff --check, and snapshot-content checks pass; established snapshots are unchanged.
- [ ] Record evidence and prepare the proposed version/PR without claiming establishment. Plane work remains gated until upstream merge and recheck.

## Evidence

Not executed. Record check commands, observed results, and relevant implementation references here after approved implementation.
