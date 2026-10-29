---
id: acp-client
depends_on: [verify-interfaces, settings]
covers:
  - element: requirements/agent-orchestration.md
    ids: [AO6, AO9, AO10, AO13, AO14, AO22, AO25, AOA2]
---

# ACP client and provider check

## Scope and ownership

One implementer adds the ACP client and the provider check in `apps/artifact-plane/server`, the route `POST /api/settings/check`, and a fake ACP agent for tests that speaks protocol version 1 or 2. The runner hosts the client later; this task tests it directly.

## Governing knowledge

`specifications/agent-orchestration.md`: ACP adapter, Provider check, Lifecycle events and Failures. ADR 018. The live evidence of `verify-interfaces`.

## Definition of Done

- [x] The client sends `initialize` with version 2 and accepts versions 1 and 2. It declares no file system and no terminal capability, and it answers each client method call of the agent with method-not-found.
- [x] `session/new` gets the worktree as `cwd` and one stdio MCP server: the Plane executable with `mcp`. An authentication error ends the session with reason `error` and the sign-in message of the contract. The client never calls the authentication method.
- [x] The client sets the profile model and level through the options of the categories `model` and `thought_level`, as `configId`, with `type: "id"` in version 2. A missing option or a refused value keeps the session and records the model as declared. The client sets no other option.
- [x] The client sends one prompt at a time and refuses a prompt while a turn runs. It keeps only the joined agent message of the last turn, at most 64 KiB. It discards the content of other updates. A turn ends with the prompt response in version 1 and with an idle `state_update` in version 2.
- [x] A permission request stays pending until the person selects one of its options. Cancel sends `session/cancel` and answers each pending request with `cancelled`. A test confirms that no request is answered without a selected option.
- [x] Resume uses `session/resume` with `replayFrom: {type: "start"}` in version 2 and `session/load` in version 1 when `loadSession` is true. Otherwise resume is unavailable. The last message comes from the replay.
- [x] End closes standard input and stops the process after 5 seconds. Malformed JSON or an exit during start ends the session with reason `error`.
- [x] The provider check runs in a new private directory under the state directory and sends no prompt. It reads the effort levels of up to 200 models within 120 seconds through `session/set_config_option`. When a reply names another model, it waits up to 2 seconds for a `config_option_update` with the requested model, and otherwise records the levels as not checked. It leaves out a model that the agent refuses, uses the legacy model list of a version 1 agent without options, closes the session when the agent offers `session/close`, and removes the directory.
- [x] The check writes `providers.json` with mode 0600: program version, check time, models and effort levels, and no credential. A changed program version marks the result stale.
- [x] Tests with the fake agent in both versions cover each item above, and AOA2 with a fixture permission request.

## Evidence

Commit abfe167 (rebased from d5bb209) adds `server/acp-client.js`, `server/provider-check.js`, a fake ACP agent for protocol versions 1 and 2, their tests, the route `POST /api/settings/check`, and the private-file writer for `providers.json`. Every client test runs with the fake agent in version 1 and in version 2.

- Initialize: version 2 is sent; versions 1 and 2 are accepted and version 3 is refused; file system and terminal calls of the agent get -32601.
- Session: `cwd` is the worktree and the one MCP server is the Plane executable with `mcp`; a -32000 error ends the session with reason `error` and the sign-in message; no authentication call is sent; the agent runs without a shell with `ARTIFACT_PLANE_LAUNCH` and the profile variables.
- Options: `configId` for `model` and `effort`, with `type: "id"` only in version 2; no `mode` option is set; a missing or refused option keeps the session and the model stays declared.
- Turns: a second prompt during a turn is refused; only the agent message of the last turn is kept, at most the newest 64 KiB; thoughts, tool titles, arguments and output are discarded; version 1 ends a turn with the prompt response, version 2 with the idle `state_update`.
- Permissions: a request stays pending without an answer; an unknown option is refused; Cancel sends `session/cancel` and answers pending requests with `cancelled` (AOA2 with the fixture).
- Resume: `session/resume` with `replayFrom` in version 2, `session/load` in version 1, `resume-unavailable` otherwise; the last message comes from the replay. End closes standard input, then stops the process after the grace time.
- Provider check: 205 models give 200 checks and 5 models with levels not checked; a stale reply waits for `config_option_update`; a refused model is left out; the time limit leaves the rest not checked; the private check directory is removed; no prompt and no authentication call is sent. `providers.json` has mode 0600 and the record shape of task `settings`, holds no environment secret, and a new program version marks it stale.
- The implementer broke key behavior in 11 ways, for example automatic permission answers; each change made a test fail.

The coordinator reran the client, check, settings, HTTP, terminal adapter and hook suites on the integrated branch (83 tests passed) and the full suite: 660 tests, 659 passed, 1 skipped (the existing pinned-model network test), 0 failed.
