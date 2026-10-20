---
self_check:
  result: passed
  source: docs/artifacts/artifact-plane/requirements/ui-discovery.md#requirement-self-check
---

# Workbench discovery

## Outcome

A person who starts a Claude Code or Codex session in an ADD repository with the Plane configured sees the address of the workbench for that repository. The workbench answers at that address, and the address opens the repository.

## Need

Facts on 20 October 2026, Plane 1.23.1:

- The harness starts the MCP server (`artifact-plane mcp`) and the hook command (`artifact-plane hook`) of the committed configuration. The workbench starts only when a person runs `artifact-plane` or `artifact-plane serve` (server/app.js). No configuration step starts it.
- At session start the hook gives `additionalContext` only (server/agent-hook.js). The harness gives this text to the agent, not to the person. The text names the MCP tools and does not name the workbench (server/agent-guidance.js).
- The integration README describes the MCP server and the hooks. It does not tell the person to start the workbench.
- The workbench start page asks for the absolute path of a repository. No address parameter opens a repository.
- The server listens on 127.0.0.1 at `PORT`, default 4310. A second server on a used port fails with an error. No route identifies a Plane server or its version.
- Claude Code 2.1.301 and codex-cli 0.163.0 accept `systemMessage` in the output of a session start hook and show it to the person (Claude Code hooks reference; Codex `hooks/src/events/session_start.rs` shows it as a warning).
- The owner reported on 20 October 2026 that a new user does not know about the workbench, because it does not open when the MCP server connects.
- The owner decided on 20 October 2026: the hook starts the server in the background when no Plane server answers, and shows the address; the hook does not open a browser; the address opens the repository of the session.

## Requirements

- UD1: When a session starts or resumes in an ADD repository, the person sees one line with the workbench address for the repository of the session.
- UD2: When no Plane server answers at the address, the hook starts one in the background. The server keeps running after the session ends.
- UD3: When a Plane server already answers at the address, the hook starts no other server.
- UD4: The address opens the repository of the session in the workbench. It selects the project tab of that repository, or it opens a new tab for it.
- UD5: The context that the agent gets at session start names the same address.
- UD6: The person can turn off the server start. The line then gives the command that starts the server.
- UD7: When another program holds the port, or the start fails, the line says that the workbench is not available and gives the command that starts it. The line never gives an address that leads to another program.
- UD8: The hook does not open a browser.
- UD9: The integration README describes the server start, the address and how to turn off the start.
- UD10: Outside an ADD repository the hook starts nothing and shows no line. The guarantees of AI7 stay: a failure never stops agent work, and the hook exits with status 0.
- UD11: The existing hook outputs, MCP tools, HTTP interface and `serve` command keep their behavior.

## Acceptance criteria

- UDA1: A Node test sends a session start input in an ADD repository with no server at the port. The hook starts a server in a detached process, the output shows the address to the person, and the agent context names the same address.
- UDA2: A Node test with a Plane server at the port shows the address and starts no process.
- UDA3: A Node test with another program at the port shows the unavailable line with the start command and starts no process.
- UDA4: A browser test opens the address of a repository: a new tab opens that repository. A second opening of the same address selects the existing tab.
- UDA5: A Node test with the start turned off starts no process, and the line gives the start command.
- UDA6: A Node test outside an ADD repository gives no line and starts no process. A test with a failed start exits with status 0 and keeps the agent context of AI3.
- UDA7: In this repository, a new Claude Code session and a new Codex session show the line, and the address opens the work page of the repository. The evidence records the harness versions.
- UDA8: The existing Node, browser and Go suites and the executable smoke check pass.

## Affected artifacts and flows

Artifact Plane only. Flows: agent-session-guidance changes its start step (server start and address line); project-tabs changes its open step (open by address). The ADD bundle, `se-adopt`, the MCP tools and the other Plane flows are not changed.

## Requirement self-check

Each fact comes from the code, the integration README, the harness documentation and source, or the owner's report and decision. Each requirement states one need and is testable through UDA1 to UDA8. The address format, the identification of a Plane server, the turn-off setting, the start detection time and the sources of session start that show the line belong to Specification. KISS: the hook reuses the existing `serve` command and adds no store; the person keeps one server for all repositories. STE: one rule in each item. No blocker prevents Specification.
