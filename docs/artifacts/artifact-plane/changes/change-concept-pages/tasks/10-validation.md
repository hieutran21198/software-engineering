---
id: validation
depends_on: [brief-concepts, sidebar-search]
covers:
  - element: requirements/concept-pages.md
    ids: [CP1, CP20, CPA1, CPA14]
---

# Validation

## Scope and ownership

Coordinator. The flow records of repository-exploration, change-impact, change-review, context-handoff and source-retrieval, the Plane README and integration README (MCP tools), the reading scenario baseline, the claims of specifications/concept-pages.md, the unit brief evidence, the version record and the package version with its Nix npm dependency hash.

## Governing knowledge

specifications/concept-pages.md: all sections; units-of-work/concept-pages/README.md: acceptance.

## Definition of Done

- [ ] The five affected flows name the new steps and supports, with basis observed and evidence where a test runs.
- [ ] The Plane README and the integration README list `get_concept` and the `kinds` input.
- [ ] On the integrated branch, `npm test`, `npm run build`, `npm run test:browser` on the CI browser, `go test ./...`, the executable smoke check and the validator pass, and the golden test passes (CPA1, CPA14).
- [ ] The S1 to S8 limits hold, and the S-A to S-F counts are measured at 1440 and 390 px and recorded as the new baseline.
- [ ] Screenshots of wave 2 (a brief with concept rows, a PR description, the sidebar search with a concept and the Discover link) at 1440 and 390 px are reviewed as a user, and the owner accepts them.
- [ ] Each claim of the specification has a status and evidence.
- [ ] The unit brief has evidence for each acceptance criterion, and the version record 1.25.0 (or the renumbered version after the merge order) is prepared with `current_version`, package.json and the Nix npm dependency hash.

## Evidence

- Reading scenarios S-A to S-F, new baseline (DoD item 4): apps/artifact-plane/test/browser/reading-scenarios.spec.js, commit 358a78d. It uses measure() of test/browser/measure.js and the S1 to S8 counting rule: every click, fill, selection and key press after the repository opens on Current work; a fill counts 1, a scroll counts 0. Its fixture declares Artifact, Change and Version in add, uses Version in the flows gates and explore, has the delivered change change-version-wording on main and the open change change-version-records on branch work. Each test asserts the count against the design count in DESIGN and in the test name. Commit 361509f removes the Refresh click from the S-E Properties setup: at both widths the saved document reaches the open page only by live reload. Result: passed.
- Measured baseline, equal to the design count in each row:

  | Scenario | 1440 px | 390 px | Design 1440 / 390 |
  | --- | --- | --- | --- |
  | S-A browse: artifact in the sidebar, Version in Concepts | 2 | 3 | 2 / 3 |
  | S-A all descriptions: artifact row | 1 | 2 | 1 / 2 |
  | S-A search: `/`, fill `version`, Enter | 3 | 3 | 3 / 3 |
  | S-B open change: open the change, expand What is affected? | 2 | 2 | 2 / 2 |
  | S-B delivered change: Show history, the change, expand | 3 | 4 | 3 / 4 |
  | S-C concept name known: `/`, fill, Enter, Code and tests | 4 | 4 | 4 / 4 |
  | S-E Properties after the save: the new concept | 1 | 2 | 1 / 2 |
  | S-E from Current work: `/`, fill `release`, Enter | 3 | 3 | 3 / 3 |
  | S-F: get_concept by title | 1 call | — | 1 call |
  | S-D (interaction kinds, P1) | not measured | not measured | not in scope |

  The design states 390 px counts only for S-E. The 390 px design count of a sidebar route adds the Navigation drawer press; the `/` key opens the drawer itself. At 1440 px the new concept and its New badge show in Properties with 0 actions. The S-E save is a write of domain-model.md outside the counted actions; no Refresh follows it, so live reload shows Release before the count starts.
- S-F: the test of reading-scenarios.spec.js counts MCP tool calls; one get_concept call with `{concept: 'Change'}` returns the description, the source, the declaring document, the declaration state (null), the flow gates with its 2 interactions, the inferred code src/gates.js with basis static, the branch-changed knowledge.md and the open change change-version-records. Result: passed.
- Browsers: reading-scenarios.spec.js 17 of 17 passed on the CI browser (Chrome 156 headless shell) and 17 of 17 on the Nix Chromium, on commit 361509f after `npm run build`. The counts are equal to the counts on commit 358a78d. Result: passed.
- S1 to S8 limits: authoring-scenarios.spec.js 10 of 10 passed on the CI browser in the same run (27 of 27 with the reading spec); actions S1 20, S2 7, S3 13, S4 28, S5 14, S6 9, S7 3, S8 5 against the limits 20, 7, 13, 29, 14, 10, 3, 5. Result: passed.
- Observation: Enter pressed in the same moment as the fill, before the concept list loads, opens the first match: in the first run the query version opened the open change Record version delivery. The scenarios wait for the concept row before Enter, as discovery-recorded.spec.js does.
