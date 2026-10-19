---
id: hook-command
depends_on: [guidance-functions, inferred-binding]
covers:
  - element: requirements/agent-integration.md
    ids: [AI1, AI2, AI7, AIA1, AIA3]
---

# Hook command

## Scope and ownership

Implementer. `server/app.js` (commands `hook` and `runtime`, lazy imports), the hook dispatcher with its error boundaries and time limits, the detached inferred bind, `scripts/app-smoke.mjs`, and tests with recorded Claude Code and Codex inputs.

## Governing knowledge

specifications/agent-integration.md: Command line, Hook command, Inferred binding; specifications/app-release.md: Command line.

## Definition of Done

- [x] `artifact-plane hook` and `artifact-plane runtime <command>` behave as the Command line section; `node server/runtime-cli.js` keeps its output.
- [x] Recorded inputs of both harnesses for each event of the Hook command table get the specified output, from the dispatcher and once from the built executable.
- [x] The fail-open tests of the Validation section exit 0 and leave no forbidden field in the store.
- [x] A PreToolUse with an inferred binding returns within 2 seconds, and the binding appears in `runtime query` after the detached process ends (claim detached-inferred-bind).
- [x] The smoke check runs `hook` with a SessionStart input and `runtime query` on every CI target.
- [x] `npm test` passes; CI passes on the six targets.

## Evidence

| DoD item | Check | Result |
| --- | --- | --- |
| Commands | test/app.test.js and test/agent-hook.test.js: the help lists `hook` and `runtime`; `runtime bind`, `query` and `report` (with `--binding inferred`) print the JSON of `node server/runtime-cli.js`; a missing or wrong runtime subcommand exits 2; test/runtime-hooks.test.js passes unchanged; server/app.js imports each command module only when the command runs | Passed |
| Recorded inputs | Claude Code inputs (four SessionStart sources, UserPromptSubmit, PreToolUse plain, commit on main, `gh pr merge`, `echo "git commit"`, subagent task read, PostToolUse, PermissionRequest, SubagentStart, SubagentStop, Stop with `stop_hook_active` false and true, SessionEnd, Notification) and codex-cli 0.163.0 inputs (the same rows, string and `["bash","-lc",…]` commands, push to `HEAD:main`, `git log --grep commit`, a main-worktree task read, Interrupt) get the output of the Hook command table from `hookOutput`, and from the Linux executable built locally with `PLANE_TEST_EXECUTABLE` | Passed |
| Fail-open | Argument problems, invalid JSON, empty input, `[1]`, `null`, input over 1 MiB, a missing `cwd`, a non-ADD repository, a state directory that is a file, injected slow steps and a real `git` that sleeps 15 s: each exits 0 with one JSON object (the slow case returns `{}` after about 5.2 s); with a broken store the context and the refusal still work; table rows and raw `runtime.sqlite*` bytes hold no marker placed in prompt, tool input, command, tool response, assistant message or transcript paths | Passed |
| Detached inferred bind | A Codex PreToolUse in a linked worktree fixture returns in 247 ms from source and 333 ms from the executable; `runtime query` then shows one inferred attempt; a second read adds none. On this repository a PreToolUse with an inferred binding took 733–823 ms and the detached bind ended about 6 s later (claim detached-inferred-bind) | Passed |
| Smoke check | `node scripts/app-smoke.mjs release/artifact-plane-linux-amd64`: "All checks passed", with "hook answers a SessionStart input with one JSON object" and "runtime query prints the JSON of the store" | Passed |

Times on this repository, median of five runs with a private state directory (source / executable): SessionStart 743 / 792 ms; PreToolUse `git status` 158 / 143 ms; PreToolUse `git commit` on a branch 127 / 160 ms; Stop with a passing validator 1,969 / 2,148 ms. `npm test` 463 tests, 462 passed, 0 failed, 1 skipped; `npm run build` passes (commit e3b0956).

Finding: the runtime store requires private POSIX modes, which Windows does not report, so the observer fails on Windows from source and from the executable; the specification now records it.

CI: CI run 39257515159 on commit b8bf50c passed the plane-app job on the six targets, with the smoke checks of `hook` and `runtime query`. On Windows the store refused its directory, as the specification records: "Use a private runtime directory (0700)" on AMD64 and "Runtime store must be outside repositories and worktrees" on ARM64 (a short temporary path); the smoke check accepts both refusals on Windows only.
