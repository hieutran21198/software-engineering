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
