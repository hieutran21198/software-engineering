---
id: live-check
depends_on: [integration]
covers:
  - element: requirements/agent-orchestration.md
    ids: [AOA1, AOA2, AOA3, AOA4, AOA6, AOA10, AOA11, AOA13]
---

# Live harness check

## Scope and ownership

The coordinator or one implementer runs the built application of the integrated revision with the Live check runbook: a disposable clone, private state and configuration directories, and the existing sign-ins of the owner. Prompts are short and change only the clone. The hooks of the clone write to the runtime store of `ARTIFACT_PLANE_STATE_DIR`, so every started process gets the private directory; the OpenCode background service runs its plugin with its own environment, so the evidence names its writes. Programs that are missing on this computer are installed only in the disposable environment, after the owner agrees.

## Governing knowledge

`requirements/agent-orchestration.md` acceptance criteria and `specifications/agent-orchestration.md`.

## Definition of Done

- [x] A person starts one session with a profile of each of Claude Code, Codex, OpenCode V2, Command Code and Antigravity CLI. The workbench shows role, harness tool, model and state. The evidence records each harness version, or names the missing capability (AOA1).
- [x] An ACP implementer session asks for a permission, the person answers in the workbench, and the agent continues (AOA2).
- [x] A Claude Code role session with a plan sign-in waits for a permission and shows as waiting with the notice. The person types the answer in the embedded terminal, and Claude Code receives it. Open in terminal app shows the same session (AOA3, AOA13).
- [x] A request to the live relay with a foreign Host or Origin is refused (AOA13).
- [x] After its agent process stops, an attempt shows as interrupted. Resume reattaches the same harness session. Respawn starts a new attempt with another profile on the same task branch (AOA4).
- [x] After a restart of the Plane server, the running sessions continue and show their state again (AOA6).
- [x] A real provider check lists two models with different effort levels, and a profile created from the lists starts with its model (AOA10).
- [x] Start ADD work starts a coordinator session in a terminal. The agent receives the request, and neither the runtime store nor the shell history of the pane holds the request text (AOA11).
- [x] An Antigravity terminal profile starts `agy` with its model in a herdr pane, and the evidence records the herdr agent status while agy waits. The `--effort` flag and `--mode auto` stay unchecked; `--mode auto` stays in the bypass list (claim `antigravity-terminal`).
- [x] With a Gemini API key, a Gemini terminal profile starts with its model (claim `gemini-terminal-model-flag`), or the evidence names the missing sign-in.
- [x] Resume of an ACP session sets the profile model and level again, and End of a terminal session deletes the stopped named herdr session. Tests cover both.
- [x] The workbench shows progress while a start runs and an activity indicator for `starting` and `working` sessions (owner request during the live check).
- [x] After any fix, the checks of `integration` pass again on the final revision. The coordinator updates the status of each claim from the evidence. The clone and its state are deleted.

## Evidence

Live evidence, 2026-10-29 19:01 to 21:05 +07. A disposable clone at 33093f3 plus a practice task (`14-practice.md`, clone only) ran in `/tmp/ap-live` with the executable built from cc31072 on port 4371, and private state and configuration directories set for the server, the runner and every started process. Programs: herdr 0.9.5, ttyd 1.7.7, claude 2.1.312, codex-acp 2.3.0, opencode2 2.2.0, cmd 1.88.0, agy 1.4.9 and Ghostty 1.3.1; `gemini` is missing. The owner clicked every Start of a Claude Code session and typed every answer in it; the coordinator drove only checks and non-Claude recovery calls.

- AOA1: the owner started a Claude Code coordinator (terminal, plan sign-in, reported `claude-sonnet-5-5`), a Codex implementer (ACP version 2, `gpt-6-luna`), an OpenCode product owner (terminal, `opencode2 mini`, `deepseek/deepseek-v4-pro`, `--standalone`), a Command Code implementer (ACP version 1, `deepseek/deepseek-v4.1-flash`) and an Antigravity technical lead (terminal, `gemini-4-argon-medium`, reported by its hook). The workbench showed the role, harness tool, model and state of each. Gemini CLI did not run: the program is missing.
- AOA2: the Command Code session asked for five permissions; the owner answered each on the session page, and the agent continued. Codex asked none, because `~/.codex/config.toml` sets `approvals_reviewer = "auto_review"`; the repository allows only `grep` and `sed` for Command Code.
- AOA3 and AOA13: with Claude Code auto mode off, the request `touch permission-check.txt` gave a `PermissionRequest` hook (Bash) 1 second before herdr reported `blocked`; the session became `waiting` with `waitingTool` Bash, and the owner saw the notice. The owner typed the answer in the embedded terminal and the file appeared. Open in terminal app ran `ghostty -e herdr session attach plane-a02975518c22`, and the owner confirmed the same session. The live relay answered 200 for the workbench origin and 403 for a foreign Origin, a foreign Host, a WebSocket without Origin and a WebSocket with a foreign Origin.
- AOA4: a SIGKILL of the Codex agent made the session and the attempt `interrupted` with `process-exit`. Resume (API) sent `session/resume` for the same harness session and replayed the last message. The owner respawned with Command Code on the same task and branch: `respawnOf` named the Codex session, the base revision stayed `61852c0`, and the earlier attempt became `superseded`. Finding: after the resume, Codex reported its default model `gpt-6.1-sol`; commit 630a3af sets the profile model and level again after a resume (tests for versions 1 and 2 fail without the fix).
- AOA6: the server stopped and started again; the same runner process kept the Command Code session (`waiting`) and the coordinator (`idle`, relay available).
- AOA10: the owner checked Claude Code (the plan sign-in gave "Needs an API key sign-in"), Codex (8 models), OpenCode (85), Command Code (92) and Antigravity CLI (13), created the profiles from the lists, and saw the effort list follow the model; the Codex profile started with its model `gpt-6-luna`.
- AOA11: Start ADD work with the request "test the coordinator" started the Claude Code coordinator in a terminal, and Claude received the coordinator prompt with the request. No file of the private state directory, the settings file, and the fish and bash histories contain the request.
- Antigravity: the agy log shows the model override "Gemini 4 Argon (Medium)", and herdr reported `working`, `blocked` and `working`. `--effort` and `--mode auto` were not checked; `--mode auto` stays in the bypass list. herdr reported no state for OpenCode and Command Code in a terminal.
- End: `server stop` left the stopped named herdr sessions; commit 630a3af also runs `herdr session delete`, and the three sessions of this check were deleted by hand. The owner asked for progress while a start runs; commit 61b8b3c adds it.
- Boundaries: the real runtime store has no row of these sessions and no path of the clone. The clone, its state and its sockets are deleted. The harness tools keep their own records of the check sessions (Claude Code, Codex, Command Code, Antigravity CLI and OpenCode).

Final checks on 630a3af: `npm run build`, `npm run build:validator`, `npm run build:app` with the smoke check, and `npm run validate` passed. `npm test` gave 723 tests, 721 passed, 1 skipped and 1 failed timing test (the hook step limit test AI7, 2.5 s against a 2 s limit), which passed 3 of 3 alone and in a full rerun (722 passed, 1 skipped, 0 failed). The browser suite gave 198 of 199 passed; the failed guidance test HGA7 (Tier criteria not visible in 5 s) passed 3 of 3 repeats of its file (24 passed).
