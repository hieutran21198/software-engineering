---
id: verify-interfaces
depends_on: []
covers:
  - element: requirements/agent-orchestration.md
    ids: [AO7, AO17, AO22, AO25, AO28]
---

# Verify the harness interfaces

## Scope and ownership

One implementer checks the documented interfaces in a disposable environment with the Live check runbook. The task changes no repository code. The coordinator owns the claims and any Amendment of `specifications/agent-orchestration.md`.

On 2026-10-29, this computer has `claude` 2.1.312, `codex` 0.165.0 and `cmd` 1.88.0. `claude-agent-acp`, `codex-acp`, `opencode`, `gemini`, `herdr` and `ttyd` are missing. Install them only in the disposable environment, for example with `nix shell` or a temporary npm prefix, after the owner agrees. The checks use the existing sign-ins of the owner. Only the model flag check sends a prompt: one short prompt for each terminal program.

## Governing knowledge

`specifications/agent-orchestration.md`: claims, Provider catalog, Provider check, Terminal adapter, Embedded terminal and Interface sources. ADR 018 and ADR 021.

## Definition of Done

- [x] Record the environment and the version of each program.
- [x] For each ACP program, record the initialize response (protocol version, `loadSession`, resume capability and sign-in methods), the `session/new` result and the config options of the categories `model` and `thought_level`.
- [x] For one ACP agent with two models, compare the effort levels after `session/set_config_option` with the levels of a new session of each model (claim `per-model-effort-discovery`).
- [x] Record the protocol version, resume method and option IDs of `cmd acp` (claim `commandcode-acp-shape`).
- [x] With only a Claude plan sign-in, start `claude-agent-acp --hide-claude-auth` and record whether `session/new` returns an authentication error (claim `claude-acp-plan-sign-in`).
- [x] Start each terminal program with its model flag, and its effort flag where the catalog names one. Record the model that the program reports, or why the program could not start a turn (claim `terminal-model-flags`).
- [x] Create two named herdr sessions with `tab create`, read the `pane list` states, stop one with `server stop` and record which servers and panes remain (claim `herdr-named-sessions`).
- [x] Run ttyd with `--interface` on a UNIX socket, `--base-path`, `--check-origin` and `--writable` in front of `herdr session attach`. Record that a WebSocket with a foreign Origin is refused and that typed keys reach the pane.
- [x] After the provider checks, list the sessions of each harness tool and record whether empty sessions appear (claim `provider-check-history`).
- [x] Label the results as live evidence, record no secret, and delete the environment. Send each refuted claim to the coordinator before a dependent task starts.

## Evidence

Live evidence, 2026-10-29 14:01 to 14:32 +07, NixOS 26.11, Linux 6.18.56, a disposable clone at 4b33403 with a local `main`, the real home directory for the sign-ins. Programs: claude 2.1.312 (no prompt), codex 0.165.0, cmd 1.88.0, node v24.21.0, and for the check claude-agent-acp 0.99.0, codex-acp 2.3.0 (bundles codex 0.164.0), `@opencode/cli` 2.2.0 (the owner's `opencode2` 2.2.0 ran the live OpenCode calls), Gemini CLI 0.66.0, ttyd 1.7.7 (nixpkgs) and herdr 0.9.5 (nixpkgs-unstable). No login command, no `authenticate` call, no bypass flag and no ACP prompt. One short prompt each went to Codex, OpenCode, Command Code and Gemini CLI. The environment is deleted; the detailed record and the probe scripts stay outside the repository in the session scratchpad.

- ACP: codex-acp and claude-agent-acp negotiate version 2; OpenCode, Command Code and Gemini CLI negotiate version 1. Version 2 names the option field `configId` and the sign-in method field `methodId`. OpenCode offers `loadSession`, resume, close and list, the options `model` (101 values), `effort` and `mode`. Gemini CLI offers `loadSession` but no resume, close or list, and `session/new` returns -32000 "Gemini API key is missing or not configured".
- `cmd acp`: version 1, `loadSession`, resume, list and close, options `model` (92 values) and `effort` (category `thought_level`), sign-in method `command-code-cli`, plus the older `models` and `modes` fields; the modes include `bypass` and `dont-ask`. During `session/new`, it marked the hooks of the clone as trusted without a prompt.
- Claude ACP with only a plan sign-in: no sign-in method is listed, and `session/new` fails with -32000 "This integration does not support using claude.ai subscriptions." after the SDK start and the project hooks ran.
- Effort levels: for Codex, the reply to each model change holds the levels of the new model, and new sessions on each model show the same levels. For OpenCode, 3 of 50 quick replies held the previous model; a later `config_option_update` held the right one. In another run, OpenCode refused all 28 listed `github-copilot/*` models. Command Code replies named the requested model each time. The claim `per-model-effort-discovery` is refuted.
- Terminal commands: `codex --model gpt-6-luna -c model_reasoning_effort=low` works (seen through `codex exec`, because the screen stopped at the folder-trust dialog). `opencode --model` fails with "Unrecognized flag: --model"; `opencode mini --model <provider/model> --prompt <text>` works, and the level is `#<level>` after the model. `cmd --model` works, and `cmd` has `--effort`. Gemini CLI could not start a turn without a sign-in. The claim `terminal-model-flags` is refuted for OpenCode.
- herdr: `tab create` with a stopped named session fails with `server_not_running`. A detached `herdr --session <name> server` has no workspace, so `tab create` fails with `workspace_not_found`; `workspace create` works and returns `.result.root_pane.pane_id` and `.result.tab.tab_id`. `pane run` needs `--session`, because pane IDs repeat. `--env` reaches the pane. The shell history keeps the literal command line with `"$ARTIFACT_PLANE_PROMPT"` and never the prompt text. `server stop` stops only its own session. Attach is `herdr session attach <name>`. herdr did not detect `cmd` or `gemini` (status `unknown`). The claim `herdr-named-sessions` is refuted.
- ttyd: a WebSocket with a foreign, missing or different Origin is closed without a status; a matching Origin and Host gets 101. Keys sent 4 seconds after the connection created a file in the clone; keys sent after 2.5 seconds were lost. `--base-path` serves under the prefix. ttyd starts one herdr client for each viewer. The socket has mode 0660 under umask 077. A socket path must be shorter than 108 bytes.
- History: OpenCode lists two empty "Untitled session" entries from the checks; Command Code keeps a `meta.json` without a transcript; Claude leaves an empty `session-env` directory; Codex and Gemini CLI keep no session. The claim `provider-check-history` is supported.

Side effects outside the disposable environment: the hooks of the clone wrote 5 events to the owner's runtime store and sent `GET /api/plane` to the running workbench. The check stopped one `artifact-plane mcp` process that the OpenCode service had started for the clone. The owner's harness histories keep the check sessions: OpenCode `ses_e798006f4ffeWNBO29KiqL6l6g`, `ses_e797f32e1ffet7id9QVNqlv0nj` and `ses_e7971c239ffehTuOe23Hv6tQDb`, a Command Code project folder and a hook-trust entry for the deleted clone path, a Claude `session-env` directory, and Gemini project entries. Nothing was deleted outside the disposable environment.
