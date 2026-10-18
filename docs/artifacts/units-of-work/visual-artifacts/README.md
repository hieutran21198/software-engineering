---
unit_of_work: visual-artifacts
changes:
  - artifact: artifact-driven
    change: change-visual-artifacts
  - artifact: artifact-plane
    change: change-visual-artifacts
  - artifact: story-driven
    change: change-visual-artifacts
affected_flows:
  - artifact: artifact-plane
    flow: repository-exploration
    effect: modify
  - artifact: artifact-plane
    flow: source-retrieval
    effect: modify
flow_assessment: Surveyed all 117 requirement, specification, decision and flow
  files of the three artifacts at 3c47a48 and rechecked the merge at 89ed23a.
  Inspected the Plane Markdown component and its four page users, the website
  document scope and the flow records. Tables, listings and diagrams in working
  knowledge change no system behavior, so no ADD or story-driven flow changes.
  Rendering fenced Mermaid in Plane pages modifies the inspect step of
  repository-exploration and the read step of source-retrieval, which show
  documents through the shared Markdown component; both gain the support
  diagram-rendering-contract. knowledge-authoring and repository-refresh use the
  document page for editing and refresh, whose behavior does not change. The website is excluded because it publishes only the bundle and the
  repository overview, and retained changes and versions.
acceptance:
  - id: representations
    criterion: Each high- and medium-priority candidate of the survey is added
      under the representation guide, with a text alternative, a source line and
      a recorded check, or is rejected with a recorded reason.
  - id: corrections
    criterion: Each verified survey defect in a passage that a planned
      representation draws from is corrected before the representation is
      drawn; the other defects stay recorded in the survey.
  - id: plane-rendering
    criterion: Artifact Plane document pages render fenced Mermaid blocks with
      bundled code and no network access, through a sanitized SVG step that keeps
      the accessible title and description, and show the source panel when a
      block does not render.
  - id: preservation
    criterion: No requirement, rule, contract value or flow behavior changes
      except the recorded defect corrections; retained changes, versions and
      files that the survey keeps are unchanged.
  - id: integration
    criterion: validate-knowledge reports no error, every new diagram renders in
      the Plane and on GitHub-compatible Mermaid, the Plane tests and build pass,
      and every relative link resolves.
    integration: true
evidence: []
---

# Improve current artifacts with visual representations

## Purpose

Apply the [visual representation guide](../../../artifact-driven/06-guidelines/visual-representations.md) of ADD 2.7.0 to the existing working knowledge of artifact-driven, artifact-plane and story-driven, and make Artifact Plane show the resulting diagrams. The [survey](survey.md) holds the candidates, the keep decisions and the verified defects.

## Included scope

The high- and medium-priority candidates of the survey: 36 representations in 24 files. Corrections of verified defects in the passages these representations draw from. Mermaid rendering in Plane document pages, which is direction R1 of the visual knowledge contract. The version records of the three changes.

## Excluded scope

Low-priority candidates, which stay recorded in the survey. Defects in passages that no planned representation draws from. Retained changes, established version records and legacy snapshots. Image files, a diagram registry and a front matter schema. Plane directions R2 to R8. The documentation website.

## Decisions

The user decided on 18 October 2026: survey before the impact changes merged and open the changes afterward; cover all files and add a representation only where the guide selects one; include Plane Mermaid rendering; correct only the defects that a planned representation depends on; implement high- and medium-priority candidates.

## Validation evidence

No checks have run. Requirement, Specification and Plan are preparatory knowledge; implementation waits for explicit approval of the plan.
