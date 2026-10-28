---
tier: small
---

# Refresh the Plane npm dependency hash

## Reason and scope

Artifact Plane 1.29.0 changed `apps/artifact-plane/package-lock.json`. The
fixed-output derivation in `nix/lib/npm-deps.nix` still names the 1.28.0 hash,
so the Nix packages check on merge revision 8727e0b fails on all four targets:

```text
specified: sha256-psZAqaiAwh9vM7VMEFqf7JNjjNoJVlshYeLwZYuwRu0=
got:       sha256-dqLIaoctAYMZc9HqGJaFQ3u6aK0V9orf7qY3jSzeSsc=
```

Included: update the fixed-output hash and the rule that keeps it current.
Excluded: application code, versions, other packages and targets.

## Plan

One task changes `nix/lib/npm-deps.nix` and checks the `x86_64-linux` package
set. The task covers NP5 in requirements/packages.md. Compatibility: patch.

## Tier decisions

One repository: the expression and the knowledge are in this repository.
Impact: the hash reaches only the fixed-output dependency derivation. The
package outputs, commands, flake interface, flows and dependencies do not
change.

- [Task](tasks/01-deliver.md)
