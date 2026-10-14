# Codex execution observation contract

## Ownership and architecture

R1–R10 are implemented by a local hook reporter, an observation store, read-only runtime HTTP endpoints, and an additive graph overlay. The established artifact-driven task/unit contracts remain unchanged. Plane remains an observer; no dispatch or scheduler is introduced.

Use Node 24 built-in node:sqlite, already compatible with the app engine, and no external database service. Store runtime.sqlite under ARTIFACT_PLANE_STATE_DIR when explicitly set; otherwise use XDG_STATE_HOME/artifact-plane or ~/.local/state/artifact-plane. Reject a state directory within any registered/inspected repository or worktree, including symlink aliases. Create private directories/files (0700/0600 where supported), use WAL, transactions, a bounded busy timeout, and schema version checks. Unknown newer schemas fail diagnostically rather than being rewritten. Runtime writes are permitted only for observation data; the repository explorer still never writes inspected files or Git metadata.

## Identity and retained graph context

Register a random repository ID in the runtime store, associated with the canonical Git common directory and remaining root checkout. Bind/matching identity includes canonical source worktree, repository ID, unit ID (nullable for individual plans), artifact, originating change, task path and signature. Capture identity also includes source revision and graph digest. Apply specifications/evidence-correctness.md for aliases, legacy records and changed HEADs. Agent identity = session ID plus optional subagent ID; each binding creates an attempt ID. A session/agent has at most one active binding. Rebinding closes the prior attempt as superseded/unknown and creates a new attempt. Task IDs remain plan-local.

The local runtime CLI provides register, bind, report, and hook commands. Bind reads the selected current plan through existing contained readers, rejects invalid/unavailable graphs or unlisted tasks, and captures immutable node/edge metadata for that plan/unit, plus its source digest and revision when available. Capture only safe labels, identity, and edges; never store arbitrary file contents. Bind does not authorize execution or verify prerequisites. Identical graphs at the same canonical worktree and source revision can share captured context. Never attach older observations to a materially changed task solely because its path matches.

Live overlays resolve exact matching context. A retained context is separately labeled Recorded execution context, with source revision/digest, capture time, and missing-worktree status. A surviving repository can list archived contexts even if the unit/change source is missing. Archived metadata is not current knowledge, approval evidence, or a historical establishment proof. Git remote URLs are not identity; do not merge unrelated clones automatically.

## Codex lifecycle adapter

Supply a Node command hook plus a configuration example, not automatic changes to user/global configuration. Support SessionStart, UserPromptSubmit, PreToolUse, PostToolUse, PermissionRequest, Stop, Interrupt, SessionEnd, SubagentStart, and SubagentStop from the documented Codex hook input. Confirm configuration parsing against installed codex-cli 0.160.1 before delivery. Documentation source: https://learn.chatgpt.com/docs/hooks . Supported fields include session_id, cwd, hook_event_name, optional turn_id, agent_id, agent_type, model, and tool_name. Subagent lifecycle input uses the parent's session_id, so agent_id is mandatory for distinct child identity.

SessionStart may return hook-specific additionalContext containing the session identity and concise binding instructions. Other hooks return valid empty JSON on stdout. Errors remain fail-open: short bounded stderr diagnostics and exit 0, no blocking decisions. Do not inspect transcript_path or persist prompt, last_assistant_message, tool_input, tool_response, full shell command, or other payload text. Normalize only the allowlisted fields. A hook writes directly to the local store, so Plane need not be running. A hook invocation receives a unique event ID before any database retry. Unbound session events remain in a bounded diagnostic buffer; never guess a task from cwd, branch, tool activity, or prose. Child agents require explicit binding; a start event alone does not assign them their parent's task.

## Observation event contract and ordering

Event records include event ID, repository ID when resolved, session/agent identity, attempt ID when bound, event kind, local observedAt timestamp, source timestamp if supplied, and optional allowlisted tool/model/type labels. SQLite supplies monotonically increasing ingestion sequence; browser ordering uses this sequence. Duplicate event IDs are ignored. Concurrent hook processes are serialized by database transactions. Events can arrive late; retain their order and disclose that receipt order is not authoritative source order. Different turn IDs must not allow a delayed Stop to terminate a newer observed turn. A missing turn ID creates uncertainty rather than inferred correlation. Keep up to 10000 unbound diagnostic events; bound attempt history remains durable until explicitly removed by a future maintenance feature.

## Derived states

