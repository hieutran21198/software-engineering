---
tier: large
---

# Connect Command Code to Artifact Plane

## Reason and scope

The owner selected full Command Code integration: ADD guidance and an
implementer profile, MCP setup and lifecycle integration. Plane already serves
Claude Code, Codex and Antigravity command hooks, and Command Code uses a
narrower variant of that protocol.

This change adds project hook configuration, recorded payload compatibility and
setup guidance. The shared outcome is documented in
`docs/artifacts/units-of-work/commandcode-integration/README.md`. It excludes
global configuration, browser UI changes and automatic continuation.

The outcome spans two artifacts, so it is large. It uses this repository only.
Plane implementation follows the established ADD supplier change. Command Code
1.85.1 did not fire SessionStart in headless mode, carries no agent_id and skips
hooks in plan mode; the delivered behavior states these limits instead of
claiming full parity.
