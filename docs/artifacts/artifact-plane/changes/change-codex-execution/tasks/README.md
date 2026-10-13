---
tasks:
  - 21-runtime-store.md
  - 22-codex-hooks.md
  - 23-runtime-api.md
  - 24-runtime-graphs.md
  - 25-execution-validation.md
---

# Codex execution visualization plan

## Current tasks

- [Persist execution observations and exact task bindings](21-runtime-store.md)
- [Report Codex lifecycle activity and document task binding](22-codex-hooks.md)
- [Expose local execution queries and SSE invalidation](23-runtime-api.md)
- [Show artifact ownership and observed concurrent execution](24-runtime-graphs.md)
- [Validate integrated Codex visibility and prepare publication](25-execution-validation.md)

## Implementation DAG

runtime-store precedes codex-hooks and runtime-api. runtime-graphs follows runtime-store and runtime-api. execution-validation joins codex-hooks, runtime-api, and runtime-graphs.

Hook and API work can proceed independently after storage/binding contracts pass their DoD. Use sequential execution in this session unless independent implementers are explicitly selected under coordinator instructions; parallel implementers require separate worktrees/branches and nonconflicting ownership. All knowledge updates remain under coordinator control. The UI must visualize actual concurrent attempts even when this feature is implemented sequentially.

## Approval and external gates

Present this plan for explicit user approval before implementation. No approval is claimed. The established artifact-plane dependency on artifact-driven remains unchanged. Recheck task/unit contracts against current established artifact-driven 1.2.0 before dispatch. Material changes return to Specification/Plan and renewed approval.

## Delivery and version

The shared outcome is codex-execution-visualization with one Artifact Plane member. Runtime observations stay outside Git. Retain historical tasks as unlisted context; copied prior results do not validate this change. Suggest 1.7.0 for the additive observer feature; user confirms/overrides during Version preparation. Preserve complete valid knowledge, prepare source_change: change-codex-execution in the version README, and prepare a PR. Stop for team review and merge.

## Plan self-check

R1–R10 map to storage/binding, lifecycle adapter, runtime API, UI, and integration tasks. Unique IDs, explicit prerequisites, and the validation join form an acyclic executable graph. DoD covers persistence, concurrency, missing-source recovery, runtime freshness, evidence semantics, local boundaries, read-only knowledge, and browser behavior. KISS reuses built-in SQLite and current graph readers; STE keeps observation and completion separate. Current session performs roles sequentially. No Plan blocker remains; implementation awaits approval.

## Preparation validation

Artifact Plane's actual repository reader accepted the new task graph: five tasks, seven prerequisite edges, available state, no task diagnostics. The new unit and its combined implementation graph are available with no unit diagnostics. A preparation check resolved 17 local Markdown links in the copied change and rejected ancestor references; metadata/acyclicity checks passed. git diff --check passed. No feature implementation, runtime integration, or feature browser checks have run.
