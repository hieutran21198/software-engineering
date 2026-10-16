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
  model-explanations preparation, protected main and PR 26/27 checks. Coverage
  includes authoring, publication, evidence consumption, review, models and
  refresh. Exhaustive runtime discovery, Story migration and hosted integrations
  are excluded.
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
  - id: integration
    criterion: Upstream establishment, integrated behavior, responsive layout,
      read-only safety, bundle parity and required checks support the delivered
      versions.
    integration: true
evidence: []
---

# Review and deliver ADD outcomes with clear evidence

## Included scope

Resolve all six audit findings through ADD-owned evidence/scaffold guidance and Plane-owned evidence, comparison, relationship and refresh behavior. Include diagnosis and repair of the known reading-controls CI failure as integrated validation work.

## Excluded scope

Automatic merges or deployment, a workflow state database, automatic approval inference, editing established snapshots, hosted inference, a full code call graph and unrelated product redesign.

## Retained prior work

PR #26 and #27 are merged. Preserve prior snapshots, delivery tasks and model-explanations membership. The new Plane change incorporates undelivered model requirements with fresh tasks; approval of this new combined plan supersedes the old Plane plan for future execution. It does not retrospectively complete or reassign the older unit. ADD starts from published 2.2.0 knowledge; Plane records declared 1.11.0 plus delivered 1.13.0 knowledge and the proposed model layer explicitly.

## Validation evidence

No delivery checks have run for this new outcome. GitHub reports successful Go/docs checks and failed Artifact Plane checks on PRs #26/#27. PR #26 failure identifies horizontal overflow at width 851. Preparation checks will be recorded separately from implementation evidence.
