---
id: add-inventory
depends_on: [flow-guidance]
---

# Record ADD system journeys

## Scope and governing knowledge

Own this change specifications/flows records for adoption, change delivery, dependency gates, unit validation and version publication. Investigate maintained leaf guidance, implementation and tests. Update unit flow assessment under coordinator ownership.

Governing requirements: requirements/flows.md. Governing specification: specifications/system-flows.md. Consume the unit shared criteria without copying them into this authority.

## Definition of Done

- [x] Five named ADD journeys have stable owner/step IDs, triggers, outcomes, important branches and source-linked support.
- [x] Reference paths exist; loop/branch/shared-support semantics follow the contract.
- [x] Basis labels, coverage exclusions and unresolved evidence remain honest.

## Evidence

Reviewed cmd/se-adopt/main.go, internal/adopt/adopt.go and its tests, and the owned knowledge/task/unit/retention contracts. Authored adoption, change-delivery, dependency-gates, unit-validation and version-publication records. The schema/source check recorded in task 03 passed: five flows, 29 steps, 30 transitions and 15 readable supporting sources. Shared support and the recheck loop remain valid. Documented/static support is distinguished from live observations; gaps and exclusions are explicit. The unit assessment lists the five delivered-candidate ADD flows and nine planned downstream flows without claiming completion.
