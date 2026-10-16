# Project tab requirements

## Need

Explore several projects without replacing the current project. The user confirmed application tabs and restoration of open projects and the active tab after refresh or browser restart.

## Scope

Add, select, and close project tabs. Keep each project's navigation and selections independent during the page session. Restore project paths, tab order, and the active project. Existing explorer views and read-only behavior remain available.

## Proposed defaults

Opening an already open canonical repository selects its tab. A new tab starts with the repository path form. Navigation details and graph positions need not persist across page reloads. Closing the last tab returns to an empty project tab. Tabs do not synchronize between separate browser windows. These defaults are part of the plan approval scope.

## Acceptance criteria

1. The user can use a visible plus button to open a second project while retaining the first.
2. Switching projects restores each project's view, worktree, selection, filter, and graph viewport during the current page session.
3. Closing one project leaves other projects usable and releases its outstanding reads and observation resources.
4. Refresh or restart restores successfully opened project paths, their order, and the active project in the same browser profile and application origin.
5. An unavailable restored project shows a recoverable error in its own tab; other projects remain usable.
6. Requests, responses, observation events, runtime details, and errors stay within the owning project tab, including rapid switching and closing.
7. Storage failures do not prevent current-session exploration. Repository contents and Git state remain unchanged.

## Impact and exclusions

Artifact Plane owns this capability. No ADD domain rule or dependency changes. Exclude persisted graph snapshots, cross-window synchronization, tab reordering, project editing, deployment, and automatic merge. Existing explorer contracts remain authoritative.
