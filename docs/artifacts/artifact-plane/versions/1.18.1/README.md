---
source_change: change-hidden-tab-streams
---

# artifact-plane 1.18.1 — Keep document reads working with several tabs open

Compatible patch version. A hidden browser tab closes its repository and runtime event streams and opens them again with a fresh read when it becomes visible, so open background tabs no longer use all six HTTP/1.1 connections that a browser allows per host. A JSON reply is serialized before its headers are sent, and a failure after the headers closes only that connection; the server process keeps running. Routes, the event API, successful replies and ADD contracts do not change.

This record holds no knowledge directories and no tasks. The originating plan and its evidence are in the [retained change](../../changes/change-hidden-tab-streams/tasks/README.md).
