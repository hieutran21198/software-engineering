# Derive task graphs from plans and task metadata

## Context

Changes retain historical tasks. File presence and checklist state cannot identify the current plan reliably. The user requires a graph without a second dependency or status store.

## Decision

Use the tasks list in tasks/README.md for current plan membership. Use id and depends_on in each listed task for dependency edges. Derive visualization and diagnostics. Keep task evidence in its Markdown source.

## Alternatives

A separate dag.yaml duplicates task prerequisites. Parsing dependency prose makes ambiguity part of the executable contract. Including every task file misclassifies copied historical work. The selected format gives explicit membership and one source for each edge with the existing YAML tooling.

## Consequences

New or materially revised plans must declare metadata. Legacy plans remain readable with unavailable graphs. Cross-artifact establishment remains a separate gate.

## Applicability in this change

For future versions, specifications/task-retention.md replaces requirements to copy or inherit tasks and version-specific task evidence. Existing delivered records remain unchanged.
