---
tasks:
  - 01-publication-evidence.md
  - 02-search-order.md
  - 03-worktree-observation.md
  - 04-review-context-service.md
  - 05-review-adapters.md
  - 06-review-interface.md
  - 07-integrated-validation.md
---

# Evidence-based review and context plan

Implement the three corrections first, then the shared review/context service, its adapters and the contextual UI. Complete integrated validation and prepare a proposed compatible minor version 1.12.0 with a linked PR for team review. The user can confirm or override the version during plan approval. No implementation begins until explicit approval of this concrete plan.

| Task | Ownership | Prerequisites |
| --- | --- | --- |
| [Publication evidence](01-publication-evidence.md) | Publication/workflow readers and evidence tests | None within this plan |
| [Search order](02-search-order.md) | Flow ranking, list label and retrieval checks | None within this plan |
| [Worktree observation](03-worktree-observation.md) | Runtime identity/store/UI matching and runtime checks | None within this plan |
| [Shared review/context service](04-review-context-service.md) | New derived reader, packet facts and pure formatter | All three corrections |
| [HTTP/MCP adapters](05-review-adapters.md) | Review endpoint, additive tools and protocol tests | Shared service |
| [Review interface](06-review-interface.md) | Delivery entry, review panels, local export and browser checks | Adapters |
| [Integrated validation and version](07-integrated-validation.md) | Combined acceptance, retained knowledge/evidence and PR | Review interface |

## Dispatch and gates

The first three tasks have independent scopes and can use separate implementation worktrees/branches after approval. Their workers are not alone in the codebase and must preserve other workers' edits. The coordinator owns all knowledge, unit membership and evidence updates, integrates code commits and checks the combined revision. A sequential run is valid if parallel execution is unavailable or not useful. No worker edits historical snapshots, retained delivered tasks, or the shared unit.

Existing artifact-plane -> artifact-driven remains. ADD 2.1.0 is the required established supplier; verify its published contract again before implementation. Membership adds no prerequisite. Three task roots do not imply approval or readiness.

## Validation methods

- Focused Node behavior suites for each corrected reader, query service and protocol boundary.
- Existing full npm test with deterministic ranking regression required, plus actual installed-model offline checks and the five expected semantic-query benchmark cases. Explicit local model installation is permitted only if assets are unavailable; normal retrieval never downloads.
- Existing app build and complete browser suite with the verified installed Chromium executable. New browser cases exercise review before/after, export, clipboard failure, unsafe text, 700/1440 layouts, project/worktree changes and refresh races.
- Real Git/Markdown fixtures and fingerprints prove unchanged inspected repository bytes/status/refs. Two real identical-task worktrees validate current attribution and archived history.
- Validate unit/task/flow metadata, actual local links against documentation hierarchy, complete snapshot path sets/bytes, absence of copied tasks and preservation of existing historical knowledge/evidence.

Passing these checks does not establish a version or grant approval. Record actual DoD results in the originating tasks and combined checks in the unit brief. Prepare source_change and delivery_tasks: change only in the new complete version README; retain this fresh plan. Push the dedicated branch, open/attach the PR, then stop for team review and merge.

## Plan self-check

Seven unique tasks and IDs form an acyclic graph. All prerequisite IDs resolve. Each of the five user-selected outcomes has focused acceptance and an integration join. First roots have nonconflicting ownership; downstream consumers wait for corrected evidence/ranking/identity. Contracts cover source scope, errors, cursor revisions, legacy observations, both-side impact and local-only exports. No additional artifact, upstream change, LLM, dependency or state database is required. KISS shares one review service/formatter; STE distinguishes documented assertions, captured context and approval. Plan is complete for user review; implementation has not started.

## Approval and delivery

The user approved this concrete plan with “chấp nhận” and later requested continuation. The coordinator integrated the approved tasks on a dedicated branch. Actual checks remain in each task and the unit brief. Version 1.12.0 remains a proposed publication; this approval does not authorize merge or certify establishment.
