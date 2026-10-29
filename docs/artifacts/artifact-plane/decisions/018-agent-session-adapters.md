# Start agent sessions through ACP and herdr behind one session port

## Context

The owner wants Plane to start and coordinate agent sessions in Claude Code, Codex, OpenCode V2, Command Code and Gemini CLI. Vendors restrict their subscription models to their own harness tools. Plane must route no model traffic and must handle no credential. Anthropic Consumer Terms section 3(7) forbid automated access with a Claude plan sign-in, except through an API key or where Anthropic permits it explicitly. [ADR 006](006-codex-observer.md) kept agent execution outside Plane.

## Alternatives

| Option | Description | Assessment |
| --- | --- | --- |
| A. ACP client plus herdr terminal sessions | Plane is an Agent Client Protocol client for harness tools that offer an ACP agent. A herdr pane runs a harness tool that a person must drive. Both connect through one session port. | One protocol covers all five harness tools with structured messages, permission requests, cancellation, model options and resume. herdr keeps terminal sessions alive and reports when an agent waits. Selected. |
| B. One vendor interface for each harness tool | Use the Claude Agent SDK, the Codex app server, the OpenCode server API, and so on. | Five different integrations to build and maintain. The ACP agents already wrap most of these interfaces. Rejected. |
| C. Terminals only, with typed input | Run every harness tool in a multiplexer and send keys to it. | No structured events or permission requests, fragile screen reading, and typed input to a Claude plan session breaks the terms. Rejected. |
| D. Terminals in the browser | Host pseudo-terminals in the server and show them with a terminal widget. | Needs a native terminal library for six release targets and the Nix package. It adds a shell that the HTTP server controls. Rejected for this change. |
| E. Plane calls model APIs | Plane sends prompts to vendor APIs itself. | Plane would route model traffic and hold credentials. Rejected by the owner constraints. |

## Decision

Adopt option A as defined in specifications/agent-orchestration.md. A launch profile selects the ACP or the terminal connection. A Claude profile with a plan sign-in uses the terminal connection only.

## Consequences

Plane depends on the ACP agent programs and on herdr only when a person configures a profile that uses them. ACP changes between protocol versions 1 and 2, so the client negotiates the version and supports both resume methods. A terminal session gives coarse states only: herdr status and the existing hooks. This decision replaces the part of ADR 006 that kept agent execution outside Plane. The observer of ADR 006 stays unchanged.
