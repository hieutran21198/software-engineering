---
tier: large
---

# Connect OpenCode V2 to Artifact Plane

## Reason and scope

The owner selected full OpenCode integration: ADD guidance and profiles, MCP setup and lifecycle integration. Plane currently supports command hooks for Claude Code, Codex and Antigravity, but has no OpenCode adapter.

This change adds project-local V2 MCP configuration, a native lifecycle bridge, setup guidance and validation. The shared outcome is documented in `docs/artifacts/units-of-work/opencode-integration/README.md`. It excludes OpenCode V1, global configuration, browser UI changes and automatic continuation.

The outcome spans two artifacts, so it is large. It uses this repository only. Plane implementation follows the established ADD 3.3.0 supplier change. OpenCode has no documented stop-blocking hook; the delivered behavior states that limit instead of claiming equivalent stop enforcement.

## Impact

The configured Plane impact reader reached the two declared flows plus `project-tabs` through the shared `ui-discovery` document. The changed section there describes native context output only; the tab contract and implementation are unchanged. Both member changes record their own assessments. Final browser and native runtime checks are recorded in the Plane validation task.
