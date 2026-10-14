---
id: plane-inventory
depends_on: [flow-reader]
---

# Record Plane system journeys

## Scope and governing knowledge

Own this change specifications/flows records for exploration, unit inspection, source retrieval, refresh, tabs and execution observation. Source each claim from maintained implementation and tests.

Governing requirements: requirements/flows.md. Governing specification: specifications/flows.md. Consume the unit shared criteria without copying them into this authority.

## Definition of Done

- [x] Six named journeys have valid records and evidence basis/exclusions.
- [x] Observed execution is distinguished from flow/system knowledge and approval.

## Evidence

All six approved journeys have owned specifications/flows records: repository exploration, unit inspection, source retrieval, repository refresh, project tabs and explicit execution observation. Static implementation/test sources and documented contracts support their steps. Source retrieval includes the new index, HTTP/MCP adapters and parity tests. Flow records carry explicit gaps and exclusions; no live execution or approval claim is inferred from code.

The actual readFlowRepository reader validates the integrated inventory of 14 flows across three artifacts without diagnostics. Source references resolve within owning knowledge and safe tracked code/tests. Every curated support record is assigned to an explicit step; reader guard tests participate in the source-read step and resolve through reverse impact. Browser actual-HTTP acceptance exercises a fixture journey and artifact participation; task 04 retains those checks. Execution observation remains explicitly bound optional input, separate from the map and ADD authorization.

KISS and STE self-check: one record per named journey, shared supporting sources, no duplicated execution DAG or historical unit membership.
