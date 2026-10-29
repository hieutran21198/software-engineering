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

- [ ] Record the environment and the version of each program.
- [ ] For each ACP program, record the initialize response (protocol version, `loadSession`, resume capability and sign-in methods), the `session/new` result and the config options of the categories `model` and `thought_level`.
- [ ] For one ACP agent with two models, compare the effort levels after `session/set_config_option` with the levels of a new session of each model (claim `per-model-effort-discovery`).
- [ ] Record the protocol version, resume method and option IDs of `cmd acp` (claim `commandcode-acp-shape`).
- [ ] With only a Claude plan sign-in, start `claude-agent-acp --hide-claude-auth` and record whether `session/new` returns an authentication error (claim `claude-acp-plan-sign-in`).
- [ ] Start each terminal program with its model flag, and its effort flag where the catalog names one. Record the model that the program reports (claim `terminal-model-flags`).
- [ ] Create two named herdr sessions with `tab create`, read the `pane list` states, stop one with `server stop` and record which servers and panes remain (claim `herdr-named-sessions`).
- [ ] Run ttyd with `--interface` on a UNIX socket, `--base-path`, `--check-origin` and `--writable` in front of `herdr session attach`. Record that a WebSocket with a foreign Origin is refused and that typed keys reach the pane.
- [ ] After the provider checks, list the sessions of each harness tool and record whether empty sessions appear (claim `provider-check-history`).
- [ ] Label the results as live evidence, record no secret, and delete the environment. Send each refuted claim to the coordinator before a dependent task starts.
