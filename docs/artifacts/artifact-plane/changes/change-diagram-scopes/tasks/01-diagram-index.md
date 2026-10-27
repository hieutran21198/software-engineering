---
id: diagram-index
depends_on: []
covers:
  - element: requirements/diagram-scopes.md
    ids: [DP3, DP12]
---

# Diagram index in the overview

## Scope and ownership

Implementer. Add server/diagram-index.js and call it where the overview section of POST /api/repository/query is built, before `stripBodies`. Add Node tests under test/. Governing section: [Diagram index](../../../specifications/diagram-scopes.md#diagram-index). Do not change src/model.js, the validator, MCP tools or context packets.

## Definition of Done

- [x] Working elements of in-place artifacts carry `systemView: true` only for a YAML boolean `system_view: true` outside `specifications/flows/`.
- [x] Elements with diagram blocks carry `diagrams` with `index`, `type`, `title`, `heading`, `source` and `stale` as the field table states; other element records are unchanged byte for byte.
- [x] Node tests cover diagrams in lists and block quotes, the type after `%%` comment lines, `accTitle`, the last heading, `Source:`, `Illustrative:`, `Stale:` within two paragraphs, `system_view` values other than `true`, and flow records.
- [x] A test shows that the index of each record equals the `data-diagram-index` that the marked renderer of src/Markdown.jsx gives the same block.
- [x] Existing MCP, context packet and validator tests pass, and a test shows that context packets contain no `diagrams` or `systemView` field.

## Evidence

An implementer delivered commit 3846782 on branch claude/diagram-scopes-01-diagram-index; the coordinator merged it (0158ec9) and added f858367, which finds a `Stale:` line written directly under the source line.

| DoD item | Check | Result | Source |
| --- | --- | --- | --- |
| `systemView` rule | Overview query on a fixture with `system_view` values `true`, `"true"`, `yes`, `1`, `false`, invalid YAML, and `true` on a flow record; a hand-made snapshot with legacy, change and working elements | Only the working specification with the YAML boolean gets `systemView: true` | apps/artifact-plane/test/diagram-index.test.js |
| `diagrams` field and unchanged records | Field checks against the contract table; the overview `artifacts` without the two fields compared as JSON text with `stripBodies` of the base scan | Equal byte for byte | same test file |
| Node test cases | Lists, block quotes, `%%` and `%%{init}%%` lines, `accTitle` trimming, last heading, `Source:`, `Illustrative:`, `Stale:` as paragraph 1, 2 and 3 and directly under the source line, flow records, non-diagram fences | 7 of 7 tests pass; four deliberate code breaks each failed a test | same test file |
| Index agreement | The test copies `renderer.code` of src/Markdown.jsx, runs `marked.parse` and compares `data-diagram-index` with the records; it also checks that Markdown.jsx keeps the same predicate, numbering and front matter rule | Equal indexes 0 to 5 | same test file |
| Packets, MCP and validator | Full `npm test`; a context packet of an in-place change with a system view and two diagrams; import trace of the validator, the MCP entry and the packet code | 563 tests, 562 pass, 0 fail, 1 skipped (the existing network-disabled model test); the packet has no `diagrams` or `systemView` key; the validator does not import the module | `npm test` in apps/artifact-plane |

The scan keeps only metadata in element `markdown`, so `scanRepository` now also returns its `workingBytes`; the specification states this. On this repository the overview gives `diagrams` to 4 working documents with 5 blocks and no `systemView`, and the index takes about 11 ms.
