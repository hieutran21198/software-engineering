---
id: antigravity-hook-adapter
depends_on: []
covers:
  - element: requirements/agent-integration.md
    ids: [AI2, AI13, AI14, AIA1, AIA4, AIA8]
---

# Antigravity hook adapter

## Scope and ownership

Implementer. `apps/artifact-plane/server/app.js`, `apps/artifact-plane/server/agent-hook.js`, `apps/artifact-plane/test/agent-hook.test.js` and `apps/artifact-plane/test/runtime-binding.test.js`.

## Governing knowledge

`specifications/agent-integration.md`: Command line, Hook command, Stop check, Inferred binding; `specifications/codex-execution.md`: Codex lifecycle adapter; `specifications/ui-discovery.md`: Hook output.

## Definition of Done

- [ ] `artifact-plane hook` accepts `--event <name>` alongside `--state-dir /absolute/path` and exits 0 on unknown options.
- [ ] Antigravity camelCase hook inputs (`SessionStart`, `PreInvocation`, `PreToolUse`, `PostToolUse`, `Stop`) normalize session, workspace directory, turn (`conversationId`), model, tool arguments (`CommandLine`, `Path`, `AbsolutePath`, `FilePath`) and `stop_hook_active` (`terminationReason !== 'NO_TOOL_CALL'` or `executionNum > 1`).
- [ ] Antigravity hook outputs return `{"injectSteps":[{"systemMessage":{"systemMessage":"<context>"}}]}` on `SessionStart`, `{"decision":"deny","reason":"<reason>"}` on a denied `PreToolUse`, `{"decision":"continue","reason":"<reason>"}` on a failing `Stop` check, and `{}` otherwise.
- [ ] Recorded Antigravity inputs in `test/agent-hook.test.js` and `test/runtime-binding.test.js` verify session context + workbench line, reserved-action refusal, inferred task binding from `read_file` in a linked worktree, observer turn progression (`processing` to `validating`), and single-pass `Stop` blocking (`executionNum: 1` versus `executionNum: 2`).
