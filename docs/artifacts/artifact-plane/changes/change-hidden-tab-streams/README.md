# Keep document reads working with several Plane tabs open

## Reason and scope

On 18 October 2026 the owner reported that every document page stayed on "Reading the text…" and then showed "Request timed out". The diagnosis found two defects.

- A browser opens at most 6 HTTP/1.1 connections to one host. Each browser tab with an open repository keeps 2 event streams open: repository events and runtime events. Hidden tabs keep them too. With three tabs, the browser has no free connection, holds every read in its queue, and the read stops after 30 seconds. A single document read on the same server took 0.33 seconds.
- A reply that failed after its headers were sent made the error handler send headers again. The second error stopped the server process. A diagnostic request to `/api/explore` stopped the owner's server this way.

Included: observation streams of hidden browser tabs, the HTTP reply guard, and their tests. Excluded: a shared stream for all tabs, HTTP/2, the size of the `/api/explore` reply, server API changes and ADD contracts.

Artifact Plane owns this change. The established baseline is Artifact Plane 1.18.0 on main, and ADD 2.8.0 is its established supplier; no ADD contract changes. Knowledge is edited in place on branch claude/hidden-tab-streams. This change belongs to the hidden-tab-streams unit.

- [Requirements](../../requirements/live-reload.md) (R11–R12)
- [Project tab contract](../../specifications/project-tabs.md) (Explorer isolation and lifecycle)
- [Explorer contract](../../specifications/explorer.md) (Runtime and opening)
- [Plan](tasks/README.md)
