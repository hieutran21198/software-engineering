---
id: sessions-ui
depends_on: [session-api, terminal-relay, settings-ui]
covers:
  - element: requirements/agent-orchestration.md
    ids: [AO1, AO3, AO6, AO7, AO8, AO9, AO10, AO19, AO20, AO23, AO26, AO27, AO28, AOA9, AOA12]
---

# Session pages and dialogs

## Scope and ownership

One implementer adds the Sessions page, the session pages of ACP and terminal sessions, the launch dialog, the Start ADD work dialog on the Work page, the recovery choices, the waiting count in the top bar and the harness tool and model in the task runtime details, in `apps/artifact-plane/src`. Browser tests use a fake runner and a fake relay. The task also moves the bound of `RuntimeStore.waitingTool` to the previous state change of the session (fourth amendment).

## Governing knowledge

`specifications/agent-orchestration.md`: Workbench, Start rules, Recovery, Embedded terminal and Failures. Mockup artboards 1, 2, 3, 3b, 4, 5, 7 and 9 of the approved canvas.

## Definition of Done

- [x] The Sessions page groups implementation tasks with a session by change. Each row shows the task, its DoD progress, an output summary, the harness tool and model, and the state. A second group lists the role sessions (artboard 1).
- [x] An ACP session page shows the header, Stop turn, End session, a pending permission request with the options of the agent, the DoD checklist, the commits, the last agent message, the output tree with the diff of the selected file, and the message field (artboard 2).
- [x] A terminal session page shows the change phases, the state, the embedded terminal with Full screen and Open in terminal app, End session and the output tree (artboard 3).
- [x] When a terminal session waits, its page shows the notice above the terminal with the tool name or the general text, marks the terminal border and offers Focus terminal. The notice has no answer control (artboard 3b). A test records a `PermissionRequest` hook observation before herdr reports `blocked`, and the notice names its tool. When herdr reports `unknown` for the agent, the page says that Plane cannot see when this agent waits.
- [x] At a narrow width, a terminal session page shows "Open this session on a computer". Without the relay, it offers Open in terminal app only.
- [x] The launch dialog opens from the task details, the change page and the Sessions page. It selects the role default, shows the warnings of the start rules and shows each refusal reason (artboard 4).
- [x] The Work page has Start ADD work. Its dialog takes the request, the worktree and a coordinator profile from the terminal profiles, and Start opens the session page (artboard 9).
- [x] An interrupted or ended session offers the choices of the Recovery table (artboard 5). For a role session, Respawn starts a new session with the same role and change.
- [x] A coordinator session without a change shows the phases of the current change of its worktree when exactly one exists.
- [x] The top bar shows the number of waiting sessions. At phone width, the Sessions page shows the waiting sessions first (artboard 7).
- [x] The workbench shows no tool call log and no message stream.
- [x] Browser tests cover the output tree and the diff of a session (AOA9), the refusal of a role session with an ACP profile, and a role session page with phases, output and terminal and no chat (AOA12).

## Evidence

Commits f60419e and 2542cef (rebased from 2e963fa and ee90262) add the Sessions page, the session pages, the launch dialog, Start ADD work, the recovery choices, the waiting count and the task runtime model, and move the bound of `RuntimeStore.waitingTool` to the previous state change. Browser tests in `test/browser/sessions.spec.js` use an injected fake runner and a stub relay page.

- Sessions page (artboards 1 and 7): tasks grouped by change with DoD meter, output summary, harness tool, model and state, then the role sessions; the top bar shows "2 sessions need you" and updates to 3; at 390 pixels the waiting sessions come first and a permission can be answered from its card.
- ACP session page (artboard 2, AOA9): Allow always sends the selected option and the card leaves; the message field waits for the end of the turn; Stop turn and End session call the runner; the file tree shows line counts and the diff of the selected file. Recorded tool hooks and lifecycle events do not appear on the page.
- Terminal session page (artboards 3 and 3b, AOA12): phases, state, the embedded terminal frame from `/api/sessions/terminal/<id>/`, Full screen, Open in terminal app and output, with no text field and no last message. A `PermissionRequest` hook before herdr `blocked` gives the notice "Claude Code asks to use Bash"; a later wait without a request gives the general text; herdr `unknown` gives "Plane cannot see when this agent waits." A real-runner Node test gives the same tool names, and fails with the old bound.
- Without the relay, the page shows the reason and Open in terminal app only; at a narrow width it shows "Open this session on a computer".
- Launch dialog (artboard 4): it opens from the task details, the change page and the Sessions page, selects the role default and a task-branch worktree, shows the prerequisite DoD warnings, the unestablished upstream and the plan approval sentence, and shows the refusals of start rule 3 and of a missing program. A role session with an ACP profile shows the exact rule 5 text, also when the server refuses it.
- Start ADD work (artboard 9): only terminal coordinator profiles are listed; the prompt carries the request, and the store bytes hold no copy.
- Recovery (artboard 5): Resume, Respawn and Respawn with another profile; Respawn of a technical lead starts the same role and change without `respawnOf`; a coordinator without a change asks for the request again.
- A coordinator without a change shows the phases of the one current change of its worktree.
- Task runtime details show the harness tool and the model. Without a profile, no session control appears.
- The coordinator looked at the Sessions page, the ACP session page and the waiting terminal page at 1440 pixels; they match the mockups.

The coordinator ran the Node suite on the rebased branch: 714 tests, 713 passed, 1 skipped (the existing pinned-model network test), 0 failed. The implementer ran the browser suite: 195 passed, 12 of them new; an earlier run had two timing failures of the existing context packet export test that passed again in isolation and in the final run.
