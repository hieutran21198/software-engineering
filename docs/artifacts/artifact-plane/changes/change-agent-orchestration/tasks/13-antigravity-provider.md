---
id: antigravity-provider
depends_on: [sessions-ui]
covers:
  - element: requirements/agent-orchestration.md
    ids: [AO3, AO22, AO24, AO25]
---

# Antigravity provider

## Scope and ownership

One implementer adds the terminal-only provider `antigravity` to the catalog in `src/launch-catalog.js` and the server modules, the `agy models` check in the provider check, `--mode auto` to the bypass list, and the provider row of the Agent settings page and the profile editor. Tests use a fake `agy` program.

## Governing knowledge

`specifications/agent-orchestration.md`: Provider catalog, Model and effort lists, Provider check, Validity and Interface sources (fifth amendment).

## Definition of Done

- [ ] The catalog has `antigravity` with only the terminal connection; its profile command is `agy --model <model> --effort <level>` plus `-i "$ARTIFACT_PLANE_PROMPT"` in the terminal adapter. A test compares the argument list and the command line with the catalog row.
- [ ] A profile of `antigravity` with the connection `acp` is invalid with its reason, and `--mode auto` and `--mode=auto` make a profile invalid.
- [ ] The provider check runs `agy models` without a shell with a 30-second limit, reads `<id><TAB><name>` lines, gives each model the five `--effort` levels, sends no prompt and writes the `providers.json` record. A malformed line is left out; a failed run returns 502 and keeps the last result; a missing program returns 503.
- [ ] The Agent settings page shows Antigravity CLI with its program, version, the Terminal connection and its models; the profile editor offers its models and levels from the check. A browser test with the fake program creates an Antigravity terminal profile.
- [ ] The existing Node and browser suites pass.
