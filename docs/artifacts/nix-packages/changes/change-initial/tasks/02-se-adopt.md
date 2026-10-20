---
id: se-adopt
depends_on: [flake]
covers:
  - element: requirements/packages.md
    ids: [NP1, NP4, NA2]
---

# Build se-adopt

## Scope and location

Implement nix/packages/se-adopt/default.nix and package-specific checks.

## Definition of Done

- [ ] Build the installed binary from repository Go sources.
- [ ] Run existing command and adoption tests.
- [ ] Run installed --help and --list outside the source checkout.
- [ ] Adopt both architectures into separate temporary workspaces and verify expected bundle files.
- [ ] Record commands, platform and results.

## Evidence

No implementation checks have run.

