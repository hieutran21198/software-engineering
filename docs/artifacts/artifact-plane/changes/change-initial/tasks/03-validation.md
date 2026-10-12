# Integrated validation and delivery

## Scope and ownership

Own app usage documentation, integrated tests, the app check job in the existing `.github/workflows` workflow, and validation evidence. The coordinator owns changes to artifact knowledge. Governing elements are all acceptance criteria in `requirements/explorer.md` and the interface/input contract in `specifications/explorer.md` in this change.

## Prerequisites

Tasks 01 and 02 complete on the integrated branch.

## Definition of Done

- [ ] Validate requirement examples B1–B6 across the reader/API and browser; preserve one authoritative set of fixtures.
- [ ] Add an independent Node.js 24 app check job running `npm ci`, `npm test`, and `npm run build` in `apps/artifact-plane` with its lockfile. Preserve existing jobs.
- [ ] Run the same test and build commands locally and record integrated results. After publication, inspect the actual app CI result; record any unavailable or failed checks rather than claiming they passed.

- [ ] Run scanner/API tests and the local asset build successfully.
- [ ] Exercise a fixture repository in the browser: open, select, expand, inspect relationships, display proposals/diagnostics, and refresh.
- [ ] Check repository contents and Git status remain unchanged after integrated operations.
- [ ] Document installation, start command, supported Markdown conventions, and explicit refresh behavior in the app README.
- [ ] Check new documentation links obey the parent-to-child hierarchy.
- [ ] Record actual commands, results, and any remaining limitations in task evidence.
- [ ] Suggest initial version `1.0.0` for user confirmation; prepare the full snapshot and consistent root/DAG only after confirmation.
- [ ] Push the dedicated branch and open a PR after validation and version preparation. Stop for team review and merge.

## Evidence

Record executed checks and results after implementation. Do not claim this task passed before running its checks.
