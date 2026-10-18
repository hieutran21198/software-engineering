---
id: flow-reads
depends_on: []
---

# Flow reads

## Scope and ownership

Own the discovery cutoff and the operation changes in apps/artifact-plane/server/flow-index.js, the fingerprint freshness check in server/flow-reader.js, the diagram source in src/pages/FlowPage.jsx, and the tests test/flow-index.test.js and test/flow-canvas.test.js.

## Governing knowledge

specifications/change-impact.md, section Discovery and flow reads. specifications/flows.md, Change-impact amendment. requirements/change-impact.md, I9 to I11.

## Prerequisites

Explicit plan approval. No internal prerequisite. The owner may defer this task at approval; the other tasks do not depend on it.

## Definition of Done

- [ ] The semantic cutoff is measured on this repository's inventory and recorded with its value: the query "review a change and assess its impact" no longer lists story-driven:revision-impact, and the expected flows of P9 stay in the top ten.
- [ ] The detail, source and impact operations never initialize the embedder; a test asserts that the embedder's embed function is not called for them.
- [ ] The flow page renders the diagram from the document front matter before the detail reply arrives; the detail reply adds resolution and sources.
- [ ] A flow query reads the repository once; the end-of-request check compares HEAD, the worktree status and the observation fingerprint; a warm detail request on this repository answers within 300 milliseconds, measured.

## Evidence

No checks have run.
