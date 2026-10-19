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
- [x] `plane-release` runs only on a `plane-v` tag and calls the version check first; `release` keeps its condition.
- [x] The README Install section names download, checksum check, start, commands and the unsigned-file warnings, and Run keeps the source path.
- [x] The jobs artifact-plane, go and docs pass unchanged.

## Evidence

| DoD item | Check | Result |
| --- | --- | --- |
| Six targets | Dispatched CI run 39220105465: four targets passed, both Windows targets failed with GET / 404, because the module path held 8.3 short names that `realpath` expands, so the static path check rejected `index.html`; server/http.js now compares with `realpathSync.native` of `dist/`. Dispatched run 39221195436: all six `plane-app` jobs and `plane-sums` passed (zipped artifacts 55 to 61 MB). The pull request run repeats this check | Open until the pull request run |
| Release conditions | YAML parsed with the `yaml` package: triggers `v*` and `plane-v*`; `plane-release` needs `artifact-plane` and `plane-sums`, runs only for `refs/tags/plane-v`, and runs the version check first; `release` keeps `startsWith(github.ref, 'refs/tags/v')`, which `refs/tags/plane-v…` does not meet; the five existing jobs equal those on main; `actionlint` 1.7.12 reports nothing. `plane-sums` writes SHA256SUMS on every run; release notes start at the previous `plane-v` tag | Passed |
| README | The Plane README has Install before Run: release files, checksum check on Linux, macOS and Windows, `chmod +x`, start, commands and environment, the macOS and Windows warnings for an unsigned file, and Git as a requirement; Run keeps the source path. The repository README Build paragraph names `plane-v` tags | Passed |
| Existing jobs | go and docs passed in both dispatched runs; artifact-plane failed only on test/browser/change-page.spec.js:302, which task pages updates for HG2 | Passed |
