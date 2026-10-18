---
id: hidden-tab-streams
depends_on: []
evidence_records:
  - id: dod
    method: Two new project-tabs.spec.js tests that set the hidden state, run on the fix and on the 1.18.0 main.jsx.
    result: passed
    source: docs/artifacts/artifact-plane/changes/change-hidden-tab-streams/tasks/01-hidden-tab-streams.md#evidence
---

# Close event streams in hidden browser tabs

## Scope and ownership

Coordinator, as implementer. Repository: this repository. Files: apps/artifact-plane/src/page-visible.js (new), apps/artifact-plane/src/main.jsx (the repository-events effect and the RuntimeProvider `active` value), and apps/artifact-plane/test/browser/project-tabs.spec.js (new tests). Runtime.jsx, the server and the event API do not change.

## Governing knowledge

R11 in requirements/live-reload.md; Hidden browser tab in specifications/project-tabs.md; Browser behavior in specifications/live-reload.md; flow repository-refresh, step observe.

## Prerequisites

Explicit user approval of this plan. ADD 2.8.0 and Artifact Plane 1.18.0 are established.

## Definition of Done

- [x] `usePageVisible()` returns false while `document.visibilityState` is `hidden` and updates on `visibilitychange`.
- [x] ProjectExplorer observes only when the project is active and the page is visible: the repository-events effect and `RuntimeProvider active` use that value. Other `isActive` uses do not change. A hidden page marks observation disconnected.
- [x] A browser test opens three pages of one repository in one context, makes two of them hidden, opens a document in the third and sees its text within 5 seconds.
- [x] A browser test hides a page, checks that the page has no open event stream, makes it visible again, and sees a new overview read and the status return to Current.

## Evidence

Executed on 18 October 2026 after the owner approved the plan.

- src/page-visible.js adds `usePageVisible()`. In src/main.jsx, `observing = isActive && visible` gates the repository-events effect and `RuntimeProvider active`; a separate effect marks observation disconnected when an active project's page is hidden. Other `isActive` uses do not change.
- Headless pages always report visible, so the tests replace `document.visibilityState` and dispatch `visibilitychange`. They count open streams with the `EventSource` wrapper that the existing switching test uses. The browser does not expose the server's stream count; the page's own count shows the same fact.
- "hidden browser tabs release their streams so the visible tab reads documents" passed: two pages each drop from 2 to 0 open streams when hidden, and the third page shows "Established identity rules." within the 5-second limit. Its first run failed because later pages restore the open project from storage and have no Open repository form; the test now opens them with `goto('/')`.
- "a tab that becomes visible again reconnects and reloads current evidence" passed: the hidden page shows "Not up to date" with 0 streams; when visible, it sends an overview read, opens 2 streams and the status goes away. The top bar has no "Current" label; the absence of "Not up to date" after a settled Refresh button is the current state.
- Negative control: with the 1.18.0 main.jsx rebuilt, both tests failed (a hidden page kept 2 streams). The fix was then restored and rebuilt.
- test/browser/project-tabs.spec.js: 7 of 7 passed.
