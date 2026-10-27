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

- [x] `npm test` and the build pass; known flaky cases are named with their baseline.
- [x] The browser suite passes with the Nix Chromium and with the CI headless shell.
- [x] On this repository, the home page shows no System section, the artifact pages of artifact-plane and story-driven list their diagrams, and artifact-driven and nix-packages show no Diagrams section.
- [x] Screenshots of the home, artifact, system view and focused document pages at 1440 and 390 pixels, on the fixture and on this repository, are critiqued against the mockups for duplication, noise and spacing.
- [ ] The owner looks at the screenshots, and this task records the result.
- [x] validate-knowledge reports no error, and the Nix package builds with the updated npm dependency hash.
- [x] repository-exploration has implementation and test supports for the new modules and tests, and the claims of the specification have their final status.
- [x] Evidence records the renderer and icon chunk sizes.

## Evidence

The coordinator ran the checks on the integrated branch claude/diagram-scopes at f99cd2d, with `TMPDIR` in the job directory.

| DoD item | Check | Result | Source |
| --- | --- | --- | --- |
| Tests and build | `npm test`, then `npm run build` | 571 tests, 570 pass, 0 fail, 1 skipped (the existing network-disabled model test); the build passes. A first run failed in the build and in the three icon tests because the worktree's node_modules predated the icon packages; `npm ci` from the merged lock file fixed it | this task |
| Browser suites | `npx playwright test` with the Nix Chromium and with the Playwright 1.64 headless shell that CI uses | 177 of 177 in both; the earlier change-page.spec.js timeout did not recur | this task |
| This repository | Review script on a clone of the branch whose `main` equals origin/main | No System section on Current work; Artifact Plane and Story-Driven Knowledge Framework show a Diagrams section; Artifact-Driven Development and Nix packages show none; no page error | this task |
| Screenshots and critique | Screens of Current work, Ordering, the system view document, a focused document and this repository at 1440 and 390 pixels, compared with the mockups | The pages match the mockups; sections align with their neighbours; tall diagrams fit the column as `flowchart TB`; long source lines end with an ellipsis on one line at 1440 pixels and wrap to two lines at 390 pixels | [review page](https://claude.ai/artifact/N3yNkZhErbPzEYiEHirday) |
| Validator and Nix | `scripts/validate-knowledge.mjs --repository <worktree>` after the owner's local `main` moved to origin/main; `nix build .#artifact-plane` | `ok: true`, only `open-change-conflict` warnings for the implementer branches of this change; the Nix package builds with hash sha256-1bQQUpIiMqnCnx/1y0HQq8UUXHFJQ3LnnNLVNx51eL8= | this task |
| Flow supports and claims | Diff of repository-exploration and of the specification claims | Eight implementation and test supports for the new modules and tests on the overview and inspect steps; `lazy-icon-chunk` verified by agent, `server-side-index` supported | docs/artifacts/artifact-plane/specifications/flows/repository-exploration.md |
| Chunk sizes | `npm run build` | Renderer 96.70 kB (33.60 kB gzip); icon chunk 144.00 kB (51.64 kB gzip) | this task |

The owner review of the screenshots is pending.
