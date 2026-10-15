---
unit_of_work: search-label-usability
changes:
  - artifact: artifact-plane
    change: change-search-label-usability
affected_flows:
  - artifact: artifact-plane
    flow: source-retrieval
    effect: modify
  - artifact: artifact-plane
    flow: unit-inspection
    effect: modify
  - artifact: artifact-plane
    flow: repository-exploration
    effect: modify
flow_assessment: Inspected Flows, UnitList, main search controls, flow ranking and paging, flow/dependency canvas labels and shared edge CSS. Title filtering and graph readability change existing journeys. Unlabelled task/unit graphs require regression checks, not invented label features. Screenshot geometry remains unverified. Graph participation creates no task prerequisite.
acceptance:
  - id: named-search
    criterion: Title and ID filtering updates visible matching results in both views, including flows outside the first browsing page.
  - id: readable-labels
    criterion: Edge labels remain readable without covering node content or blocking controls in representative graph fixtures.
  - id: integration
    criterion: Discovery compatibility, async isolation, read-only behavior and previous flows pass integrated checks.
    integration: true
evidence: []
---

# Consistent named search and readable graph relationships

## Outcome and membership

Readers can find named units/flows predictably and read graph relationships. The sole member is artifact-plane/change-search-label-usability. It belongs to no other unit. Membership adds no dependency; the existing ADD 2.1.0 supplier remains required.

## Scope

Include title/ID search, explicit behavior discovery, search feedback/races and labelled flow/dependency graph presentation. Exclude global search, new inference, graph semantics changes, task history deletion and lifecycle repair.

## Validation evidence

Requirement, Specification and Plan completed in separate phase commits. Self-checks confirm four tasks, three resolved prerequisite edges, eight structurally valid flow records and nine local change-document links with no ancestor destinations. No implementation files or historical snapshots were changed. Implementation checks and shared evidence are pending. No version or unit completion is asserted. The new concrete plan requires user approval before implementation.
