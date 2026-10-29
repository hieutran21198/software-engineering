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

- [ ] The client sends `initialize` with version 2 and accepts versions 1 and 2. It declares no file system and no terminal capability, and it answers each client method call of the agent with method-not-found.
- [ ] `session/new` gets the worktree as `cwd` and one stdio MCP server: the Plane executable with `mcp`. An authentication error ends the session with reason `error` and the sign-in message of the contract. The client never calls the authentication method.
- [ ] The client sets the profile model and level through the options of the categories `model` and `thought_level`, with `type: "id"` in version 2. A missing option or a refused value keeps the session and records the model as declared. The client sets no other option.
- [ ] The client sends one prompt at a time and refuses a prompt while a turn runs. It keeps only the joined agent message of the last turn, at most 64 KiB. It discards the content of other updates. A turn ends with the prompt response in version 1 and with an idle `state_update` in version 2.
- [ ] A permission request stays pending until the person selects one of its options. Cancel sends `session/cancel` and answers each pending request with `cancelled`. A test confirms that no request is answered without a selected option.
- [ ] Resume uses `session/resume` with `replayFrom: {type: "start"}` in version 2 and `session/load` in version 1 when `loadSession` is true. Otherwise resume is unavailable. The last message comes from the replay.
- [ ] End closes standard input and stops the process after 5 seconds. Malformed JSON or an exit during start ends the session with reason `error`.
- [ ] The provider check runs in a new private directory under the state directory and sends no prompt. It reads the effort levels of up to 50 models through `session/set_config_option`, uses the legacy model list of a version 1 agent without options, closes the session when the agent offers `session/close`, and removes the directory.
- [ ] The check writes `providers.json` with mode 0600: program version, check time, models and effort levels, and no credential. A changed program version marks the result stale.
- [ ] Tests with the fake agent in both versions cover each item above, and AOA2 with a fixture permission request.
