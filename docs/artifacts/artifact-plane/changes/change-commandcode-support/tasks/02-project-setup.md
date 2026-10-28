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

- [x] The committed hook file has `SessionStart`, `PreToolUse`, `PostToolUse`
      and `Stop`, no matcher and the specified timeouts.
- [x] Every handler runs `artifact-plane hook || true`.
- [x] The example equals the committed hook file.
- [x] `.mcp.json` stays the single project MCP registration and is checked.
- [x] Setup guidance names the MCP file, the hook file, the trust step, the
      source path and the observed limits.
- [x] Help and documentation name Command Code without removing another
      harness.
- [x] The configuration test passes.

## Evidence

Merged the four hook entries into the existing `.commandcode/settings.json` and
kept its `permissions` object (`allow` for `Shell(grep:*)` and `Shell(sed:*)`,
empty `deny`, `defaultMode` `default`). The committed hooks equal
`integration/commandcode-settings.example.json`: `SessionStart` 10 seconds,
`PreToolUse` and `PostToolUse` 5 seconds, and `Stop` 30 seconds, with no matcher
and the `artifact-plane hook || true` command.

`.mcp.json` is unchanged and remains the only project MCP registration.
`integration/README.md` has a Command Code section with the MCP file, hook file,
trust step, limits and source. The Plane README, the `hook` help text and the
verification limits name Command Code without removing another harness.

`node --test test/agent-config.test.js` passed all 5 tests, including the new
Command Code example, committed hooks and preserved permissions. The executable
smoke check in the validation task covers the built `hook` command.
