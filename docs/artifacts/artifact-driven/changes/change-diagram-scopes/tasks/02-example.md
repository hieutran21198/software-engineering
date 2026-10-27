---
id: example
depends_on: [guide]
covers:
  - element: requirements/diagram-scopes.md
    ids: [DS16, ADS4]
---

# AWS example page

## Scope and ownership

Implementer. Create docs/artifact-driven/06-guidelines/diagram-scopes-example.md as the [AWS example](../../../specifications/diagram-scopes.md#aws-example) of the contract states. The coordinator's render drafts for the mockups can seed the diagrams; the facts come first, as stated sentences, tables and lists on the page.

## Definition of Done

- [x] The page is invented and self-contained. It names no file, account or person of this repository.
- [x] It states the facts of the four invented artifacts and of the flow `ordering:place-order`, and the system view document declares `system_view: true` in its described front matter.
- [x] It has the seven views of the contract table. Each view has an introduction with its arrow meaning, `accTitle`, `accDescr` and a source line, or the `Illustrative:` label for the fallback sample.
- [x] Each system view has its owner table. The artifact views link to the system view document and to the flow record.
- [x] The system context is the overview and the logical architecture is its detail; the text and the source lines say so.
- [x] The views use only icons of the set, except one name outside the set in the fallback sample. The fallback sample has one label longer than 40 characters.
- [x] A recorded check compares the nodes and edges of each view with its fact list or owner table and finds no extra, missing or reversed element.
- [x] Every view renders with Mermaid 11.17.2 under the Plane configuration, with and without the icon packs. Screenshots are recorded.

## Evidence

Commit 04e12d7 on branch claude/diagram-scopes-add implements the task. The coordinator performed it in the implementer role.

| DoD item | Check | Result | Source |
| --- | --- | --- | --- |
| Self-contained | Read the page for names of this repository | It names invented artifacts, an invented account and invented documents only | docs/artifact-driven/06-guidelines/diagram-scopes-example.md |
| Stated facts | Read the facts and the front matter sample | Four artifacts, the flow `ordering:place-order` and `system_view: true` are stated | same page |
| Seven views | Read each view block | Each has an introduction with its arrow meaning, `accTitle`, `accDescr` and a source line; the fallback sample has `Illustrative:` | same page |
| Owner tables and links | Read the system views and the ordering views | Three owner tables; the ordering section links to the system overview and the flow record | same page |
| Overview and detail | Read the text and the source lines | The context is the overview; the logical architecture source line names it as its detail | same page |
| Icons and long label | Script over the blocks | Every icon name is in the set except `logos:aws-bedrock` in the fallback sample; its long label has 57 characters | same page |
| Count check | Script that counts nodes, edges, participants, messages, states, transitions, entities, relationships and attributes per block, compared with the fact lists and tables | Context 4/3; logical architecture 8/8; deployment 10/10 with 2 boxes; sequence 5 participants and 9 messages for 8 facts, fact 6 has two messages; state 5 states and 8 transitions for 5 rows and 3 final statuses; data model 3 entities, 2 relationships, 14 attributes. No extra, missing or reversed element | this task |
| Render with and without packs | Chromium render of all seven blocks with Mermaid 11.17.2, `securityLevel: strict`, `htmlLabels: false`, the Plane SVG sanitizer and CSP, once with the `logos` AWS and `lucide` subsets registered and once without | All seven render in both cases, with title and description; no request to another origin; screenshots kept outside the repository | this task |
