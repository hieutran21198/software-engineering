---
id: validation
depends_on: [foundation, guideline, role-skills, worked-examples]
evidence_records:
  - id: dod
    method: AV1 to AV6 with source resolution, agent procedure dry run, browser render check, scope review, parity, link, Go, website and validate-knowledge checks.
    result: passed
    source: docs/artifacts/artifact-driven/changes/change-visual-knowledge/tasks/05-validation.md#evidence
---

# Validate the combined change

## Scope and ownership

Coordinator. Repository: this repository. Read-only checks over both bundle copies, the Go module, the website and the project knowledge. Fixes for failed checks return to the owning task.

## Governing knowledge

V10 and AV1 to AV6 in requirements/visual-knowledge.md; the consistency and checks section of specifications/visual-knowledge.md; the acceptance criteria of the visual-knowledge unit brief.

## Prerequisites

Tasks foundation, guideline, role-skills and worked-examples meet their DoD. Explicit user approval of this plan.

## Definition of Done

- [x] AV1: every source entry of the foundation page carries a DOI or URL, and a resolution check of the DOIs and URLs is recorded with its date and any unreachable entry.
- [x] AV2: the agent procedure is applied to artifact-plane:specifications/knowledge-editing.md without further clarification; the decision of each step and its reasons are recorded here.
- [x] AV3: on the built website, every Mermaid block of the bundle renders to an SVG without an error message, checked with a browser script; the count checks of task worked-examples are confirmed.
- [x] AV4: a review confirms that the changed pages add no phase, state registry or approval field and change no ownership, versioning, dependency or flow rule; the four skills contain the Representations section.
- [x] AV5: the Artifact Plane directions are a section of the contract labelled as directions, and `git diff --stat main -- apps` is empty.
- [x] AV6: `diff -rq docs/artifact-driven src/archs/artifact-driven` lists only the Go files and required-skills; every relative link in both copies resolves and no child page links to an ancestor; `go test ./...` and `go vet ./...` pass; the website build passes; validate-knowledge reports 0 errors.

## Evidence

Executed on 18 October 2026 on branch claude/visual-knowledge after the user approved the plan.

- AV1: all 46 source entries carry a DOI or URL. On 18 October 2026, the 36 DOIs resolved through the Crossref works API and the 10 URLs returned 200. The first run found one unreachable URL (the publisher page of Johnson-Laird 1983, 404); it was replaced with a library catalog record, and the second run found no unresolved entry.
- AV2: dry run of the agent procedure on artifact-plane:specifications/knowledge-editing.md, without further clarification. (1) Stated relationships: an ordered processing sequence among caller, service, scan, readers and writer; outcomes 422, 409 and dry run; 32 operations with inputs, files and checks; seven HTTP status codes; five element references; the journal and undo rules. (2) Difficulty: the processing order spreads across the Operation service, Validation and Writer sections; the status codes are one long sentence. (3) Decision: a sequence diagram for the write path is justified; the operations table already holds its facts, so it stays; the references are explained by the derived reference view, so no embedded diagram is required in the contract; the status codes could become a table, but the sentence holds seven items with one relation, so prose stays. (4) Selection: sequence diagram, segmented into two because there are more than ten messages. (5) to (8) Fact list, notation, introduction and source line as in example E3. (9) Validation: 9 and 7 messages counted against the sections, the journal module shown as a gap, both diagrams render. (10) Maintenance: regenerate when the Processing sentence, the validation rule or the writer rules change.
- AV3: on the built website, a Chromium script found 1 rendered SVG on the guideline and 8 on the examples page, equal to the fenced blocks, each with an SVG title and description, no error SVG and no page error. The first run rendered 7 of 8: a semicolon in a sequence message ended the statement. The label was fixed and rule 1 amended. Screenshots were reviewed; one state diagram was changed to left-to-right layout because two labels overlapped. The examples page has no horizontal scroll at 390 px. The count checks of task worked-examples pass.
- AV4: review of `git diff main -- docs/artifact-driven`: the new sections run inside existing self-checks and add no phase, state registry, approval field or review step; ownership, versioning, dependency and flow rules are unchanged. The four skills have the Representations section.
- AV5: the Artifact Plane directions R1 to R8 are a section of the contract, labelled as not implemented, required or approved. `git diff --stat main -- apps` is empty.
- AV6: `diff -rq docs/artifact-driven src/archs/artifact-driven` lists only bundle.go, bundle_test.go and required-skills. The link check covered 276 links in both copies: the new links resolve and no page links to an ancestor; the only problems are 8 template links in minimal-change.md that main also reports. `go vet ./...` and `go test ./...` pass, including the bundle fidelity test. `npm ci` and `npm run build` in website pass. validate-knowledge reports 0 errors and 1 existing info diagnostic (retained legacy change record in artifact-plane).
