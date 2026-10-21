---
self_check:
  result: passed
  source: docs/artifacts/artifact-plane/specifications/ui-discovery.md#specification-self-check
claims:
  - id: plane-identity-route
    kind: decision
    statement: The hook identifies a Plane server with the new route
      GET /api/plane, which returns the name and the version.
    status: verified
    basis: observed
    verified_by: agent
    evidence:
      - docs/artifacts/artifact-plane/changes/change-ui-discovery/tasks/01-workbench-step.md#evidence
      - docs/artifacts/artifact-plane/changes/change-ui-discovery/tasks/03-validation.md#evidence
    rejected:
      - option: Read the HTML title of the start page.
        reason: The title is presentation text; a change of the page would
          change the test, and another program can have the same title.
      - option: Treat any answer at the port as a Plane server.
        reason: The line would then give an address that leads to another
          program, which UD7 forbids.
    risk_if_wrong: A running Plane 1.23.1 or older has no such route, so the
      hook reports the port as used by another program.
    check: Run the UDA2 and UDA3 tests, and probe a running Plane 1.23.1 by hand
      to confirm the unavailable line.
  - id: hook-port-variable
    kind: decision
    statement: The hook reads the port from ARTIFACT_PLANE_PORT, not from PORT,
      and gives the value to the server it starts as PORT.
    status: verified
    basis: observed
    verified_by: agent
    evidence:
      - docs/artifacts/artifact-plane/changes/change-ui-discovery/tasks/01-workbench-step.md#evidence
    rejected:
      - option: Read PORT, as `serve` does.
        reason: A harness often runs with PORT set for the development server of
          the project, so the hook would probe and start at that port.
    risk_if_wrong: A person who starts `serve` with PORT gets another address
      from the hook than from the server.
    check: Run the hook with PORT=3000 and no ARTIFACT_PLANE_PORT; the address
      has port 4310.
  - id: autostart-variable
    kind: decision
    statement: The environment variable ARTIFACT_PLANE_AUTOSTART=0 turns off the
      server start.
    status: verified
    basis: observed
    verified_by: agent
    evidence:
      - docs/artifacts/artifact-plane/changes/change-ui-discovery/tasks/01-workbench-step.md#evidence
      - docs/artifacts/artifact-plane/changes/change-ui-discovery/tasks/03-validation.md#evidence
    rejected:
      - option: A setting file of the Plane.
        reason: It adds a store; both harnesses already pass their environment
          and their configured env entries to a hook.
      - option: A hook command option.
        reason: The committed configuration is shared, so one person cannot turn
          off the start without a change of the shared file.
    risk_if_wrong: A person cannot find how to turn off the start.
    check: Run the UDA5 test, and read the integration README section.
  - id: canonical-root
    kind: assumption
    statement: The Git top level that the hook puts in the address is the path
      that the workbench keeps for the tab of that repository, so a second
      opening selects the existing tab.
    status: verified
    basis: observed
    verified_by: agent
    evidence:
      - docs/artifacts/artifact-plane/changes/change-ui-discovery/tasks/02-repository-address.md#evidence
    risk_if_wrong: Each new session opens one more tab of the same repository.
    check: In the UDA4 browser test, open the address with the path from
      `git rev-parse --show-toplevel` of the fixture twice and count the tabs.
  - id: start-latency
    kind: unknown
    statement: A server that the hook starts answers within 3 seconds, also at
      the first start of the executable, which extracts its assets.
    status: verified
    basis: observed
    verified_by: agent
    evidence:
      - docs/artifacts/artifact-plane/changes/change-ui-discovery/tasks/03-validation.md#evidence
    risk_if_wrong: The line says that the workbench is starting, and the person
      must wait before the address answers.
    check: Time the first start of the release executable with an empty state
      directory, and a second start.
  - id: codex-system-message
    kind: assumption
    statement: Codex 0.163.0 shows the systemMessage of a SessionStart hook to
      the person, as a warning.
    status: verified
    basis: observed
    verified_by: person
    evidence:
      - docs/artifacts/artifact-plane/changes/change-ui-discovery/tasks/03-validation.md#evidence
    risk_if_wrong: A Codex user does not see the line; the agent context still
      names the address.
    check: Start a Codex session in this repository in the UDA7 live check and
      record what the person sees.
---

# Workbench discovery contract

## Governing requirements

UD1 to UD11 in requirements/ui-discovery.md.

## Identity route

