---
id: knowledge-writer
depends_on: []
evidence_records:
  - id: writer-tests
    method: node --test test/knowledge-writer.test.js
    result: passed
    source: docs/artifacts/artifact-plane/changes/change-authoring-workbench/tasks/01-knowledge-writer.md#writer-tests
---

# Knowledge writer

## Scope and ownership

Own apps/artifact-plane/server/knowledge-writer.js and its tests. The module is the only code that writes inside an inspected repository.

## Governing knowledge

specifications/knowledge-editing.md, sections Two layers, one writer and Writer. ADD specifications/knowledge-layout.md for the records that must survive unchanged.

## Prerequisites

Explicit plan approval. No internal prerequisite.

## Definition of Done

- [x] Containment: paths outside docs/artifacts, through symbolic links, with .git, dot segments, backslashes or NUL, non-Markdown files, files over 1 MiB or not UTF-8 are rejected with the specified reasons; version records, tasks of delivered changes and legacy artifacts are refused; a protected branch or detached HEAD refuses every write.
- [x] Front-matter edits through the yaml Document API preserve unknown keys, key order and comments; short new scalar lists use flow style; a body without front matter gains a block only when a structural field is added; invalid existing YAML is reported.
- [x] Section edits replace exactly the heading's token range, append a missing section at the end, and keep every other byte and the file's line endings; whole-body saves keep the front matter.
- [x] Writes are atomic through temporary files and renames; creation uses exclusive flags; a simulated rename failure in a multi-file plan restores earlier files and reports partial-write.
- [x] Expected digests are compared before writing; a mismatch returns 409 with current contents; the journal keeps the last 50 operations and undo restores pre-images only while post-image digests are current.
- [x] Tests cover each rule above with fixture repositories and fingerprint comparisons that show unchanged bytes outside the targets.

## Evidence

### writer-tests

Checked in apps/artifact-plane at commit 8514ef3: 8 of 8 tests passed. Containment rejects unsafe path syntax, symbolic links, files over 1 MiB and invalid UTF-8; protected main, detached HEAD, version records, delivered task files and legacy artifacts are refused. Front-matter edits of flow steps, supports and lists change only the targeted lines and keep comments, unknown keys, folded long scalars and inline interactions; short identifier lists use flow style; a document without front matter gains a block only for a structural field; invalid YAML is reported. Section edits replace one heading range, append missing sections, change only checkbox characters and keep CRLF. A failed third rename restores both replaced files and removes created directories (fingerprint unchanged). Missing or stale expected digests return 409 with digests or current text. The journal keeps 50 entries; undo restores pre-images and returns 409 after an external edit. Implementation: server/knowledge-writer.js. The front-matter writer splices changed nodes by source range; the specification records this detail.
