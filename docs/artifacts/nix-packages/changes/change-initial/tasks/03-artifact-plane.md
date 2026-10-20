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

- [x] Build browser assets and install required production dependencies using a fixed npm dependency hash.
- [x] Install a wrapper with Node.js 24 or later and Git.
- [x] Run installed --help and --version outside the checkout.
- [x] Serve the browser assets using temporary state outside the store.
- [x] Initialize the stdio MCP interface against a temporary Git repository.
- [x] Load native ONNX and Sharp bindings on the build target.
- [x] Check semantic model installation and inference using external writable caches.
- [x] Confirm the wrapper preserves working directory, arguments and configured state.
- [x] Record commands, platform and results.

## Evidence

Platform: x86_64-linux.
Ran nix build .#checks.x86_64-linux.packages --no-link -L: passed.
The check verifies installed help and package version, both native modules, HTTP HTML and its linked JavaScript asset, and MCP initialization/tool discovery from the caller's temporary Git repository.
The wrapper supplies Node.js 24.21.0 and Git, forwards arguments and preserves the working directory and environment.
Runtime files include server, shared src modules, scripts, package metadata, production dependencies and built dist assets.
Ran node nix/tests/semantic.mjs /nix/store/lq2q77c06xb2a4y7qy4srpmwmgd321za-artifact-plane-1.23.0 with the pinned Node runtime: passed.
The semantic check installed the pinned model into fresh temporary external state, then generated two finite normalized 384-dimensional CPU vectors. It removed its temporary state afterward.

### Failures corrected

The first npm fetch failed with an HTTP/2 transport error. A retry succeeded and supplied the fixed hash shared by both builders.
The first native check crashed in Sharp. Debugger inspection found libvips initialization at offset 0x25c overwritten by the program-header expansion of patchelf 0.15.2.
The same library failed after a 0.15.2 fixup and loaded successfully after a 0.18.0 fixup. The Linux builder now uses the pinned patchelfUnstable package; both native loading and actual inference passed afterward.
Initial launch checks also exposed missing shared src modules and scripts in the installation. Both directories are now included, and the final HTTP and MCP checks passed.
The test fixture initially lacked docs/artifacts. Adding that valid ADD directory corrected the embedded-validator check without changing the validator.

