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

- [x] `go test ./...` and `go vet ./...` pass.
- [x] The website build passes. The built example page renders every diagram without an error, and the subset icons show the unknown-icon mark with their labels. Screenshots are recorded.
- [x] The pushed branch renders the example page on GitHub. Screenshots of each diagram are recorded.
- [x] The claims `github-renders-notations` and `website-shows-unknown-icon` are updated with the observed results. A refuted claim returns to Specification before Version.
- [x] validate-knowledge reports no error and no new diagnostic for an existing artifact.
- [x] Every relative link of the changed bundle pages resolves, and no child page links to an ancestor.

## Evidence

The coordinator performed the checks in the implementer role on branch claude/diagram-scopes-add.

| DoD item | Check | Result | Source |
| --- | --- | --- | --- |
| Go | `go test ./...` and `go vet ./...` at the repository root | Both pass | this task |
| Website | `npm ci` and `npm run build` in website, then `docusaurus serve` and a headless Chromium capture of the example page | Build passes; seven SVG diagrams with titles, no syntax or page error, no request to another origin; subset icons show the unknown-icon mark with labels | [rendered checks](../../../specifications/diagram-scopes.md#rendered-checks) |
| GitHub | Push of claude/diagram-scopes-add, then a headless Chromium capture of the blob view of the example page | Seven viewscreen frames, each with an SVG, its title and no error; icons show the unknown-icon mark with labels | [rendered checks](../../../specifications/diagram-scopes.md#rendered-checks) |
| Claims | Update of `github-renders-notations` and `website-shows-unknown-icon` | Both `verified`, basis `observed`, `verified_by: agent` | docs/artifacts/artifact-driven/specifications/diagram-scopes.md |
| Validator | `scripts/validate-knowledge.mjs` on a clone of the branch whose local `main` equals origin/main ef59d0f | `ok: true`; only `open-change-conflict` warnings for the author's own branches and stale local branches | this task |
| Links | The link and anchor script of task `guide` over the eight changed bundle pages | 0 problems | [guide evidence](01-guide.md#evidence) |

The validator in the main checkout reported `tier-mismatch` for change-opencode-ci-tests, because the local `main` of that checkout was at b67824e, before #61. The clone with the current `main` does not report it. The screenshots are kept outside the repository.
