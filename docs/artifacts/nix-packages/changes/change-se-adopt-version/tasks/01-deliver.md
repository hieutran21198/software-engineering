---
id: deliver
depends_on: []
covers:
  - element: requirements/packages.md
    ids: [NP1]
---

# Deliver the se-adopt version

## Scope and location

nix/packages/se-adopt/default.nix and nix/README.md.

## Definition of Done

- [ ] The se-adopt package version is `current_version` of docs/artifacts/artifact-driven/README.md, and evaluation fails when the record has no version.
- [ ] nix/README.md names the version source of both packages.
- [ ] nix eval gives the ADD version for x86_64-linux and aarch64-darwin.
- [ ] The package check builds se-adopt with that version and passes on x86_64-linux.
- [ ] The Nix workflow passes on the four systems.
- [ ] nixfmt, the validator and git diff --check pass.

## Evidence

Record the commands and results here.
