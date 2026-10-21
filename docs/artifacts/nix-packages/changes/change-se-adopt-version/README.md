---
tier: small
---

# Give the se-adopt package the ADD version

## Reason and scope

The se-adopt package sets the fixed version 3.1.0. ADD moved to 3.2.0 in #52, so the flake builds the ADD 3.2.0 source of se-adopt under the name se-adopt-3.1.0. se-adopt releases carry the ADD version: tag v3.1.0 is the release "se-adopt v3.1.0".

Included: read `current_version` from the ADD identity record at evaluation, and name both package version sources in nix/README.md. Excluded: a version flag in the se-adopt command, the v3.2.0 release tag, and the Artifact Plane package, which already reads package.json.

## Plan

One task changes nix/packages/se-adopt/default.nix and nix/README.md, and checks the evaluated version on two systems and the package check. The task covers NP1 in requirements/packages.md. Compatibility: patch.

## Tier decisions

One repository: the package expression, the documentation and the knowledge are in this repository.

Impact: the version reaches only the se-adopt derivation name and the store path. The package smoke check, the Nix workflow and the Artifact Plane package use the derivation, not its version. No flow record, decision, requirement ID, dependency or referenced element changes.

- [Task](tasks/01-deliver.md)
