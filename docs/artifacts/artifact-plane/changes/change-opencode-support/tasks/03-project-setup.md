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

- [x] Project MCP configuration uses the native V2 `mcp.servers` shape and calls `artifact-plane mcp`.
- [x] A thin project plugin entry loads the single reusable bridge with the verified V2 package format.
- [x] Examples and setup guidance match the committed configuration and explain activation and trust requirements.
- [x] Documentation states that OpenCode has no stop blocking and directs record validation to MCP `check_records`.
- [x] Configuration checks preserve model selection, existing permission rules and all other harness registrations.
- [x] Current agent and observation contracts identify the OpenCode contract without rewriting historical evidence.
- [x] The affected flow supports and evidence bases match implemented behavior; no live or observed basis is claimed from an unexecuted fixture.
- [x] Relative links resolve without ancestor references.

## Evidence

`node --test test/opencode-config.test.js test/agent-config.test.js` passed all 8 tests from the integrated Plane app. The exact config/example comparison rejects model, permission, global and V1 fields. The entry test resolves the relative re-export to the one reusable implementation. Link and anchor tests passed without ancestor references. The implementer also ran agent/runtime/MCP regressions and `go test ./docs/artifact-driven`; those checks passed. `git diff --check` passed.

The coordinator linked the native contract from the current agent, observation and UI-discovery specifications and updated the two affected flow records. New implementation/test supports are static until their recorded integration checks run; existing historical evidence remains untouched. The flow's finish step now explicitly distinguishes supported stop checks from OpenCode's MCP record validation.

After the project configuration was integrated, the current OpenCode session discovered the actual `artifact-plane` MCP server. Its `get_change_status` returned this branch and its current task checklist. Its `check_records` returned `ok: true`; branch-overlap warnings identify the two coordinated worker branches and a retained Antigravity branch already merged through PR 52. No global configuration changed. This is live MCP activation in the current harness, separate from the target 2.1.2 native-provider fixture and task 04's final bridge check.
