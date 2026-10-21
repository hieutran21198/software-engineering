---
tier: large
---

# Connect OpenCode V2 to Artifact Plane

## Reason and scope

The owner selected full OpenCode integration: ADD guidance and profiles, MCP setup and lifecycle integration. Plane currently supports command hooks for Claude Code, Codex and Antigravity, but has no OpenCode adapter.

This change adds project-local V2 MCP configuration, a native lifecycle bridge, setup guidance and validation. The shared outcome is documented in `docs/artifacts/units-of-work/opencode-integration/README.md`. It excludes OpenCode V1, global configuration, browser UI changes and automatic continuation.

The outcome spans two artifacts, so it is large. It uses this repository only. Plane implementation waits for the required ADD supplier change to establish. OpenCode has no documented stop-blocking hook; this change must not claim equivalent stop enforcement.
