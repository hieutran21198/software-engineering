---
id: edit-interfaces
depends_on: [artifact-change-operations, plan-unit-version-operations, flow-operations, git-lifecycle]
evidence_records:
  - id: interface-tests
    method: node --test test/knowledge-interfaces.test.js and npm test
    result: passed
    source: docs/artifacts/artifact-plane/changes/change-authoring-workbench/tasks/06-edit-interfaces.md#interface-tests
---

# Edit interfaces

## Scope and ownership

Own the routes POST /api/knowledge/edit and POST /api/knowledge/git in server/http.js, the opt-in MCP tools in server/flow-mcp.js and server/flow-mcp-stdio.js, and their tests.

## Governing knowledge

specifications/knowledge-editing.md, sections HTTP interface and MCP interface; the existing host, origin and content-type rules in specifications/explorer.md.

## Prerequisites

Tasks artifact-change-operations, plan-unit-version-operations, flow-operations and git-lifecycle.

## Definition of Done

- [x] Both routes enforce the existing loopback host and origin checks, accept JSON up to 2 MiB while other routes keep 16 KiB, and map failures to 400, 403, 404, 409, 422 and sanitized 500 with error bodies that carry diagnostics and current contents where specified.
- [x] preview_knowledge_operation and apply_knowledge_operation are registered only with --allow-writes, carry the specified annotations, default path to a single configured root and return the operation response as structured content; without the flag the tools are absent and a write is refused with 403.
- [x] A parity test applies the same operation through HTTP and MCP on equal fixtures and compares the written bytes and responses.
- [x] The existing read routes, tools and tests are unchanged and pass.

## Evidence

### interface-tests

Checked in apps/artifact-plane at commit 8514ef3: 2 of 2 interface tests passed and npm test passed 331 of 332 tests with 1 skipped. The edit routes refuse a foreign origin (403), text/plain (415), malformed JSON (400) and bodies over 2 MiB (413); a 100 KB body reaches the service; /api/explore keeps 413 above 16 KiB. Errors carry code, action, diagnostics and current contents (403 protected branch, 404 missing repository, 409 digest conflict, 422 cycle). Without --allow-writes the MCP server lists no write tools and a write call fails; with it, both tools carry readOnlyHint false, destructiveHint true, idempotentHint false and openWorldHint false, the preview writes nothing, a repository outside the roots is refused with 403, and the same operation through MCP and HTTP on equal fixtures writes identical bytes and equal responses. Implementation: server/http.js, server/flow-mcp.js, server/flow-mcp-stdio.js.
