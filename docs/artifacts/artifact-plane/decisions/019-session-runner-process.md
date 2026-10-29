# Host ACP sessions in a separate runner process

## Context

An ACP agent runs as a child process that talks to its client through standard input and output. When the client process ends, the agent ends. Requirement AO12 needs running sessions to continue when the Plane server restarts.

## Alternatives

| Option | Description | Assessment |
| --- | --- | --- |
| A. One runner process for each state directory | The server starts a detached `artifact-plane runner`. The runner owns all ACP child processes and talks to the server through a private local socket. | Sessions continue across server restarts. One process to find, one socket and one owner for live message buffers. Selected. |
| B. ACP children of the server | The server spawns each agent directly. | A server restart ends every session, so AO12 fails. Rejected. |
| C. One detached process for each session | Each session gets its own helper process. | The server must find and reconnect to many helpers, and each needs its own socket and lifetime rules. Rejected. |
| D. Run ACP agents inside herdr | Use herdr panes for every session. | herdr connects a pane to a terminal, not to a JSON-RPC client, so structured events are lost. Rejected. |

## Decision

Adopt option A as defined in specifications/agent-orchestration.md. The runner writes lifecycle events to the existing runtime store. It keeps message text in memory only.

## Consequences

A runner restart or a machine restart ends ACP sessions; recovery uses ACP resume or a new attempt. The socket boundary can later carry a remote runner, which this change excludes. The runtime store stays the only durable state, so the runner needs no database of its own.
