---
tier: medium
---

# Give agents the Plane through the executable

## Reason and scope

A review of the agent integration on 19 October 2026, after the release of Plane 1.22.0, found that the executable has no hook command, that the observer needs a manual binding and supports Codex only, that the MCP tools do not return the change status or the record checks, and that this repository registers neither the MCP server nor the hooks.

The owner decided on 19 October 2026: one change of artifact-plane; keep the observer and bind automatically; commit the configuration of this repository; the technical lead selects the hook behaviors from research. Playbooks are out of scope.

Included:

- the observer commands and one hook command in the executable, for Claude Code and Codex;
- the change state at session start, the refusal of three reserved actions, and the record check at stop;
- an inferred task binding from the first task file that an agent reads;
- MCP tools for the change state and the record checks, MCP instructions and the package version;
- README sections for both harnesses, and the MCP and hook configuration of this repository.

Excluded, for later changes: an ADD bundle or `se-adopt` change, hooks of other harnesses, a check after each file edit, blocking rules other than the three reserved actions, and code signing.

Knowledge is edited in place on this branch. The unit brief is [Plane agent integration](../../../units-of-work/plane-agent-integration/README.md).

- [Requirements: agent integration](../../requirements/agent-integration.md)
- [Specification: agent integration](../../specifications/agent-integration.md)
- [Plan](tasks/README.md)
