---
unit_of_work: human-cognitive-support
changes:
  - artifact: artifact-driven
    change: change-claim-records
  - artifact: artifact-plane
    change: change-review-brief
affected_flows:
  - artifact: artifact-driven
    flow: change-delivery
    effect: modify
  - artifact: artifact-plane
    flow: change-review
    effect: modify
  - artifact: artifact-plane
    flow: knowledge-authoring
    effect: modify
  - artifact: artifact-plane
    flow: context-handoff
    effect: modify
flow_assessment: Discovery on 19 October 2026 read the 18 flow records, the
  ADD evidence, writing and working-with-AI guidance, the Plane review service,
  impact service, knowledge operations and change page, and computed the impact
  of commits 3c317fd and 89ed23a with the Plane impact service. ADD
  change-delivery changes because its approval step reads open claims and
  separates goal acceptance from verification, and its implement and
  publication steps use claim checks. Plane change-review changes because the
  change page gains the brief and a person's check; knowledge-authoring changes
  because two claim operations are added; context-handoff changes because the
  packet gains the brief field. Change-impact, repository-exploration,
  repository-refresh, unit-inspection, execution-observation, project-tabs,
  source-retrieval, the other ADD flows and the Story-Driven flows keep their
  steps. Gap - the brief reads impact only through the existing service and
  inherits its limits (dynamic calls, HTTP and process boundaries).
  Reconciliation after Specification - the impact service on the branch
  difference against main reached change-review, knowledge-authoring and
  repository-exploration. Repository-exploration is reached at its inspect
  step through the amended change-review contract; the amendment only points
  to the new brief contract, and inspection opens the change page without new
  steps, so the flow is not declared. Change-delivery and context-handoff are
  declared but not reached because their own flow records are origins of the
  difference. Story-Driven is unresolved because it depends on ADD and
  declares no reference to the changed documents; its adopted bundle does not
  use the evidence fields, so its knowledge does not change.
acceptance:
  - id: claims-contract
    criterion: ADD defines the optional claim list, its status and basis rules,
      the consequential rule and the diagnostics in one contract element and in
      the bundle guidance, both bundle copies are identical, and existing
      knowledge stays valid without edits.
  - id: brief
    criterion: On this repository the change brief shows, for change-hidden-tab-streams,
      six flows reached, one declared and five undecided, and, for the delivered
      changes of four units, the failed or incomplete evidence or unchecked DoD
      item they shipped with.
  - id: checks
    criterion: A claim can be verified only with an observed result; the browser
      records a person and MCP records an agent, and the input cannot choose the
      value; no approval is recorded.
  - id: interfaces
    criterion: The change page, the MCP tool and the packet field return the same
      brief facts for the same revision, and existing routes, tools and packet
      fields pass their tests without edits.
  - id: performance
    criterion: A brief on this repository returns in at most 2 seconds after the
      impact index is warm.
  - id: usability
    criterion: The owner approves the mockups before page work starts, then opens
      the built brief on real changes at 1440 and 390 pixels, answers the seven
      questions from it, and accepts the page.
  - id: integration
    criterion: Node, browser, Go and website checks pass for the combined change,
      both bundle copies are identical for changed files, and validate-knowledge
      reports no error.
    integration: true
evidence:
  - criterion: claims-contract
    method: Contract and ADR review, bundle diff, copy comparison, scripted
      parse of the guideline examples and validate-knowledge.
    result: passed
    source: docs/artifacts/artifact-driven/changes/change-claim-records/tasks/02-validation.md#evidence
  - criterion: brief
    method: Repository probe of the brief operation on change-hidden-tab-streams,
      change-impact-intelligence and the delivered changes of four units.
    result: passed
    source: docs/artifacts/artifact-plane/changes/change-review-brief/tasks/03-brief-service.md#evidence
  - criterion: checks
    method: Node tests of claim.verify through the knowledge service, HTTP and
      MCP, and the browser check form.
    result: passed
    source: docs/artifacts/artifact-plane/changes/change-review-brief/tasks/02-claim-operations.md#evidence
  - criterion: interfaces
    method: Parity test of the brief operation, data.brief and get_change_brief;
      existing review, packet and adapter suites.
    result: passed
    source: docs/artifacts/artifact-plane/changes/change-review-brief/tasks/03-brief-service.md#evidence
  - criterion: performance
    method: Warm brief timing on this repository.
    result: passed
    source: docs/artifacts/artifact-plane/changes/change-review-brief/tasks/03-brief-service.md#evidence
  - criterion: usability
    method: Owner approval of the mockup, screenshots of the built page at 1440
      and 390 pixels, and the owner's acceptance of the built page.
    result: passed
    source: docs/artifacts/units-of-work/human-cognitive-support/README.md#owner-acceptance
  - criterion: integration
    method: npm test, the browser suite twice, go test, the website build, the
      bundle copy comparison and validate-knowledge.
    result: passed
    source: docs/artifacts/artifact-plane/changes/change-review-brief/tasks/06-validation.md#evidence
---

# Help people understand and check agent work

## Purpose

Give a person who reviews agent work the facts they need to understand it, check it and decide, without reading every step: the consequential claims a change rests on, how each was decided, the cheapest check for each, what the change affects, what nobody decided, and whether a person or an agent checked it. Agents write the records; people read, check and challenge.

## Included scope

The optional ADD claim record, its diagnostics and the guidance for authors and reviewers in the bundle. The Plane change brief on the change page, the verification ladder, the claim reader, the claim operations with a person's check, the MCP tool and the packet field, and the validate-knowledge diagnostics.

## Excluded scope

Learning prompts, risk classes, competence or familiarity signals, a workflow, approval or claim registry, numeric confidence, rendering of Codex tool results, and changes to approval or establishment rules. These are later phases in the investigation record.

## Investigation evidence

The [investigation record](research.md) holds the current-state map, the research findings, the design alternatives, the roadmap and the measurement plan that this unit follows. Its prototype is the starting mockup for the page work.

## Members

ADD change-claim-records delivered the claim contract and the bundle guidance as version 2.9.0, established on main. Artifact Plane change-review-brief implements the contract: the claim reader, the claim operations, the change brief and the change page.

## Validation evidence

The claims-contract criterion passed; the detail is in task validation of change-claim-records. The other criteria passed with change-review-brief; each entry names the task evidence that holds its detail.

### Owner acceptance

The owner approved the change brief mockup on 19 October 2026 without amendments. After the build, the owner opened the change brief on changes of this repository and accepted the page on 19 October 2026.
