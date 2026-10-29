---
source_change: change-agent-orchestration
---

# Agent sessions across harness tools

Minor: adds person-started agent sessions in Claude Code, Codex, OpenCode V2, Command Code, Antigravity CLI and Gemini CLI, with launch profiles, provider checks, role defaults, a session runner, an embedded terminal, task output views and recovery. Without a launch profile, the existing observation, hooks, MCP tools and workbench behave as before, and the runtime schema version stays 1.

Limits of this version: the claims `antigravity-terminal` (the `--effort` flag of `agy`) and `gemini-terminal-model-flag` stay open, and `--mode auto` of `agy` stays refused. herdr detects the waiting state of Claude Code, Codex and Antigravity CLI only. No tag or release is created by this record.
