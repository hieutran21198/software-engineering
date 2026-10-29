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

- [ ] A person starts one session with a profile of each of Claude Code, Codex, OpenCode V2, Command Code and Gemini CLI. The workbench shows role, harness tool, model and state. The evidence records each harness version, or names the missing capability (AOA1).
- [ ] An ACP implementer session asks for a permission, the person answers in the workbench, and the agent continues (AOA2).
- [ ] A Claude Code role session with a plan sign-in waits for a permission and shows as waiting with the notice. The person types the answer in the embedded terminal, and Claude Code receives it. Open in terminal app shows the same session (AOA3, AOA13).
- [ ] A request to the live relay with a foreign Host or Origin is refused (AOA13).
- [ ] After its agent process stops, an attempt shows as interrupted. Resume reattaches the same harness session. Respawn starts a new attempt with another profile on the same task branch (AOA4).
- [ ] After a restart of the Plane server, the running sessions continue and show their state again (AOA6).
- [ ] A real provider check lists two models with different effort levels, and a profile created from the lists starts with its model (AOA10).
- [ ] Start ADD work starts a coordinator session in a terminal. The agent receives the request, and neither the runtime store nor the shell history of the pane holds the request text (AOA11).
- [ ] With a Gemini sign-in, a Gemini terminal profile starts with its model (claim `gemini-terminal-model-flag`), or the evidence names the missing sign-in.
- [ ] After any fix, the checks of `integration` pass again on the final revision. The coordinator updates the status of each claim from the evidence. The clone and its state are deleted.
