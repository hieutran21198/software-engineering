---
self_check:
  result: passed
  source: docs/artifacts/nix-packages/requirements/packages.md#self-check
---

# Package requirements

- NP1: Users can install se-adopt through the repository flake. The package version is the ADD version that names se-adopt releases.
- NP2: Users can install artifact-plane through the repository flake.
- NP3: Both packages support x86_64 and aarch64 on Linux and macOS.
- NP4: Installed commands run outside the source checkout and retain existing arguments and environment settings.
- NP5: Package builds use pinned inputs and dependency hashes. A change to the
  Plane package or lock file updates the fixed-output dependency hash before
  the version pull request.

## Acceptance criteria

- NA1: The flake exposes both named packages for all four target systems.
- NA2: Installed se-adopt lists and adopts both embedded architecture bundles into a temporary workspace.
- NA3: Installed artifact-plane prints help and version, serves built browser assets, and starts its stdio MCP interface.
- NA4: Artifact Plane keeps mutable state and downloaded models outside the Nix store and preserves the caller's working directory.
- NA5: Each target has a recorded native build and smoke-check result before four-platform support is claimed verified.
- NA6: The package documentation gives build, run and install commands and states any unverified platform checks.

## Impact

The affected implementation paths are flake.nix, flake.lock and nix/.
Inspect se-adopt embedding and Plane launch, static asset, Git, state and native dependency behavior.
No application feature or existing artifact contract changes are required by the requested scope.

## Self-check

The user confirmed all four targets. Each requirement has an observable acceptance check.
The scope reuses the existing flake and introduces no service or workflow registry.
The requirements distinguish platform verification from package declarations.

change-se-adopt-version amends NP1 and keeps its ID. The defect is observable: the flake builds se-adopt-3.1.0 while ADD and the source it embeds are at 3.2.0. No requirement ID is added.

change-plane-npm-deps-hash amends NP5 and keeps its ID. The defect is observable: the Nix packages check on revision 8727e0b reports the specified 1.28.0 dependency hash and the 1.29.0 value. No requirement ID is added.
