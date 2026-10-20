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

- [ ] Both named outputs evaluate for the four agreed systems.
- [ ] Inputs are pinned in flake.lock.
- [ ] Flake configuration parses and uses no unrelated untracked files.
- [ ] Record evaluation commands and results.

## Evidence

No implementation checks have run.

