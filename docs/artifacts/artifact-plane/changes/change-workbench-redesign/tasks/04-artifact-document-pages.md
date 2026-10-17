---
id: artifact-document-pages
depends_on: [style-and-shell]
evidence_records: []
---

# Artifact and document pages

## Scope and ownership

Own apps/artifact-plane/src/pages/ArtifactPage.jsx and DocumentPage.jsx with their forms.

## Governing knowledge

specifications/authoring-workbench.md, sections Artifact page, Document page and Labels.

## Prerequisites

Task style-and-shell.

## Definition of Done

- [ ] The artifact page shows the title once, version and dependency subtitle with Edit, Show dependencies with the inline graph and edge explanations, the purpose lead without the README heading, and the open-change notice or Start a change.
- [ ] Requirements, Specifications, Decisions and Flows sections list 5 documents by title with badges, expand with Show all N, and offer "+ New <kind>" only for an open change on an editable branch; Versions lists newest first; legacy artifacts offer Migrate.
- [ ] The document page shows the eyebrow, title once, Edit, the body without its first heading, and the properties column (kind, branch state with Compare with main, self-check, references with Fix and Add, used by, file, front matter editor, delete), which becomes a disclosure at 1100 pixels and below.
- [ ] Edit mode has Write and Preview, Save, Cancel and Ctrl+S; the conflict dialog, unsaved protection and refresh behavior of 1.16.0 still pass their tests.
- [ ] Screenshots at 1440 and 390 pixels match the Artifact and Document mockups.

## Evidence
