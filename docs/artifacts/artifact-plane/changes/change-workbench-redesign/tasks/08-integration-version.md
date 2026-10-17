---
id: integration-version
depends_on: [browser-suites]
evidence_records:
  - id: combined-checks
    method: Node, browser, build, Go, website and knowledge checks on the combined branch
    result: passed
    source: docs/artifacts/artifact-plane/changes/change-workbench-redesign/tasks/08-integration-version.md#combined-checks
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
- [x] npm test, npm run build, npm run test:browser, go test ./..., go vet ./..., the website build and validate-knowledge pass on the combined branch.
- [x] The README describes the new layout, and the eight affected flow records name the new page modules and suites, with observed supports recorded from the new runs.
- [x] The unit brief records evidence for usability, authoring and integration.
- [ ] The version record and identity record are prepared with the suggested version, and the pull request is open for team review.

## Evidence

### combined-checks

The combined checks are recorded in the unit brief, section Validation evidence. All of them passed:
- npm test, the app build and the full browser suite (93 of 93, twice);
- go test and go vet;
- the website build;
- validate-knowledge.

apps/artifact-plane/README.md describes the top bar, sidebar, pages, graphs on request, the change review and the browser checks.

The nine Plane flow records now name the new page modules and suites:
- support paths to removed files are replaced;
- requirements that described inspectors, trees or dropdowns are reworded;
- observed browser supports cite this change's browser-suites evidence.

The unit brief records passed evidence for authoring and integration. Usability waits for the owner's acceptance of the screenshots.

