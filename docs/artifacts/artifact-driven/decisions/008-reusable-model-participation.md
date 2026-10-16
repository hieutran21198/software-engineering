# Reusable models with evidence-linked participation

## Decision

Declare named models in owned specification metadata and reference them from flow participants. Keep semantic identity separate from document paths. Reuse existing support records for interaction evidence and existing element-reference reasons for dependency explanations.

## Alternatives and consequences

Relabelling document nodes cannot represent several models in one file or a model defined by several sources. Per-flow model copies lose shared identity. A separate registry or mandatory DDD taxonomy adds maintenance without serving this initial outcome. Additive owned declarations require authoring and leave legacy coverage gaps explicit; readers must preserve old flow behavior and diagnose incomplete semantic metadata.
