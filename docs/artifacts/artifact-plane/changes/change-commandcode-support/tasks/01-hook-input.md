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

- [ ] The existing `artifact-plane hook` command handles the four Command Code
      events and adds no new subcommand or wrapper.
- [ ] A task read from `file_path` and from `absolute_path` infers a binding
      under the existing identity rules.
- [ ] A non-empty `tool_input.args` array is appended with shell quoting before
      reserved-action and task-path inspection.
- [ ] `SessionStart`, `PreToolUse`, `PostToolUse` and `Stop` return the
      documented shapes; an unsupported event returns `{}`.
- [ ] `Stop` honors both `stop_hook_active` values.
- [ ] Invalid input, a missing repository, a broken store and a deadline return
      status 0 and store no payload text.
- [ ] Existing Claude Code, Codex, Antigravity and OpenCode tests still pass.

## Evidence

Filled during implementation.
