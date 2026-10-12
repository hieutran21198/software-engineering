# Display workflow evidence and validate integration

## Scope and ownership

Own Workflow view in src/main.jsx and styles, browser tests, and app README instructions. Coordinator owns combined artifact evidence and release handoff.

## Prerequisites and governing elements

Tasks 06 and 07 integrated; user approval. Requirements 17–20 and B12–B14; UI and failures contract.

## Definition of Done

- [x] Workflow view lists all worktrees, selected marker, branch/path/HEAD, changes, inferred step and reasons, task evidence, and expandable commit IDs/messages.
- [x] Open another readable ADD worktree through the existing API; unavailable and unknown states remain visible. Switching views preserves canvas selection and panel width.
- [x] Full commit IDs are inspectable; associated commits are distinguished from proven completion; no workflow execution or automatic refresh exists.
- [x] Run npm test, npm run build, and npm run test:browser; preserve existing acceptance and API/security checks.
- [x] Inspect canvas histories, long worktree paths/messages, workflow uncertainty, and narrow/wide layouts visually. Verify all inspected worktree bytes and Git metadata are unchanged.
- [ ] Record evidence and check documentation hierarchy; obtain version confirmation, prepare complete snapshot/root/DAG, and open the review PR with integrated CI evidence. Stop for team merge.

## Evidence

The integrated Node suite passed 24 checks; the production build passed; all 6 Chromium browser checks passed. B11 covers proposed references into hidden history and preserving selected details after collapse. Its failing regression found reference-label overlap that intercepted history controls; non-interactive edge labels now allow clicks through. B12–B14 verify registered worktree branch/path, unavailable entries, full completion-evidence IDs and subjects, unknown approval, explicit worktree opening, preserved canvas transform/selection/inspector width, narrow layout, and unchanged file/Git fingerprints. Wide and narrow screenshots were inspected. Vite retains its existing non-blocking bundle/client-directive warnings. The user confirmed compatible minor version 1.2.0. Documentation links passed target and hierarchy checks. Snapshot and PR preparation follow this confirmation.
