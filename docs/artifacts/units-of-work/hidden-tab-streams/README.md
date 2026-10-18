---
unit_of_work: hidden-tab-streams
changes:
  - artifact: artifact-plane
    change: change-hidden-tab-streams
affected_flows:
  - artifact: artifact-plane
    flow: repository-refresh
    effect: modify
flow_assessment: Inspected the Plane flows whose supports name
  apps/artifact-plane/src/main.jsx, src/Runtime.jsx or server/http.js
  (repository-refresh, repository-exploration, knowledge-authoring,
  context-handoff, source-retrieval and change-impact). Only
  repository-refresh changes - its observe step now stops while the browser
  tab is hidden and starts again with a fresh reload when the tab is visible.
  The other flows keep their steps; the reply guard changes no successful
  reply and no route. ADD and Story-Driven journeys are excluded because no
  ADD contract changes.
acceptance:
  - id: hidden-tabs
    criterion: With three browser tabs of the Plane open on one repository and
      two of them hidden, a document opened in the visible tab shows its text
      within 5 seconds.
  - id: return
    criterion: A hidden tab that becomes visible again reconnects its
      observation and reloads current evidence.
  - id: reply-guard
    criterion: A reply that fails after its headers are sent closes only that
      connection, and the server answers the next request.
  - id: preserved
    criterion: Existing node and browser tests pass.
    integration: true
evidence: []
---

# Keep document reads working with several Plane tabs open

## Included scope

Hidden browser tabs close their repository and runtime event streams, and open them again when they become visible. The HTTP reply guard closes a failed reply without stopping the server.

## Excluded scope

One shared event stream for all tabs, HTTP/2, the size of the `/api/explore` reply, server API changes and ADD contracts.

## Validation evidence

No checks have run.
