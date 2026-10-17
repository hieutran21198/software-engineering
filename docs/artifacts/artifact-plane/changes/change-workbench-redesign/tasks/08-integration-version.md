---
id: integration-version
depends_on: [browser-suites]
evidence_records: []
---

# Integration and version

## Scope and ownership

The coordinator owns the combined checks, apps/artifact-plane/README.md, the affected flow records, the unit brief evidence, the version record and the pull request.

## Governing knowledge

requirements/workbench-redesign.md; specifications/authoring-workbench.md, section Affected flows; the unit brief plane-workbench-redesign.

## Prerequisites

Task browser-suites.

## Definition of Done

- [ ] The owner compares the screenshots with the approved mockups and accepts them; the acceptance is recorded in the unit brief.
- [ ] npm test, npm run build, npm run test:browser, go test ./..., go vet ./..., the website build and validate-knowledge pass on the combined branch.
- [ ] The README describes the new layout, and the eight affected flow records name the new page modules and suites, with observed supports recorded from the new runs.
- [ ] The unit brief records evidence for usability, authoring and integration.
- [ ] The version record and identity record are prepared with the suggested version, and the pull request is open for team review.

## Evidence
