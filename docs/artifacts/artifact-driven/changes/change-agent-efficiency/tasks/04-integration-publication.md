---
id: efficiency-integration
depends_on: [context-retention, json-cli]
evidence_records: []
---

# Validate ADD efficiency and prepare publication

## Scope and ownership

Coordinator owns complete ADD snapshot/root/DAG updates and this unit's evidence.
Integrate implementation and run existing checks. Coordinate the combined repository
PR with the separate Plane integration task without cross-artifact task IDs.

## Governing knowledge and prerequisites

R1-R7/A1-A6; specifications/agent-efficiency.md; existing version/delivery contracts.
Explicit approval, version confirmation and listed task DoD. No new artifact gate.

## Definition of Done

- [ ] Run GOCACHE=/tmp/add-autonomy-go-cache go test ./... and go vet ./...; run website npm run build with locked dependencies and existing supported Node; record all outcomes.
- [ ] Run conflict benchmarks, source-read/recovery scenarios and safety/parity checks. Report bytes/reads and conflict inventory counts; claim no unmeasured token or latency savings.
- [ ] Validate unit membership, task/flow contracts, links, acyclicity, retained evidence and unchanged artifact dependency semantics with existing readers.
- [ ] Prepare confirmed ADD 2.4.0 complete requirements/specifications/decisions without tasks; source_change: change-agent-efficiency and delivery_tasks: change; consistent proposed root/DAG, retained tasks and unchanged historical snapshots.
- [ ] After required combined checks, push the dedicated branch and open/attach the single repository PR with proposed ADD/Plane versions and separate evidence; link upstream #28 and stop for team review/merge. Do not claim establishment from PR creation.

## Evidence

Not executed. Record methods, results, source references and limitations here.
