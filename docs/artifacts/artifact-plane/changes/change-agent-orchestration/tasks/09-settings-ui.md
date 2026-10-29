---
id: settings-ui
depends_on: [settings, acp-client]
covers:
  - element: requirements/agent-orchestration.md
    ids: [AO18, AO21, AO22, AO23, AO25, AOA10]
---

# Agent settings pages

## Scope and ownership

One implementer adds the Agent settings page, the profile editor and their sidebar entry in `apps/artifact-plane/src`, with browser tests against fixture settings and a fake provider check. The pages reuse the existing workbench tokens and components.

## Governing knowledge

`specifications/agent-orchestration.md`: Workbench, Settings and launch profiles, Model and effort lists and Validity. Mockup artboards 6 and 8 of the approved canvas.

## Definition of Done

- [x] The Agent settings page shows Providers (programs and versions, connections, sign-in state, models and Check, plus herdr and ttyd), Role defaults (one selector for each role) and Profiles (state, New profile, Edit, Duplicate and Delete), as in artboard 6.
- [x] The profile editor sets name, provider, connection, sign-in kind, model and effort level from lists, the roles that use the profile as default, and the extra arguments and variables under Advanced, as in artboard 8.
- [x] A change of provider changes the model list, and a change of model changes the effort list. The editor shows the source of the lists with Check again, the program that Plane will run and the validity errors.
- [x] Without a list, the editor shows "Check the provider first." A model or level that the last check no longer lists shows "Not in the last check".
- [x] A save that returns 409 shows the current settings and asks the person to apply the edit again.
- [x] A browser test checks a provider, creates a profile from the lists, sets it as the implementer default, and confirms that another model shows its own effort levels (AOA10 with fixtures).
- [x] Without a settings file, the workbench shows no session control except the Agent settings page, and the existing browser tests pass unchanged (AO18).
- [x] Screenshots at desktop width and at 390 pixels show no horizontal page scroll.

## Evidence

Commit bba76a1 adds `src/pages/SettingsPage.jsx`, `src/pages/ProfileEditor.jsx`, their model and request modules, and `test/browser/agent-settings.spec.js`. The catalog data and the shared texts move to `src/launch-catalog.js`; the server modules re-export them, so the editor builds the same command as the server. The entry Agent settings is in the top-bar More menu beside Discover behavior, Impact and Recorded executions: the workbench sidebar holds the artifact tree, and the golden capture of the sidebar stays unchanged.

- Page (artboard 6): Providers with programs and versions, connections, sign-in state, models with their levels, Check and Check all, plus herdr, ttyd and the session runner; Role defaults with one selector for each role; Profiles with state, New profile, Edit, Duplicate and Delete. Browser tests cover "Sign-in required" with the agent's message, "Plan · terminal only", a stale check, a missing program and a refused settings file.
- Editor (artboard 8): name, harness tool, sign-in kind, connection, model and effort from lists, default roles, and Advanced arguments and variables. A provider change changes the model list and a model change changes the effort list; the list source shows Checked or Documented with Check again; "Plane will run" shows the command, for example `opencode2 mini --model 'google/gemini-2.5-pro#high' --prompt "<initial prompt>"`.
- Messages: "Check the provider first." without a list, and "Not in the last check" for a model and a level that the last check does not list.
- Conflict: a file change while the editor is open makes Save return 409; the page shows the current settings, and "Apply my edit again" reopens the draft on the new digest.
- AOA10 with fixtures: the test checks Codex through the fake agent, creates a profile from the lists, sets it as the implementer default, confirms the file with mode 0600, and shows the own levels of another model.
- AO18: without a settings file, no session control appears and Agent settings writes no file; the 177 existing browser tests pass unchanged.
- Screenshots at 1440 and 390 pixels of nine states show no page overflow; the coordinator looked at the provider page and the editor at 1440 pixels and the provider page at 390 pixels.

The coordinator reran the related Node suites: 32 tests passed. The implementer ran `npm test` (666 tests, 665 passed, 1 skipped, 0 failed) and the browser suite (183 passed).
