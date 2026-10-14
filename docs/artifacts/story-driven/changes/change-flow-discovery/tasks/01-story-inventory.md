---
id: story-inventory
depends_on: []
---

# Record and validate Story-Driven journeys

## Scope and governing knowledge

Own this change specifications/flows records for authoring, revision with impact and adoption. Preserve the reusable framework behavior and examples. Coordinator prepares the new complete snapshot/root/provenance after validation.

Governing requirements: requirements/flows.md. Governing specification: specifications/flows.md. Consume the unit shared criteria without copying them into this authority.

## Definition of Done

- [x] Three named journeys use the established ADD flow contract and source-backed step/support records.
- [x] Optional medium/domain boundaries and inferred gaps are explicit.
- [x] Source references, documentation hierarchy, bundle fidelity and snapshot retention checks pass.
- [x] Proposed version excludes copied delivery tasks and records originating change provenance.

## Evidence

Three owned flow records describe authoring, revision impact and adoption, with 19 steps, 22 transitions and 14 support records. The actual ADD parser and repository flow reader accept all records without diagnostics. Source/contract review confirms Core/Content ownership, creator decisions and conditional game/art/level domains. No consumer canon or creative runtime behavior changes. Supporting guidance and code are static/documented; gaps remain explicit.

The integrated documentation check passed for 59 changed/new Markdown files and 66 actual local links, with no missing or ancestor destinations. Inline-code examples are excluded. Story 1.1.0 has all eight current change knowledge files with identical paths/bytes, source_change: change-flow-discovery, delivery_tasks: change and no task copies. The delivery preserves 240 historical snapshot/upstream task files byte-for-byte. The proposed Story knowledge dependency on ADD resolves in an acyclic artifact DAG without adding a creative runtime prerequisite.

GOCACHE=/tmp/flow-discovery-go-cache go test ./... and go vet ./... passed, including adoption/bundle fidelity tests. Website build passed. KISS and STE self-check passed. Version 1.1.0 is a compatible proposed minor addition and waits for team review/merge.
