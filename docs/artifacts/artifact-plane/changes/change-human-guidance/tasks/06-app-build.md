---
id: app-build
depends_on: [app-entry]
covers:
  - element: requirements/app-release.md
    ids: [AR1, AR2, AR4]
---

# Application build

## Scope and ownership

Implementer, after task app-entry. `scripts/build-app.mjs`, the launcher, `scripts/app-smoke.mjs`, `scripts/check-release-version.mjs`, the `build:app` script, the pinned `postject` dev dependency, and Node tests of the version check.

## Governing knowledge

specifications/app-release.md: Packaging, Continuous integration (smoke check), Release (version check); claims node-sea, bundled-onnx-runtime and sharp-import.

## Definition of Done

- [ ] `npm run build:app` on Linux AMD64 writes `release/artifact-plane-linux-amd64`, and its size is recorded.
- [ ] `node scripts/app-smoke.mjs release/artifact-plane-linux-amd64` passes every check of the smoke list.
- [ ] The file runs with a `PATH` without Node.js, opens this repository, and `model-install` followed by one semantic query returns flows.
- [ ] A second start reuses the cache directory; a changed payload creates a new one and keeps at most two.
- [ ] Node tests of `check-release-version.mjs` cover a matching tag, a different package version, a different `current_version` and a `v` tag.
- [ ] `npm test` passes.

## Evidence

Not recorded.
