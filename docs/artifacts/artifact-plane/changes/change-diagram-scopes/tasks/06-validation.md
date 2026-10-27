---
id: validation
depends_on: [icons, system-entry, diagram-list]
covers:
  - element: requirements/diagram-scopes.md
    ids: [ADP1, ADP2, ADP3, ADP4, ADP5, ADP6]
---

# Integrated validation and owner review

## Scope and ownership

Coordinator with an implementer for the checks. Location: the integrated Plane branch, the fixture repository and this repository. The coordinator adds the implementation and test supports to repository-exploration and records the owner review.

## Definition of Done

- [ ] `npm test` and the build pass; known flaky cases are named with their baseline.
- [ ] The browser suite passes with the Nix Chromium and with the CI headless shell.
- [ ] On this repository, the home page shows no System section, the artifact pages of artifact-plane and story-driven list their diagrams, and artifact-driven and nix-packages show no Diagrams section.
- [ ] Screenshots of the home, artifact, system view and focused document pages at 1440 and 390 pixels, on the fixture and on this repository, are critiqued against the mockups for duplication, noise and spacing.
- [ ] The owner looks at the screenshots, and this task records the result.
- [ ] validate-knowledge reports no error, and the Nix package builds with the updated npm dependency hash.
- [ ] repository-exploration has implementation and test supports for the new modules and tests, and the claims of the specification have their final status.
- [ ] Evidence records the renderer and icon chunk sizes.

## Evidence

Pending.
