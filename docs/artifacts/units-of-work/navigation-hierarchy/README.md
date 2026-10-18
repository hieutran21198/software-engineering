---
unit_of_work: navigation-hierarchy
changes:
  - artifact: artifact-plane
    change: change-navigation-hierarchy
affected_flows: []
flow_assessment: Inspected the repository-exploration flow, whose
  navigation-tree support is apps/artifact-plane/src/Sidebar.jsx, and the
  other Plane flows that open pages from the sidebar. The change alters only
  the tree's indentation, guide lines, group spacing and parent weight. Flow
  steps, transitions and the support requirement (one sidebar for current work
  and artifacts with search, keys and History) stay valid, so no flow is
  listed. ADD and Story-Driven journeys are excluded because no ADD contract
  changes.
acceptance:
  - id: hierarchy
    criterion: Children indent one step per level with joined guide lines under
      their ancestors' chevrons, and artifact rows use medium weight.
  - id: group-space
    criterion: The space above each artifact row is larger than the gap between
      rows in one group.
  - id: preserved
    criterion: Existing browser tests pass and no horizontal overflow occurs at
      390, 700, 851 and 1440 pixels.
    integration: true
  - id: owner-acceptance
    criterion: The owner accepts sidebar screenshots at 1440 and 390 pixels on
      this repository.
evidence:
  - criterion: hierarchy
    method: Browser test of chevron offsets, guide lines and weights.
    result: passed
    source: docs/artifacts/artifact-plane/changes/change-navigation-hierarchy/tasks/01-tree-style.md#evidence
  - criterion: group-space
    method: Browser test of level-0 margins and screenshot review.
    result: passed
    source: docs/artifacts/artifact-plane/changes/change-navigation-hierarchy/tasks/01-tree-style.md#evidence
  - criterion: preserved
    method: npm test, build and the full browser suite with overflow checks.
    result: passed
    source: docs/artifacts/artifact-plane/changes/change-navigation-hierarchy/tasks/02-validation.md#evidence
  - criterion: owner-acceptance
    method: Owner review of sidebar screenshots at 1440 and 390 pixels.
    result: passed
    source: docs/artifacts/artifact-plane/changes/change-navigation-hierarchy/tasks/02-validation.md#evidence
---

# Show hierarchy in the navigation tree

## Included scope

Indentation per tree level, vertical guide lines, extra space before each level-0 row, and medium weight for artifact rows in the Artifact Plane sidebar.

## Excluded scope

Sidebar contents, row order and behavior, pages, the top bar, interfaces and ADD contracts.

## Validation evidence

All four criteria passed on 18 October 2026; the owner accepted the screenshots. The check details are in the [tree-style](../../artifact-plane/changes/change-navigation-hierarchy/tasks/01-tree-style.md#evidence) and [validation](../../artifact-plane/changes/change-navigation-hierarchy/tasks/02-validation.md#evidence) task evidence.
