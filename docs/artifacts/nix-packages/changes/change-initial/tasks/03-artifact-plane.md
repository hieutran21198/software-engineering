---
id: artifact-plane
depends_on: [flake]
covers:
  - element: requirements/packages.md
    ids: [NP2, NP4, NP5, NA3, NA4]
---

# Build Artifact Plane

## Scope and location

Implement nix/packages/artifact-plane/default.nix and package-specific checks.
Preserve application source behavior.

## Definition of Done

- [ ] Build browser assets and install required production dependencies using a fixed npm dependency hash.
- [ ] Install a wrapper with Node.js 24 or later and Git.
- [ ] Run installed --help and --version outside the checkout.
- [ ] Serve the browser assets using temporary state outside the store.
- [ ] Initialize the stdio MCP interface against a temporary Git repository.
- [ ] Load native ONNX and Sharp bindings on the build target.
- [ ] Check semantic model installation and inference using external writable caches.
- [ ] Confirm the wrapper preserves working directory, arguments and configured state.
- [ ] Record commands, platform and results.

## Evidence

No implementation checks have run.

