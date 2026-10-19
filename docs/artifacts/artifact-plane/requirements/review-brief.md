---
self_check:
  result: passed
  source: docs/artifacts/artifact-plane/requirements/review-brief.md#requirement-self-check
---

# Change brief requirements

## Outcome

On the change page, a person sees what changed, why, what is affected, what to care about, what to understand, what they can check and what they must decide, and can record their own check of a claim. An agent receives the same facts through the existing interfaces.

## Need

Facts measured on this repository at main d931d07 on 19 October 2026:

- The change page shows the plan, changed knowledge and readiness. Tiered impact is on a separate Impact page; the change-context packet has the tiers but the page does not summarize them.
- The hidden-tab change (commit 3c317fd) reached six flows directly. Its unit declared one. The page cannot show that five reached flows are decided only by a prose paragraph.
- The change-impact-intelligence unit reached six flows that it did not declare, and five unresolved items in Story-Driven. A reviewer finds them only on the Impact page with no sign of who decided them.
- Four unit briefs record failed or incomplete criteria for established versions, and 1.17.0 shipped with an unchecked owner-acceptance item. Delivered change pages do not show this.
- Five flow records say "current integrated validation remain pending" for work delivered in 1.14.0.
- No page separates a recorded agent check from a person's check, and no page lets a person record a check of their own.

## Requirements

- B1: The change page opens with a change brief. It answers seven questions in a fixed order, one line each, and expands each answer in place. An empty answer is hidden. The list of things to care about has at most seven rows.
- B2: The brief is derived on request from the existing readers: the change-context packet, the impact service, plan, task and unit evidence, publication state and Git. The Plane stores no brief, status or approval.
- B3: Every claim and every check row shows one step of a verification ladder: not analyzed, inferred, explained, observed activity, recorded experiment, fact from Git, re-checked by an agent, checked by a person. An agent record never shows the word verified. A test written in the same change counts as a recorded experiment until a run that fails before the fix is recorded.
- B4: The brief compares declared and computed flows. Each flow that is reached but not declared shows the claim that decides it, or "undecided".
- B5: The brief of a delivered change shows failed or incomplete evidence and unchecked DoD items that the version shipped with. Wording that says pending, proposed or not started for delivered work shows as an inferred note on the page of the record that holds it.
- B6: The Plane reads the claim records that ADD defines and shows each claim with its kind, status, basis, evidence, check, risk and rejected options. validate-knowledge reports the claim diagnostics that ADD defines.
- B7: Two knowledge operations record and verify claims. Verification needs the observed result as text and writes it as check detail. The browser channel records a person; the MCP channel records an agent.
- B8: The brief shows acceptance of the goal and verification of correctness as two separate answers. The Plane records no approval.
- B9: An MCP tool and an additive packet field return the same brief facts as the page.
- B10: The owner approves mockups before the page changes are implemented. The built page matches the approved mockups.
- B11: Existing routes, MCP tools, packet fields, tests and the 1.17.0 layout rules stay valid: one navigation, one title per page, one place per action, diagnostics on the page they concern, no horizontal overflow at 390, 700, 851 and 1440 pixels.

## Acceptance criteria

- P1: On this repository the brief of change-hidden-tab-streams shows six flows reached, one declared and five undecided. The brief of change-impact-intelligence shows six reached flows that are not declared and five unresolved items.
- P2: The briefs of the delivered changes of the units add-agent-efficiency, evidence-and-usability, plane-authoring-workbench and plane-workbench-redesign show their failed or incomplete evidence or unchecked DoD item.
- P3: claim.verify without an observed result is refused with status 422. A browser verification records a person and an MCP verification records an agent; the input cannot choose the value.
- P4: The page, the MCP tool and the packet field return the same counts and claims for the same revision.
- P5: The brief of a change on this repository returns in at most 2 seconds after the impact index is warm.
- P6: The owner opens the brief on real changes of this repository at 1440 and 390 pixels, answers the seven questions from it, and accepts the page.
- P7: Node and browser tests pass; validate-knowledge reports no new error.

## Affected artifacts and flows

Artifact Plane is the only implementing artifact. It consumes the proposed ADD claim contract of change-claim-records. Flows that change: change-review (the brief and a person's check), knowledge-authoring (claim operations), context-handoff (the packet field). Flows that keep their steps: change-impact (the brief consumes its answer), repository-exploration, repository-refresh, unit-inspection, execution-observation, project-tabs and source-retrieval. Specification confirms this list with the impact service.

## Facts, assumptions and exclusions

Facts: the measurements above come from the repository and the Plane impact service at d931d07. Assumptions: the existing packet and impact readers can supply the brief within P5 without a new index; the published prototype of the human-cognitive-support unit is the starting mockup. Exclusions: learning prompts, risk classes, competence signals, rendering of Codex tool results, and changes to the approval and establishment rules.

## Requirement self-check

Each requirement names an observable behavior, and P1–P7 test them. B2 and B8 keep the Plane free of workflow and approval state. B10 keeps the owner's mockup gate from the 1.17.0 redesign. Facts are separated from assumptions. The design of fields, routes and modules belongs to Specification. KISS: one derived section and two operations on existing readers. STE: one behavior per item. No blocker prevents Specification.
