---
id: deliver
depends_on: []
covers:
  - element: requirements/opencode-support.md
    ids: [OPA4]
---

# Deliver the portable OpenCode tests

## Scope and location

apps/artifact-plane/test/opencode-bridge.test.js and test/opencode-config.test.js.

## Definition of Done

- [x] The two bridge tests create their temporary directories under `os.tmpdir()`, and no test creates a file under `/tmp/opencode`.
- [x] The guide test matches the text of integration/README.md.
- [x] npm test passes.
- [ ] The artifact-plane job of CI passes on the pull request.

## Evidence

Implementation commit a1a6ee8: 8 changed test lines.

Ran node --test test/opencode-bridge.test.js test/opencode-config.test.js: 32 passed, 0 failed.

Ran npm test: 557 tests, 556 passed, 0 failed, 1 skipped.

Version preparation: package.json and package-lock.json give 1.27.2, and nix/lib/npm-deps.nix has the new npm dependency hash.
