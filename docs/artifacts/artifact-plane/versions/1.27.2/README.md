---
source_change: change-opencode-ci-tests
---

# artifact-plane 1.27.2

Patch: the OpenCode bridge tests create their temporary directories under the system temporary directory, and the guide test matches the guide, so the test suite passes on the CI runner and the Plane release job can run. Product code, routes, MCP tools and the flow format do not change.

The plan and its evidence are in the [retained change](../../changes/change-opencode-ci-tests/tasks/README.md).
