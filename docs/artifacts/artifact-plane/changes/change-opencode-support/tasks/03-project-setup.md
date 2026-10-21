---
id: project-setup
depends_on: [verify-v2-contract]
covers:
  - element: requirements/opencode-support.md
    ids: [OP1, OP6, OP7, OPA1]
---

# Register OpenCode project integration

## Scope and ownership

Implementer. Owns root `opencode.json`, `.opencode/plugins/artifact-plane/index.ts`, any verified project plugin dependency manifest, `apps/artifact-plane/integration/README.md`, the Plane README and integration examples. The coordinator updates current agent/runtime specifications and the two affected flow records. Governing contract: `specifications/opencode-support.md`.

## Definition of Done

- [ ] Project MCP configuration uses the native V2 `mcp.servers` shape and calls `artifact-plane mcp`.
- [ ] A thin project plugin entry loads the single reusable bridge with the verified V2 package format.
- [ ] Examples and setup guidance match the committed configuration and explain activation and trust requirements.
- [ ] Documentation states that OpenCode has no stop blocking and directs record validation to MCP `check_records`.
- [ ] Configuration checks preserve model selection, existing permission rules and all other harness registrations.
- [ ] Current agent and observation contracts identify the OpenCode contract without rewriting historical evidence.
- [ ] The affected flow supports and evidence bases match implemented behavior; no live or observed basis is claimed from an unexecuted fixture.
- [ ] Relative links resolve without ancestor references.

## Evidence

No implementation checks have run.
