---
self_check:
  result: passed
  source: docs/artifacts/artifact-plane/specifications/diagram-scopes.md#specification-self-check
references:
  - artifact: artifact-driven
    element: specifications/diagram-scopes.md
    requires: The system_view declaration, the curated icon set with its
      prefixes, names and licenses, the recommended notations and the reader
      support table.
claims:
  - id: server-side-index
    kind: decision
    statement: The server derives the diagram metadata of each working element
      while it builds the overview section, because the browser receives the
      elements without their Markdown.
    status: supported
    basis: static
    evidence:
      - docs/artifacts/artifact-plane/specifications/diagram-scopes.md#design-facts
    check: Read stripBodies in server/repository-query.js and the overview request in src/main.jsx.
    rejected:
      - option: Read every document in the browser to find its diagrams.
        reason: An artifact page would read all its documents on each visit.
      - option: Add a POST /api/flows/query operation.
        reason: The flow index holds no document bodies and needs no new operation for metadata.
      - option: Derive the metadata in src/model.js.
        reason: The bundled validator shares src/model.js and must not gain a Markdown parser.
  - id: lazy-icon-chunk
    kind: assumption
    statement: Mermaid 11.17.2 calls an icon pack loader only when a diagram
      names an icon of that pack, so a page without icons loads no icon chunk.
    status: open
    basis: documented
    check: Record the network requests of a page with diagrams and no icon in the browser test.
    risk_if_wrong: DP7 fails; the icon chunk loads with every diagram page.
---

# Diagram scopes in the Plane

