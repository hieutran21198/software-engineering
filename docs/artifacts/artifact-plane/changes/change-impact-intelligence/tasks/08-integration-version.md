---
id: integration-version
depends_on:
  - browser-suites
  - interfaces
---

# Integration and version

## Scope and ownership

Own the combined checks, the owner's review, the flow records of this change, the README documentation, the unit evidence and the version record docs/artifacts/artifact-plane/versions/1.18.0/README.md with the identity record update.

## Governing knowledge

The unit brief docs/artifacts/units-of-work/change-impact-intelligence/README.md, every criterion. specifications/change-impact.md, Validation. specifications/flows/change-impact.md.

## Prerequisites

Tasks browser-suites and interfaces satisfy their DoD. artifact-driven 2.8.0 is established or merges in the same pull request.

## Definition of Done

- [ ] The owner opens the Impact page on a real change of this repository at 1440 and 390 pixels and accepts it; the acceptance is recorded in the unit evidence.
- [ ] Combined checks pass on the integrated branch: `npm test`, `npm run build`, the browser suites, `go test ./...`, `go vet ./...`, the website build and validate-knowledge with no error.
- [ ] The benchmark output on the delivery revision is recorded as evidence for the accuracy and performance criteria.
- [ ] The change-impact flow gains implementation and test supports for the service, the route, the tool, the page and the suites; the amended flows resolve their supports; the unit's declared flows match the computed flows or the differences are explained in the flow assessment.
- [ ] The version record 1.18.0 names source_change change-impact-intelligence, states the minor compatibility level with its reason, and current_version in the identity record is 1.18.0.

## Evidence

No checks have run.
