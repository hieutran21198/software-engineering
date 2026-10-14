---
id: agent-adapters
depends_on: [flow-index]
---

# Expose HTTP and stdio MCP retrieval

## Scope and governing knowledge

Own /api/flows/query and the four specified MCP tools, shared service validation, context budgets, pagination and client setup. Restrict configured roots and context-owned source retrieval.

Governing requirements: requirements/flows.md. Governing specification: specifications/flows.md. Consume the unit shared criteria without copying them into this authority.

## Definition of Done

- [x] HTTP/MCP results and diagnostics match.
- [x] Host/origin/path guards, stdio protocol output and read-only behavior pass.
- [x] Impact traversal is independent of ranked top-k and reports omissions/completeness.

## Evidence

POST /api/flows/query and all four MCP tools call createFlowService.query. HTTP reuses host/origin, content type and 16 KiB request guards. MCP uses strict selector schemas and read-only annotations. Configured roots are checked before reading knowledge; registered worktrees and context-owned source IDs restrict reads. Source excerpts page with revision-bound cursors. Cache writes stay outside repositories.

The seven adapter tests passed, covering equivalent search/detail/impact/source responses and diagnostics, unsafe selectors and foreign origin rejection, full source reconstruction with stale cursor rejection, repeated dirty source edits, escaping symlinks, graceful shutdown and repository byte/Git-state preservation. A real SDK stdio client initialized, listed exactly four tools and retrieved fixture flows; foreign configured roots were rejected. Valid protocol parsing verifies stdout framing. Local missing-model diagnostics remained explicit. The complete graph closure test uses a requested page size below its consumer count; search limits do not truncate impact traversal.

Run FLOW_MODEL_STATE=/tmp/plane-flow-model-state node --test test/flow-index.test.js test/flow-model-integrity.test.js test/flow-adapters.test.js for the combined 24 passing checks. Client registration and state-directory examples are in apps/artifact-plane/README.md. KISS and STE self-check passed.
