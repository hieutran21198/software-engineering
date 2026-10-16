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
  - criterion: trustworthy-review
    method: Review baseline, declared evidence and remaining gate checks.
    result: passed
    source: docs/artifacts/artifact-plane/changes/change-evidence-and-usability/tasks/12-layout-navigation.md#evidence
  - criterion: explain-relationships
    method: Dependency and model explanation unit, adapter and browser checks.
    result: passed
    source: docs/artifacts/artifact-plane/changes/change-evidence-and-usability/tasks/04-model-explanations.md#evidence
  - criterion: efficient-refresh
    method: Observer tests and the 60-second idle benchmark.
    result: failed
    source: docs/artifacts/artifact-plane/changes/change-evidence-and-usability/tasks/05-incremental-refresh.md#evidence
  - criterion: layout-reading
    method: Layout reader, Git baseline, declared evidence and script checks.
    result: passed
    source: docs/artifacts/artifact-plane/changes/change-evidence-and-usability/tasks/09-layout-records.md#evidence
  - criterion: integration
    method: Integrated npm test, build, browser suite and benchmark.
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

Before implementation, GitHub reported successful Go and docs checks and failed Artifact Plane checks on PRs #26 and #27, including horizontal overflow at width 851. Implementation results are in Combined checks below; the overflow and retry failures are resolved in the responsive-repair task. Preparation checks will be recorded separately from implementation evidence.

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

Earlier upstream results: the ADD 2.3.0 member passed Go, bundle, scaffold, adoption and documentation checks and is established on main through PR #28.

Integrated Plane results on 16 October 2026 (branch claude/add-in-place-layout, one coordinated PR as approved):

- Checks: `npm ci`, then `npm test` (308 tests, 307 pass, 1 skipped) and `npm run build` pass. Two full `npm run test:browser` runs on port 4311 with the Nix Chromium passed 76 of 77. Each run had one different failure, and each failed test passed every isolated rerun, so they are load-timing flakiness. CI on Ubuntu has not run yet. test/flow-index.test.js "separate processes atomically publish complete SQLite records" is flaky: 3 of 10 runs, with code unchanged from origin/main.
- Read-only safety and parity: the new in-place tests assert unchanged repository bytes, and the HTTP and MCP parity tests cover review, flows and models. Historical units read identically on the legacy and migrated forms of this repository.
- layout-benchmark (10 worktrees, legacy revision 4eb71e3 against the migrated branch, main 6a0e0c9): explore git commands 771 to 102 (86.8 percent fewer), elapsed time 23.0 s to 11.0 s, and packet capture commands 1,324 to 50. The zero-excerpt packet for the ADD change grew from 139,216 to 145,391 bytes, so M3's packet target is not met.
- Idle refresh: 75.0 percent fewer knowledge bytes in 60 seconds, and 85.7 percent after the startup scan, against an 80 percent target that the 30-second reconciliation rule caps near 75 percent in a 60-second window.
- Not established: integration stays incomplete until the user decides on the two unmet targets and the team reviews and merges. Proposed versions are ADD 2.4.0 and Plane 1.14.0. Older trustworthy-review and simple-authoring evidence of the ADD 2.3.0 member stays in its delivered change.
