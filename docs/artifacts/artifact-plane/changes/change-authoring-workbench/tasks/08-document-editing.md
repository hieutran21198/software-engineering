---
id: document-editing
depends_on: [edit-interfaces, workbench-shell]
evidence_records:
  - id: document-browser-tests
    method: npm run test:browser
    result: passed
    source: docs/artifacts/artifact-plane/changes/change-authoring-workbench/tasks/08-document-editing.md#document-browser-tests
---

# Document editing

## Scope and ownership

Own the document page: breadcrumb, status since main, properties strip (references with Add and Remove, self-check with Record, declared models), body rendering with the existing Markdown and navigation, the editor with Preview, Save, Discard and Ctrl+S, conflict handling with Reload and Overwrite, Compare with main, the advanced front-matter editor, undo actions and refresh behavior for unsaved text.

## Governing knowledge

specifications/authoring-workbench.md, sections Pages (document), Feedback and states; specifications/knowledge-editing.md operations document.save, document.properties.set, reference.add, reference.remove, selfcheck.record and undo.

## Prerequisites

Tasks edit-interfaces and workbench-shell.

## Definition of Done

- [x] Edit, Save and Discard work with the loaded digest; a conflicting save shows both versions with Reload and Overwrite; Overwrite repeats with the current digest; a repository refresh keeps editor text and marks the document changed on disk.
- [x] Add reference opens a picker over artifacts and their documents and records the reason; Remove and Record self-check apply their operations; properties show resolved and unresolved targets with a Fix action for unresolved references.
- [x] The advanced front-matter editor validates through document.properties.set and shows field diagnostics inline.
- [x] Applied operations show Undo while valid; navigation away from unsaved text asks for confirmation; status messages are announced.
- [x] Browser tests cover editing, conflict, reference, self-check, undo, keyboard use and the 390 and 1440 widths; fixture bytes outside the edited targets are unchanged.

## Evidence

### document-browser-tests

Checked at commit 0c6ee0d: 102 of 102 browser tests passed. test/browser/document-editing.spec.js covers Edit, Save with Ctrl+S, Preview, Discard and Undo with front matter and other bytes unchanged; a concurrent edit that shows both versions with Reload and Overwrite; a refresh that keeps editor text; Add reference with the artifact and document pickers, Remove, Fix for an unresolved reference and Record self-check; the advanced front-matter editor with field diagnostics; the unsaved-navigation guard; and the 390 and 1440 pixel widths. The S7 scenario fixes a reference in 3 actions. The scenarios found two defects that are fixed: the editor now takes focus when a document opens in edit mode, and Fix preselects the reference's artifact and adds the new reference before it removes the old one. Implementation: src/pages/DocumentPage.jsx and src/editing.jsx.
