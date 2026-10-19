---
id: validation
depends_on: [guidance-validation, ci-release, explore-scale]
covers:
  - element: requirements/app-release.md
    ids: [ARA1, ARA2, ARA3, ARA4, ARA5]
  - element: requirements/human-guidance.md
    ids: [HG12]
---

# Validation

## Scope and ownership

Coordinator. Combined checks, the downloaded executable, the supports of the five affected flows, the unit evidence and the version record.

## Governing knowledge

The unit brief docs/artifacts/units-of-work/plane-human-guidance/README.md; both specifications; requirements acceptance criteria.

## Definition of Done

- [ ] The Linux AMD64 executable downloaded from the CI artifacts of the pull request passes its checksum, opens this repository with a `PATH` without Node.js, lists the MCP tools and answers a semantic query after `model-install`.
- [ ] The six file sizes are recorded and compared with the claim bundled-onnx-runtime.
- [ ] The supports of repository-exploration, change-review, knowledge-authoring, unit-inspection and source-retrieval name the new modules and tests; their steps keep their meaning.
- [ ] `npm test`, both browser runs, `go test ./...` and `npm run validate` pass; the validator reports no error for this change.
- [ ] The owner looked at the screenshots and at the downloaded executable before the version.
- [ ] The unit brief has evidence for every criterion; the version record and `current_version` are prepared with the number computed from the protected branch and the minor level.

## Evidence

Not recorded.
