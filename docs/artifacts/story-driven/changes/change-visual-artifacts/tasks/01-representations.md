---
id: representations
depends_on: []
evidence_records:
  - id: dod
    method: Sentence-to-cell mapping, graph count check, Mermaid parse and Plane rendering at 1440 and 390 pixels.
    result: passed
    source: docs/artifacts/story-driven/changes/change-visual-artifacts/tasks/01-representations.md#evidence
---

# Add the core domain table and the domain graph

## Scope and ownership

Coordinator, as implementer. Repository: this repository. File: docs/artifacts/story-driven/specifications/framework.md. No other file changes.

## Governing knowledge

VS1 and VS2 in requirements/visual-artifacts.md; specifications/visual-artifacts.md; the visual representation guide of ADD.

## Prerequisites

Explicit user approval of this plan.

## Definition of Done

- [x] The Knowledge contract section has the core domain table in replace mode, and the evidence maps every replaced sentence to a cell or to retained text.
- [x] The Dependency and change behavior section has the graph after its paragraph, with an introduction, accTitle, accDescr, a source line and the two gaps in the text; a count check against the fact list gives 8 nodes and 11 edges.
- [x] The graph renders in the Artifact Plane document page and parses with Mermaid 11.17.2; headings are unchanged; links resolve; validate-knowledge reports no error.

## Evidence

Executed on 18 October 2026 on branch claude/visual-artifacts after the user approved the plan. The worker commit on branch claude/va-know-add was integrated as f21fda9.

### Story-Driven: story-driven/specifications/framework.md

#### Knowledge contract, core domain table

Form: table Core domain | Shared or conditional | Applies when, 8 rows in source order. Mode: replace in paragraph 1. Placement: after "The bundle defines eight Core domains."; introduction; table; source line; "Narrative owns prose conventions and applicable interactive delivery conventions."; paragraphs 2 to 4 unchanged.

| Removed text | Carried by |
| --- | --- |
| Domain list after "eight Core domains": "Creative Direction, World Foundation, Setting Rules, Lore Foundation, Narrative Foundation, Game Design Foundation, Art Direction, and Level Design Foundation." | Core domain column, rows 1 to 8, same order |
| "The first five are shared;" | Rows 1 to 5 "Shared", Applies when "—"; introduction says the section names a condition only for the last three |
| "Game Design applies to games," | Row 6 "Conditional / games" |
| "Art when visual work needs it," | Row 7 "Conditional / visual work needs it" |
| "and Level Design when spatial/encounter design needs it." | Row 8 "Conditional / spatial or encounter design needs it" |

#### Dependency and change behavior, domain graph

Form: Mermaid flowchart LR with accTitle and accDescr. Mode: summarize; paragraph 1 stays. Placement: after paragraph 1, before "Objective truth, testimony, ...". Arrow meaning stated once in the introduction. Labels are the domain names of the Knowledge contract. No HTML, no init directive, no click, no semicolon in any label or in accDescr.

Fact list:

- Nodes (8): Creative Direction, World Foundation, Setting Rules, Lore Foundation, Narrative Foundation, Game Design Foundation, Art Direction, Level Design Foundation (Knowledge contract).
- Edges (11):
  1 to 7. Creative Direction to World Foundation, Setting Rules, Lore Foundation, Narrative Foundation, Game Design Foundation, Art Direction, Level Design Foundation ("Creative Direction informs all domains").
  8. World Foundation to Setting Rules; 9. Setting Rules to Lore Foundation ("World informs Setting, which informs Lore").
  10. Setting Rules to Game Design Foundation, label "reconciles with"; 11. Narrative Foundation to Game Design Foundation, label "reconciles with" ("Game Design reconciles applicable actions with Setting and Narrative").
- Gaps (2), listed in the text after the source line and not drawn: "Narrative uses relevant shared rules."; "Art and Level use relevant narrative, fiction and gameplay inputs."
- Excluded: cross-references and feedback (the introduction says so); the conflict return to the Core owner (paragraph 2).

Count check: Mermaid 11.17.2 (website/node_modules/mermaid, DOMPurify stubbed for Node) parses the block as flowchart-v2 with 8 vertices and 11 edges; every edge equals the fact list in direction and label; accTitle "Core domain relations of Story-Driven"; accDescr states the same 11 relations. Facts 8 nodes, 11 edges, 2 gaps.

Plane rendering: not checked here. The Plane source in this worktree has no Mermaid renderer (no "mermaid" in apps/artifact-plane/src or package.json); marked 18.1.1 renders the block as a code block labelled mermaid with the introduction, source line and gap list readable.

### Rendering

A browser check on a disposable clone of this repository at 65d5df9 opened framework.md in the Plane document page at 1440 and 390 pixels: one SVG with the title "Core domain relations of Story-Driven" and a description, no fallback note, no horizontal page scroll. The graph is 1,093 pixels wide; at 1440 it shrinks to 820 pixels and scrolls inside its figure in the 720-pixel column. Links resolve; validate-knowledge reports 0 errors.
