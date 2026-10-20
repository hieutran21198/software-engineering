---
tier: medium
---

# Package the repository applications with Nix

Users need installable se-adopt and artifact-plane commands without a development checkout.
Reuse the existing untracked Snowfall flake and empty package definitions, preserving unrelated edits.
Include four native targets: x86_64-linux, aarch64-linux, x86_64-darwin and aarch64-darwin.
Exclude application features, NixOS services, Home Manager modules, nixpkgs submission and changes to other repositories.

This change adds requirements, so it cannot use the small tier.
Only this repository changes. The package artifact owns distribution rather than application behavior.
No new artifact prerequisite is needed because implementation consumes existing source in this repository without changing its contracts.

## Plan

See the [implementation tasks](tasks/README.md).
