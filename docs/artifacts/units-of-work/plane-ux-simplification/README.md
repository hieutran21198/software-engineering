---
unit_of_work: plane-ux-simplification
changes:
  - artifact: artifact-plane
    change: change-ux-simplification
affected_flows:
  - artifact: artifact-plane
    flow: repository-exploration
    effect: modify
  - artifact: artifact-plane
    flow: project-tabs
    effect: modify
  - artifact: artifact-plane
    flow: unit-inspection
    effect: modify
  - artifact: artifact-plane
    flow: source-retrieval
    effect: modify
  - artifact: artifact-plane
    flow: change-review
    effect: modify
  - artifact: artifact-plane
    flow: context-handoff
    effect: modify
  - artifact: artifact-plane
    flow: execution-observation
    effect: modify
  - artifact: artifact-plane
    flow: repository-refresh
    effect: modify
flow_assessment: Inspected the running explorer and main, Workspace, Delivery,
  UnitsOfWork, Flows, ChangeReview, Markdown, query boundaries and browser fixtures.
  The eight named Plane journeys cover context switching, reading, evidence,
  review and restoration. Execution observation changes only its empty navigation
  and source context. Flow discovery and supporting knowledge are included in
  repository exploration and source retrieval; backend ranking is unchanged.
  Audit observations do not prove exhaustive usability coverage or the cause of
  prolonged review loading. ADD and Story-Driven runtime journeys are excluded.
acceptance:
  - id: context
    criterion: One explicit worktree selection switches every current-knowledge
      view consistently and equal-named project tabs are visibly distinct.
  - id: reading
    criterion: Purpose and selected knowledge are readable first, direct supported
      source navigation has safe return, and list disclosure leaves the graph intact.
  - id: feedback
    criterion: Pending, empty, unknown, stale and error states are distinct,
      selected-unit completion loads automatically and failed reads can recover.
  - id: clarity
    criterion: Routine metadata and setup controls are secondary, named search
      communicates scope, and review clearly distinguishes full and partial comparisons.
  - id: integration
    criterion: Integrated wide/narrow keyboard and refresh journeys preserve graph
      meaning, source containment, captured evidence and unchanged fixture bytes/Git state.
    integration: true
evidence: []
---

# Simpler Artifact Plane exploration

## Purpose

Reduce the effort to identify a source, read its knowledge and follow relevant evidence. One Artifact Plane change delivers the outcome.

## Included scope

All ten observed audit findings: source context, reading layout, direct contained navigation, honest asynchronous feedback, independent list disclosure, progressive evidence detail, consistent named search, review comparison, project labels and compact setup controls. Preserve pending presentation work on the audited baseline without calling it established.

## Excluded scope

New dashboards, domain graph semantics, ADD changes, hosted services, arbitrary source reads, workflow state storage, historical rewrites, automatic merge and deployment.

## Combined checks

No implementation or integrated validation has run for this outcome. Phase checks verify prepared knowledge only. Record actual combined results here after approved implementation; retained predecessor checks do not prove this change passes.
