---
source_change: change-agent-integration
---

# artifact-plane 1.23.0

Minor: new commands, MCP tools and an attempt field; existing commands, tools and observer states keep their behavior. The executable has the commands `hook` and `runtime`. One hook command serves Claude Code and Codex: it gives the change state at session start, refuses a commit or push to `main` or `master` and a pull request merge, asks once for a fix of record errors before the agent stops, and binds an agent to a task when it reads the task file. The MCP server adds `get_change_status` and `check_records`, sends instructions and reports the package version. The observer correlates Claude Code turns by `prompt_id`. This repository registers the MCP server and the hooks for both harnesses.

The plan and its evidence are in the [retained change](../../changes/change-agent-integration/tasks/README.md).