- No recorded execution (internal waiting state): no matching attempt; no readiness or approval assertion.
- Processing: bound UserPromptSubmit or PreToolUse observed; show last tool label and event time. SessionStart alone is idle/unknown.
- Blocked: PermissionRequest observed; next corresponding activity can clear this observation. Also allow explicit blocked reports with a bounded reason label.
- Validating: Stop or SubagentStop observed, or explicit execution-returned report. Neither hook proves success. Labels say execution returned / DoD pending.
- Interrupted: Interrupt observed for the matching main turn. No invented child interruption events.
- Failed: explicit failed report; no success/failure inference from tool output or generic Stop.
- Done: explicit validated report containing nonempty validation method and a safe existing Markdown evidence reference with nonempty check details. Mark Done (reported); an assertion is not independent verification. Runtime validation references do not replace artifact-local evidence.
- Unknown: expired active observation, restart without fresh matching activity, missing correlation, or contradictory report. Retain last observed state/time in the inspector.

Active observations expire after ten minutes without fresh matching evidence; show Unknown / last observed Processing or Blocked. This is freshness expiry, not proof the agent stopped. No heartbeat or process scanning is claimed. SessionEnd terminates activity visibility but does not prove DoD. Terminal reports are not overwritten by later unrelated tool events. Multiple attempts remain separately inspectable; concurrent attempts for one task show a count and each agent. The task projection remains Processing while any fresh attempt is Processing, then Blocked, then Validating; mixed/contradictory results are disclosed and cannot produce an unqualified Done. No runtime event changes DAG edges or establishment gates.

## Local API and live browser updates

Reuse existing loopback host/origin checks. Add POST /api/runtime/query with a contained root and optional context ID, returning repository ID, contexts, attempt summaries, freshness, and latest sequence. Add GET /api/runtime/events for same-origin SSE invalidation, containing only the latest sequence. Browsers refetch their selected runtime context on invalidation; initial query and reconnect recover missed updates. A single bounded server watcher checks database sequence once per second while clients are connected; no repository scan/polling is added. Limit SSE clients, clean up watchers on disconnect, and surface runtime-store failure without failing knowledge exploration. Expose no event-write, execution, shell, or arbitrary file-read HTTP endpoint. Writes occur through the local CLI/hook only. Browsers cannot bind tasks or report validation.

## UI

Apply common runtime rendering to individual task and combined unit implementation graphs. Artifact name is prominent, change identity secondary, and task title wraps without the current one-line truncation. Gates retain artifact-specific establishment labels. Show state text and colors: gray No recorded execution/Unknown, blue Processing, amber Validating/Blocked (distinct icons), green Done (reported), red Failed, and neutral Interrupted. Show agent label, elapsed time, last observed activity, and freshness for bound nodes. Clock updates are browser-local and do not imply harness liveness. Keep checklist counts labeled documented checklist, separate from validation reports.

Inspectors expose attempts, ordered activity, source references, and archived context diagnostics without sensitive payloads. Multiple processing nodes show observed concurrency on existing branches; do not invent edges or readiness. Preserve selection/pan/zoom during runtime updates. Runtime disconnection is visible and does not freeze stale nodes as Processing. Add a Recorded executions selector independent of current worktree selection, reachable from a surviving checkout. Responsive layouts and keyboard access remain supported. Artifact lanes may be deferred; ownership labels are required.

## Baseline amendments and self-check

Execution observation is the explicit exception to the inherited no-database/no-background-update constraints. Existing knowledge read-only behavior, graph parsing, and completion semantics remain applicable. Local-server and derived-workflow ADRs govern knowledge exploration; the new observer ADR governs the separate runtime extension. External ADD contract references resolve to current established artifact-driven 1.2.0. R1–R10 have contracts covering identity, transport, persistence, errors, recovery, and visual semantics. KISS uses built-in SQLite and existing readers/canvases; STE separates observations, assertions, and establishment. No blocker remains for Plan.

## Visualization correction contract

When no matching attempt exists, render No recorded execution. A nonempty checklist with zero unchecked items adds a Documented checklist complete label; this does not imply runtime Done or verification.

In individual, unit, and recorded implementation views, hide a task edge only when another path of task-prerequisite edges connects its source to its target. Never use establishment edges to justify removing a task edge, and never hide establishment edges. Cyclic or invalid graphs retain their existing diagnostic behavior without reduction. Use a keyboard-accessible Show all prerequisites checkbox, default unchecked. The toggle affects canvas edges/layout only. Declared metadata, inspector prerequisites, runtime matching, node identities, and source data remain unchanged.

Specification self-check: R11/R12 have precise labels, edge semantics, failure behavior, and input-preservation rules. No upstream contract change or new ADR is needed. KISS uses a shared pure display projection; STE distinguishes recorded execution and documented checklists.
