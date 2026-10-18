---
id: impact-index
depends_on: []
---

# Impact index

## Scope and ownership

Own apps/artifact-plane/server/impact-index.js, the dependencies acorn and acorn-jsx in package.json, and the Node tests test/impact-index.test.js with their fixtures.

## Governing knowledge

specifications/change-impact.md, section Index. requirements/change-impact.md, I2 and I9.

## Prerequisites

Explicit plan approval. No internal prerequisite.

## Definition of Done

- [ ] impact-index.sqlite is created under the private state directory with the directory guard of flow-index.js and the tables files, imports, declarations, packages, embeds, mirrors, history, vocabulary and contexts.
- [ ] File identities come from `git ls-files -s` and the hashes of dirty files; a second build with no change parses no file; a build after one changed file parses that file only, within 300 milliseconds on this repository.
- [ ] JavaScript, JSX and ES modules yield import and export specifiers with local names, dynamic imports, top-level declarations and the identifiers each mentions; a file that fails to parse yields a diagnostic and file-level relations.
- [ ] Go packages yield imports, test imports and go:embed targets when go is available; without go, not_analyzed names Go and the build succeeds.
- [ ] Mirrors pair tracked non-empty files with identical content in different top-level directories; history pairs come from the last 500 non-merge commits without commits that touch more than 60 files; vocabulary keeps identifiers present in at most 12 percent of source files.
- [ ] Interrupted builds publish no generation; a full build of this repository completes within 2 seconds, measured and recorded.

## Evidence

No checks have run.
