# Edit knowledge through deterministic operations over the existing readers

## Context

The Plane reads every ADD record but writes none. The user asked for safe, integrated editing that preserves the in-place layout, Git as the version store, the separation between structural facts and semantic knowledge, and compatibility with external editors and agents. The readers already parse front matter with the yaml library, lex bodies with marked and validate task plans, unit briefs, flows, references and evidence records. The migrate-layout script already writes inside docs/artifacts with containment and byte checks.

## Alternatives

| Option | Description | Assessment |
| --- | --- | --- |
| A. Minimal editing on the existing explorer | Add Edit buttons that open the raw file text in a textarea and save it. | Smallest code change. Leaves YAML, identifiers, paths and cross-file invariants to the person; validation stays after the fact. Fails the goal of authoring without storage knowledge. Rejected. |
| B. Operation service over the existing readers | A writer edits front-matter keys through the yaml Document API and body sections by token range; an operation catalogue derives every identifier and path, validates the post-image with the readers and writes atomically with digests, journal and Git actions. One service serves the UI, HTTP and opt-in MCP. | Keeps one source of truth, preserves unrelated bytes, reuses every validator, and makes agents and people use the same commands. Needs a writer, a service and two routes; browser tests for the new pages. Selected. |
| C. Generic editor architecture | A command bus with a generic graph model, bidirectional Markdown object mapping, visual graph editing and collaborative sessions. | A Markdown-to-object-to-Markdown mapping loses unknown content and formatting; a generic graph editor permits edits the contracts forbid; collaboration and sessions add state the constraints exclude. The useful part, shared commands for UI and agents, is already in option B. Rejected. |
| D. Workflow or editing database | Store drafts and lifecycle state outside the files. | Second source of truth; excluded by the ADD constraints. Rejected. |

Sub-choices within option B: the yaml Document API instead of a custom YAML printer, because it preserves comments and unknown keys and is already a dependency; section replacement by lexer token ranges instead of an AST round trip, because bodies stay bytes; expected digests instead of file locks, because external editors and agents cannot be locked; an in-memory journal instead of persisted undo, because Git holds durable history; protected-branch refusal instead of silent branch creation, because the branch is the person's decision; no push, pull request or merge, because publication stays with team review.

## Decision

Adopt option B as specified in specifications/knowledge-editing.md. Structural facts change only through named operations; bodies change as text; every write is contained, atomic, validated against the readers and recorded in a bounded journal. Git lifecycle actions are limited to status, branch creation, knowledge commits and discarding a file.

## Consequences

The Plane becomes the primary authoring tool for ADD knowledge while files remain editable elsewhere. Every new record type needs an operation and its round-trip test; unsupported edits fall back to the raw front-matter editor. Modified YAML nodes may change style. Agents gain write tools only when the server is started with the flag, and keep committing with their own Git access. The read-only scope statement of the artifact is amended; the read interfaces do not change.
