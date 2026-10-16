# Spacing and control consistency requirements

- C1: Inspector headings, actions, status text, reasons and helper text have deliberate visible separation across Artifact, Unit of Work, Flow, review and execution details. Repeated rows remain readable at narrow and wide sizes.
- C2: Worktree, Recorded executions, Artifact, search-mode and flow-source dropdowns share typography, surface, border, radius, padding and focus treatment. Preserve native keyboard behavior, accessible names, disabled state and selected values.
- C3: Completion evidence presents one meaningful not-loaded status. Preserve distinct reasons, loading/error feedback and loaded evidence. The action remains visibly separated from feedback.
- C4: No horizontal overflow or obscured controls at 700/1440 widths and resized inspectors. Preserve Markdown formatting, graph layout, source selection, read-only behavior and search navigation.

## Scope and uncertainty

Audit these existing surfaces and correct shared spacing/control rules. No custom dropdown framework, new design system package, business-rule changes or lifecycle repair. This is source-backed consistency work; the extent of visual defects beyond the supplied example requires rendered inspection during implementation.
