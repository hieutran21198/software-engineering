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

- [x] The catalog has `antigravity` with only the terminal connection; its profile command is `agy --model <model> --effort <level>` plus `-i "$ARTIFACT_PLANE_PROMPT"` in the terminal adapter. A test compares the argument list and the command line with the catalog row.
- [x] A profile of `antigravity` with the connection `acp` is invalid with its reason, and `--mode auto` and `--mode=auto` make a profile invalid.
- [x] The provider check runs `agy models` without a shell with a 30-second limit, reads `<id><TAB><name>` lines, gives each model the five `--effort` levels, sends no prompt and writes the `providers.json` record. A malformed line is left out; a failed run returns 502 and keeps the last result; a missing program returns 503.
- [x] The Agent settings page shows Antigravity CLI with its program, version, the Terminal connection and its models; the profile editor offers its models and levels from the check. A browser test with the fake program creates an Antigravity terminal profile.
- [x] The existing Node and browser suites pass.

## Evidence

Commit 76ab1f4 adds the terminal-only provider `antigravity` to `src/launch-catalog.js`, the `agy models` check in `server/provider-check.js`, the pair `--mode auto` to the bypass list, the `-i` prompt form to the terminal adapter, the Antigravity rows of the Agent settings page and the profile editor, and a fake `agy` for tests. No test runs the real `agy`.

- Catalog: a test builds the argument list from the catalog row and compares it with the profile command; the command line is `'agy' '--model' <model> '--effort' <level> '-i' "$ARTIFACT_PLANE_PROMPT"`; through `/bin/sh` a hostile prompt reaches the stub unchanged; resume gives `resume-unavailable`.
- Validity: an `antigravity` profile with `acp` is invalid with its reason; `--mode auto` and `--mode=auto` are refused; `--mode plan` and `--mode accept-edits` stay valid.
- Check: `agy models` runs without a shell from a folder with a space and a quote, in a private check folder that is removed, with closed standard input and no prompt; malformed, empty and repeated lines are left out; four models each get the five levels; `providers.json` has mode 0600; a new program version marks the result stale. A missing program gives 503 and writes nothing; a failed run and a run past the limit give 502 and keep the last result.
- Workbench: the provider row shows the program and version, Terminal only and the models; the editor disables ACP with the reason and offers the checked models and levels. A browser test checks the fake `agy`, creates a coordinator default with `claude-opus-5-5-high` and `xhigh`, and confirms the preview and the saved file.
- The implementer broke the bypass pair, the `-i` form, the line filter, the time limit and the shell flag in turn; each change made a test fail.

The coordinator reran the check, settings, adapter, HTTP and settings model suites: 47 tests passed. The implementer ran `npm test` (718 tests, 717 passed, 1 skipped, 0 failed) and the browser suite (196 passed).
