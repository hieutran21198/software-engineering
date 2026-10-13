# Observe Codex through lifecycle hooks

## Context

Readers want to see existing Codex task execution on the ADD DAG. Sessions and temporary worktrees do not reliably retain artifact/task identity in the visualization. Current graphs deliberately do not infer running agents.

## Decision

Use configured lifecycle command hooks and explicit session/task binding for this first release. Store allowlisted execution observations and captured graph context outside repositories using Node built-in SQLite. Read them through local query/SSE endpoints. Keep agent execution and ADD authorization outside Plane.

## Alternatives

App Server is suitable when the application manages sessions, but would expand this release toward agent launch/control or require a verified attachment interface. MCP reporting can provide explicit task identity, but lifecycle observations still need hooks and would add a server dependency. Transcript parsing is unstable and risks persisting sensitive content. A store inside implementation worktrees loses history during cleanup. An in-memory store loses history on restart.

## Consequences

Users must enable and trust hooks in Codex and explicitly bind agent sessions. Hook events provide observations, not continuous liveness or task success; stale activity becomes Unknown. SQLite transactions support concurrent hook writers without a separate service. Existing artifact evidence remains authoritative for delivery. No launch/control or automatic approval/merge is added.

## Source

[Official Codex lifecycle hook contract](https://learn.chatgpt.com/docs/hooks). The installed CLI is 0.160.1; its generated protocol schema confirms hook metadata and agent/session types, but actual hook execution still needs implementation smoke validation.
