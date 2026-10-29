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

- [ ] The Agent settings page shows Providers (programs and versions, connections, sign-in state, models and Check, plus herdr and ttyd), Role defaults (one selector for each role) and Profiles (state, New profile, Edit, Duplicate and Delete), as in artboard 6.
- [ ] The profile editor sets name, provider, connection, sign-in kind, model and effort level from lists, the roles that use the profile as default, and the extra arguments and variables under Advanced, as in artboard 8.
- [ ] A change of provider changes the model list, and a change of model changes the effort list. The editor shows the source of the lists with Check again, the program that Plane will run and the validity errors.
- [ ] Without a list, the editor shows "Check the provider first." A model or level that the last check no longer lists shows "Not in the last check".
- [ ] A save that returns 409 shows the current settings and asks the person to apply the edit again.
- [ ] A browser test checks a provider, creates a profile from the lists, sets it as the implementer default, and confirms that another model shows its own effort levels (AOA10 with fixtures).
- [ ] Without a settings file, the workbench shows no session control except the Agent settings page, and the existing browser tests pass unchanged (AO18).
- [ ] Screenshots at desktop width and at 390 pixels show no horizontal page scroll.
