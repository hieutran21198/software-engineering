# Reuse current context and existing adoption boundaries

## Context and alternatives

Role startup can repeat utility reads. Adoption exposes only the first conflict.
A new runner or persistent recovery packet would add lifecycle authority and
another compatibility surface. Mandatory new agent sessions would add handoff cost.

## Decision

Use explicit same-session reuse with source-change/context-loss invalidation.
Keep complete canonical guidance and load relevant governing sources as needed.
Extend the existing copy preflight and CLI with aggregate diagnostics and optional
JSON. Preserve safety and default behavior. Do not add a workflow engine, cache,
new role or harness adapter. Plane remains optional discovery.

## Consequences

Fewer reads and repair attempts can be measured without asserting model token
savings. Recovery still requires current source and authorization checks. Fatal
filesystem errors can prevent complete inventories and must stay visible.
