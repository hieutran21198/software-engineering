---
tier: large
---

# Support OpenCode V2 in ADD

## Reason and scope

The owner requested OpenCode support alongside Antigravity, Claude Code and Codex, and selected the full integration scope. Existing `.agents/skills` entries already expose the six skills to OpenCode. Explicit adoption guidance and native role profiles are missing.

This change covers bundle guidance, repository instructions and role profiles. Artifact Plane owns its MCP and lifecycle bridge in a separate member change. The shared outcome is documented in `docs/artifacts/units-of-work/opencode-integration/README.md`.

The outcome spans two artifacts and changes the harness contract that Plane consumes, so it is large. It uses this repository only. No CLI adoption behavior, record format or phase gate changes.
