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

- [ ] Working elements of in-place artifacts carry `systemView: true` only for a YAML boolean `system_view: true` outside `specifications/flows/`.
- [ ] Elements with diagram blocks carry `diagrams` with `index`, `type`, `title`, `heading`, `source` and `stale` as the field table states; other element records are unchanged byte for byte.
- [ ] Node tests cover diagrams in lists and block quotes, the type after `%%` comment lines, `accTitle`, the last heading, `Source:`, `Illustrative:`, `Stale:` within two paragraphs, `system_view` values other than `true`, and flow records.
- [ ] A test shows that the index of each record equals the `data-diagram-index` that the marked renderer of src/Markdown.jsx gives the same block.
- [ ] Existing MCP, context packet and validator tests pass, and a test shows that context packets contain no `diagrams` or `systemView` field.

## Evidence

Pending.
