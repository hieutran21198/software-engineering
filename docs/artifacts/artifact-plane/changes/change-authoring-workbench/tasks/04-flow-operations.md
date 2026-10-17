---
id: flow-operations
depends_on: [knowledge-writer]
evidence_records: []
---

# Flow operations

## Scope and ownership

Own the operations flow.create, flow.step.add, flow.step.update, flow.step.remove, flow.transition.set, flow.transition.remove, flow.support.add, flow.support.update, flow.support.remove and flow.meta.set in knowledge-operations.js, with their tests.

## Governing knowledge

specifications/knowledge-editing.md, section Operations. ADD system-flows.md and specifications/flows.md of this artifact.

## Prerequisites

Task knowledge-writer. Coordinate the shared service file with the other operation tasks through the coordinator.

## Definition of Done

- [ ] flow.create writes a valid flow document whose first step is the entry step; parseFlow reports no diagnostic other than the first step's evidence gap.
- [ ] Step, transition and support operations edit the flow mapping in place through the yaml Document API, derive step and support IDs from titles, keep at least one entry step, remove transitions and step references when their endpoints disappear, and validate the post-image with buildFlowGraph for the planning view.
- [ ] Support targets of kind element and flow are checked in the checked-out tree; implementation and test targets must be tracked files; observed basis requires evidence paths.
- [ ] Participants, interactions and models are preserved byte for byte by every operation.
- [ ] Tests cover every operation, each refusal and round-trip line diffs on fixtures with comments and unknown keys in the flow front matter.

## Evidence

Implementation has not started.
