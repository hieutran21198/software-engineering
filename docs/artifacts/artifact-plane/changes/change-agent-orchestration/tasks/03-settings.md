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

- [ ] The service finds `profiles.json` in `ARTIFACT_PLANE_CONFIG_DIR`, then `$XDG_CONFIG_HOME/artifact-plane/`, then `~/.config/artifact-plane/`. It refuses a file inside an inspected repository or worktree, a symbolic link, and a file that group or other users can write.
- [ ] Each validity rule of the contract makes a profile invalid with its reason, and the invalid profile stays in the result. Tests cover a Claude plan profile with ACP, a connection that the provider does not offer, a role default with no valid profile, an ACP profile as a role default, each entry of the permission-bypass list, a credential-like variable name, an unknown field and a wrong type.
- [ ] The builder makes the profile command of each catalog provider and connection, and of `harness: other`, as an argument list without a shell. A test compares each result with the catalog table.
- [ ] Save refuses a model that is not in the list and a level that the model does not offer. Without a list, it fails with "Check the provider first." A model or level that the last check no longer lists gives the warning "Not in the last check".
- [ ] Save returns 409 with the current settings when the digest differs. It writes a temporary file with mode 0600 in the same directory and renames it, and it creates a missing directory with mode 0700. A test confirms that no other file is written and that a saved catalog profile has no `command`.
- [ ] Query returns the settings, the digest, the validity of each profile, the file path, the providers with their programs and versions (`--version`, 5-second limit, no shell; for OpenCode, the first of `opencode` and `opencode2` with version 2 or later) and their last check, and the herdr and ttyd availability. The Claude terminal lists come from the documented list.
- [ ] The routes keep the loopback, Host, Origin and JSON checks and the 16 KiB body limit. Tests confirm a refusal for a foreign Host and a foreign Origin.
