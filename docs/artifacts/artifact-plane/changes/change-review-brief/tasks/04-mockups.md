---
id: mockups
depends_on: []
---

# Mockups

## Scope and ownership

Coordinator. The published prototype of the human-cognitive-support unit (https://claude.ai/artifact/2ZBFnXHdDD6gRkqc32b7rz) and, when the owner asks for artboards, the existing design canvas. No repository code changes.

## Governing knowledge

specifications/review-brief.md, Change page and its list of differences from the prototype; requirements/review-brief.md, B1, B8 and B10.

## Prerequisites

Explicit plan approval.

## Definition of Done

- [x] The prototype matches the contract: the "Accept goal and scope" and "Ask for an independent check" buttons, the prediction prompts and the "Last week" page are removed or marked as later phases; the goal line and "Record my check" remain.
- [x] Screenshots of the change brief at 1440 and 390 pixels are reviewed for one navigation, one title, one place per action and no horizontal overflow.
- [x] The owner approves the mockups, or the requested amendments are made and approved; the approval date is recorded here.

## Evidence

| DoD item | Check | Result | Source |
| --- | --- | --- | --- |
| Matches the contract | The mockup https://claude.ai/artifact/4ihoTUaYWg2zacLvzBxjvh shows the change page of three real changes: phase steps, the Change brief (seven rows, attention row open, decision row with the goal line and the correctness line), Claims in attention order with Record my check (What you ran, What you observed, outcome holds or fails; submit disabled until an observation exists) and Challenge, the hypothesis table of one task file, the flows table, then the existing plan. The two approval buttons, prediction prompts, "new here" notes and the Last week page are removed and named as not in this change | Passed | The mockup page |
| Screenshots | Playwright at 1440 and 390 pixels for the three pages: one navigation, one h1, no horizontal overflow, no console error. Scripted interaction: holds sets verified and Checked by a person; fails sets refuted; the correctness line counts 2 checks by a person; Challenge adds an open hypothesis | Passed | Scratchpad screenshots of 19 October 2026 |
| Owner approval | The owner approved the mockup without amendments in the conversation on 19 October 2026 | Passed | This row |

The research prototype (https://claude.ai/artifact/2ZBFnXHdDD6gRkqc32b7rz) stays unchanged as the research record of the unit. The mockup is a separate page, so research.md stays accurate.

Flow steps in the mockup come from the impact service on commits 3c317fd and 89ed23a, without the brief step that this unit adds. One contract question came up: the ladder table assigns no step to an open claim that has `basis: observed` and evidence. The mockup shows Recorded experiment; task brief-service resolves the rule before code.
