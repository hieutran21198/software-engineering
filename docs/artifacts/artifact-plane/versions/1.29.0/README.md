---
source_change: change-commandcode-support
---

# Command Code command-hook support

Minor: adds Command Code project hooks and input compatibility while preserving
every existing harness adapter, MCP tool, runtime schema and browser behavior.
The context output is still checked with recorded payloads because Command Code
1.85.1 does not fire `SessionStart` in headless mode. See the
[originating plan](../../changes/change-commandcode-support/tasks/README.md).
