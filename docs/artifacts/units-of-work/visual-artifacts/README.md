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
evidence:
  - criterion: representations
    method: Row-by-row check of the 29 kept candidates against their row specifications, with sentence-to-cell mappings and count checks.
    result: passed
    source: docs/artifacts/units-of-work/visual-artifacts/README.md#combined-checks
  - criterion: corrections
    method: Review of the D3, D8 and inspector-clause corrections against knowledge-layout.md and the current workbench contract.
    result: passed
    source: docs/artifacts/artifact-driven/changes/change-visual-artifacts/tasks/01-representations.md#evidence
  - criterion: plane-rendering
    method: CSP check, diagram browser tests at 1440 and 390 pixels and the renderer-load failure test.
    result: passed
    source: docs/artifacts/artifact-plane/changes/change-visual-artifacts/tasks/01-renderer.md#evidence
  - criterion: preservation
    method: Record diff against main, heading comparison per file and the replaced-text comparisons.
    result: passed
    source: docs/artifacts/units-of-work/visual-artifacts/README.md#combined-checks
  - criterion: integration
    method: Real-knowledge rendering in the Plane, Plane unit and browser suites, build, Go tests, link check and validate-knowledge.
    result: passed
    source: docs/artifacts/units-of-work/visual-artifacts/README.md#combined-checks
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

Implementation ran on 18 October 2026 after explicit approval of the three plans. Task details are in the originating tasks; this section records the combined result.

## Combined checks

Executed on branch claude/visual-artifacts at a08810a, rebased on main 3c317fd (ADD 2.8.0, Artifact Plane 1.18.1, Story-Driven 1.1.0).

- Representations: 29 of the 36 high- and medium-priority candidates are in place as 24 tables, 3 listings and 5 diagrams in 21 specifications; the 7 rejected candidates and their reasons are in the artifact-plane representation contract. The GitHub-flavored Markdown lexer finds the expected table and fence counts in every changed file, and each replace row has a sentence-to-cell mapping in its task evidence.
- Preservation: `git diff main` changes no established version record or retained change outside change-visual-artifacts; every heading of the changed specifications is unchanged; the only rule-text changes are the corrections D3 (with its extension to the shared evidence sentence), D8 and the inspector clause. Defects outside drawn passages stay recorded in the survey.
- Integration: every Mermaid block of the changed knowledge renders in the Plane document page at 1440 and 390 pixels with its title and description and no note, checked on a disposable clone. Plane `npm test` (365 tests, 364 passed, 1 skipped), the browser suite (105 passed) and `npm run build` pass; `go vet ./...` and `go test ./...` pass; 335 relative links and anchors under docs/artifacts resolve; validate-knowledge reports 0 errors and the existing info diagnostic retained-legacy-change.
- Rebase: Artifact Plane 1.18.1 landed on main during Implementation and amended project-tabs.md and explorer.md. The tab diagram was rechecked: page visibility adds no tab state, so its states and transitions are unchanged.
- Proposed versions: artifact-driven 2.8.1 and story-driven 1.1.1 (patch: presentation and defect corrections), artifact-plane 1.19.0 (minor: diagram rendering). They establish when the PR lands on main.
