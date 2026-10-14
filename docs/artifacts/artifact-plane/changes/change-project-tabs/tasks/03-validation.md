---
id: validation
depends_on: [workspace-tabs]
---

# Integrated validation and delivery

## Scope and location

Own apps/artifact-plane/test/browser project-tab acceptance checks and apps/artifact-plane/README.md documentation. The coordinator owns task evidence, unit evidence, snapshot preparation, and root metadata. Run current integrated checks and document concrete results.

## Governing references

Artifact Plane requirements/project-tabs.md and specifications/project-tabs.md in this change. Existing live-reload and lazy-loading specifications remain applicable. Shared acceptance is owned by the project-tabs unit brief.

## Prerequisites

Explicit approval of this plan and the listed internal prerequisites with their DoD satisfied. No new upstream establishment gate.

## Definition of Done

- [ ] Browser cases use two repositories with equal artifact/task IDs to verify project isolation, navigation/viewport retention, close during reads, rapid switching, runtime scope, and automatic refresh on return.
- [ ] Verify refresh/restoration, persisted browser restart context, unavailable project recovery, and accessible tab controls.
- [ ] Verify closed/inactive tabs release streams and stop polling; delayed responses stay with their owner.
- [ ] Run npm test, npm run test:browser, and npm run build in apps/artifact-plane; investigate failures before claiming completion.
- [ ] Verify inspected fixture bytes and Git state remain unchanged.
- [ ] Validate documentation hierarchy, safe unit membership, task DAG, and resulting snapshot references.
- [ ] Record actual commands/results in task evidence and reference shared evidence from the unit brief.
- [ ] Document browser-origin persistence and memory growth with retained tabs; prepare the proposed version and review PR after version confirmation.

## Evidence

Implementation has not started. No validation success is asserted.
