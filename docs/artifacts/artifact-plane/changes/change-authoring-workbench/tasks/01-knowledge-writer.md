---
id: knowledge-writer
depends_on: []
evidence_records: []
---

# Knowledge writer

## Scope and ownership

Own apps/artifact-plane/server/knowledge-writer.js and its tests. The module is the only code that writes inside an inspected repository.

## Governing knowledge

specifications/knowledge-editing.md, sections Two layers, one writer and Writer. ADD specifications/knowledge-layout.md for the records that must survive unchanged.

## Prerequisites

Explicit plan approval. No internal prerequisite.

## Definition of Done

- [ ] Containment: paths outside docs/artifacts, through symbolic links, with .git, dot segments, backslashes or NUL, non-Markdown files, files over 1 MiB or not UTF-8 are rejected with the specified reasons; version records, tasks of delivered changes and legacy artifacts are refused; a protected branch or detached HEAD refuses every write.
- [ ] Front-matter edits through the yaml Document API preserve unknown keys, key order and comments; short new scalar lists use flow style; a body without front matter gains a block only when a structural field is added; invalid existing YAML is reported.
- [ ] Section edits replace exactly the heading's token range, append a missing section at the end, and keep every other byte and the file's line endings; whole-body saves keep the front matter.
- [ ] Writes are atomic through temporary files and renames; creation uses exclusive flags; a simulated rename failure in a multi-file plan restores earlier files and reports partial-write.
- [ ] Expected digests are compared before writing; a mismatch returns 409 with current contents; the journal keeps the last 50 operations and undo restores pre-images only while post-image digests are current.
- [ ] Tests cover each rule above with fixture repositories and fingerprint comparisons that show unchanged bytes outside the targets.

## Evidence

Implementation has not started.
