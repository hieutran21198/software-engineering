---
id: agent-adapters
depends_on: [flow-index]
---

# Expose HTTP and stdio MCP retrieval

## Scope and governing knowledge

Own /api/flows/query and the four specified MCP tools, shared service validation, context budgets, pagination and client setup. Restrict configured roots and context-owned source retrieval.

Governing requirements: requirements/flows.md. Governing specification: specifications/flows.md. Consume the unit shared criteria without copying them into this authority.

## Definition of Done

- [ ] HTTP/MCP results and diagnostics match.
- [ ] Host/origin/path guards, stdio protocol output and read-only behavior pass.
- [ ] Impact traversal is independent of ranked top-k and reports omissions/completeness.

## Evidence

No implementation checks have run for this task.
