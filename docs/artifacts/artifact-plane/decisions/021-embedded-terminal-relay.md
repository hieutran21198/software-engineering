# Embed terminal sessions through ttyd behind the Plane server

## Context

Role sessions run in a terminal, where the harness tool gives the conversation (requirement AO27). The owner wants that terminal inside the session page (requirement AO28). Node has no built-in pseudo-terminal, and the release ships six single-executable builds and a Nix package that installs no native build scripts. A terminal in the browser can type into a shell, so it must stay reachable only from the local workbench.

## Alternatives

| Option | Description | Assessment |
| --- | --- | --- |
| A. ttyd on a private UNIX socket, forwarded by the Plane server | The runner starts ttyd with the herdr attach command of the session. The server forwards the page and WebSocket after its Host and Origin checks. | A real terminal with the full harness interface, no native module in Plane, no new network port. ttyd is MIT-licensed and packaged for Nix, Homebrew and Windows. Selected. |
| B. ttyd on a loopback port | The browser connects to ttyd directly. | Any local page or process can reach the port; ttyd basic authentication does not fit an iframe. Rejected. |
| C. node-pty and xterm.js in Plane | Plane hosts the pseudo-terminal itself. | Needs a native module for six release targets and the Nix package. Rejected. |
| D. Read-only screen mirror through herdr | Plane polls the pane screen and shows it. | No typing, and a polled screen is not a terminal stream. Rejected for the main view. |

## Decision

Adopt option A as defined in specifications/agent-orchestration.md. Each terminal session uses its own named herdr session, so its client shows only that session.

## Consequences

ttyd becomes an optional external program, like herdr. The server gains one forwarding route with WebSocket upgrade. Plane forwards only the keys of the person and generates no input. Browser shortcuts stay with the browser; Full screen and the terminal app remain available.
