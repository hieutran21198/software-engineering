# Integrated validation and delivery

## Scope and ownership

Own app usage documentation, integrated tests, the app check job in the existing `.github/workflows` workflow, and validation evidence. The coordinator owns changes to artifact knowledge. Governing elements are all acceptance criteria in `requirements/explorer.md` and the interface/input contract in `specifications/explorer.md` in this change.

## Prerequisites

Tasks 01 and 02 complete on the integrated branch.

## Definition of Done

- [x] Validate requirement examples B1–B6 across the reader/API and browser; preserve one authoritative set of fixtures.
- [x] Add an independent Node.js 24 app check job running `npm ci`, `npm test`, and `npm run build` in `apps/artifact-plane` with its lockfile. Preserve existing jobs.
- [x] Run the same test and build commands locally and record integrated results. After publication, inspect the actual app CI result; record any unavailable or failed checks rather than claiming they passed.

- [x] Run scanner/API tests and the local asset build successfully.
- [x] Exercise a fixture repository in the browser: open, select, expand, inspect relationships, display proposals/diagnostics, and refresh.
- [x] Verify B7: pan, zoom, fit, select elements, expand/collapse multiple artifacts, and retain dependency status distinctions and zoom during relayout.
- [x] Check repository contents and Git status remain unchanged after integrated operations.
- [x] Document installation, start command, supported Markdown conventions, and explicit refresh behavior in the app README.
- [x] Check new documentation links obey the parent-to-child hierarchy.
- [x] Record actual commands, results, and any remaining limitations in task evidence.
- [x] Suggest initial version `1.0.0` for user confirmation; prepare the full snapshot and consistent root/DAG only after confirmation.
- [x] Push the dedicated branch and open a PR after validation and version preparation. Stop for team review and merge.

## Evidence

Local validation passed: npm ci; npm test (14 checks); npm run build; npm run test:browser (2 checks) using the existing Chromium executable. The shared fixtures cover B1–B7 and preserve inspected repository files and Git state. The browser requested no external assets and reported no page errors. The screenshot was inspected for readable nodes, edge labels, controls, diagnostics, and details.

Repository checks go test ./... and go vet ./... passed. The app has an independent Node.js 24 test/build/browser job in the existing CI workflow. Existing jobs remain intact. App usage documentation describes supported formats, installation, opening, canvas exploration, and refresh. All 15 new documentation links passed missing-target and ancestor-reference checks. Active-change and version snapshot contents match. A real-repository smoke check discovered one artifact and 14 elements with zero diagnostics and unchanged Git index/status.

The user confirmed initial version 1.0.0. It introduces the first explorer contract and has no established compatibility baseline. The snapshot and regenerated DAG are proposed until merge. Published the dedicated branch and opened [PR #1](https://github.com/hieutran21198/software-engineering/pull/1) for team review. The [integrated CI run](https://github.com/hieutran21198/software-engineering/actions/runs/38281711143) passed the artifact-plane, Go, and documentation jobs. Deployment and release jobs were skipped for the PR. No merge or deployment was performed.

KISS retains one local process, request-driven reads, plain records/functions, and an in-memory UI. STE checks preserve the requirements and use direct instructions. Parser support is bounded by the documented README conventions. Vite's bundle-size and client-directive warnings are non-blocking; browser checks passed.
