# Integrated validation and delivery

## Scope and ownership

Own app usage documentation, integrated tests, and validation evidence. The coordinator owns changes to artifact knowledge. Governing elements are all acceptance criteria in `requirements/explorer.md` and the interface/input contract in `specifications/explorer.md` in this change.

## Prerequisites

Tasks 01 and 02 complete on the integrated branch.

## Definition of Done

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
