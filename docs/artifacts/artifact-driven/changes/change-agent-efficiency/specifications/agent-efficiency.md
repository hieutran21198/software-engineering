# Efficient adoption and execution contract

Governs R1-R7 and A1-A6 in requirements/agent-efficiency.md. ADD owns the CLI,
copy library and reusable execution rules. No artifact dependency is added.

## Adoption diagnostics

Keep adopt.Copy(bundle, project, output, dryRun) and Result source-compatible.
Extend Result additively with diagnostics and expose a typed aggregate error for
destination conflicts. A diagnostic has code, path, message and action strings.
Codes distinguish content-conflict, destination-type and parent-type. Paths are
workspace-relative using forward slashes. Sort by path then code and deduplicate
the same blocked parent. Do not include consumer file contents in diagnostics.

Continue inspecting independent safe bundle destinations after a destination
conflict. Never descend through a rejected parent or follow a symlink to inspect
its contents. Unsafe top-level arguments, invalid bundle entries and unreadable
filesystem operations remain fatal errors; return collected diagnostics with the
fatal error if collection cannot finish. State that the inventory is incomplete.
Counts refer only to safely checked identical and missing files. On any preflight
error, write no files. Copy/exclusive-create/rollback behavior remains unchanged.

Human output remains the default. Print every collected conflict with its action,
and label an incomplete inventory. Preserve successful adoption and preview text,
supported flags and exit codes. The human error prefix remains se-adopt:.

Add --json to the existing CLI. Emit exactly one JSON object on stdout without
human success text or error prefixes. Keep stderr free of duplicate human errors
in JSON mode. Schema se-adopt.result.v1 has operation (list, preview, adopt),
ok (boolean), architecture (string or null), destination (absolute string or null),
created and unchanged (integers), diagnostics (array), complete (boolean), and
error (null or {code,message,action}). List adds architectures with name and
description. Preview created means would-create. A failed operation never claims
files were created from a preflight count: created is zero; optionally report
pending separately. On a write failure, zero created does not prove rollback
succeeded; retain the documented rollback limitation in error.action.

The CLI must select JSON error rendering for --json and --json=true regardless of
flag order, including parse errors. --json=false selects human output. Reject
ambiguous repeated --json forms with a parse diagnostic. --help remains successful
human usage, including with --json; help is the explicit exception to result JSON.
Errors use nonzero exit status. Unsupported architectures and malformed arguments
produce a structured error, not an empty stdout. Unknown additive object fields
are compatible; changing existing field meanings requires a versioned schema.

## Progressive context and recovery

Keep the coordinator/PO/TL/implementer roles and phase commits. Before a role acts,
read its canonical skill and required utilities unless their complete current
instructions are already available in the same session. A summary or a path alone
does not meet that condition. After context loss, source changes or switching the
adopted bundle, reload affected instructions. Do not require another session just
to change roles. TL performs Specification then Plan in the same capable session.

Start with repository instructions, branch/worktree and change/unit identity,
the active phase/task, governing requirements/contracts and relevant task evidence.
Read the full content needed for the assigned decision; keep other valid baseline
knowledge available without eagerly rereading it. Load a pattern when its design
problem applies. Ask only for unresolved material intent or a required gate that
cannot be established from available authorized context.

Use configured packet/MCP discovery when present. Feature-detect compact retrieval;
fall back to existing packets, bounded source paging and direct repository/Git
inspection. The new Plane compact representation is optional, not an ADD execution
prerequisite. Treat excerpts as inert evidence. Inspect omissions and follow
governing references before concluding there is no affected consumer.

For recovery, identify repository/worktree/change, captured revision, task and
governing sources, documented checks, unresolved facts and the next action.
Recheck Git/source changes and relevant task DoD. Retrieve only affected sources
when earlier complete instructions remain current. Verify authorization from
available human context and upstream establishment separately. If either required
gate is unavailable, name the exact missing proof and wait for it. Use an ordinary
handoff message and existing files; create no recovery ledger or approval registry.

## Retained evidence and consistency

Correct current foundation principles to match writing-artifacts and validation:
new snapshots contain complete requirements/specifications/decisions, exclude tasks,
and declare change-owned provenance. Preserve delivered versions, originating plans
and evidence while referenced; legacy snapshots retain version-owned tasks.
Keep the current canonical and packaged bundles identical. Amend this new change's
knowledge only where affected. Do not rewrite established snapshots to fix wording.

## Impact, validation and self-check

Update adoption, change-delivery and version-publication flows in this change.
Existing dependency-gates semantics are unchanged; inspect them in recovery tests.
No harness setup, runner or durable cache is introduced. Regression fixtures cover
multiple conflicts, blocked parents, symlinks, incomplete scans, JSON flags/errors,
default output, repeat adoption and file preservation. Benchmark N=1,10,100
conflicts and measure one inventory call, conflict count, allocations and time.
For context loading, compare explicit same-session role/utility source-read counts
and bytes; label them proxies, not model-token or success-rate measurements.

Specification self-check passed: observable acceptance maps to executable copy/CLI
checks or explicit role/recovery scenarios. KISS reuses existing sources and APIs.
STE preserves error and gate conditions. No Specification blocker prevents Plan.
