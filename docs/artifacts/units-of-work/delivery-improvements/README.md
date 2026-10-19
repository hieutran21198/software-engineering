---
unit_of_work: delivery-improvements
changes:
  - artifact: artifact-driven
    change: change-delivery-improvements
  - artifact: artifact-plane
    change: change-delivery-improvements
affected_flows:
  - artifact: artifact-driven
    flow: change-delivery
    effect: modify
  - artifact: artifact-driven
    flow: version-publication
    effect: modify
  - artifact: artifact-driven
    flow: adoption
    effect: modify
  - artifact: artifact-driven
    flow: unit-validation
    effect: modify
  - artifact: artifact-plane
    flow: knowledge-authoring
    effect: modify
  - artifact: artifact-plane
    flow: change-review
    effect: modify
  - artifact: artifact-plane
    flow: context-handoff
    effect: modify
flow_assessment: Discovery on 19 October 2026 read the 15 flow records of ADD
  and the Plane, the ADD workflow, validation, writing, unit and minimal-change
  guidance, the role skills, AGENTS.md, the Plane validator script, knowledge
  operations and change review, and the measurement and optimization records
  of the framework-comparison investigation. ADD change-delivery changes
  because tiers, the small-tier path, one knowledge commit and the level
  confirmed with plan approval change its requirement, plan, approval and
  publication steps. Version-publication changes because the number is
  computed at Version and the validator checks the record. Adoption changes
  because the install adds the validator and the bundle copy is generated at
  build. Unit-validation changes because small outcomes need no brief and
  evidence is referenced, not copied. Plane knowledge-authoring changes
  because of the scaffold operation and the computed number; change-review
  because of the tier check and the PR description; context-handoff because
  the packet gains the description. Dependency-gates keeps its steps; the
  validator only checks its existing rule. Change-impact keeps its steps; the
  tier check calls it. The other Plane flows and the Story-Driven flows keep
  their steps. Gap - the impact service covers JS, JSX and Go imports only, so
  the small-tier impact criterion is unresolved for other languages and such
  changes cannot be small. Reconciliation after Specification - the impact
  service on the branch difference reached the seven declared flows and four
  more; the claim reached-flows-kept records why the four are not declared.
claims:
  - id: reached-flows-kept
    kind: assumption
    statement: The flows dependency-gates, repository-exploration,
      repository-refresh and unit-inspection keep their steps, although the
      impact service reaches them from the edited specifications.
    status: verified
    basis: observed
    verified_by: agent
    evidence:
      - docs/artifacts/units-of-work/delivery-improvements/README.md#impact-reconciliation
    check: Run the impact service with the branch difference as origin at depth
      2 and confirm, for each of the four flows, that every reaching origin is
      an amendment that adds no step, branch or support condition.
    risk_if_wrong: A flow record keeps steps that the delivered rules no longer
      follow.
  - id: plane-reached-flows-kept
    kind: assumption
    statement: The flows source-retrieval, change-impact, repository-exploration,
      repository-refresh and execution-observation keep their steps, although
      the impact service reaches them from the Plane code of this unit.
    status: verified
    basis: observed
    verified_by: agent
    evidence:
      - docs/artifacts/units-of-work/delivery-improvements/README.md#impact-reconciliation
    check: Run the impact service on the Plane branch difference at depth 2 and
      confirm, for each of the five flows, that the reaching code only adds a
      tool, an operation, diagnostics or an import and no step, branch or
      support condition.
    risk_if_wrong: A flow record keeps steps that the delivered Plane no longer
      follows.
acceptance:
  - id: small-path
    criterion: Replayed on the knowledge of change-hidden-tab-streams, the
      small-tier path produces at most 9 knowledge files, at most 160
      knowledge lines, 2 commits and 1 human gate, and the validator reports
      no error.
  - id: validator
    criterion: The default-install validator and the Plane validator report the
      same diagnostics on a fixture with one seeded defect per check and no
      error on this repository.
  - id: guarantees
    criterion: For each of the five owner-fixed guarantees, a check or a
      contract statement shows that it holds for small, medium and large
      changes.
  - id: reading
    criterion: Each role skill core has at most 400 words and the coordinator's
      unconditional reading has at most 3,000 words.
  - id: review
    criterion: The Plane renders a PR description with tier, changed knowledge,
      DoD and evidence, requirement coverage, validator result, impact coverage,
      proposed level and open claims, and the page, HTTP and MCP agree.
  - id: scores
    criterion: Rescored with the anchors of the framework-comparison scores,
      ADD reaches at least 48 of 55, and each raised score names the delivered
      mechanism that meets its anchor.
  - id: integration
    criterion: Go, Node, browser and website checks pass for the combined
      change, the release archive holds the full bundle from one source, and
      existing knowledge stays valid without edits.
    integration: true
