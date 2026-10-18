---
id: hidden-tab-streams
depends_on: []
---

# Close event streams in hidden browser tabs

## Scope and ownership

Coordinator, as implementer. Repository: this repository. Files: apps/artifact-plane/src/page-visible.js (new), apps/artifact-plane/src/main.jsx (the repository-events effect and the RuntimeProvider `active` value), and apps/artifact-plane/test/browser/project-tabs.spec.js (new tests). Runtime.jsx, the server and the event API do not change.

## Governing knowledge

R11 in requirements/live-reload.md; Hidden browser tab in specifications/project-tabs.md; Browser behavior in specifications/live-reload.md; flow repository-refresh, step observe.

## Prerequisites

Explicit user approval of this plan. ADD 2.8.0 and Artifact Plane 1.18.0 are established.

## Definition of Done

- [ ] `usePageVisible()` returns false while `document.visibilityState` is `hidden` and updates on `visibilitychange`.
- [ ] ProjectExplorer observes only when the project is active and the page is visible: the repository-events effect and `RuntimeProvider active` use that value. Other `isActive` uses do not change. A hidden page marks observation disconnected.
- [ ] A browser test opens three pages of one repository in one context, makes two of them hidden, opens a document in the third and sees its text within 5 seconds.
- [ ] A browser test hides a page, checks that its server stream count drops, makes it visible again, and sees a new overview read and the status return to Current.

## Evidence

Implementation has not started.
