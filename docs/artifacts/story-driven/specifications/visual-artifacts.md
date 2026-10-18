---
self_check:
  result: passed
  source: docs/artifacts/story-driven/specifications/visual-artifacts.md#specification-self-check
---

# Visual representations of the Story-Driven knowledge

Governs VS1 and VS2 in [requirements/visual-artifacts.md](../requirements/visual-artifacts.md). Each representation follows the visual representation guide of ADD 2.7.0. The row specifications were checked against the files at 5d7935a.

## Decisions

| Element | Section | Representation | Size | Mode |
| --- | --- | --- | --- | --- |
| specifications/framework.md | Knowledge contract | Table of core domain, shared or conditional, applies when | 8 rows | Replace |
| specifications/framework.md | Dependency and change behavior | Directed graph from informing domain to informed domain | 8 nodes, 11 edges, 2 gaps | Summarize |

The graph draws the two edges into Game Design from "Game Design reconciles applicable actions with Setting and Narrative". "Narrative uses relevant shared rules" and the "fiction" inputs of Art and Level name no domain, so they are gaps in the text and are not drawn. No correction is needed.

## Validation

Each task records, per representation: the fact list, the count check, and for replace mode a mapping from every replaced sentence to a cell or to retained text. A comparison of the old and new section text confirms that no fact, condition, limit or exception is lost. Diagrams follow authoring rules 1 to 8 of the guide; each renders on GitHub-compatible Mermaid and in the Plane. Headings stay unchanged, and every relative link and anchor of the changed files resolves. validate-knowledge reports no error.

## Row specifications

### story-driven/specifications/framework.md — Knowledge contract

1. **Decision:** confirm (columns fixed by VS1).
2. **Form:** table `Core domain | Shared or conditional | Applies when`, 8 rows in source order: Creative Direction, World Foundation, Setting Rules, Lore Foundation, Narrative Foundation (Shared | —); Game Design Foundation (Conditional | games); Art Direction (Conditional | visual work needs it); Level Design Foundation (Conditional | spatial or encounter design needs it). The text states no condition for the five shared domains; write "—" and say in the introduction that the section names a condition only for the last three.
3. **Mode:** replace in paragraph 1 (line 5): the domain list after "The bundle defines eight Core domains" and the sentence "The first five are shared; Game Design applies to games, Art when visual work needs it, and Level Design when spatial/encounter design needs it." All names, their order, shared or conditional, and each condition map to cells.
4. **Placement:** after the kept introduction "The bundle defines eight Core domains." Then the table, then "Narrative owns prose conventions and applicable interactive delivery conventions." and paragraph 2 unchanged.
5. **Defect dependency:** none.
6. **Anchors:** keep `## Knowledge contract` and all headings. No inbound anchor links found.
7. **Stays in text:** Narrative ownership of prose and interactive delivery conventions; paragraphs 2–4 (Content families and ownership, guide and record declarations, work skeletons).

### story-driven/specifications/framework.md — Dependency and change behavior

1. **Decision:** confirm, with labelled edges for the two reconciliation relations.
2. **Form:** Mermaid `flowchart` with accTitle and accDescr. Arrow meaning, stated once: the domain at the start supplies input to the domain at the end; an unlabelled arrow means "informs", the label "reconciles with" means that Game Design reconciles its applicable actions with that domain.
   - Nodes (8), labels as the Knowledge contract names them: Creative Direction, World Foundation, Setting Rules, Lore Foundation, Narrative Foundation, Game Design Foundation, Art Direction, Level Design Foundation.
   - Edges (11): Creative Direction to each of the other seven ("Creative Direction informs all domains", 7); World Foundation to Setting Rules and Setting Rules to Lore Foundation ("World informs Setting, which informs Lore", 2); Setting Rules to Game Design Foundation and Narrative Foundation to Game Design Foundation, label "reconciles with" ("Game Design reconciles applicable actions with Setting and Narrative", 2). The direction of the last two is a reading of "reconciles ... with"; if the coordinator rejects that reading, move them to the gap list (then 9 edges, 3 gaps).
   - Gaps, listed after the source line and not drawn (2): "Narrative uses relevant shared rules" (the supplying shared domains are not named); "Art and Level use relevant narrative, fiction and gameplay inputs" (the supplying domains are not named).
   - Excluded: cross-references and feedback ("not execution edges"); the conflict return to the Core owner (paragraph 2).
   Source line: `Source: story-driven:specifications/framework.md, Knowledge contract (domain names) and Dependency and change behavior paragraph 1; derived one node per Core domain and one edge per stated informs or reconciles relation; current snapshot.`
3. **Mode:** summarize. Paragraph 1 stays; it states every drawn fact.
4. **Placement:** after paragraph 1 ("Prerequisites mean sufficiently defined applicable contracts, ..."), before "Objective truth, testimony, character belief, ...".
5. **Defect dependency:** none.
6. **Anchors:** keep `## Dependency and change behavior` and all headings. No inbound anchor links found.
7. **Stays in text:** meaning of prerequisites (sufficiently defined applicable contracts); cross-references and feedback are not execution edges; the two vague relations (as gaps); provisional concepts and final content prerequisites; all of paragraph 2.

## Specification self-check

VS1 maps to Decisions and the row specifications, VS2 to Validation. KISS: one table and one graph. STE: gaps are named, not drawn. No Specification blocker prevents Plan.
