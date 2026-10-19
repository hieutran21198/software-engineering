---
self_check:
  result: passed
  source: docs/artifacts/artifact-plane/requirements/human-guidance.md#requirement-self-check
---

# Human guidance and visual distinction

## Outcome

A person who opens a change, an artifact or a flow in the Plane sees where the work stands and what to do next, sees no two states that contradict each other, and tells navigation, actions, destructive controls and states apart at a glance.

## Need

The owner's coordinator used the Plane as a person on 19 October 2026: a disposable clone of this repository at branch claude/plane-ci-browser (change-browser-suite-fixes with version 1.21.1 prepared, not merged) on a separate server, at 1440 and 390 pixels. Facts:

- The work page shows "0 open changes", "No open change" and "Start a change" while the branch holds change-browser-suite-fixes, which waits for team review and merge. `src/work-model.js` treats a change with a version record as closed and lists it only under Show history. The phase state "Team review" with its hint "open a pull request for team review and merge" is therefore not shown after Version preparation.
- The change page of change-delivery-improvements, whose version 1.21.0 is on `main`, shows "Version 1.21.0 prepared", the same label as the unmerged 1.21.1. The artifact page shows "Version 1.21.0 · 1.21.1 prepared" next to "No open change" and does not link the change that prepared 1.21.1.
- On the change page of change-browser-suite-fixes the phase stepper marks all five phases done, while the Plan section shows "1 task · 0 done" and the task shows 5 of 6 DoD items.
- The change brief says "2 knowledge records and 0 other files" while the PR description on the same page says that 7 changed knowledge files and 46 code and test lines are in the difference. The two counts count different things and neither label says what it counts.
- The change brief of change-delivery-improvements lists five flows as "neither declared nor named by a claim", while a claim on the same page names the same five flows in its statement. The brief counts only the claim's `about` list, and the page does not say so.
- Status terms appear without an explanation: documented, static, observed, coordinator, Retained change, Publication review, "Declared evidence; Git history is not replayed", "No introducing commit of the version record was found on the protected ref", "0 items and the goal", "verified by an agent, not independent" and "Re-checked by an agent, not independent".
- Navigation links and actions use the same blue text: Edit, Show dependencies, Read reason and scope, Export context, Open version record, + Add support, Rename step. An unlabeled "×" removes a dependency next to the dependency link in the artifact header, and an unlabeled "×" removes each support of a flow step next to its basis label.
- States use several badge styles without a shared meaning: Changed, Passed, pass, coordinator, Version prepared, Decision, Assumption and Fact from Git. Prepared and established versions both use a gray badge.
- At 390 pixels the phase stepper is five colored bars without phase names.

## Requirements

- HG1: The work page and the change page show, for each change, one status and one next step derived from the change records and local Git. The statuses cover at least: a phase in progress, ready for team review (the version record is on the branch and not on the protected branch) and delivered (the version is established on the protected branch).
- HG2: A change whose version record is not on the protected branch stays under Current work until its version is established.
- HG3: Every page that shows a version tells a version prepared on a branch from a version established on the protected branch, and links the change that prepared it.
- HG4: Two views of the same fact on one page agree. The phase stepper does not mark Implementation done while a task of the plan has an unchecked DoD item.
- HG5: Each count names what it counts. When two counts on one page count different things, their labels say so.
- HG6: A gap that the Plane derives from a rule names the rule and the record that resolves it, in the words of the page.
- HG7: Each status term that a page shows has a short explanation that a person can open at the term, with the keyboard and with a pointer.
- HG8: Navigation, actions, the primary next action and destructive actions look different from each other on every page, and each has an accessible name.
- HG9: A destructive control shows its effect in a visible label or in a confirmation before it removes anything; it does not appear as an unlabeled symbol next to information.
- HG10: One status vocabulary serves every page. Each status has a color, an icon and a text, and no status is shown by color alone.
- HG11: At 390 pixels the phase stepper names the current phase.
- HG12: Existing operations, routes, MCP tools, packet fields and page content keep their behavior, except for the labels and states that HG1 to HG11 change.

## Acceptance criteria

- HGA1: Browser tests on fixtures show the status and next step of a change in each status of HG1 on the work page and the change page, and a change with a prepared, unmerged version under Current work.
- HGA2: Browser tests show "prepared" and "established" versions with different labels on the artifact page and the change page, each with a link to its change.
- HGA3: A browser test on a change with an unchecked DoD item shows Implementation not done in the stepper.
- HGA4: The change brief and the PR description name what each count counts, on the change page of a fixture.
- HGA5: A test opens the explanation of each status term in the glossary with the keyboard and with a pointer.
- HGA6: A layout test finds that links, actions, primary actions and destructive actions on the work, artifact, document, change, unit and flow pages have the computed styles of their kind, and that no destructive control lacks a visible label or a confirmation.
- HGA7: No status badge on these pages lacks an icon and a text.
- HGA8: Screenshots at 1440 and 390 pixels of the work, artifact, change and flow pages are in the change evidence, and the owner looked at them before the version.
- HGA9: The Node and browser suites pass; existing route, tool and packet tests pass without edits.

## Affected artifacts and flows

Artifact Plane only. Flows: repository-exploration (work and artifact pages), change-review (change page), knowledge-authoring (flow and document page controls) and unit-inspection (shared status vocabulary) change their supports; their steps keep their meaning. Artifact-Driven Development is not affected: the statuses are derived from records that ADD 3.0.0 already defines.

## Requirement self-check

Each fact comes from the screenshots and the code named above. Each requirement states a need and is testable through HGA1 to HGA9. The words for statuses, the glossary text and the visual treatment belong to Specification. KISS: the statuses derive from existing records and Git; no new state is stored. STE: one rule in each item; facts are separate from requirements. No blocker prevents Specification.
