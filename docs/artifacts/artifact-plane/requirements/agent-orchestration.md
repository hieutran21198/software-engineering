---
self_check:
  result: passed
  source: docs/artifacts/artifact-plane/requirements/agent-orchestration.md#self-check
claims:
  - id: harness-session-interfaces
    kind: assumption
    statement: Claude Code, Codex, OpenCode V2, Command Code and Gemini CLI each offer a session interface that a local program can start, prompt, cancel and resume, or run as a terminal program that a person drives.
    status: open
    basis: documented
    check: Read the current interface documentation of each harness tool, then start, prompt, cancel and resume one session of each in a disposable clone.
    risk_if_wrong: A harness tool cannot take part, and AOA1 fails for it.
  - id: claude-plan-automation
    kind: risk
    statement: Anthropic Consumer Terms section 3(7) forbid access through automated means, except with an API key or where Anthropic permits it explicitly. Prompts that Plane sends to a Claude session with a plan login can break these terms.
    status: open
    basis: documented
    check: Read the current Anthropic Consumer Terms and the Claude Help Center article on the Agent SDK with a Claude plan before the Specification relies on them.
    risk_if_wrong: A permitted automation is refused, or a forbidden one is offered to the person.
---

# Agent orchestration requirements

## Need

The owner wants to run ADD across several harness tools directly from Plane, and to keep the delivered observation. Vendors restrict their subscription models to their own harness tools. Thus one harness tool cannot serve every model, and this limits model choice and teamwork. A person must choose the harness tool and the model for each ADD role and task: a frontier model for hard work and a fast model for easy work.

## Owner constraints

- Plane coordinates sessions as an event-driven system. Each harness tool connects through one adapter boundary.
- Plane routes no model traffic. Plane reads, stores and forwards no credential. Each harness tool uses its own sign-in.
- The delivered observation stays available.
- Each harness tool keeps its own sign-in and its own model providers. Plane only reads what the harness tool reports.

## Requirements

- AO1: A person can start an agent session for the coordinator, product owner, technical lead or implementer role from the workbench. An implementer session names one task of a current change.
- AO2: Each session starts only on an explicit request of a person. Plane starts no session automatically, and an agent cannot start a session through Plane.
- AO3: A person chooses a launch profile for each session. A profile names the harness tool, the connection kind, the sign-in kind, the model and, where the harness tool offers it, the reasoning level.
- AO4: Launch profiles are personal settings outside every repository. A profile contains no credential value.
- AO5: An implementer session works in the worktree of its task. Plane refuses an implementer session in a checkout of `main` or `master`.
- AO6: For a session that reports structured events, the person answers permission requests, reads the last agent message of each turn and sends messages in the workbench. The workbench shows no step-by-step agent activity.
- AO7: For a session that a person drives in a terminal, the workbench shows when the agent waits for the person and opens that terminal on request. After the harness program starts, Plane sends no text and no keys into that terminal.
- AO8: The workbench shows the role, task, harness tool, model and state of each session, and the DoD progress of its task. It shows the sessions that wait for the person.
- AO9: The person can stop the current turn of a session and can end a session.
- AO10: After an interruption, the person can continue the live session, resume the same harness session, or start a new attempt with the same or another profile. A new attempt starts from the task, its branch and its recorded evidence.
- AO11: A task has at most one active attempt. A repeated start request for that task creates no second session.
- AO12: A restart of the Plane server does not end the running sessions. After the restart, the workbench shows their state again.
- AO13: Plane stores no prompt, message text, transcript, tool argument, tool output or credential. The harness tool keeps the session history.
- AO14: Plane adds no option that skips a harness permission prompt, and it keeps all existing permission rules.
- AO15: Plane accepts session commands only from the local workbench, with the existing loopback, Host and Origin checks.
- AO16: Plane approves no plan, checks no DoD item, merges nothing and establishes no version. Plan approval stays in the conversation of the person with the coordinator.
- AO17: For Claude with a plan sign-in, a person types every prompt and every permission answer. Plane only starts the official Claude Code program on the request of the person and observes it.
- AO18: When the person configures no launch profile, the delivered observation, hooks, MCP tools and workbench behave as before.
- AO19: A missing harness program, a failed sign-in or a stopped session shows a reason in the workbench. The failure changes no repository file.
- AO20: For each session, the workbench shows its output since the session started: the commits, and the changed files as a tree with the diff of each file, uncommitted changes included.
- AO21: The person creates, edits, duplicates and deletes launch profiles in the workbench. Plane writes them only to the personal settings file.
- AO22: The workbench lists the supported harness tools on the computer with their programs, versions, connection kinds, sign-in state, models and reasoning levels. A check on request reads these facts without a prompt.
- AO23: The person sets a default profile for each ADD role. The launch dialog selects it, and the person can choose another profile for each session.
- AO24: A profile that the workbench saves runs only a program of a supported harness tool. Its extra arguments and environment variable names pass the permission-bypass and credential checks.
- AO25: The profile editor offers the models of the selected harness tool and the effort levels of the selected model as lists. The person does not type a model ID or an effort level.
- AO26: The person starts ADD work from the workbench with a written request. Plane starts a coordinator session with the request in its initial prompt and keeps no copy of the request.
- AO27: For a coordinator, product owner or technical lead session with structured events, the workbench shows a conversation: the messages of the person and the final agent message of each turn, without tool activity. The person replies in that conversation.

