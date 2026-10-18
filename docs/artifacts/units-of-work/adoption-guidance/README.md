---
unit_of_work: adoption-guidance
changes:
  - artifact: artifact-driven
    change: change-adoption-guidance
affected_flows: []
flow_assessment: The change edits bundle documentation only. The adoption flow
  (artifact-driven specifications/flows/adoption.md) covers se-adopt selection,
  preflight, preview, copying and conflicts; that behavior does not change, and
  the flow already excludes consumer harness setup. Other ADD flows cover
  authoring, validation and version publication of project knowledge, which
  this change does not modify. Discovery read the flow definitions, the adoption
  guide, the end-user guidelines and cmd/se-adopt; no gap was found.
acceptance:
  - id: one-procedure
    criterion: Download, checksum and se-adopt command blocks occur only in the
      adoption guide; the agent request and the harness setup rules occur once.
  - id: release-selection
    criterion: No fixed past tag is the default; the latest-release and chosen-tag
      procedures resolve a tag and pass checksum verification.
  - id: next-steps
    criterion: The adoption guide gives ordered next steps from the adopted bundle
      to the first change, and their links resolve.
  - id: integration
    criterion: Both bundle copies are identical for changed files, links and the
      documentation hierarchy are valid, Go tests pass and the website builds.
    integration: true
evidence:
  - criterion: one-procedure
    method: Search of fenced blocks, request text and setup rule in both bundle copies.
    result: passed
    source: docs/artifacts/artifact-driven/changes/change-adoption-guidance/tasks/02-validation.md#evidence
  - criterion: release-selection
    method: Live runs of the Linux script and of the PowerShell script (pwsh 7.6.6) with empty, chosen and invalid tags.
    result: passed
    source: docs/artifacts/artifact-driven/changes/change-adoption-guidance/tasks/02-validation.md#evidence
  - criterion: next-steps
    method: Contract review of After Adoption and the link check.
    result: passed
    source: docs/artifacts/artifact-driven/changes/change-adoption-guidance/tasks/02-validation.md#evidence
  - criterion: integration
    method: Bundle diff, link and hierarchy check, Go tests and vet, website build and validate-knowledge.
    result: passed
    source: docs/artifacts/artifact-driven/changes/change-adoption-guidance/tasks/02-validation.md#evidence
---

# Improve the ADD adoption guidance

## Included scope

Make the adoption guide the single procedure for download, verification and se-adopt use; remove the copies from the end-user guidelines; replace the fixed release tag with tag selection; and add ordered next steps after adoption. Apply the edits to docs/artifact-driven and src/archs/artifact-driven.

## Excluded scope

se-adopt code and behavior, an upgrade procedure, a new release tag, renamed files, the story-driven guide and Artifact Plane.

## Validation evidence

All four criteria passed on 18 October 2026. The check details are in the [validation task evidence](../../artifact-driven/changes/change-adoption-guidance/tasks/02-validation.md#evidence). Windows PowerShell 5.1 was reviewed statically only.