The server answers `GET /api/plane` with status 200 and `{"name":"artifact-plane","version":"<package version>"}`. The route has the host and origin checks of the other routes. Another method gets status 405.

## Workbench step

On SessionStart with any source, the hook runs the workbench step in parallel with the session context step. The step has its own limit of 4 seconds. It runs only in an ADD repository (specifications/agent-integration.md, Hook command). The root is the Git top level of `cwd`.

The port is `ARTIFACT_PLANE_PORT` when it is an integer from 1 to 65535, else 4310. An invalid value is a failed start. The address is `http://127.0.0.1:<port>/?repository=<root>`, with the root encoded by `encodeURIComponent`.

A probe sends `GET http://127.0.0.1:<port>/api/plane` and waits at most 500 milliseconds. Its result is one of:

| Result | Condition |
| --- | --- |
| plane | Status 200 and a JSON body with `name` `artifact-plane`. |
| free | The connection is refused. |
| other | Any other answer, an error or a timeout. |

The step then works as follows:

1. Probe once. On plane, the state is ready.
2. On other, the state is unavailable.
3. On free with `ARTIFACT_PLANE_AUTOSTART=0`, the state is off.
4. On free, start `<executable> serve` as a detached process with no standard streams, the environment of the hook with `PORT=<port>`, and the home directory as the working directory. `<executable>` is the program of the hook, as for the inferred binding.
5. Probe every 200 milliseconds until 3 seconds after the start. On plane, the state is ready.
6. When the started process exits, probe once more. On plane, the state is ready: another session started a server first. Else the state is unavailable.
7. When the 3 seconds pass and the process runs, the state is starting.

The step never opens a browser and never stops a server. The started server keeps running after the session ends, until the person stops it.

## Lines

`<command>` is `artifact-plane serve` for port 4310, else `PORT=<port> artifact-plane serve`.

| State | Line for the person |
| --- | --- |
| ready | `Artifact Plane workbench: <address>` |
| starting | `Artifact Plane workbench is starting: <address>` |
| off | `Artifact Plane workbench: run <command>, then open <address>` |
| unavailable | `Artifact Plane workbench is not available at port <port>. Run <command> to see why, or set ARTIFACT_PLANE_PORT to another port.` |

The unavailable line gives no address. A step that fails or passes its limit gives no line and adds the hook unavailable line to standard error, as the other steps do.

## Hook output

The SessionStart output adds two parts for Claude Code and Codex:

- `systemMessage` holds the line for the person when the source is `startup` or `resume`. Other sources show no line.
- `additionalContext` is the session context text, then a new line, then `Workbench for people: <line>`. With no session context text, it is the workbench line alone.

For Antigravity, the combined `additionalContext` string (the session context text and `Workbench for people: <line>`, or either one alone) is returned in `{"injectSteps":[{"systemMessage":{"systemMessage":"<context>"}}]}`.

With no line and no session context text, the output stays `{}`. The other events and their outputs do not change. Outside an ADD repository the step starts nothing and gives no line.

## Repository address

At load, the workbench reads the `repository` query parameter of its address. When the value is an absolute path:

- When a restored tab has the same path, that tab becomes active.
- Else a new tab with that path is added after the restored tabs and becomes active. It opens as a restored project opens.

The workbench then removes the query from the address with `history.replaceState`, so a reload does not add the tab again. A value that is not an absolute path is removed and ignored. The project preferences store the tab as for any opened project. A missing repository keeps the behavior of a missing restored project.

## Documentation

The integration README gets a section "Workbench" with: the start at session start, the address line, the four states, `ARTIFACT_PLANE_PORT`, `ARTIFACT_PLANE_AUTOSTART=0` and how to set an environment variable for each harness, and how to stop the server. The Plane README links to it from the Run section.

## Specification self-check

Each requirement maps to a section: UD1 and UD5 to Hook output and Lines; UD2, UD3, UD7 and UD8 to Workbench step; UD4 to Repository address; UD6 to Workbench step and Lines; UD9 to Documentation; UD10 and UD11 to Workbench step and Hook output, with the fail-open rules of the agent integration contract. KISS: one route, one hook step, one query parameter and two environment variables; no store and no new command. Open decisions and unknowns are claims with checks. STE: one rule in each item or row. The impact service on 20 October 2026 reached nine Plane flows from the changed modules; agent-session-guidance and project-tabs change, and the other seven keep their steps because the existing routes and outputs do not change.
