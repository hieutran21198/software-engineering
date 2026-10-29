---
id: settings
depends_on: [verify-interfaces]
covers:
  - element: requirements/agent-orchestration.md
    ids: [AO3, AO4, AO14, AO17, AO21, AO23, AO24, AO25, AOA13]
---

# Settings service and provider catalog

## Scope and ownership

One implementer adds the settings service, the provider catalog and the profile command builder in `apps/artifact-plane/server`, and the routes `POST /api/settings/query` and `POST /api/settings/save` in `server/http.js`, with Node tests. `acp-client` adds the check route, and `runner` adds the runner availability.

## Governing knowledge

`specifications/agent-orchestration.md`: Settings and launch profiles, Provider catalog, Model and effort lists, Validity, Save and Commands. ADR 020. The live evidence of `verify-interfaces`.

## Definition of Done

- [x] The service finds `profiles.json` in `ARTIFACT_PLANE_CONFIG_DIR`, then `$XDG_CONFIG_HOME/artifact-plane/`, then `~/.config/artifact-plane/`. It refuses a file inside an inspected repository or worktree, a symbolic link, and a file that group or other users can write.
- [x] Each validity rule of the contract makes a profile invalid with its reason, and the invalid profile stays in the result. Tests cover a Claude plan profile with ACP, a connection that the provider does not offer, a role default with no valid profile, an ACP profile as a role default, each entry of the permission-bypass list, a credential-like variable name, an unknown field and a wrong type.
- [x] The builder makes the profile command of each catalog provider and connection, and of `harness: other`, as an argument list without a shell. A test compares each result with the catalog table.
- [x] Save refuses a model that is not in the list and a level that the model does not offer. Without a list, it fails with "Check the provider first." A model or level that the last check no longer lists gives the warning "Not in the last check".
- [x] Save returns 409 with the current settings when the digest differs. It writes a temporary file with mode 0600 in the same directory and renames it, and it creates a missing directory with mode 0700. A test confirms that no other file is written and that a saved catalog profile has no `command`.
- [x] Query returns the settings, the digest, the validity of each profile, the file path, the providers with their programs and versions (`--version`, 5-second limit, no shell; for OpenCode, the first of `opencode` and `opencode2` with version 2 or later) and their last check, and the herdr and ttyd availability. The Claude terminal lists come from the documented list.
- [x] The routes keep the loopback, Host, Origin and JSON checks and the 16 KiB body limit. Tests confirm a refusal for a foreign Host and a foreign Origin.

## Evidence

Commit 937df78 adds `server/provider-catalog.js`, `server/agent-settings.js` and their tests, and the two settings routes in `server/http.js`.

- Location: tests check the order `ARTIFACT_PLANE_CONFIG_DIR`, `$XDG_CONFIG_HOME/artifact-plane`, `~/.config/artifact-plane`, and ignore a relative `XDG_CONFIG_HOME`. The server keeps no registry of inspected repositories, so the service refuses a path inside any Git work tree or Git directory, as the runtime store does. Tests refuse a path in a repository, a linked worktree and `.git`, a symbolic link, and modes 0620, 0602 and 0666; nothing is written. On this computer, `~/.config` is not in a Git work tree.
- Validity: tests cover a Claude plan profile with ACP, a connection that an injected provider does not offer, each bypass entry as an argument, a pair and a `--flag=value` form, credential-like names in any case, unknown fields, wrong types and duplicate IDs. A role default rule makes the role default invalid, not the profile, so an ACP profile stays valid for implementers.
- Builder: ten literal argument lists match the catalog table, including `opencode mini … --prompt`, the `#<level>` suffix and the `opencode2` program; no catalog command holds a bypass argument.
- Lists: save refuses a model outside the list and a level that the model does not offer, fails with "Check the provider first." without a list, and keeps an unchanged profile with the warning "Not in the last check".
- Save: a digest change returns 409 with the current settings; new directories get 0700 and the file 0600 through a temporary file and a rename; no other file appears; a saved catalog profile has no `command`; a `harness: other` profile saves only unchanged. A refused file location returns 409 without settings.
- Query: fake programs in a directory with a space and a quote prove that no shell runs; a slow program stops at the limit; `opencode2` 2.2.0 wins over `opencode` 1.14.2. The Claude terminal list comes from the Claude Code CLI reference and model configuration pages (read through Context7 on 2026-10-29).
- Routes: foreign Origin, foreign Host, `Sec-Fetch-Site: cross-site`, wrong content type, a 17 KB body, bad JSON and GET are refused, and the file stays unchanged.
- `providers.json` shape for task `acp-client`: `{version: 1, providers: {<harness>: {program, programVersion, checkedAt, state?, message?, protocolVersion?, signInMethods?, models: [{id, name, levels}]}}}`; `levels: []` means no levels, and `null` means not checked.

The coordinator reran the focused suites: 17 tests passed. The implementer ran `npm test`: 609 tests, 608 passed, 1 skipped (the existing pinned-model network test), 0 failed.
