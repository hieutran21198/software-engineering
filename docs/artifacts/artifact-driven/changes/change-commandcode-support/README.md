---
tier: large
---

# Support Command Code in ADD

## Reason and scope

The owner requested Command Code support alongside Claude Code, Codex,
Antigravity and OpenCode V2. Command Code already discovers the six canonical
skills through `.agents/skills` and reads repository `AGENTS.md`; explicit setup
guidance and a native implementer profile are missing.

This change covers bundle guidance, repository instructions and the implementer
profile. Artifact Plane owns its MCP and lifecycle bridge in a separate member
change. The shared outcome is documented in
`docs/artifacts/units-of-work/commandcode-integration/README.md`.

The outcome spans two artifacts and changes the harness contract that Plane
consumes, so it is large. It uses this repository only. No adoption CLI
behavior, record format or phase gate changes.
