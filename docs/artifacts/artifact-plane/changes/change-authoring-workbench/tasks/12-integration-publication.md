---
id: integration-publication
depends_on: [scenario-benchmarks]
evidence_records:
  - id: combined-checks
    method: Combined checks
    result: passed
    source: docs/artifacts/artifact-plane/changes/change-authoring-workbench/tasks/12-integration-publication.md#combined-checks
---

# Integration and publication

## Scope and ownership

Own the combined validation of the integrated change branch, the application README and artifact README updates, the flow record support entries for the implemented modules and tests, the measurement table in the unit brief, the version record and identity record for the confirmed version, and the pull request handoff.

## Governing knowledge

The complete requirements, specifications and decisions of this change; the unit brief docs/artifacts/units-of-work/plane-authoring-workbench/README.md; ADD knowledge-layout.md for version preparation.

## Prerequisites

Task scenario-benchmarks and every other task's DoD.

## Definition of Done

- [x] npm test, npm run build and npm run test:browser pass in apps/artifact-plane; go test ./... and go vet ./... pass; the website builds; validate-knowledge reports 0 errors on this repository.
- [x] The application README documents the workbench, operations, Git actions, HTTP routes, MCP flag and limits; the artifact README scope matches the delivered behavior; the seven affected flow records gain static and observed support for the implemented modules and tests.
- [ ] The unit brief evidence lists every acceptance criterion with its passing source, and the Combined checks section records the commands, results and the before-and-after measurement table.
- [ ] The version record for the confirmed version names this change and current_version is updated together with it through the Plane's own version.prepare operation, recorded as evidence of S-level use on this repository.
- [ ] The branch is pushed and one pull request is opened with the companion summary; establishment is not claimed before merge.

## Evidence

### combined-checks

Checked on branch claude/plane-authoring-workbench: npm test passed 333 of 334 with 1 skipped (one run failed once in the known flaky SQLite process test and passed on two reruns); npm run build succeeded; npm run test:browser passed 102 of 102; go test ./... and go vet ./... passed; the website build succeeded; validate-knowledge reports 0 errors (3 artifacts, 335 elements, 17 units, 17 flows). The application README documents the shell, the editing pages, the operations, the Git actions, the HTTP routes, the MCP flag and the limits. The seven affected flow records gained static and observed support for the server modules, the pages and the Node and browser tests. The unit brief records the evidence and the measurement table; its effort criterion is incomplete because five action targets are missed. The version record and the pull request follow this record, so their DoD items stay unchecked here.
