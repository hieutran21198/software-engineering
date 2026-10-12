# Implementation plan

Implement the read-only explorer in `apps/artifact-plane` after explicit user approval. Keep development artifacts under coordinator control. All work belongs to this repository and the dedicated change branch.

## Tasks and order

1. [Repository scanner and local API](01-reader.md).
2. [Graph explorer interface](02-interface.md).
3. [Integrated validation and delivery](03-validation.md).

The reader and interface can be built independently against the snapshot contract, but sequential implementation avoids worktree and integration overhead for this small application. Integrated validation follows both tasks. There are no required upstream project versions.

## Governing elements

Tasks implement `requirements/explorer.md`, `specifications/explorer.md`, and `decisions/001-local-server.md` in this change. These are snapshot-relative references, not links to ancestor pages.

## Selected patterns

| Pattern | Planned application |
| --- | --- |
| Strategic DDD | Keep one explorer artifact and consistent artifact, element, version, change, and dependency terms. |
| Contract-Driven Development | Validate repository formats, reference resolution, API snapshot shape, errors, and UI consumption in tasks 01–03. |
| BDD | Use requirement examples B1–B6 as shared acceptance fixtures. No Cucumber dependency. |
| TDD | Implement parser, resolution, graph, and read-only behavior through failing behavior tests, implementation, and refactoring in task 01. |
| Ports and Adapters | Separate real repository reads, pure calculations, HTTP handling, and UI through plain modules in tasks 01–02. |
| CI | Add app tests and build checks to the existing GitHub Actions workflow in task 03; retain local commands. |

Use plain records and invariant checks where useful. Full tactical DDD structures, asynchronous event processing, and a policy engine serve no current requirement.

## Acceptance coverage

| Examples | Reader/API checks | UI and integration checks |
| --- | --- | --- |
| B1 | No current version; discover initial change and elements. | Display version absence and proposed knowledge. |
| B2 | Resolve the declared version; calculate established edge and reachability. | Display direction, target, and upstream/downstream lists. |
| B3, B5 | Preserve established graph; calculate proposed removals/additions. | Distinguish graph status and planning relationships. |
| B4 | Return unresolved-reference diagnostic without losing valid data. | Show target, reason, and diagnostic when expanded. |
| B6 | Compare file contents and Git state; reread after external edits. | Open, inspect, refresh, and show refreshed content. |
| B7 | Canvas actions require no repository mutation or new API contract. | Pan, zoom, fit, select, expand/collapse multiple groups, and inspect element details. |

## Canvas delivery

Task 02 uses a locally bundled React UI with React Flow and Dagre. The canvas shows artifact nodes and expands them into grouped element nodes in place. Library controls provide pan, zoom, and fit. Repository/API contracts and the selected development patterns remain unchanged. Task 03 verifies canvas interactions and read-only behavior on the integrated application.

## Self-check

All acceptance criteria have scanner, UI, or integrated checks below. Examples map to reader and browser checks. Tasks specify ownership, prerequisites, and observable DoD. KISS keeps one app, plain functions, and sequential work. STE checks keep actions and validation criteria explicit. No implementation has started; approval of this revised plan is required before these tasks execute.
