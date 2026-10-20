---
tier: medium
---

# Show the workbench to a new user at session start

## Reason and scope

On 20 October 2026 the owner reported that a new user does not know about the workbench. The harness connects the MCP server and runs the hooks, but nothing starts the workbench or tells the person about it.

The owner decided on 20 October 2026: the session start hook starts the server in the background when no Plane server answers, and shows the person the address of the repository; it opens no browser.

Included:

- the server start and the address line of the session start hook;
- an address that opens the repository of the session in the workbench;
- the setting that turns off the start;
- the integration README.

Excluded: opening a browser, the MCP tools, `se-adopt`, the ADD bundle and the install of the executable.

Knowledge is edited in place on this branch. The unit brief is [Plane UI discovery](../../../units-of-work/plane-ui-discovery/README.md).

- [Requirements: workbench discovery](../../requirements/ui-discovery.md)
- [Specification: workbench discovery](../../specifications/ui-discovery.md)
- [Plan](tasks/README.md)
