---
id: hook-input
depends_on: []
covers:
  - element: requirements/commandcode-support.md
    ids: [CP1, CP2, CP3, CP4, CP5, CP7, CPA2, CPA3]
---

# Accept Command Code hook input

## Scope and ownership

Implementer. Owns `apps/artifact-plane/server/agent-hook.js`,
`apps/artifact-plane/server/runtime-store.js` and the recorded-input tests in
`apps/artifact-plane/test/agent-hook.test.js` and
`apps/artifact-plane/test/runtime-binding.test.js`. Governing contract:
`specifications/commandcode-support.md`.

## Definition of Done

- [x] The existing `artifact-plane hook` command handles the four Command Code
      events and adds no new subcommand or wrapper.
- [x] A task read from `file_path` and from `absolute_path` infers a binding
      under the existing identity rules.
- [x] A non-empty `tool_input.args` array is appended with shell quoting before
      reserved-action and task-path inspection.
- [x] `SessionStart`, `PreToolUse`, `PostToolUse` and `Stop` return the
      documented shapes; an unsupported event returns `{}`.
- [x] `Stop` honors both `stop_hook_active` values.
- [x] Invalid input, a missing repository, a broken store and a deadline return
      status 0 and store no payload text.
- [x] Existing Claude Code, Codex, Antigravity and OpenCode tests still pass.

## Evidence

`server/agent-hook.js` appends a non-empty string `tool_input.args` array to
`tool_input.command` with single-quote escaping before the policy and task-path
parsers run. `server/runtime-store.js` reads a task path from `absolute_path`
beside `file_path`, `path` and `command`.

`node --test test/agent-hook.test.js` passed all 15 tests. The new CPA2 test
sends recorded 1.85.1 payloads for `SessionStart` from three sources,
`PreToolUse` for an ordinary command, a commit, separate `git` arguments, a push,
a `gh pr merge`, quoted text, a task read, `PostToolUse` with an output, and
`Stop` with both `stop_hook_active` values. It checks the dispatcher and the
process entry and confirms that no payload marker reaches the store.

`node --test test/runtime-binding.test.js` passed all 7 tests. Task paths resolve
from `file_path`, `absolute_path`, `path`, a command string and a command array.
A linked-worktree Command Code read with `absolute_path` returns an inferred
binding. The separate-argument case normalizes `git` plus `commit`, `-m` and a
quoted value, and a linked-worktree read from `absolute_path` binds session
`cc` with an empty agent under unit `live`.

Existing Claude Code, Codex and Antigravity cases pass in the same suites.
