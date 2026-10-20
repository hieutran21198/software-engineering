---
id: flake
depends_on: []
covers:
  - element: requirements/packages.md
    ids: [NP3, NP5, NA1]
---

# Pin the shared flake

## Scope and location

Update flake.nix and generate flake.lock. Reuse the existing Snowfall input and package layout.

## Definition of Done

- [x] Both named outputs evaluate for the four agreed systems.
- [x] Inputs are pinned in flake.lock.
- [x] Flake configuration parses and uses no unrelated untracked files.
- [x] Record evaluation commands and results.

## Evidence

Ran nix flake show --all-systems --json. Both packages and the package check evaluate for all four requested systems.
Ran nixfmt on flake.nix. Parsing and formatting passed.
Nixpkgs unstable rejected x86_64-darwin because 26.11 dropped it. Pinned nixpkgs-26.05-darwin instead and repeated evaluation successfully.
The lock pins Nixpkgs at c4e5bcc625bd88ba8ea792fa6616ab914fe990d0 and Snowfall at 6ee3542cb459ca4b038cfe50ceb8797f05cdabad.
Git-based flake evaluation includes tracked sources. Unrelated .claude/worktrees, .commandcode and .review files remain untracked.
The machine is x86_64-linux. Nix reports no remote builders; native checks for the other targets remain unavailable.

