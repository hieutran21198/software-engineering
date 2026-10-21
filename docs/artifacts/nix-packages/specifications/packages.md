---
self_check:
  result: passed
  source: docs/artifacts/nix-packages/specifications/packages.md#self-check
---

# Nix package contract

## Flake interface

Retain the supplied Snowfall structure. Export packages.<system>.se-adopt and packages.<system>.artifact-plane for x86_64-linux, aarch64-linux, x86_64-darwin and aarch64-darwin.
Pin nixpkgs and Snowfall in flake.lock. Do not add a default package because the request names two independent commands.
Each derivation sets its mainProgram to its command name. A consumer can use nix build, nix run with an explicit package name, or nix profile install.

## se-adopt

Use the pinned nixpkgs Go builder with a compiler compatible with go.mod.
Build cmd/se-adopt from repository sources, including the embedded src/archs bundles.
Install bin/se-adopt. Preserve all CLI arguments and adoption behavior.
Run existing Go command and adoption tests, then exercise the installed command outside the source checkout.
Do not introduce fetched Go dependencies when go.mod needs none.
Set the package version to `current_version` of docs/artifacts/artifact-driven/README.md, the ADD version that names se-adopt release tags, as the Plane package takes its version from package.json. Fail evaluation when the record has no version.

## Artifact Plane

Use the pinned nixpkgs Node.js runtime at version 24 or later and package-lock.json.
Build the browser assets with the existing Vite build. Install the server, package metadata, built dist directory and required production dependencies in the store.
Wrap server/app.js as bin/artifact-plane, forwarding arguments without changing the caller's working directory.
Include Git in the wrapper PATH. Preserve user-provided tools for optional Go analysis and agent integrations.
Use existing application state and model cache settings. Do not download a semantic model during package build or change the default state directory.
Keep supported optional features available, including semantic discovery. Resolve ONNX and Sharp native libraries through Nix dependencies and platform fixups where necessary.
Do not use the standalone executable build because the Nix wrapper already supplies Node and immutable application assets.

## Validation and limits

Evaluate both package outputs for every declared target. Build and smoke-test natively on each target before claiming verified support.
Check help, version, browser assets, temporary external runtime state and MCP initialization.
Check native module loading and the semantic model install/inference path with external writable caches.
Model downloads require network access at runtime; they are not bundled assets.
If a native dependency cannot meet this contract, return the issue to Specification before reducing features or target support.

## Self-check

The package contract covers the five requirements without changing application interfaces.
The two packages share the flake but have independent builders. The integration task joins them.
No artifact-level dependency is introduced. Existing application code supplies the runtime interfaces.
Native dependency compatibility is unverified until implementation checks run.

change-se-adopt-version: NP1 maps to the version rule of the se-adopt section. Reading the version of the ADD identity record adds no artifact dependency, because se-adopt already embeds the ADD bundle without one.
