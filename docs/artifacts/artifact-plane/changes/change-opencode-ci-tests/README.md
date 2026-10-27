---
tier: small
---

# Pass the OpenCode tests on the CI runner

## Reason and scope

After #58 merged, the artifact-plane job of CI failed on main at 5d76f6e and b67824e, so the plane-release job of the tag plane-v1.27.2 was skipped. Three OpenCode tests fail on the runner and pass on the developer machine:

1. "non-Git locations fail open without observations" and "Git identity lookup fails open on missing executable, excess output and timeout, and reaps on unload" create their temporary directories with `mkdtemp('/tmp/opencode/…')`. `/tmp/opencode` exists only on the developer machine, so the runner reports ENOENT.
2. "OpenCode guidance separates unsupported completion control and activation evidence" expects "native-runtime provider fixtures". The guide says "native-runtime fixtures".

Included: temporary directories under the system temporary directory, and the guide test aligned with the guide text. Excluded: the bridge code, the guide text and the native OpenCode check.

## Plan

One task changes test/opencode-bridge.test.js and test/opencode-config.test.js. The task covers OPA4 in requirements/opencode-support.md. Compatibility: patch.

## Tier decisions

One repository and one artifact. Impact: test files only; no product code, route, MCP tool, flow record, decision or dependency changes.

- [Requirements](../../requirements/opencode-support.md)
- [Specification](../../specifications/opencode-support.md)
- [Task](tasks/01-deliver.md)
