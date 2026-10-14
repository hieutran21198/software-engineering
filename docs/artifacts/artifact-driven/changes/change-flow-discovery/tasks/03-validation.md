---
id: add-validation
depends_on: [flow-guidance, add-inventory]
---

# Validate and prepare ADD delivery

## Scope and governing knowledge

Coordinator owns combined validation, bundle adoption checks and the proposed complete ADD snapshot/root/provenance. Do not execute downstream tasks or rewrite historical snapshots.

Governing requirements: requirements/flows.md. Governing specification: specifications/system-flows.md. Consume the unit shared criteria without copying them into this authority.

## Definition of Done

- [ ] Go tests and go vet pass with a writable cache.
- [ ] Fresh/repeated/dry-run adoption preserves the full bundle and conflicts; website build succeeds.
- [ ] New flow records and task DAG validate; changed Markdown links and hierarchy validate.
- [ ] Historical snapshots/evidence are unchanged; proposed new version has source_change, delivery_tasks: change and no task copies.
- [ ] Record upstream-only evidence and prepare a PR; do not claim the shared unit complete.

## Evidence

No implementation checks have run for this task.
