---
unit_of_work: evidence-and-usability
changes:
  - artifact: artifact-driven
    change: change-evidence-and-usability
  - artifact: artifact-plane
    change: change-evidence-and-usability
affected_flows:
  - artifact: artifact-driven
    flow: change-delivery
    effect: modify
  - artifact: artifact-driven
    flow: version-publication
    effect: modify
  - artifact: artifact-driven
    flow: unit-validation
    effect: modify
  - artifact: artifact-plane
    flow: repository-exploration
    effect: modify
  - artifact: artifact-plane
    flow: change-review
    effect: modify
  - artifact: artifact-plane
    flow: context-handoff
    effect: modify
  - artifact: artifact-plane
    flow: repository-refresh
    effect: modify
  - artifact: artifact-plane
    flow: unit-inspection
    effect: modify
flow_assessment: Inspected canonical phase and evidence rules, publication
  parsing, selected-change review and MCP adapters, observer sampling and tests,
  model-explanations preparation, protected main and PR 26/27 checks. The
  16 October 2026 investigation added layout detection, Git-based comparison,
  declared-evidence derivation and version-record resolution for the proposed
  ADD in-place layout; these modify repository-exploration, change-review,
  context-handoff, repository-refresh and unit-inspection. Coverage includes
  authoring, publication, evidence consumption, review, models and refresh.
  Exhaustive runtime discovery, Story migration and hosted integrations are
  excluded.
acceptance:
  - id: trustworthy-review
    criterion: A reader can identify the baseline, distinguish inherited work,
      inspect evidence and name the remaining gate from the selected change.
  - id: simple-authoring
    criterion: One-artifact authoring uses a complete minimal scaffold and one
      authoritative record per check, with actionable structural diagnostics.
  - id: explain-relationships
    criterion: Dependency and model interactions explain recorded behavior and
      sources with explicit information gaps.
  - id: efficient-refresh
    criterion: Idle observation reads at least 80 percent fewer knowledge bytes on
      the same large fixture while bounded reconciliation detects missed
      changes.
  - id: layout-reading
    criterion: The Plane reads in-place and legacy artifacts, resolves established
      knowledge from the protected branch for both, compares working knowledge
      through Git, derives phase evidence from declared fields, resolves version
      records, and supplies deterministic validate and migrate scripts.
  - id: integration
    criterion: Upstream establishment, integrated behavior, responsive layout,
      read-only safety, bundle parity and required checks support the delivered
      versions.
    integration: true
evidence:
  - criterion: integration
    method: Run upstream Go, bundle/adoption, scaffold and documentation checks;
      downstream execution and publication remain pending.
    result: incomplete
    source: docs/artifacts/units-of-work/evidence-and-usability/README.md#combined-checks
---

# Review and deliver ADD outcomes with clear evidence

## Included scope

Resolve all six audit findings through ADD-owned evidence/scaffold guidance and Plane-owned evidence, comparison, relationship and refresh behavior. Include diagnosis and repair of the known reading-controls CI failure as integrated validation work.

The proposed agent-efficiency extension adds compact HTTP/MCP context retrieval
to the existing Plane member. It preserves this unit's membership and delivered
ADD member. Its new contract, task and affected integration join require approval
before execution. No compact-context implementation or validation is claimed.

## In-place layout reading

The investigation of 16 October 2026 selected an in-place knowledge layout for ADD (see the [add-agent-efficiency unit](../add-agent-efficiency/README.md)). This unit's Plane member now owns reading that layout and the validate and migrate scripts. The single knowledge tree removes the inherited-copy noise and most of the packet size that the publication-evidence, comparison-service, comparison-interface and compact-context tasks addressed; those tasks are superseded. Plane implementation waits for the ADD in-place contract to establish. Membership and the delivered ADD member are unchanged.

## Excluded scope

Automatic merges or deployment, a workflow state database, automatic approval inference, editing established snapshots, hosted inference, a full code call graph and unrelated product redesign.

## Retained prior work

PR #26 and #27 are merged. Preserve prior snapshots, delivery tasks and model-explanations membership. The new Plane change incorporates undelivered model requirements with fresh tasks; approval of this new combined plan supersedes the old Plane plan for future execution. It does not retrospectively complete or reassign the older unit. ADD starts from published 2.2.0 knowledge; Plane records declared 1.11.0 plus delivered 1.13.0 knowledge and the proposed model layer explicitly.

## Validation evidence

No delivery checks have run for this new outcome. GitHub reports successful Go/docs checks and failed Artifact Plane checks on PRs #26/#27. PR #26 failure identifies horizontal overflow at width 851. Preparation checks will be recorded separately from implementation evidence.

## Reviewable plan

1. Deliver ADD evidence rules, publication reconciliation guidance and the minimal authoring scaffold. Validate bundle/adoption and documentation. Prepare suggested ADD 2.3.0 and an upstream PR.
2. Stop for team review and merge. Verify required protected-ref publication and recheck the consumer plan.
3. Implement Plane evidence interpretation and explicit comparison, model explanations, incremental observation and responsive repair. Run the full integrated checks and performance comparison. Prepare suggested Plane 1.14.0 and a linked downstream PR.
4. Stop for team review and merge. Verify both exact member deliveries before claiming shared completion.

- [ADD plan](../../artifact-driven/changes/change-evidence-and-usability/tasks/README.md)
- [Artifact Plane plan](../../artifact-plane/changes/change-evidence-and-usability/tasks/README.md)

The user approved these ten tasks and the suggested ADD 2.3.0 and Plane 1.14.0 versions in the conversation. This approval covers the expanded plan. Upstream publication still gates dependent Plane implementation. Preparation changed project knowledge only.

## Preparation validation

Preparation checks passed: 10 fresh tasks, 14 internal dependency edges, two unique unit members, 13 valid flow records, eight affected journeys and 21 resolving Markdown links without ancestor-page links. Existing task/unit parsers validate both plans. All current task DoD boxes remain unchecked. Only project knowledge changed; application code, canonical/embedded bundles, prior changes and established snapshots remain untouched. These checks validate the plan, not the fixes. PR #27 additionally reports a retry-button detachment timeout in execution-history recovery; task 06 covers diagnosis and focused validation.

## Combined checks

The upstream ADD member passes Go tests/vet, bundle fidelity, scaffold assembly, adoption checks and the documentation production build. The complete proposed 2.3.0 snapshot retains provenance and excludes tasks. Sources and methods are recorded in its originating tasks. These are upstream results only. Plane implementation and shared acceptance remain pending the required upstream review/merge and contract recheck. The earlier approval remains valid for the unchanged downstream tasks.

## Upstream review

[PR #28](https://github.com/hieutran21198/software-engineering/pull/28) carries the validated ADD 2.3.0 proposal and approved downstream preparation. Its team review and merge, followed by exact protected-contract/delivery recheck, gate Plane implementation. The approval already covers the unchanged ten-task plan and proposed versions. The shared outcome remains incomplete.

## Proposed agent-efficiency plan revision

PR #28 is now merged on remote main. Protected-ref contract and delivery recheck
remain required before execution; merged publication does not clear failed Plane
checks. The earlier review/handoff wording above records its preparation context.
The revised pending plan retains seven Plane tasks and adds compact-context after
comparison-service, with the integration join waiting for compact-context too.
The extension and combined repository PR organization await explicit user approval.
No new implementation is claimed and no historical member is reassigned. Proposed
Plane 1.14.0 remains the existing version choice. The separate ADD efficiency unit
prepares ADD 2.4.0; compact transport has no prerequisite on that new release.
