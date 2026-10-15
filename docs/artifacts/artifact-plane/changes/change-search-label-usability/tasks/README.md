---
tasks:
  - 01-named-search.md
  - 02-readable-labels.md
  - 03-shared-controls.md
  - 04-integrated-validation.md
---

# Search and graph readability implementation plan

Implement metadata matching and labelled graph presentation first; shared controls consume matching. Integrated validation joins both paths. Four fresh tasks cover all three user reports.

- [Filter flow metadata before paging](01-named-search.md)
- [Keep graph relationship text readable](02-readable-labels.md)
- [Align Unit of Work and Flow search interaction](03-shared-controls.md)
- [Validate and prepare the proposed patch](04-integrated-validation.md)

## Gates and execution

User approval of this new concrete plan is required before implementation. Existing ADD 2.1.0 remains the sole upstream supplier and must be reverified at dispatch. No new artifact edge is needed. Independent roots may use separate worktrees only after approval; label and search owners coordinate shared CSS. Sequential implementation is valid. Workers are not alone and must preserve other edits; artifact and unit updates remain coordinator-owned.

Prepare compatible patch 1.12.1 after checks. Preserve the root’s explicit 1.11.0 declaration and merged 1.12.0 knowledge; do not silently repair lifecycle state. Keep original task plans/evidence and all historical snapshots.

## Validation and self-check

Use focused service/adapter and actual browser fixtures, then full Node/build/browser checks with the verified Chromium executable. Run installed-model discovery and the six existing benchmark queries independently of title mode; no model skip can prove this check. Verify real repository fingerprints, layout visibility rather than label-string presence, task DAG, flow source support, document hierarchy and complete snapshot bytes.

Four unique task IDs form an acyclic graph with three resolved edges. Metadata search has no pending new supplier. The new match selector preserves external defaults and confines inference to explicit discovery. Label work has fixture reproduction as DoD because the screenshot was not decodable. KISS and STE self-checks pass. Implementation remains gated on user approval; team review/merge remains a separate publication gate.

## Artifact-filter plan amendment

The same four-task DAG now includes the user-requested Artifact selector and contextual Find participating flows navigation. Named-search owns complete eligibility, scoped options and API/cursor parity. Shared-controls owns the selector, per-project state and entry preselection. Integrated validation checks cross-owner participation, composite queries, unavailable artifacts and delayed replies. No new supplier or task edge is required. Recorded executions was inspected for the user’s question and is not redesigned. This updated concrete plan requires explicit approval before implementation.

## Implementation approval

The user explicitly approved the updated concrete plan, including Artifact filtering and contextual entry. Implementation is authorized on the dedicated branch. Existing ADD 2.1.0 supplying knowledge is present on main. Proposed patch 1.12.1 remains subject to validation and team review/merge.
