---
tasks:
  - 01-source-context.md
  - 02-reading-layout.md
  - 03-contained-links.md
  - 04-loading-recovery.md
  - 05-browsing-shell.md
  - 06-focused-review.md
  - 07-integration-publication.md
  - 08-heading-hierarchy.md
  - 09-navigation-resize.md
  - 10-highlighted-code.md
  - 11-reading-controls-validation.md
---

# Simpler exploration implementation plan

One outcome covers all ten audit findings. Seven fresh tasks execute sequentially because they share main.jsx, view lifecycle and CSS. Independent agents would add merge risk here; reuse the current capable session. No separate state registry or copied historical tasks are needed.

1. [Unify source context](01-source-context.md): one worktree selection activates every current-knowledge view.
2. [Make reading primary](02-reading-layout.md): main reader, explicit return, independent list/canvas disclosure and no empty inspector.
3. [Open allowed sources directly](03-contained-links.md): scoped local Markdown navigation and direct flow support actions.
4. [Fix loading and recovery](04-loading-recovery.md): selected-unit automatic completion, local busy/retry and bounded request waits.
5. [Simplify browsing and shell](05-browsing-shell.md): shared search feedback, secondary metadata/discovery, compact source controls and unique tab labels.
6. [Focus review](06-focused-review.md): purpose-first changed passages, bounded full diff and explicit partial/page export limits.
7. [Integrate and prepare publication](07-integration-publication.md): actual behavior/visual/security regressions, complete snapshot and PR handoff.

## Coverage and impact

| Audit finding | Requirement | Implementation task |
| --- | --- | --- |
| Misleading worktree selection | UX1 | source-context |
| Reading below machinery/narrow panel | UX2 | reading-layout |
| Inert/indirect source navigation | UX3 | contained-links |
| Loading presented as unknown/zero | UX4 | loading-recovery |
| List disclosure expands graph | UX5 | reading-layout |
| Repeated metadata and provenance | UX6 | browsing-shell |
| Inconsistent search and scope | UX7 | browsing-shell |
| Raw review comparison/loading | UX8 | loading-recovery, focused-review |
| Identical project labels | UX9 | browsing-shell |
| Persistent setup and empty execution UI | UX10 | browsing-shell |
| Preserved safety and evidence | UX11 | every task, integration-publication |

## Gates and baseline

Requirement, Specification and Plan have separate phase commits. This concrete plan requires explicit user approval before implementation. The earlier audit recommendations and general optimization request do not approve this newly specified plan. No application files or implementation tests have changed during preparation.

The dedicated branch starts from the audited codex/spacing-control-consistency revision. Existing main contains search/readability PR #25. Presentation 1.12.2 remains an inherited unpublished proposal at preparation time; no PR was found for its branch. Preserve it and reconcile its publication/base status before PR handoff. No new artifact edge is introduced. Recheck the existing established ADD 2.1.0 contracts before dependent implementation. Do not infer another version's establishment from copied knowledge, a feature branch or an open PR.

The proposed release is 1.13.0 because this outcome adds a main-area reader and compatible controlled local navigation while retaining API/schema and evidence contracts. Confirm or override the version with the user before version preparation. No snapshot, root current-version change or package version bump is part of planning.

## Validation plan and self-check

Use the existing Node and browser suites, build and read-only fixture conventions. Add meaningful behavior/security/diff checks, not tests that merely repeat markup. Inspect actual rendered geometry/screenshots, async failures and keyboard interaction. Root Go tests/vet and website build cover knowledge integration. Record exact commands and observed limitations only when executed.

Seven unique task IDs and six prerequisite edges form one acyclic chain ending at integration/publication. Every UX requirement has executable task DoD; all eight affected flow records have contract support and will receive actual evidence. Required upstream establishment and user approval are separate from the task chain. KISS uses existing services and removes duplicate actions/state coupling; STE keeps labels and partial-evidence limits precise. No preparation blocker remains.

## Original implementation approval

The user explicitly approved this concrete plan and proposed 1.13.0 in the conversation. Implementation is authorized on the dedicated branch. Rechecked origin/main: ADD declares 2.1.0 with publication review; no new artifact prerequisite is introduced. Preserve pending presentation work and stop for team review/merge after PR preparation.

## Reading-control amendment awaiting approval

The three user screenshots request UX12–UX14 after the original implementation. The original approval and seven completed tasks remain valid for their delivered scope. This material amendment requires renewed approval. Application code, dependencies and the prepared version snapshot remain unchanged during preparation.

8. [Larger headings](08-heading-hierarchy.md): consistent sizes above body text and wrapping source titles.
9. [Resizable navigation](09-navigation-resize.md): a left divider matching pointer/keyboard behavior with bounded shared layout.
10. [Highlighted code](10-highlighted-code.md): one local bounded renderer for source files and fenced examples, with safe plain fallback.
11. [Validate and reconcile](11-reading-controls-validation.md): responsive/source-safety regression, fresh evidence, complete 1.13.0 proposal update and PR #26 handoff.

Execute these four fresh tasks in order in the current dedicated worktree because they share CSS and rendering. Add no concurrent agents or new worktrees for this sequential extension. It remains the same unit outcome/member; the added reading-controls criterion has no passing evidence yet. No older task is reopened or copied. Same-artifact proposal reconciliation does not introduce an upstream artifact gate or infer 1.13.0 establishment. Recheck protected supplier/PR context before execution.

Follow-up Plan self-check: eleven unique task IDs form one acyclic chain with ten edges, including the four fresh tasks after retained integration-publication. Scope, governing contracts, ownership, concrete DoD and integration checks cover UX12–UX14. KISS reuses existing controls and source boundaries; STE states limits and plain fallback precisely. The same capable TL session completed Specification and Plan sequentially. No preparation blocker remains. Wait for explicit user approval before implementation.