evidence:
  - criterion: reading
    method: wc -w on each role skill core and on the coordinator core with its Read-when table
    result: passed
    source: docs/artifacts/artifact-driven/changes/change-delivery-improvements/tasks/03-role-skills.md#evidence
  - criterion: guarantees
    method: one contract statement or check for each guarantee and tier
    result: passed
    source: docs/artifacts/artifact-driven/changes/change-delivery-improvements/tasks/06-validation.md#evidence
  - criterion: small-path
    method: replay of #37 counted and checked with the validator of a fresh adoption
    result: passed
    source: docs/artifacts/artifact-plane/changes/change-delivery-improvements/tasks/07-validation.md#evidence
  - criterion: validator
    method: adopted validator on the seeded fixture; built file and entry point compared
    result: passed
    source: docs/artifacts/artifact-plane/changes/change-delivery-improvements/tasks/07-validation.md#evidence
  - criterion: review
    method: description parity test over operation, HTTP, MCP, packet and page
    result: passed
    source: docs/artifacts/artifact-plane/changes/change-delivery-improvements/tasks/06-description.md#evidence
  - criterion: scores
    method: ADD rescored with the anchors of the framework-comparison scores
    result: passed
    source: docs/artifacts/units-of-work/framework-comparison/scores.md#rescore-after-delivery
  - criterion: integration
    method: Go, Node, browser, website and validator checks on the combined branch
    result: passed
    source: docs/artifacts/artifact-plane/changes/change-delivery-improvements/tasks/07-validation.md#evidence
---

# Make delivery cost scale with the change

## Purpose

Make the cost of delivering a change with ADD scale with its size and risk. A small fix gets few records, one knowledge commit and one human gate. A medium or large change keeps its phases and plan approval, with less restated text, less mandatory reading, a deterministic validator and one review description for its PR. The five guarantees that the owner fixed hold for every size.

## Included scope

The ADD rules of artifact-driven change-delivery-improvements: tiers, the small-tier path, gate changes, the computed version number, single-source facts, requirement IDs with `covers`, the default-install validator, progressive guidance, implementer context rules, impact-selected local tests, the configuration file, Claude Code profiles, the owner look for UI changes, the generated bundle copy and the matching `AGENTS.md` instructions. The Plane support of artifact-plane change-delivery-improvements: readers, shared checks, scaffold, computed version, tier check and PR description.

## Excluded scope

A code-only maintenance tier without records (deferred by the owner until new measurements exist), a required independent review for large changes, migration of existing requirement files to IDs, and any change to the five guarantees.

## Basis

The investigation, scores, measurements and optimization options are in the framework-comparison unit directory: [research](../framework-comparison/research.md), [scores](../framework-comparison/scores.md), [optimization](../framework-comparison/optimization.md). The owner decided on 19 October 2026: releases R1 to R3 in this unit; tier limits as proposed, without a code-only tier; unit brief optional for small outcomes; approval by request, level with plan approval and one knowledge commit for small changes; a validator in the default install; the bundle copy generated at build; requirement IDs and `covers` for new and edited files only. After the small-tier replay the owner allowed at most 9 knowledge files in the small-path criterion and accepted paragraph labels (`R4. …`) as requirement IDs.

## Order

Requirement, Specification and Plan of both members are prepared together. Plane implementation waits until ADD 3.0.0 is established on main, because the Plane depends on artifact-driven.

## Impact reconciliation

On 19 October 2026 the Plane impact service ran on this worktree with the difference against the protected branch as origin, depth 2. It reached the seven declared flows and four more:

| Flow | Tier | Reached from | Why its steps stay |
| --- | --- | --- | --- |
| artifact-driven dependency-gates | direct | knowledge-layout.md, knowledge.md; at Version also 02-methodology/dependencies.md | The amendments change the lifecycle, phase and approval text for tiers; the resolution of established and proposed knowledge is unchanged, and the step "Check task DoD prerequisites and available plan approval" holds for every tier. |
| artifact-plane repository-exploration | direct | change-review.md, knowledge.md | change-review.md only points to the new description section; inspection still opens the change page. |
| artifact-plane repository-refresh | transitive | knowledge-layout.md through knowledge-layout-reading.md | Layout reading is unchanged. |
| artifact-plane unit-inspection | transitive | evidence-records.md through evidence-and-comparison.md | A task evidence record may omit its source; the reader resolves the default section, and the inspection steps are unchanged. |

On 19 October 2026, during Version preparation of artifact-driven 3.0.0, the check of claim reached-flows-kept ran again on the final branch difference (depth 2). The service reached the same eleven flows, the seven declared flows and the four in the table; its completeness was partial, and each listed origin is an amendment that adds no step, branch or support condition.

On 19 October 2026, at Version preparation of artifact-plane 1.21.0, the impact service on the Plane branch difference (depth 2) reached the three declared Plane flows and five more (claim plane-reached-flows-kept):

| Flow | Tier | Reached from | Why its steps stay |
| --- | --- | --- | --- |
| artifact-plane source-retrieval | direct | server/flow-mcp.js | The MCP server gains the read tool get_change_description; the context step and its tools keep their behavior. |
| artifact-plane change-impact | direct | server/change-review.js | The review service gains the description operation, which calls the impact service; the handoff of the tiered impact is unchanged. |
| artifact-plane repository-exploration | direct | server/reader.js | Exploration adds the record-check diagnostics to the snapshot; it stays read-only and contained. On this repository the checks add about 0.45 s to a 2.55 s exploration (47 Git reads, 17 refs). |
| artifact-plane repository-refresh | transitive | src/pages/ChangePage.jsx through main.jsx | The change page gains a section; observation and reload are unchanged. |
| artifact-plane execution-observation | transitive | server/reader.js through runtime-store.js | runtime-store imports exploreRepository; binding observations is unchanged. |
