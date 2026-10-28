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
in JSON mode.

Schema se-adopt.result.v1 has these fields; diagnostic and error objects follow.
The Object column names the object that has the field: result is the top-level
JSON object, diagnostic is the diagnostic of the first paragraph, and error is
the object in the error field.
A dash means that the text states no type or no further rule.

| Object | Field | Type or values | Rule |
| --- | --- | --- | --- |
| result | operation | list, preview or adopt | — |
| result | ok | boolean | — |
| result | architecture | string or null | — |
| result | destination | absolute string or null | — |
| result | created | integer | Preview created means would-create. A failed operation never claims files were created from a preflight count: created is zero; optionally report pending separately. On a write failure, zero created does not prove rollback succeeded. Counts refer only to safely checked identical and missing files. |
| result | unchanged | integer | Counts refer only to safely checked identical and missing files. |
| result | diagnostics | array | — |
| result | complete | boolean | — |
| result | error | null or {code, message, action} | — |
| result | architectures | entries with name and description | List operation only. |
| diagnostic | code | string: content-conflict, destination-type or parent-type | — |
| diagnostic | path | string | Workspace-relative, with forward slashes. |
| diagnostic | message | string | — |
| diagnostic | action | string | — |
| error | code | — | — |
| error | message | — | — |
| error | action | — | On a write failure, retain the documented rollback limitation. |

Source: artifact-driven:specifications/agent-efficiency.md, Adoption diagnostics
paragraphs 1, 2 and 4; derived one row per field of the result, diagnostic and
error objects; current snapshot.

The CLI must select JSON error rendering for --json and --json=true regardless of
flag order, including parse errors. --json=false selects human output. Reject
ambiguous repeated --json forms with a parse diagnostic. --help remains successful
human usage, including with --json; help is the explicit exception to result JSON.
Errors use nonzero exit status. Unsupported architectures and malformed arguments
produce a structured error, not an empty stdout. Unknown additive object fields
are compatible; changing existing field meanings requires a versioned schema.

## Progressive context and recovery

Keep the coordinator/PO/TL/implementer roles and the phase commits of medium and
large changes. Before a role acts, read the core of its canonical skill unless
its complete current instructions are already available in the same session. A summary or a path alone
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

## Progressive guidance

Each role skill has a core of at most 400 words, counted with `wc -w` on the
SKILL.md body without front matter. The core states the role's duty, its phase
steps and a self-check checklist. The checklist includes five KISS and STE
items. A "Read when" table follows the core; each row names a condition and the
guidance path to load when the condition is true. Content that only some
changes need (legacy layout, multi-repository publication, flows, visuals,
claims, units, patterns) moves behind a row. The full `kiss` and `asd-ste-100`
skills stay in the bundle; a role reads them when the checklist does not settle
a case. The guidance that the coordinator reads unconditionally, the coordinator
core and the files of `reading.coordinator` in the configuration file, has at
most 3,000 words.

## Implementer context

The coordinator dispatches each implementer with the task path, the governing
paths and the DoD, in a new agent context, not as a copy of its own context.
Implementers read code by section or symbol, return a short summary with
commits and evidence, and start a new context at a phase boundary when the
harness allows it. An implementer runs the tests that the change impact lists
under verification and the fast unit suites; CI runs the full suites.

## Harness profiles

The adoption guidance describes registration for Antigravity (`.agents/skills`
or `.agents/skills.json`), Codex (`.agents/skills`, `.codex/agents`), OpenCode V2
(`.agents/skills`, `.opencode/agents`), Command Code (`.agents/skills`,
`.commandcode/agents`) and Claude Code (`.claude/skills` entries that point to
the canonical role skill directories). This repository includes these entries.
OpenCode V2 reuses the six existing skill registrations and reads `AGENTS.md`;
its four native profiles use `mode: all` without model or permission overrides.
Command Code reuses the six entries, reads `AGENTS.md` and supplies one
implementer profile with all tools and no model or permission override. The
adoption tool still does not register skills or profiles.

## Retained evidence and consistency

Correct current foundation principles to match writing-artifacts and validation:
new legacy snapshots contain complete requirements/specifications/decisions, exclude
tasks, and declare change-owned provenance; in-place versions are records as defined
in knowledge-layout.md. Preserve delivered versions, originating plans
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
