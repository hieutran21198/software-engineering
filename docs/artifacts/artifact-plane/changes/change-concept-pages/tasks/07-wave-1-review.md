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

- [x] Tasks 01 to 06 are integrated; `npm test`, `npm run build`, `npm run test:browser` on the CI browser, `go test ./...` and the executable smoke check pass.
- [x] The golden test passes on the integrated build.
- [x] Screenshots of the Version, Repository snapshot and an unused-model concept page, the ADD artifact page, the domain-model document, the dependency-gates flow Model section and an Impact concept row on this repository at 1440 and 390 px are reviewed as a user against the mockups, and defects are fixed.
- [x] The owner accepts the wave 1 screenshots; until then tasks 08 and 09 do not start.

## Evidence

- Integration: tasks 01 to 06 merged into claude/concept-pages with --no-ff (2660dbe, 1169214, 9c62cb8, cfdb4ce, f07e275, b7d7836); no conflict.
- Combined checks on b7d7836 (machine load 1.05 at start): `npm test` 494 passed, 1 skipped, 0 failed; `npm run build`, `npm run build:validator`, `go test ./...` and `go vet ./...` passed; `npm run build:app` and `node scripts/app-smoke.mjs release/artifact-plane-linux-amd64` passed; validator ok, 0 errors.
- `npm run test:browser` on the CI browser (Chrome for Testing 156): 136 passed, including golden.spec.js and history.spec.js.
- `npm run test:browser` on Nix Chromium 149: 135 passed, 1 failed (artifact-document.spec.js:371, a comparison with every line removed). The test is unchanged since 0eecce1; the file passed 15 of 15 in two reruns. Recorded as intermittent under suite load.
- Screenshots on a disposable clone of b7d7836 with local main at 0eecce1 and one added unused model (Delivery record), CI browser, 1440 and 390 px: Version (closed, and a flow row and Code and tests open), Repository snapshot, Delivery record, the ADD artifact page, the domain-model document, the dependency-gates flow Model section, Impact of Version and an Impact concept row. Each has one h1 and no horizontal scroll. Reviewed against the mockups; no defect found. Published for the owner: https://claude.ai/artifact/Lz7QRMb1hzQdvjYmERJoar.
- Owner acceptance: on 20 October 2026 the owner accepted the wave 1 screenshots and the four listed choices (the affect action on a concept without flows, the Participants heading, no rows for removed concepts on the artifact page, no reopened Flows row on Back).
