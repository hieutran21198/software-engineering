---
id: ci-release
depends_on: [app-build]
covers:
  - element: requirements/app-release.md
    ids: [AR1, AR5, AR6, AR7, AR8]
---

# CI and release

## Scope and ownership

Implementer, after task app-build. `.github/workflows/ci.yml` (job `plane-app`, job `plane-release`, tag trigger `plane-v*`) and the Install section of the Plane README.

## Governing knowledge

specifications/app-release.md: Continuous integration, Release, README.

## Definition of Done

- [ ] The pull request CI run builds the six targets on their runners and every smoke check passes.
- [ ] `plane-release` runs only on a `plane-v` tag and calls the version check first; `release` keeps its condition.
- [ ] The README Install section names download, checksum check, start, commands and the unsigned-file warnings, and Run keeps the source path.
- [ ] The jobs artifact-plane, go and docs pass unchanged.

## Evidence

Not recorded.