## Acceptance criteria

- AOA1: With one profile for each of Claude Code, Codex, OpenCode V2, Command Code and Gemini CLI, a person starts a session. The workbench shows its role, harness tool, model and state. The live evidence records each harness version, or names the missing capability.
- AOA2: An implementer session with structured events asks for a permission. The person answers in the workbench, and the agent continues.
- AOA3: A terminal session that waits for the person shows as waiting. Open terminal shows that session. A test confirms that Plane sends no input to it after the start command.
- AOA4: After its agent process stops, an attempt shows as interrupted. Resume reattaches the same harness session. Respawn starts a new attempt with another profile on the same task branch.
- AOA5: A second start request for a task with an active attempt returns the existing attempt.
- AOA6: After a restart of the Plane server, running sessions continue and show their state again.
- AOA7: Tests confirm that the store contains no message text, prompt or credential, that foreign Host and Origin values are refused, and that no started command contains a permission-bypass option.
- AOA8: Existing Node, browser and record checks pass. A screenshot review at desktop and narrow widths matches the approved UI/UX mockups.
- AOA9: After a session changes files, its page shows the changed files as a tree, their line counts and the diff of a selected file since the session started. The page shows no tool activity log.
- AOA10: In the workbench, the person checks a harness tool, creates a profile by choosing a model and an effort level from lists, and sets it as the implementer default. Another model shows its own effort levels.
- AOA11: The person writes a request and starts ADD work. A coordinator session with the coordinator default profile starts in the selected worktree, the agent receives the request, and the runtime store holds no request text.
- AOA12: A role session over ACP shows each message of the person and the final agent reply of each turn, and no tool call. After a resume, the conversation shows again from the replay of the harness tool. The settings file outside every repository holds the profile, and the launch dialog selects it. A bypass option or a credential-like variable name is refused with a reason.

## Impact

Artifact Plane owns this capability. The artifact-driven method keeps ownership of roles, phases, approval and establishment; the change needs no ADD change and no new artifact dependency. The amended statements are in the [explorer constraints](explorer.md#constraints), the [Codex execution boundary](codex-execution.md#need-and-boundary) and [OP8](opencode-support.md#requirements). The change modifies the `execution-observation` flow and creates flows for session start and session recovery.

## Self-check

Each requirement states a need or an owner constraint, not an adapter technology. The scope excludes agent-started sessions, automatic dispatch, remote runners, team mode, a terminal inside the workbench, approvals recorded by Plane and credential handling. The two claims stay open until the Specification checks the vendor documentation. No blocker prevents Specification. KISS and STE checklists applied.

The Technical Lead returned AO7: herdr starts a program by typing its command line into the shell of the new pane. AO7 now forbids input only after the harness program starts. The start command contains only the profile command and the fixed initial prompt.

After the UI/UX review, the owner asked for task progress and task output instead of the agent process. AO6 and AO8 now show the last message and the DoD progress, and AO20 and AOA9 add the output tree and diffs.

The owner then asked for profile and provider configuration in the workbench. AO21 to AO24 and AOA10 add agent settings: providers, profiles and role defaults. Credential handling stays excluded. The owner prefers lists to typed values; AO25 makes model and effort lists that depend on the harness tool and the model.

The owner asked where ADD work starts and where the person chats. AO26 adds a start of ADD work with a written request, and AO27 adds a conversation for role sessions over ACP. Implementer sessions keep the output view of AO20.
