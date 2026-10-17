---
id: document-editing
depends_on: [edit-interfaces, workbench-shell]
evidence_records: []
---

# Document editing

## Scope and ownership

Own the document page: breadcrumb, status since main, properties strip (references with Add and Remove, self-check with Record, declared models), body rendering with the existing Markdown and navigation, the editor with Preview, Save, Discard and Ctrl+S, conflict handling with Reload and Overwrite, Compare with main, the advanced front-matter editor, undo actions and refresh behavior for unsaved text.

## Governing knowledge

specifications/authoring-workbench.md, sections Pages (document), Feedback and states; specifications/knowledge-editing.md operations document.save, document.properties.set, reference.add, reference.remove, selfcheck.record and undo.

## Prerequisites

Tasks edit-interfaces and workbench-shell.

## Definition of Done

- [ ] Edit, Save and Discard work with the loaded digest; a conflicting save shows both versions with Reload and Overwrite; Overwrite repeats with the current digest; a repository refresh keeps editor text and marks the document changed on disk.
- [ ] Add reference opens a picker over artifacts and their documents and records the reason; Remove and Record self-check apply their operations; properties show resolved and unresolved targets with a Fix action for unresolved references.
- [ ] The advanced front-matter editor validates through document.properties.set and shows field diagnostics inline.
- [ ] Applied operations show Undo while valid; navigation away from unsaved text asks for confirmation; status messages are announced.
- [ ] Browser tests cover editing, conflict, reference, self-check, undo, keyboard use and the 390 and 1440 widths; fixture bytes outside the edited targets are unchanged.

## Evidence

Implementation has not started.
