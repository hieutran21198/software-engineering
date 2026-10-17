---
id: flow-operations
depends_on: [knowledge-writer]
evidence_records:
  - id: flow-operation-tests
    method: node --test test/knowledge-operations.test.js
    result: passed
    source: docs/artifacts/artifact-plane/changes/change-authoring-workbench/tasks/04-flow-operations.md#flow-operation-tests
---

# Flow operations

## Scope and ownership

Own the operations flow.create, flow.step.add, flow.step.update, flow.step.remove, flow.transition.set, flow.transition.remove, flow.support.add, flow.support.update, flow.support.remove and flow.meta.set in knowledge-operations.js, with their tests.

## Governing knowledge

specifications/knowledge-editing.md, section Operations. ADD system-flows.md and specifications/flows.md of this artifact.

## Prerequisites

Task knowledge-writer. Coordinate the shared service file with the other operation tasks through the coordinator.

## Definition of Done

- [x] flow.create writes a valid flow document whose first step is the entry step; parseFlow reports no diagnostic other than the first step's evidence gap.
- [x] Step, transition and support operations edit the flow mapping in place through the yaml Document API, derive step and support IDs from titles, keep at least one entry step, remove transitions and step references when their endpoints disappear, and validate the post-image with buildFlowGraph for the planning view.
- [x] Support targets of kind element and flow are checked in the checked-out tree; implementation and test targets must be tracked files; observed basis requires evidence paths.
- [x] Participants, interactions and models are preserved byte for byte by every operation.
- [x] Tests cover every operation, each refusal and round-trip line diffs on fixtures with comments and unknown keys in the flow front matter.

## Evidence

### flow-operation-tests

Checked in apps/artifact-plane at commit 8514ef3: the flow test passed. flow.create writes a flow whose only new diagnostic is the evidence gap of its first step. flow.step.add with after, flow.step.update, flow.transition.set with a condition, flow.step.move, flow.support.add for a tracked implementation file attached to a step, flow.support.update, flow.meta.set, flow.support.remove, flow.transition.remove and flow.step.remove edit the flow in place; untracked targets, observed support without evidence, unknown supports and removal of an interaction's only support are refused. After every operation the fixture's comments, participants, inline interaction supports and unknown keys are unchanged, at least one entry step remains, and validate-knowledge reports 0 errors.
