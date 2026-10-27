---
unit_of_work: diagram-scopes
changes:
  - artifact: artifact-driven
    change: change-diagram-scopes
  - artifact: artifact-plane
    change: change-diagram-scopes
affected_flows:
  - artifact: artifact-driven
    flow: change-delivery
    effect: modify
  - artifact: artifact-plane
    flow: repository-exploration
    effect: modify
flow_assessment: Discovery inspected the visual representation guide, the
  artifact model, the system-flow guide, the diagram rendering contract, the
  Plane home, artifact and document pages, the overview query, the diagram
  renderer, its browser tests and the 18 flow records. change-delivery gains
  the diagram scope support on its specification and implement steps.
  repository-exploration gains the Plane contract support on its overview and
  inspect steps. source-retrieval reads documents through the extended
  renderer; its existing diagram-rendering-contract support covers the change,
  so its record stays. No flow gains or loses a step.
acceptance:
  - id: selection
    criterion: The ADD guidance has one selection matrix for system and artifact
      scope with the purpose, owner, suitability, conditional necessity and
      omission condition of each view.
  - id: system-navigation
    criterion: A reader finds the system views of a repository and goes from
      them to the owning artifacts and their detail views.
  - id: artifact-navigation
    criterion: A reader finds the diagrams of an artifact beside its governing
      knowledge, follows their source links and returns to the system views.
  - id: icons
    criterion: Supported icons render in the intended Plane views. Missing icons
      and unsupported diagram types keep a readable label or source fallback in
      every reader.
  - id: aws-example
    criterion: A self-contained AWS example shows a system logical and deployment
      view and an artifact sequence, state and data view, each tied to stated
      facts.
  - id: maintenance
    criterion: A source change reaches each affected diagram through
      regeneration, recheck or an explicit stale line under the existing rules.
      Artifacts without diagrams stay usable, and no diagram quota, approval gate
      or knowledge registry is added.
  - id: integration
    criterion: Representative examples render in Artifact Plane and GitHub
      Markdown with icons, a missing icon, long labels and an overview and detail
      split. The ADD validator and the renderer checks pass, and the owning
      changes record the evidence.
    integration: true
evidence:
  - criterion: selection
    method: Read the scopes, the two matrix tables and the omission conditions of the established guide against the contract.
    result: passed
    source: docs/artifacts/artifact-driven/changes/change-diagram-scopes/tasks/01-guide.md#evidence
  - criterion: system-navigation
    method: Run system-entry.spec.js at 1440 and 390 pixels on the AWS fixture repository.
    result: passed
    source: docs/artifacts/artifact-plane/changes/change-diagram-scopes/tasks/04-system-entry.md#evidence
  - criterion: artifact-navigation
    method: Run diagram-list.spec.js at 1440 and 390 pixels on the AWS fixture repository.
    result: passed
    source: docs/artifacts/artifact-plane/changes/change-diagram-scopes/tasks/05-diagram-list.md#evidence
  - criterion: icons
    method: Run the icon browser tests and the icon chunk check of the Plane renderer.
    result: passed
    source: docs/artifacts/artifact-plane/changes/change-diagram-scopes/tasks/02-icons.md#evidence
  - criterion: icons
    method: Capture the example page on the built website and on GitHub without icon packs.
    result: passed
    source: docs/artifacts/artifact-driven/changes/change-diagram-scopes/tasks/03-validation.md#evidence
  - criterion: aws-example
    method: Count the nodes and edges of each example view against its fact list and render each view.
    result: passed
    source: docs/artifacts/artifact-driven/changes/change-diagram-scopes/tasks/02-example.md#evidence
  - criterion: maintenance
    method: Read the stale and cross-artifact maintenance rules of the guide and check that the guide adds no quota, gate or registry.
    result: passed
    source: docs/artifacts/artifact-driven/changes/change-diagram-scopes/tasks/01-guide.md#evidence
  - criterion: maintenance
    method: Run the diagram index tests for stale lines and for repositories without diagrams.
    result: passed
    source: docs/artifacts/artifact-plane/changes/change-diagram-scopes/tasks/01-diagram-index.md#evidence
  - criterion: integration
    method: Run the integrated unit and browser suites, the repository check, the validators and the renderer checks of both members.
    result: passed
    source: docs/artifacts/units-of-work/diagram-scopes/README.md#combined-checks
publication_reviews:
  - artifact: artifact-driven
    version: 3.4.0
    source: docs/artifacts/units-of-work/diagram-scopes/README.md#upstream-publication
    required_changes:
      - repository: https://github.com/hieutran21198/software-engineering
        scope: ADD knowledge, retained delivery tasks, the visual guide, the example page, the artifact model sentence and the four role skill references.
        pull_request: https://github.com/hieutran21198/software-engineering/pull/62
---

# Diagrams at system and artifact scope

## Purpose

Let readers understand the whole system and then the knowledge of one artifact through diagrams with clear owners, sources and icons. The request is [issue 60](https://github.com/hieutran21198/software-engineering/issues/60).

## Included scope

- ADD guidance: two diagram scopes, one selection matrix, the system ownership and discovery rules, supported icons with reader fallback, and an invented AWS example.
- Artifact Plane: a system entry on the home page, a diagram list on the artifact page and bundled icons in the diagram renderer.
- A Plane fixture repository that mirrors the AWS example, and render checks in the Plane and on GitHub.

## Excluded scope

- A system overview for this repository and new diagrams for existing artifacts.
- Icon registration on the documentation website and diagram checks in the record validator.
- Architecture inferred from code, AWS infrastructure, a diagram editor, navigation from diagram nodes and remote icons.

## Owner decisions

On 27 October 2026 the owner selected an ordinary artifact as the owner of system views, the AWS example in the bundle with a Plane fixture, a curated bundled icon set, and the two Plane surfaces.

## Delivery boundary

The Plane consumes the ADD diagram scope contract. Implement and publish the ADD member first. Start the dependent Plane implementation only after the ADD change establishes on the protected branch. Membership does not replace this gate.

## Upstream publication

Verified through GitHub that PR 62 merged into `main` on 27 October 2026 as 46e7433. Compared the ADD paths of the fetched protected revision with the PR branch `claude/diagram-scopes-add` using `git diff`; the knowledge, the bundle and this brief matched. The protected branch contains the artifact-driven identity record at 3.4.0, version record 3.4.0, the originating tasks of change-diagram-scopes with their evidence, the guide and the example page. No companion repository is required. The Plane member then merged the protected revision into its branch and rechecked its specification against the established contract.

## Combined checks

The ADD member's checks are in its validation task: Go tests, the website build, the rendered example page on the website and on GitHub, and the validator. The Plane member's integrated checks are in its validation task: 571 unit tests with 0 failures, 177 of 177 browser tests with the Nix Chromium and with the CI headless shell, the repository check, the validator and the Nix package build. Together they cover representative examples in Artifact Plane and GitHub Markdown: icons, a missing icon, long labels, and the system context split into an overview and the logical architecture detail. The owner accepted the Plane screens on 27 October 2026. Completion needs the Plane PR to merge.

