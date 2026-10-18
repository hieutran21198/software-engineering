---
id: validation
depends_on: [foundation, guideline, role-skills, worked-examples]
evidence_records: []
---

# Validate the combined change

## Scope and ownership

Coordinator. Repository: this repository. Read-only checks over both bundle copies, the Go module, the website and the project knowledge. Fixes for failed checks return to the owning task.

## Governing knowledge

V10 and AV1 to AV6 in requirements/visual-knowledge.md; the consistency and checks section of specifications/visual-knowledge.md; the acceptance criteria of the visual-knowledge unit brief.

## Prerequisites

Tasks foundation, guideline, role-skills and worked-examples meet their DoD. Explicit user approval of this plan.

## Definition of Done

- [ ] AV1: every source entry of the foundation page carries a DOI or URL, and a resolution check of the DOIs and URLs is recorded with its date and any unreachable entry.
- [ ] AV2: the agent procedure is applied to artifact-plane:specifications/knowledge-editing.md without further clarification; the decision of each step and its reasons are recorded here.
- [ ] AV3: on the built website, every Mermaid block of the bundle renders to an SVG without an error message, checked with a browser script; the count checks of task worked-examples are confirmed.
- [ ] AV4: a review confirms that the changed pages add no phase, state registry or approval field and change no ownership, versioning, dependency or flow rule; the four skills contain the Representations section.
- [ ] AV5: the Artifact Plane directions are a section of the contract labelled as directions, and `git diff --stat main -- apps` is empty.
- [ ] AV6: `diff -rq docs/artifact-driven src/archs/artifact-driven` lists only the Go files and required-skills; every relative link in both copies resolves and no child page links to an ancestor; `go test ./...` and `go vet ./...` pass; the website build passes; validate-knowledge reports 0 errors.

## Evidence

Implementation has not started.
