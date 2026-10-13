---
id: unit-knowledge
depends_on: []
---

# Define and deliver unit-of-work knowledge

## Scope and location

docs/artifact-driven/01-foundation, 02-methodology, 03-execution/skills, 06-guidelines; matching src/archs/artifact-driven files. Work only on this task's scope; preserve unrelated edits. The coordinator controls artifact and shared brief updates.

## Governing knowledge

- [Requirements](../requirements/units-of-work.md)
- [Specification](../specifications/units-of-work.md)

## Prerequisites

No upstream artifact prerequisite. Explicit user plan approval gates implementation.

Internal prerequisites must satisfy applicable DoD before this task starts.

## Definition of Done

- [x] Update definitions and distinguish artifact change from outcome grouping.
- [x] Document brief schema, shared evidence, version provenance, legacy compatibility, cardinality, and historical completion.
- [x] Update all four role instructions and consumer guidance; retain the full bundle and required skills.
- [x] Canonical and packaged documents agree; references obey the waterfall hierarchy.

## Evidence

Implemented definitions, artifact model, workflow, author/getting-started guidance, all four role instructions, and the new units-of-work guide in docs/artifact-driven and matching src/archs/artifact-driven sources.

The shared outcome brief is docs/artifacts/units-of-work/unit-of-work-exploration/README.md. It names the two member changes and records shared criteria with no stored workflow status.

A local Markdown/YAML check inspected 118 documents and 174 local links across the bundles and both active changes: all resolved without ancestor references. Three guide YAML examples parse successfully, including membership, provenance, and shared evidence. The actual brief has two members and one required integration criterion. Canonical bundle fidelity is covered by TestCanonicalBundleFidelity. KISS reuses existing documents, ownership, and DAGs; STE preserves evidence limits and establishment gates. Self-check passed.
