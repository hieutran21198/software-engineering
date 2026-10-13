---
id: task-contract
depends_on: []
---

# Update method and delivered guidance

## Scope and governing references

Repository: software-engineering. Own affected Markdown under docs/artifact-driven and matching src/archs/artifact-driven assets. Update foundation definitions/model, dependency methodology, writing/getting-started guidance, and coordinator/TL/implementer instructions. Preserve the full bundle and utility skill references.

D1–D7 in requirements/task-dag.md; specifications/task-dag.md; decisions/004-derived-task-graph.md; existing knowledge/delivery contracts.

## Prerequisites

No external artifact prerequisite. Explicit user approval of this plan is required.

## Definition of Done

- [x] Guidance defines plan membership, stable IDs, depends_on, edge direction, validation failures, historical exclusion, and legacy unavailability consistently.
- [x] Artifact DAG rules remain artifact-level; task DAG rules remain local to each change. Approval and upstream establishment gates remain explicit.
- [x] Canonical affected Markdown and packaged copies match. All bundle references and required skills remain intact.
- [x] Examples cover a fork/join, single task, and exclusion of retained task evidence. New links resolve and obey documentation hierarchy.

## Evidence

Implemented eight canonical guidance files and mirrored their packaged copies. Reviewed D1–D7 against the approved specification, including fork/join, single/empty plans, legacy unavailability, invalid declarations, historical exclusion, and separate approval/establishment gates. A local Node parity/link check verified all 32 canonical/package Markdown pairs and 57 bundle links, with no missing or ancestor references. go test ./..., go vet ./..., and the website npm run build passed. Existing embedded-filesystem and adoption tests cover delivery bytes; no redundant test or standalone validator was added. KISS keeps one dependency source and existing checks. STE preserves gates, formats, and uncertainty.

## Self-check

Scope and DoD cover the governing requirements. KISS reuses existing assets and checks. STE keeps gates and evidence explicit.
