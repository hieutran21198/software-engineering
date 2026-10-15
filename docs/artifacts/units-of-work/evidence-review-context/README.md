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
flow_assessment: Inspected publication and unit readers, flow
  ranking/pagination, runtime identities, delivery navigation, scoped source
  retrieval, HTTP/MCP adapters, refresh, and project sessions. Add
  selected-change review and context export; preserve named existing flow
  semantics except the explicit evidence and ordering corrections. Coverage is
  recorded relationships, not exhaustive code behavior. Agent launch, remote
  sharing, historical code reconstruction and cross-repository units are
  excluded.
acceptance:
  - id: trustworthy-evidence
    criterion: Instructional or unscoped prose cannot support establishment, search
      preserves exact/relevance order with newest-first empty browsing, and
      identical tasks in separate worktrees never borrow execution observations.
  - id: change-review
    criterion: Readers inspect selected-change knowledge differences against the
      explicit declared-current baseline, affected recorded flows on both sides,
      governing sources and unresolved evidence with honest coverage and
      revision labels.
  - id: context-handoff
    criterion: Markdown, JSON and configured MCP clients receive equivalent bounded
      source-backed change context, omissions and unresolved facts; registered
      source paging remains safe and revision-bound.
  - id: integration
    criterion: Integrated Node, browser, offline-model retrieval, read-only and
      documentation checks cover all five outcomes and preserve existing
      flow/project/unit/task/history behavior and historical bytes.
    integration: true
evidence:
  - criterion: trustworthy-evidence
    method: Run integrated Node, Chromium, offline retrieval, read-only and
      knowledge checks.
    result: passed
    source: docs/artifacts/units-of-work/evidence-review-context/README.md#combined-checks
  - criterion: change-review
    method: Run integrated Node, Chromium, offline retrieval, read-only and
      knowledge checks.
    result: passed
    source: docs/artifacts/units-of-work/evidence-review-context/README.md#combined-checks
  - criterion: context-handoff
    method: Run integrated Node, Chromium, offline retrieval, read-only and
      knowledge checks.
    result: passed
    source: docs/artifacts/units-of-work/evidence-review-context/README.md#combined-checks
  - criterion: integration
    method: Run integrated Node, Chromium, offline retrieval, read-only and
      knowledge checks.
    result: passed
    source: docs/artifacts/units-of-work/evidence-review-context/README.md#combined-checks
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

The user accepted the concrete seven-task plan and proposed compatible minor version 1.12.0. All implementation task DoD checks passed. The required ADD 2.1.0 supplier remains established; no upstream change was needed. Originating task files retain focused checks and implementation commits.

## Combined checks

- Integrated Artifact Plane Node suite: 253 passed, zero failures and zero skips, including the actual installed-model check.
- Complete Chromium browser suite: 46 passed. Eight review cases exercise exact comparisons, missing sides, paging, exports, failures, stale replies, project/worktree changes and refresh selection. Existing project, flow, history, unit, runtime and canvas behavior remains covered. Wide and narrow screenshots were inspected.
- Offline retrieval benchmark: 16 planning flows; the exact-ID case and all five semantic cases ranked their expected result first. Both explicit adoption consumers were returned. Sources were fresh and complete. Assets were already installed; retrieval required no model download. Timing ran alongside browser checks and is not a controlled performance comparison.
- Artifact Plane production build passed. Existing ReactFlow directive and bundle-size warnings remain. Go tests and vet passed; website production build passed.
- Actual self-host review: declared baseline 1.11.0, 39 comparison records, seven candidate flows, fresh/partial packet and exactly 12,000 excerpt characters. The selected change scope received the first excerpt. Tracked bytes, symlink identities, HEAD and status were unchanged by reads. Publication correctly remains proposed.
- Knowledge checks: seven tasks, six valid prerequisite edges, eight valid flow records, one owning unit, 15 change-document links and 34 release/root links. The full proposed snapshot contains 39 knowledge files, no task copies and matching change bytes. Existing historical snapshots, retained delivery evidence and the upstream bundle have zero changed paths.

## Publication boundary

Version 1.12.0 is prepared for team review. The root still declares 1.11.0. Shared acceptance evidence does not establish this unit: its member version must land on main with applicable scoped publication evidence. No approval, merge or continuing packet freshness is inferred.
