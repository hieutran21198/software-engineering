# Deliver the validator from the reader rules of the Plane

## Context

The owner decided that the default install of ADD contains a deterministic validator. The rules that it must check are implemented today in the JavaScript readers of Artifact Plane (`apps/artifact-plane/server`), which depend on the `yaml` and `marked` packages. The adoption tool `se-adopt` is a Go binary. Artifact Plane depends on artifact-driven, and its implementation waits until an ADD version is established, so ADD implementation must not need new Plane code. Requirement PI2 of the Plane asks for one implementation of each rule.

## Alternatives

| Option | Description | Assessment |
| --- | --- | --- |
| A. Go port in se-adopt | `se-adopt validate` implements every rule in Go. | No Node.js needed by consumers, but every reader rule exists twice and can drift; the port is the largest effort. Rejected. |
| B. Move the readers to an ADD package | The reader modules move from the Plane to a package that ADD owns; the Plane imports it. | One implementation with the right ownership, but a large move of Plane modules that the user interface also uses, and ADD implementation would include the move. Rejected. |
| C. Plane builds, ADD installs | ADD defines the validator contract and installs `tools/add-validate.mjs` when the release contains it. The Plane implements the rules once and builds the file into the bundle `tools/` directory before the release build. | One implementation; ADD implementation needs no Plane code; the validator reaches consumers when the Plane version is established. Needs Node.js 24 or later at the consumer. Selected. |

## Decision

Adopt option C. The contract is specifications/record-checks.md. ADD implements the `tools/` directory, its README and the install behavior. Artifact Plane implements the checks, the validator entry point and the build of the single file, and adds that build to CI before the Go build.

## Consequences

Consumers without Node.js keep the by-hand rules. Between the two versions the release contains no validator file, and adoption still succeeds. The installed validator is the Plane's reader code, so the Plane owns its tests and the unit owns the end-to-end check.
