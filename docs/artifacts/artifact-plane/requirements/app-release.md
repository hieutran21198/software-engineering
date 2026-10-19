---
self_check:
  result: passed
  source: docs/artifacts/artifact-plane/requirements/app-release.md#requirement-self-check
---

# Release the Plane as an application

## Outcome

A person downloads one file for their computer from a GitHub release, checks it, runs it and uses the Plane, without Node.js, npm or a source checkout.

## Need

Facts on 19 October 2026:

- The Plane runs only from a source checkout: Node.js 24 or later, `npm ci`, `npm run build` and `npm start` in apps/artifact-plane (README, Run). `npm ci` installs 645 MB of packages on this machine and needs `ONNXRUNTIME_NODE_INSTALL_CUDA=skip` to finish here.
- `se-adopt` is released as six executable files (Linux, macOS and Windows on AMD64 and ARM64) with `SHA256SUMS`, attached to a GitHub release by the tag `v<version>` (README, Build). The Plane has no release asset.
- Two independent assessments of ADD on 19 October 2026 did not count the Plane in the default install, because the bundle and `se-adopt` do not deliver it.
- The server stores SQLite data with the built-in `node:sqlite`. The optional semantic discovery model is downloaded by `npm run flow:model-install` into the private state directory. The package tree contains prebuilt `onnxruntime-node` bindings for the six targets.
- The owner decided on 19 October 2026: one executable file for each operating system and processor, and a separate release tag `plane-v<version>`.

## Requirements

- AR1: Each release offers one executable file of the Plane for Linux, macOS and Windows on AMD64 and ARM64, and one `SHA256SUMS` file for them.
- AR2: The executable runs without Node.js, npm, a source checkout or network access, except the optional model download of AR4.
- AR3: The executable serves the same pages and HTTP interface as `npm start`, with the same port, state directory and environment settings, and offers the stdio MCP server and its version number.
- AR4: Semantic discovery in the executable behaves as from source: keyword discovery works without the model, and one command of the executable installs and verifies the pinned model.
- AR5: A tag `plane-v<version>` on a reviewed commit publishes a GitHub release with the files of AR1. The release is refused when the version differs from `current_version` of artifact-plane or from the package version. Tags `v<version>` keep publishing `se-adopt` only.
- AR6: CI builds the executable for every target on each pull request and push, and starts each built file on its own operating system to check that it serves the application and opens a repository.
- AR7: The Plane README describes download, checksum check, start, the macOS and Windows warnings for an unsigned file, and the source path, which stays available.
- AR8: Existing CI jobs, the `se-adopt` release and the source workflow (`npm ci`, `npm run build`, `npm start`) keep their behavior.

## Acceptance criteria

- ARA1: A CI run of the pull request produces six executable files and their `SHA256SUMS`, and each file passes its start check on its own operating system and processor.
- ARA2: On a machine without Node.js on the path, the Linux AMD64 file opens this repository and shows the work page, and its MCP command lists the tools.
- ARA3: The model install command of the executable installs the pinned model, and a semantic query returns flows afterwards.
- ARA4: A check of the release workflow refuses a `plane-v` tag whose version differs from `current_version` or the package version, and a `v` tag does not build the Plane release.
- ARA5: The README section is in the change evidence; the existing Node, browser and Go suites pass.

## Affected artifacts and flows

Artifact Plane and the repository CI only. Flows: repository-exploration changes its select step support (the person starts the executable); source-retrieval changes its supports for the model install. The ADD bundle, `se-adopt` and their release are not changed.

## Requirement self-check

Each fact comes from the README, the package tree, the CI file or the owner's decision. Each requirement states a need and is testable through ARA1 to ARA5. The packaging technique, the target runners and the handling of the native binding belong to Specification. KISS: one file for each target, one tag, the existing release mechanism. STE: one rule in each item. No blocker prevents Specification.
