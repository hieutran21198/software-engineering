---
id: pages
depends_on: [status-model, visual-system]
covers:
  - element: requirements/human-guidance.md
    ids: [HG1, HG2, HG3, HG9, HG12]
---

# Pages

## Scope and ownership

Implementer, after tasks status-model and visual-system merge into the change branch. The work, artifact, document, change, unit and flow pages, the sidebar and the PR description section: status cards, version labels, the three badge families, `Term` at the first glossary term of each section, the two remove controls and the flow step action groups.

## Governing knowledge

specifications/human-guidance.md: Status card, Version labels, Visual grammar of controls, Sections and cards; specifications/authoring-workbench.md, Labels.

## Definition of Done

- [x] The work page and the change page show a status card for each change in progress, with at most one primary button.
- [x] The artifact page, the change page and the sidebar use "established" and "prepared on this branch" with a link to the preparing change.
- [ ] No page renders the old `.badge` tones; every badge comes from a family component.
- [x] The dependency and support remove controls are `button.danger` with "Remove"; removing a dependency asks for confirmation.
- [x] Existing browser tests pass after label updates only; no route, tool or packet test changes.

## Evidence

| DoD item | Check | Result |
| --- | --- | --- |
| Status cards | Work cards: 4-pixel stripe, status badge, phases, "Next: …" and one action; only the first card with an action has `button.primary`. Change page: StatusCard under the title with branch and version label, PhaseSteps with `status`, styles for `incomplete` and `prepared`, a section link row; the unit page has section links. Screenshots and work-page and change-page specs | Passed |
| Version labels | Artifact header "Version X established · Y prepared by <change>"; VersionLabel on the change Delivery section and unit members; sidebar History rows "<v> established"; artifact-document and change-page specs and the prepared screenshots | Passed |
| Families | The six main pages and the sidebar use StatusBadge, DiffBadge or KindTag; the old tone CSS and `Badge` are removed; claim cards and attention rows have `.stripe.<family>`. Open: the Impact page still renders `.badge tier-*`, and Hypothesis, supported, superseded, Integration and affected render as text; the amended contract lists them, and the follow-up in this task adds them | Open |
| Remove controls | Dependency and support remove are `button.danger` "Remove"; dependency removal shows an inline confirmation, Escape keeps the dependency; flow step actions in three groups; authoring scenario S3 | Passed |
| Existing tests | Browser suite 109 of 109 on the Nix Chromium after label and selector updates in change-page, work-page, artifact-document, unit-page, flow-page and authoring-scenarios specs (each for HG2, HG3, HG8, HG9 or HG10); scenario actions S1 20, S2 7, S3 13 (limit 13, one confirmation click), S4 28, S5 14, S6 9, S7 3, S8 5; `npm test` 424 passed, 0 failed, no Node test edited. After integration: 430 tests, 429 passed, 0 failed | Passed |

Screenshots of a disposable clone at 1440 and 390 pixels, with and without a prepared version: scratchpad pages-shots (session scratchpad). Implementation: src/pages/guidance.jsx (status names, version labels, one term per section, section links, PR description copy); links for "Read reason and scope", "Open task document", "What does this change affect?" and "Read brief"; "Declare in unit brief" on undecided-flow rows; "Discard" is `button.danger`.
