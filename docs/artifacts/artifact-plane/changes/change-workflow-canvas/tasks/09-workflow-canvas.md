# Workflow canvas and inspector

## Scope and governing elements

Repository: this repository. Implementation: apps/artifact-plane/src. Requirements 21–23 and B15–B16 in requirements/explorer.md and Workflow canvas contract in specifications/explorer.md govern this task. No upstream prerequisite.

Build deterministic worktree groups, change rows, and phase nodes from the existing workflow payload. Reuse React Flow pan, zoom, and fit controls. Replace the text-first list. Integrate selection and evidence into the existing resizable inspector. Preserve independent artifact selection, source errors, explicit worktree opening, refresh semantics, and narrow layout.

## Definition of Done

- [ ] All registered worktree states appear, with selected branch and path readable.
- [ ] Changes show ordered phase nodes, evidence states, and inferred current phase.
- [ ] Sequence lines and legend do not imply completion or dependency edges.
- [ ] Selected worktree, change, and phase details show the existing evidence and complete commit IDs/messages.
- [ ] Pan, zoom, fit, resize, view switching, and selection invalidation satisfy the contract.
- [ ] No new dependency, backend inference change, polling, storage, or repository write.

## Self-check

Scope and DoD cover the presentation contract. KISS reuses existing libraries. STE preserves uncertainty language. Evidence awaits implementation.
