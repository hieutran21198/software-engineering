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

- [x] `npm run build:app` on Linux AMD64 writes `release/artifact-plane-linux-amd64`, and its size is recorded.
- [x] `node scripts/app-smoke.mjs release/artifact-plane-linux-amd64` passes every check of the smoke list.
- [x] The file runs with a `PATH` without Node.js, opens this repository, and `model-install` followed by one semantic query returns flows.
- [x] A second start reuses the cache directory; a changed payload creates a new one and keeps at most two.
- [x] Node tests of `check-release-version.mjs` cover a matching tag, a different package version, a different `current_version` and a `v` tag.
- [x] `npm test` passes.

## Evidence

| DoD item | Check | Result |
| --- | --- | --- |
| Build | `npm run build:app` writes `release/artifact-plane-linux-amd64`, 129.5 MB with the local Nix Node 24.21.0 (78 MB); the payload is about 71 MB (server.mjs 1.9, dist 5.4, onnxruntime-node 22, sharp bindings 19, transformers 1.8); a rebuild is byte-identical | Passed |
| Smoke | `node scripts/app-smoke.mjs release/artifact-plane-linux-amd64` in a one-worktree clone: `--version`, address line, GET / HTML, explore finds 3 artifacts, mcp initialize lists 10 tools, stop on SIGTERM within 5 s | Passed |
| Without Node | `env -i` with a PATH where `command -v node` fails, a private 0700 state directory and its own port: explore of the clone finds 3 artifacts; a discovery query returns 15 flows by keyword (`semantic: false`); `model-install` exits 0; the same query then returns `semantic: true` with 15 flows; the first embedding took about 80 s | Passed |
| Cache | Payload variants A, A, B, C, B, A: the second start of A reuses its directory (same manifest inode); B and C create new ones; at most two remain; no temporary directory is left | Passed |
| Version check | `node --test test/release-version.test.js` 4 of 4: matching tag, other package version, other `current_version`, `v` tag | Passed |
| Node suite | `npm test` 419 tests, 418 passed, 0 failed, 1 skipped | Passed |

Claim sharp-import: `transformers.node.mjs` imports `sharp`, `onnxruntime-node` and `onnxruntime-common` statically; without sharp the import fails with ERR_MODULE_NOT_FOUND, and without the `@img/sharp-*` bindings it fails to load the linux-x64 runtime. The payload carries sharp and the bindings of its target; `onnxruntime-web` is reduced to its package.json and `dist/ort.node.min.mjs` for `import.meta.resolve`. Claim bundled-onnx-runtime: the CI files use the official Node binary, so their size is expected near 170 MB; task validation records the six sizes.

Finding outside this task: POST /api/explore returns 500 (`RangeError: Invalid string length` in JSON.stringify) on a repository with ten registered worktrees, from source and from the executable, because `workflow.worktrees` and `unitsOfWork` exceed the V8 string limit. A one-worktree clone and CI are not affected.
