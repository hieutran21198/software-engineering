---
id: wave-1-review
depends_on: [golden-captures, concept-mcp, concept-page, page-links]
covers:
  - element: requirements/concept-pages.md
    ids: [CP20, CPA14]
---

# Wave 1 review

## Scope and ownership

Coordinator. The integration of tasks 01 to 06 on the change branch, the combined checks, and the owner's screenshot review of wave 1. No new code except fixes of integration defects, which go back to their task.

## Governing knowledge

specifications/concept-pages.md: all wave 1 sections; units-of-work/concept-pages/README.md: acceptance usability and absent-not-empty.

## Definition of Done

- [ ] Tasks 01 to 06 are integrated; `npm test`, `npm run build`, `npm run test:browser` on the CI browser, `go test ./...` and the executable smoke check pass.
- [ ] The golden test passes on the integrated build.
- [ ] Screenshots of the Version, Repository snapshot and an unused-model concept page, the ADD artifact page, the domain-model document, the dependency-gates flow Model section and an Impact concept row on this repository at 1440 and 390 px are reviewed as a user against the mockups, and defects are fixed.
- [ ] The owner accepts the wave 1 screenshots; until then tasks 08 and 09 do not start.

## Evidence
