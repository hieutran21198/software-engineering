---
unit_of_work: evidence-review-context
changes:
  - artifact: artifact-plane
    change: change-evidence-review-context
affected_flows:
  - artifact: artifact-plane
    flow: execution-observation
    effect: modify
  - artifact: artifact-plane
    flow: source-retrieval
    effect: modify
  - artifact: artifact-plane
    flow: unit-inspection
    effect: modify
  - artifact: artifact-plane
    flow: repository-exploration
    effect: modify
  - artifact: artifact-plane
    flow: change-review
    effect: create
  - artifact: artifact-plane
    flow: context-handoff
    effect: create
flow_assessment: Inspected publication and unit readers, flow ranking/pagination, runtime identities, delivery navigation, scoped source retrieval, HTTP/MCP adapters, refresh, and project sessions. Add selected-change review and context export; preserve named existing flow semantics except the explicit evidence and ordering corrections. Coverage is recorded relationships, not exhaustive code behavior. Agent launch, remote sharing, historical code reconstruction and cross-repository units are excluded.
acceptance:
  - id: trustworthy-evidence
    criterion: Instructional or unscoped prose cannot support establishment, search preserves exact/relevance order with newest-first empty browsing, and identical tasks in separate worktrees never borrow execution observations.
  - id: change-review
    criterion: Readers inspect selected-change knowledge differences against the explicit declared-current baseline, affected recorded flows on both sides, governing sources and unresolved evidence with honest coverage and revision labels.
  - id: context-handoff
    criterion: Markdown, JSON and configured MCP clients receive equivalent bounded source-backed change context, omissions and unresolved facts; registered source paging remains safe and revision-bound.
  - id: integration
    criterion: Integrated Node, browser, offline-model retrieval, read-only and documentation checks cover all five outcomes and preserve existing flow/project/unit/task/history behavior and historical bytes.
    integration: true
evidence: []
---

# Evidence-based change review and context handoff

## Outcome

Artifact Plane provides trustworthy evidence and a useful read-only change review that can be handed to another person or agent as source-backed context.

## Included scope

- Correct publication assertions, query-specific flow order, and worktree-bound observations.
- Review one selected artifact change against its declared current knowledge version.
- Show explicit flow impact, governing sources and missing evidence.
- Copy/download Markdown and JSON context and retrieve the same context through MCP.
- Preserve merged flow readability, existing exploration and historical evidence.

## Excluded scope

Agent execution/approval, hosted generation, external sharing, general code-diff review, inferred historical code baselines, arbitrary repositories/files, cross-repository federation, broad navigation redesign and automatic lifecycle repair are excluded.

## Membership and dependencies

The sole member is artifact-plane/change-evidence-review-context. It belongs to no other unit. Its existing dependency on established ADD 2.1.0 remains. This brief creates no artifact or task edge. Detailed knowledge and the fresh task plan remain with the member.

## Discovery and baseline evidence

The user requested three investigated corrections plus change review and context handoff. Source inspection confirms each correction's mechanism. GitHub reports PR #23 merged at the local main and origin/main revision, but the artifact root still declares 1.11.0. Existing reader-derived completion is not used as independent publication proof. PR #20 merged the supplying ADD 2.1.0 contract. Historical snapshots and delivery tasks remain unchanged.

## Validation evidence

Requirement self-check completed. Implementation checks have not run for this outcome. The evidence list remains empty until actual checks pass. No proposed member version or shared completion is asserted. Specification and a concrete task plan precede implementation approval.
