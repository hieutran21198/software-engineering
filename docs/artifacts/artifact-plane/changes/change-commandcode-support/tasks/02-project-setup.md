---
id: project-setup
depends_on: []
covers:
  - element: requirements/commandcode-support.md
    ids: [CP6, CP9, CPA1]
---

# Register Command Code project integration

## Scope and ownership

Implementer. Owns `.commandcode/settings.json`,
`apps/artifact-plane/integration/commandcode-settings.example.json`,
`apps/artifact-plane/test/agent-config.test.js`,
`apps/artifact-plane/integration/README.md`, the Plane README and the `hook`
help text in `apps/artifact-plane/server/app.js`. Governing contract:
`specifications/commandcode-support.md`.

## Definition of Done

- [ ] The committed hook file has `SessionStart`, `PreToolUse`, `PostToolUse`
      and `Stop`, no matcher and the specified timeouts.
- [ ] Every handler runs `artifact-plane hook || true`.
- [ ] The example equals the committed hook file.
- [ ] `.mcp.json` stays the single project MCP registration and is checked.
- [ ] Setup guidance names the MCP file, the hook file, the trust step, the
      source path and the observed limits.
- [ ] Help and documentation name Command Code without removing another
      harness.
- [ ] The configuration test passes.

## Evidence

Filled during implementation.
