---
id: edit-interfaces
depends_on: [artifact-change-operations, plan-unit-version-operations, flow-operations, git-lifecycle]
evidence_records: []
---

# Edit interfaces

## Scope and ownership

Own the routes POST /api/knowledge/edit and POST /api/knowledge/git in server/http.js, the opt-in MCP tools in server/flow-mcp.js and server/flow-mcp-stdio.js, and their tests.

## Governing knowledge

specifications/knowledge-editing.md, sections HTTP interface and MCP interface; the existing host, origin and content-type rules in specifications/explorer.md.

## Prerequisites

Tasks artifact-change-operations, plan-unit-version-operations, flow-operations and git-lifecycle.

## Definition of Done

- [ ] Both routes enforce the existing loopback host and origin checks, accept JSON up to 2 MiB while other routes keep 16 KiB, and map failures to 400, 403, 404, 409, 422 and sanitized 500 with error bodies that carry diagnostics and current contents where specified.
- [ ] preview_knowledge_operation and apply_knowledge_operation are registered only with --allow-writes, carry the specified annotations, default path to a single configured root and return the operation response as structured content; without the flag the tools are absent and a write is refused with 403.
- [ ] A parity test applies the same operation through HTTP and MCP on equal fixtures and compares the written bytes and responses.
- [ ] The existing read routes, tools and tests are unchanged and pass.

## Evidence

Implementation has not started.
