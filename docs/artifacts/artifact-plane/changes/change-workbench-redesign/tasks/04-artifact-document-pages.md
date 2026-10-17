---
id: artifact-document-pages
depends_on: [style-and-shell]
evidence_records:
  - id: artifact-document-review
    method: Page build and screenshot comparison with the Artifact and Document mockups
    result: passed
    source: docs/artifacts/artifact-plane/changes/change-workbench-redesign/tasks/04-artifact-document-pages.md#artifact-document-review
  - id: artifact-document-suite
    method: npx playwright test test/browser/artifact-document.spec.js
    result: passed
    source: docs/artifacts/artifact-plane/changes/change-workbench-redesign/tasks/04-artifact-document-pages.md#artifact-document-suite
---

# Artifact and document pages

## Scope and ownership

Own apps/artifact-plane/src/pages/ArtifactPage.jsx and DocumentPage.jsx with their forms.

## Governing knowledge

specifications/authoring-workbench.md, sections Artifact page, Document page and Labels.

## Prerequisites

Task style-and-shell.

## Definition of Done

- [x] The artifact page shows the title once, version and dependency subtitle with Edit, Show dependencies with the inline graph and edge explanations, the purpose lead without the README heading, and the open-change notice or Start a change.
- [x] Requirements, Specifications, Decisions and Flows sections list 5 documents by title with badges, expand with Show all N, and offer "+ New <kind>" only for an open change on an editable branch; Versions lists newest first; legacy artifacts offer Migrate.
- [x] The document page shows the eyebrow, title once, Edit, the body without its first heading, and the properties column (kind, branch state with Compare with main, self-check, references with Fix and Add, used by, file, front matter editor, delete), which becomes a disclosure at 1100 pixels and below.
- [x] Edit mode has Write and Preview, Save, Cancel and Ctrl+S; the conflict dialog, unsaved protection and refresh behavior of 1.16.0 still pass their tests.
- [x] Screenshots at 1440 and 390 pixels match the Artifact and Document mockups.

## Evidence

### artifact-document-review

Checked on a disposable clone at 390, 700, 851 and 1440 pixels: 0 pixels of overflow and no page errors. The coordinator compared the screenshots with the Artifact and Document mockups. The checks covered:
- the artifact title once, the subtitle with dependency Edit and a refused cycle, Show dependencies with the edge explanation, and the purpose lead;
- kind sections with Show all and "+ New <kind>", versions, and legacy Migrate;
- the document properties column, which becomes a disclosure at 1100 pixels and below;
- edit mode with Ctrl+S, a conflict dialog when the file changes on disk, the unsaved guard, references, self-check, front matter and delete.

Implementation: src/pages/ArtifactPage.jsx, ArtifactPageParts.jsx, DocumentPage.jsx, DocumentPageParts.jsx and their CSS.

### artifact-document-suite

`artifact-document.spec.js`: 13 of 13 passed in two runs. The suite found three gaps, now fixed:
- headings smaller than body text;
- no keyboard activation of graph edges;
- the artifact error notice never shown, because read diagnostics carry no severity.

The scenario suite added a one-click "Remove dependency on <artifact>".
