---
id: validation
depends_on: [guide, example]
covers:
  - element: requirements/diagram-scopes.md
    ids: [ADS5, ADS6]
---

# Bundle validation

## Scope and ownership

Implementer for the checks; coordinator for the claims and the branch push. Location: the repository root, the website and the pushed branch on GitHub.

## Definition of Done

- [ ] `go test ./...` and `go vet ./...` pass.
- [ ] The website build passes. The built example page renders every diagram without an error, and the subset icons show the unknown-icon mark with their labels. Screenshots are recorded.
- [ ] The pushed branch renders the example page on GitHub. Screenshots of each diagram are recorded.
- [ ] The claims `github-renders-notations` and `website-shows-unknown-icon` are updated with the observed results. A refuted claim returns to Specification before Version.
- [ ] validate-knowledge reports no error and no new diagnostic for an existing artifact.
- [ ] Every relative link of the changed bundle pages resolves, and no child page links to an ancestor.

## Evidence

Pending.
