# Embedded bundle and conservative local copying

## Recovery basis

Observed choices are recovered from current sources. Historical reasoning and original approval are not inferred. Boundary registration in ADR 001 is a proposed organizational decision for this change; existing runtime behavior is unchanged.

## Context

The command packages the ADD source with mounted canonical utility skills and uses a catalog plus a filesystem copy engine. Consumer edits must survive adoption.

## Decision

Retain the observed Go fs.FS embedding and required-skills mount, architecture selection, full conflict preflight, contained local destinations and exclusive new-file creation.

## Alternatives considered during recovery

Downloading mutable content at adoption time would add a network/version dependency. Forced overwrite or automatic merge would change consumer-preservation behavior. A separately maintained utility copy would risk drift. These are reconstructed comparisons, not evidence of original author deliberation.

## Consequences

Binaries are self-contained and need rebuilding for source updates. Differing destinations require manual reconciliation or another output path. Write rollback is best-effort and can leave directories. Harness setup remains a consumer agent responsibility.

## Evidence

Repository-relative source paths: src/archs/catalog.go; src/archs/artifact-driven/bundle.go; src/utils/agents/skills/bundle.go; internal/adopt/adopt.go; cmd/se-adopt/main.go; docs/artifact-driven/05-adoption/README.md.
