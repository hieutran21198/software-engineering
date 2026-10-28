---
id: deliver
depends_on: []
covers:
  - element: requirements/packages.md
    ids: [NP5]
---

# Deliver the refreshed hash

## Scope and location

`nix/lib/npm-deps.nix`.

## Definition of Done

- [ ] The fixed-output hash equals the derivation value of the 1.29.0 Plane
      sources on every target.
- [ ] `nix build .#checks.x86_64-linux.packages` builds the dependency set and
      the package check.
- [ ] The knowledge validator reports `ok: true`, `nixfmt` passes and
      `git diff --check` passes.

## Evidence

Filled during implementation.
