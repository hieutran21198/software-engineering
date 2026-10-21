---
id: integration
depends_on: [se-adopt, artifact-plane]
covers:
  - element: requirements/packages.md
    ids: [NP1, NP2, NP3, NP4, NP5, NA1, NA2, NA3, NA4, NA5, NA6]
---

# Validate and document the packages

## Scope and location

Own nix/README.md, combined flake checks, the native CI job in .github/workflows/nix.yml and the packaging validation record.
The coordinator records shared evidence in the unit brief.

## Definition of Done

- [x] Run integrated flake evaluation and package checks.
- [x] Record native builds and smoke results for both packages on all four targets.
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

## Native checks

The first session had no native runner for aarch64-linux, x86_64-darwin or aarch64-darwin. A later branch added the Nix workflow `.github/workflows/nix.yml`. It runs `nix build .#checks.<system>.packages -L` on the GitHub runner of each system: ubuntu-24.04, ubuntu-24.04-arm, macos-15 and macos-15-intel. The check builds both packages and runs nix/tests/smoke.mjs against them.

Run 39538815032 (commit 7c89457): x86_64-linux, aarch64-darwin and x86_64-darwin passed. Each printed "PASS: adoption, embedded validator, CLI, native modules, HTTP assets and MCP handshake" for se-adopt 3.1.0 and artifact-plane 1.26.1. aarch64-linux built both packages and linked the ONNX Runtime and Sharp libraries, then aborted in the smoke check. ONNX Runtime 1.21 reads /sys/devices/system/cpu on ARM, the build sandbox has no /sys, and its CPU detection failure ends in "Attempt to use DefaultLogger but none has been registered".

Run 39539479700 (commit 3d2ec27) binds /sys/devices/system/cpu into the sandbox through `extra-sandbox-paths`. All four systems printed the same PASS line, and aarch64-linux reported no CPU detection error. nix/README.md names the setting for a local check on aarch64-linux; the installed command does not need it, because a normal system has /sys.

Model installation and inference ran on x86_64-linux only (task 03). The DoD of this task requires native builds and smoke results, which cover native module loading on every target.