Governs DP1 to DP12 in [requirements/diagram-scopes.md](../requirements/diagram-scopes.md). It consumes the ADD [diagram scopes contract](../../artifact-driven/specifications/diagram-scopes.md), established in ADD 3.4.0 (#62). It amends the [diagram rendering contract](diagram-rendering.md) for icons. The [mockups](#mockups) show the changed pages.

## Diagram index

A new server module, server/diagram-index.js, derives two fields for each element of the working knowledge of an in-place artifact. The overview section of POST /api/repository/query adds them to the element records before it removes the Markdown bodies. A field is present only when it has a value, so the records of other elements do not change.

| Field | Value | Rule |
| --- | --- | --- |
| `systemView` | `true` | The front matter has `system_view: true` (a YAML boolean), and the element path does not start with `specifications/flows/`. |
| `diagrams` | List of diagram records, in document order | Present when the element has at least one diagram block. |

The module finds diagram blocks with the marked lexer that src/Markdown.jsx uses, on the text without front matter. It walks the tokens in document order with `marked.walkTokens`. A diagram block is a code token whose info string has `mermaid` as its first word. Its position in this order is its index, and the index equals the `data-diagram-index` of the figure that src/Markdown.jsx renders.

| Diagram record field | Rule |
| --- | --- |
| `index` | The position of the block among the diagram blocks of the document, from 0. |
| `type` | The first word of the first line that is not empty and does not start with `%%`. |
| `title` | The text after `accTitle:` in the block, trimmed to 120 characters, or null. |
| `heading` | The text of the last heading before the block, or null. |
| `source` | `{kind, text}` when the next paragraph after the block starts with `Source:` (kind `source`) or `Illustrative:` (kind `illustrative`); text is the paragraph, trimmed to 300 characters. Otherwise null. |
| `stale` | The text of the first paragraph that starts with `Stale:` among the two paragraphs after the block, trimmed to 300 characters, or null. |

The index is navigation metadata. It creates no relationship, no diagnostic and no graph edge. Embedded diagrams stay presentation; front matter stays the only structural source. Flow records keep their diagrams in the index, so their diagrams appear in the artifact list. The HTTP response gains these optional fields; MCP tools, context packets and the bundled validator do not change.

## Home page

The Current work page adds a System section before the Dependencies section when at least one element has `systemView`. The section is absent otherwise.

- The title is "System", and the summary is the number of system view documents.
- A muted line says: "Views of the whole system. Their tables link to the artifacts that own each part."
- Each item shows the document title and, below it, the owning artifact title and the number of diagrams ("3 diagrams", "1 diagram" or "No diagram").
- Items are ordered by artifact title, then by document path.
- An item opens the document page of its document.

The document page already shows the owning artifact and resolves knowledge links to other artifacts, so the owner table of a system view navigates to the owning artifacts (DP2). Implementation confirms this in the browser test.

## Artifact page

The artifact page adds a Diagrams section after the Flows section when the artifact has at least one diagram in its working knowledge. The section is absent otherwise.

- The title is "Diagrams", and the summary is the number of diagrams.
- Each item shows three lines. The first line is the diagram title, or "<type label> diagram" when the block has no `accTitle`. The second line is "<type label> · <document title> › <heading>", without the heading part when the heading is null. The third line is the source text, or "Illustrative" for an illustrative label, or "No source line".
- An item with a `stale` value shows a "Stale" badge; the badge title is the stale text.
- Items follow the element order of the page, then the index. The section shows five items and a "Show all N" control, as the other sections do.
- An item opens the document page at its diagram.

| `type` | Type label |
| --- | --- |
| `flowchart`, `graph` | Flowchart |
| `sequenceDiagram` | Sequence |
| `stateDiagram`, `stateDiagram-v2` | State |
| `erDiagram` | Data model |
| `classDiagram` | Class |
| `architecture-beta`, `architecture` | Architecture |
| other | The type as written |

When the repository has system view documents, the line under the purpose adds a link after "Read the overview": "System view: <title>" for one document, or "System views:" and one link for each document. The line is unchanged otherwise. The sidebar does not change.

## Document focus

The document page state accepts an optional `diagram`, a nonnegative integer. When it is present, the Markdown component scrolls the figure with that index into view after its diagram renders or fails, and moves the focus to the figure. The figure then has `tabindex="-1"` and the label "Diagram <index + 1>: <title or type label>". When no figure has the index, the page opens at the top. Browser Back returns to the artifact page through the existing history entry.

## Icons

This section amends step 3 of the rendering rules in [diagram-rendering.md](diagram-rendering.md).

1. `@iconify-json/logos` 1.2.18 and `@iconify-json/lucide` 1.2.147 are exact development dependencies.
2. A new file, vite.config.js, adds a Vite plugin that resolves the module `virtual:diagram-icons` at build time. The module exports one Iconify JSON object for each pack: every `logos` name that starts with `aws`, and the `lucide` names that src/diagram-icon-names.js lists. Each object keeps the `info` record of its pack. The `lucide` object also carries the ISC license notice of Lucide in a `notice` field.
3. The plugin stops the build when a listed `lucide` name is missing from the pinned pack, or when the `logos` subset does not have 65 names.
4. src/diagram-render.js registers the two packs once with `mermaid.registerIconPacks`. Each loader imports `virtual:diagram-icons`, so Vite puts the icons into their own chunk.
5. The SVG sanitizer does not change. The icon shapes are SVG paths and gradients with local references, which the existing profile keeps.
6. A name outside the set renders as Mermaid's unknown-icon mark with its label.

The Plane README lists the two packs with their versions, authors, licenses and URLs.

## Diagram types

The renderer configuration does not change for diagram types. The browser tests add a `flowchart` with icon shapes, a `flowchart TB` with nested subgraphs and `erDiagram` to the existing flowchart, sequence and state cases. A block that does not render keeps the code panel and the note.

## Fixture repository

The browser tests build a fixture repository from test/browser/fixtures/diagram-scopes/. It mirrors the AWS example of the ADD diagram scopes contract with the artifacts `platform`, `storefront`, `ordering` and `payments`. `platform` has specifications/system-overview.md with `system_view: true`, the three system views and their owner tables. `ordering` has the sequence, state and data model views and one `Stale:` line. One document has a block without a source line, one has an illustrative label, one names an icon outside the set, and one has a label of more than 60 characters. `payments` has no diagram.

## Validation

- Browser tests at 1440 and 390 pixels on the fixture repository: the System section and its item; the owner table links to `ordering` and `payments`; the Diagrams section of `ordering` with type, location, source text, illustrative label, "No source line" and the stale badge; an item opens the document with the figure in view and focused; Back returns to the artifact page; the System view link on the artifact page; no Diagrams section on `payments`.
- Browser tests for icons: icons of both packs render as SVG paths; the unknown icon shows the mark and its label; no request goes to another origin; a page with diagrams and no icon requests no icon chunk; no horizontal page scroll at 390 pixels; the existing diagram rendering cases still pass.
- Node tests for server/diagram-index.js: index order with diagrams in lists and quotes, type, title, heading, source, illustrative, stale, `system_view` values other than `true`, flow records, and agreement of the index with the figures of src/Markdown.jsx.
- A check on this repository: no System section; the artifact pages of artifact-plane and story-driven list their diagrams; artifact-driven and nix-packages show no Diagrams section.
- The owner looks at screenshots of the changed pages at 1440 and 390 pixels, and the Version task records the result.
- The test suite, the build, validate-knowledge and the Nix package build pass. Task evidence records the sizes of the renderer and icon chunks, and the Nix npm dependency hash.

## Flow supports

Add the element support `diagram-scopes-contract` for this document to the overview and inspect steps of repository-exploration. Add implementation and test supports for server/diagram-index.js and its tests when Implementation creates them. Steps and transitions do not change. source-retrieval reads documents through the renderer that this change extends; its existing `diagram-rendering-contract` support covers the change, so its record does not change.

## Mockups

The [mockup canvas](https://claude.ai/artifact/VNNNytcQLDKmyUncNMytAC) shows the home page with the System section, the artifact page with the Diagrams section and the System view link, the system view document with icons and owner tables, a document opened at a diagram, the artifact page at 390 pixels, and the icon fallback of readers without the packs. Its diagrams are Mermaid 11.17.2 renders under the Plane configuration and sanitizer. It is an illustration for plan approval; this contract is the authority.

## Design facts

These facts at revision b67824e decide the design:

- src/main.jsx loads the overview section of POST /api/repository/query, and `stripBodies` in server/repository-query.js removes the `markdown`, `readme` and `body` keys. The browser therefore has no element Markdown before it opens a document.
- src/Markdown.jsx numbers diagram blocks in the order in which marked renders code tokens, and the document page already scrolls to heading anchors.
- The Plane has no vite.config file and no third-party notice file.
- The `@iconify-json/lucide` package has no LICENSE file; its info.json names the ISC license and its URL.

## Specification self-check

DP1 maps to Home page; DP2 to Home page and Validation; DP3 to Diagram index and Artifact page; DP4 to Document focus; DP5 to Artifact page; DP6 to Home page and Artifact page; DP7 to DP9 to Icons; DP10 to Diagram types; DP11 to Validation and the existing rendering rules; DP12 to Diagram index and Unchanged behavior of the rendering contract. Impact: the overview response gains two optional element fields; WorkPage, ArtifactPage, DocumentPage, Markdown, the renderer and the build change; repository-exploration gains supports; source-retrieval is reached through the renderer and its record stays. Upstream: the plan waits until the ADD member establishes. Representations: this document uses tables only; the mockups are illustrations. KISS: one server module, one Vite plugin, two sections, one page parameter, no new page kind, endpoint or MCP tool. STE: each table row states one rule. Open claim: lazy-icon-chunk, checked first in the icon task. No Specification blocker prevents Plan.
