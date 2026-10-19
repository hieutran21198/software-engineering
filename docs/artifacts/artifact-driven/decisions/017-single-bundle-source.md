# Embed the bundle from its canonical directory

## Context

The bundle exists twice in Git: `docs/artifact-driven` and `src/archs/artifact-driven`, byte-identical and kept equal by a test. Every method change edits both, and 1,152 lines per copy appeared twice in PRs #29 to #39. Go `embed` reads only files in the package directory and its children, so the copy exists to give the Go package the files. The owner decided to keep one source.

## Alternatives

| Option | Description | Assessment |
| --- | --- | --- |
| A. Keep two copies | No change. | The measured duplication stays. Rejected by the owner. |
| B. Generate the copy at build | `go generate` copies the canonical directory into `src/archs/artifact-driven`; Git ignores the copy. | One source in Git, but `go test` and `go build` fail until the generate step runs, and CI, release and website builds all need the extra step. Rejected. |
| C. Go package beside the bundle | The embedding Go files move into `docs/artifact-driven`; the catalog imports that package. | One source, no generated file, no extra build step. The Go files are excluded from the embedded bundle. Selected. |

## Decision

Adopt option C. `docs/artifact-driven/bundle.go` and its test embed the bundle sections, `tools/` and the required-skill mount from their current sources. `src/archs/artifact-driven` is removed. The catalog imports the new package path. The website copies the bundle Markdown from `docs/artifact-driven` to the same site path as before, so links stay valid.

## Consequences

A method change edits one file. The bundle directory holds two Go files that consumers never receive. The owner chose "generate at build"; this option meets the same goal without a generated copy, and the plan presents it for approval.
