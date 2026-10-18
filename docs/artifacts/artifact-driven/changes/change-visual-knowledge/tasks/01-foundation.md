---
id: foundation
depends_on: []
evidence_records:
  - id: dod
    method: Review of the foundation page, the principle and the contents entry against the contract, link check and byte comparison of both bundle copies.
    result: passed
    source: docs/artifacts/artifact-driven/changes/change-visual-knowledge/tasks/01-foundation.md#evidence
---

# Write the foundation page and the new principle

## Scope and ownership

Coordinator, as implementer. Repository: this repository. Files, each in docs/artifact-driven and then copied to src/archs/artifact-driven:

- 01-foundation/visual-knowledge.md (new)
- 01-foundation/principles.md
- 01-foundation/README.md

No other file changes in this task.

## Governing knowledge

V1 and AV1 in requirements/visual-knowledge.md; the research basis, the principles and the page ownership sections of specifications/visual-knowledge.md; decisions/013-text-defined-representations.md.

## Prerequisites

Explicit user approval of this plan. No upstream artifact is required.

## Definition of Done

- [x] visual-knowledge.md states principles P1 to P6 with their basis and limits, the finding table with the status of each finding, the hypothesis assessment, the research limits and the source list of the contract with a DOI or URL per entry. Hypotheses and recommendations are labelled as such.
- [x] principles.md has the new principle "Present Knowledge in the Form That Fits It" in two sentences with a link to the new page, and 01-foundation/README.md lists the page as contents entry 4.
- [x] The new page links to the representation guideline and the examples and to no ancestor page; every relative link resolves.
- [x] Each changed file in src/archs/artifact-driven is byte-identical to its docs/artifact-driven source.

## Evidence

Executed on 18 October 2026 after the user approved the plan.

- 01-foundation/visual-knowledge.md states the terms, principles P1 to P6 with rule and basis, the recommendations labelled as design hypotheses, the 14 findings with status, sources and limit, the hypothesis assessment, the research limits and 46 sources. Finding 10 now also cites Hegarty 2011 and Tversky 2011, which were in the source list without a citation.
- Correction during implementation: three book entries had no DOI or URL. Mayer 2020 now has doi:10.1017/9781316941355, Norman 1983 the DOI of the 2014 Psychology Press reissue of the edited volume (doi:10.4324/9781315802725), and Johnson-Laird 1983 a library catalog record, because the publisher page returned 404. The arXiv entries carry their abs URLs. The contract source list is the same list.
- principles.md has "Present Knowledge in the Form That Fits It" in two sentences with the link, before Keep Complete, Recoverable Snapshots. 01-foundation/README.md lists the page as entry 4.
- The page links to artifact-model.md (records and identities), the guideline and the examples. The link check resolves every link and finds no ancestor link.
- `diff -rq docs/artifact-driven src/archs/artifact-driven` lists only bundle.go, bundle_test.go and required-skills.
