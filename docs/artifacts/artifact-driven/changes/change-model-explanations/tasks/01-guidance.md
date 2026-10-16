---
id: model-guidance
depends_on: []
---

# Define and ship the additive model contract

## Scope and ownership

Own canonical docs/artifact-driven and matching src/archs/artifact-driven guidance. Extend existing flow/element guidance with models and interactions; preserve links and current source-selection/evidence rules. Do not change Plane application code.

## Governing knowledge

M1-M4; specifications/model-explanations.md; decision 008.

## Prerequisites

Explicit concrete-plan approval and listed prerequisite DoD are required. No new upstream artifact dependency is required. Implement and validate ADD first, then stop for team review and merge before Plane consumes the new contract.

## Definition of Done

Canonical and embedded guidance match. Existing legacy examples remain valid. New examples cover multi-flow identity, explicit proposed selectors, missing evidence and loops without creating artifact/task prerequisites. Adoption tests confirm complete fresh, repeat and conflict behavior.

## Evidence

Passed: GOCACHE=/tmp/plane-domain-go-cache go test ./internal/adopt ./src/archs/artifact-driven. The adoption suite covers fresh/repeated copying, conflict preflight, dry run, containment and complete bundle preservation; canonical filesystem fidelity also passed. node /tmp/check-plane-domain.mjs parsed all three YAML guidance examples and checked shared model identity across two illustrative journeys, explicit proposed selectors and a self-loop. Six deliberately invalid model/participant/source cases were rejected by the authoring check. The examples explicitly identify missing target evidence and do not assert observed execution. Canonical and embedded copies of all three changed guidance pages are byte-identical. git diff --check passed. This is documentation/authoring validation, not a claim that Plane already interprets the new semantic layer. KISS reuses existing selectors/support and STE preserves evidence limits.
