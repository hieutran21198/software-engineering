---
tasks:
  - 01-shared-presentation.md
  - 02-completion-feedback.md
  - 03-visual-validation.md
---

# Spacing and control consistency plan

1. Normalize inspector spacing and all existing native dropdowns using shared scoped CSS.
2. Remove the duplicated unloaded completion message while retaining meaningful evidence reasons and feedback.
3. Inspect and validate all affected views at 700/1440 widths and resized inspector widths; record evidence, prepare a complete proposed 1.12.2 snapshot and PR.

- [Shared presentation](01-shared-presentation.md)
- [Completion feedback](02-completion-feedback.md)
- [Visual and integrated validation](03-visual-validation.md)

## Gates and self-check

Three fresh tasks form an acyclic graph with two edges into validation. Execute sequentially for this small shared presentation change. No new supplier or architectural dependency is needed; verify existing ADD 2.1.0 and merged search behavior before implementation. Preserve prior changes, snapshots and task evidence. KISS and STE checks pass. User approval of this new plan is required before implementation. Proposed compatible patch 1.12.2 remains subject to validation, review and merge; preserve the root lifecycle declaration.

## Implementation approval

The user explicitly approved this concrete plan. Implementation is authorized on the dedicated branch. Existing ADD 2.1.0 and merged PR #25 are available on main. Proposed 1.12.2 remains subject to checks and team review.
