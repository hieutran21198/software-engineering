---
source_change: change-plane-npm-deps-hash
---

# nix-packages 1.0.2

Patch: refreshes the fixed-output npm dependency hash after the Artifact Plane
1.29.0 lock change, so the four-platform package check builds again. Package
outputs, commands and the flake interface do not change.

The plan and its evidence are in the [originating change](../../changes/change-plane-npm-deps-hash/tasks/README.md).
