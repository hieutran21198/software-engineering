---
id: sessions-ui
depends_on: [session-api, terminal-relay, settings-ui]
covers:
  - element: requirements/agent-orchestration.md
    ids: [AO1, AO3, AO6, AO7, AO8, AO9, AO10, AO19, AO20, AO23, AO26, AO27, AO28, AOA9, AOA12]
---

# Session pages and dialogs

## Scope and ownership

One implementer adds the Sessions page, the session pages of ACP and terminal sessions, the launch dialog, the Start ADD work dialog on the Work page, the recovery choices, the waiting count in the top bar and the harness tool and model in the task runtime details, in `apps/artifact-plane/src`. Browser tests use a fake runner and a fake relay.

## Governing knowledge

`specifications/agent-orchestration.md`: Workbench, Start rules, Recovery, Embedded terminal and Failures. Mockup artboards 1, 2, 3, 3b, 4, 5, 7 and 9 of the approved canvas.

## Definition of Done

- [ ] The Sessions page groups implementation tasks with a session by change. Each row shows the task, its DoD progress, an output summary, the harness tool and model, and the state. A second group lists the role sessions (artboard 1).
- [ ] An ACP session page shows the header, Stop turn, End session, a pending permission request with the options of the agent, the DoD checklist, the commits, the last agent message, the output tree with the diff of the selected file, and the message field (artboard 2).
- [ ] A terminal session page shows the change phases, the state, the embedded terminal with Full screen and Open in terminal app, End session and the output tree (artboard 3).
- [ ] When a terminal session waits, its page shows the notice above the terminal with the tool name or the general text, marks the terminal border and offers Focus terminal. The notice has no answer control (artboard 3b).
- [ ] At a narrow width, a terminal session page shows "Open this session on a computer". Without the relay, it offers Open in terminal app only.
- [ ] The launch dialog opens from the task details, the change page and the Sessions page. It selects the role default, shows the warnings of the start rules and shows each refusal reason (artboard 4).
- [ ] The Work page has Start ADD work. Its dialog takes the request, the worktree and a coordinator profile from the terminal profiles, and Start opens the session page (artboard 9).
- [ ] An interrupted or ended session offers the choices of the Recovery table (artboard 5).
- [ ] The top bar shows the number of waiting sessions. At phone width, the Sessions page shows the waiting sessions first (artboard 7).
- [ ] The workbench shows no tool call log and no message stream.
- [ ] Browser tests cover the output tree and the diff of a session (AOA9), the refusal of a role session with an ACP profile, and a role session page with phases, output and terminal and no chat (AOA12).
