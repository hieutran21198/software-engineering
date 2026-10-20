---
id: integration
depends_on: [se-adopt, artifact-plane]
covers:
  - element: requirements/packages.md
    ids: [NP1, NP2, NP3, NP4, NP5, NA1, NA2, NA3, NA4, NA5, NA6]
---

# Validate and document the packages

## Scope and location

Own nix/README.md, combined flake checks and the packaging validation record.
The coordinator records shared evidence in the unit brief.

## Definition of Done

- [x] Run integrated flake evaluation and package checks.
- [ ] Record native builds and smoke results for both packages on all four targets.
- [x] Keep unavailable platform checks explicitly incomplete.
- [x] Document named build, run and profile install commands.
- [x] Document runtime model download requirements and tool behavior.
- [x] Validate new knowledge, links, task coverage and Git whitespace.
- [x] Preserve unrelated .commandcode/ and .review/ files.
- [x] Return combined evidence for version preparation and PR handoff.

## Evidence

Ran nix flake show --all-systems --json: both named packages and package checks evaluate for all four systems.
Ran nix build .#checks.x86_64-linux.packages --no-link -L: the installed-package check passed.
Ran nix flake check -L: passed on the available host. Ran nix flake check --no-build --all-systems: all target declarations passed.
Ran nix run .#se-adopt -- --list: both architecture names were printed. Ran nix run .#artifact-plane -- --version: printed 1.23.0.
Package-specific commands and observations remain in their originating task evidence.
Ran node apps/artifact-plane/scripts/validate-knowledge.mjs --repository . --change nix-packages/change-initial: ok true, zero diagnostics.
Ran nixfmt --check on every new Nix expression, node --check on both smoke scripts and git diff --check: passed.
Reviewed the new documentation links against the waterfall hierarchy: no child document links to a parent or ancestor.
The usage page documents both packages, installation, explicit flake targets, model downloads and platform verification limits.
Git status confirms unrelated .claude/worktrees, .commandcode and .review files remain untracked and excluded.
An initial all-system flake check encountered a transient invalid Nix store source path. A native flake check and a repeated all-system check both passed afterward. Snowfall emits warnings for its additional snowfall and pkgs outputs; these do not fail the checks.

## Incomplete native checks

The available host is x86_64-linux. Nix has no configured remote builders.
Native builds, module loading, HTTP/MCP startup and semantic inference have not run on aarch64-linux, x86_64-darwin or aarch64-darwin.
The remaining DoD item stays unchecked. Prepare a draft PR for review; do not prepare the artifact version record or claim the outcome complete before the required native checks pass.

