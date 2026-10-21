---
source_change: change-se-adopt-version
---

# nix-packages 1.0.1

Patch: the se-adopt package takes its version from `current_version` of the ADD identity record, the version that names se-adopt release tags. The flake now builds se-adopt-3.2.0 instead of se-adopt-3.1.0. Package outputs, commands and the Artifact Plane package do not change.

The plan and its evidence are in the [originating change](../../changes/change-se-adopt-version/tasks/README.md).
