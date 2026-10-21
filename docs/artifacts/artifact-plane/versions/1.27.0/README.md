---
source_change: change-opencode-support
---

# OpenCode 2 integration

Minor: adds native OpenCode 2 project configuration, a lifecycle bridge around the existing hook command, and setup guidance alongside the existing harnesses. The target 2.1.2 runtime loads the committed entry, connects the Plane MCP server with 13 tools, receives change context and refuses a reserved action without starting it. OpenCode has no stop blocking, so record validation uses `check_records`; ambiguous execution terminals stay unknown. See the [originating plan](../../changes/change-opencode-support/tasks/README.md).
