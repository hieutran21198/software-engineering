# Display workflow evidence and validate integration

## Scope and ownership

Own Workflow view in src/main.jsx and styles, browser tests, and app README instructions. Coordinator owns combined artifact evidence and release handoff.

## Prerequisites and governing elements

Tasks 06 and 07 integrated; user approval. Requirements 17–20 and B12–B14; UI and failures contract.

## Definition of Done

- [ ] Workflow view lists all worktrees, selected marker, branch/path/HEAD, changes, inferred step and reasons, task evidence, and expandable commit IDs/messages.
- [ ] Open another readable ADD worktree through the existing API; unavailable and unknown states remain visible. Switching views preserves canvas selection and panel width.
- [ ] Full commit IDs are inspectable; associated commits are distinguished from proven completion; no workflow execution or automatic refresh exists.
- [ ] Run npm test, npm run build, and npm run test:browser; preserve existing acceptance and API/security checks.
- [ ] Inspect canvas histories, long worktree paths/messages, workflow uncertainty, and narrow/wide layouts visually. Verify all inspected worktree bytes and Git metadata are unchanged.
- [ ] Record evidence and check documentation hierarchy; obtain version confirmation, prepare complete snapshot/root/DAG, and open the review PR with integrated CI evidence. Stop for team merge.

## Evidence

Implementation has not started.
