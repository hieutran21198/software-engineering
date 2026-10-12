# Implementation plan

Implement the read-only explorer in `apps/artifact-plane` after explicit user approval. Keep development artifacts under coordinator control. All work belongs to this repository and the dedicated change branch.

## Tasks and order

1. [Repository scanner and local API](01-reader.md).
2. [Graph explorer interface](02-interface.md).
3. [Integrated validation and delivery](03-validation.md).

The reader and interface can be built independently against the snapshot contract, but sequential implementation avoids worktree and integration overhead for this small application. Integrated validation follows both tasks. There are no required upstream project versions.

## Governing elements

Tasks implement `requirements/explorer.md`, `specifications/explorer.md`, and `decisions/001-local-server.md` in this change. These are snapshot-relative references, not links to ancestor pages.

## Self-check

All acceptance criteria have scanner, UI, or integrated checks below. Tasks specify ownership, prerequisites, and observable DoD. KISS keeps one app and sequential work. STE checks keep actions and validation criteria explicit. No implementation has started; approval is required before these tasks execute.
