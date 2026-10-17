---
self_check:
  result: passed
  source: docs/artifacts/artifact-plane/specifications/knowledge-editing.md#specification-self-check
references:
  - artifact: artifact-driven
    element: specifications/knowledge-layout.md
    requires: In-place layout records, identities, derived facts and the migration procedure that every write preserves.
  - artifact: artifact-driven
    element: specifications/task-dag.md
    requires: Plan membership, task id and depends_on rules that task operations enforce before writing.
  - artifact: artifact-driven
    element: specifications/units-of-work.md
    requires: Unit brief fields, membership uniqueness, evidence and provenance rules that unit operations enforce.
  - artifact: artifact-driven
    element: specifications/system-flows.md
    requires: Flow document fields and validation that flow operations enforce.
  - artifact: artifact-driven
    element: specifications/evidence-records.md
    requires: self_check, evidence_records and publication_reviews rules for the recording operations.
---

# Knowledge editing contract

Governs W3–W6, W8, W9 and A2–A6, A8, A9 in requirements/authoring-workbench.md. The repository and its Git history stay the only source of truth. The Plane writes files; it stores no workflow state, approval or index authority. Reading contracts in explorer.md, knowledge-layout-reading.md, change-review.md and flows.md are unchanged; this contract adds the write path.

## Two layers, one writer

Structural facts live in YAML front matter and are edited only through operations. Semantic knowledge lives in the Markdown body and is edited as text: a whole body on save, or one named section when an operation records something. The writer never serializes a parsed document back to Markdown. It edits the front-matter text through the yaml Document API and splices body sections by their lexer token ranges, so every byte outside the targeted keys and sections stays identical.

## Writer

Module server/knowledge-writer.js. It is the only code that writes inside an inspected repository.

Containment. A target path must start with docs/artifacts/, must stay inside the realpath of docs/artifacts of the selected worktree, must not pass through a symbolic link, must not contain .git, backslashes, NUL or dot segments, and must end in .md. The selected worktree must be registered for the repository and must have a non-protected branch checked out: a detached HEAD or a checked-out main or master rejects every write with a diagnostic that names the branch action. Files under versions/ are created once (the version record) and never modified or deleted. Task files of a change that a version record names in source_change are never modified or deleted. Artifacts in the legacy layout accept only the migration operation. Files larger than 1 MiB or not valid UTF-8 are refused.

Front-matter edits. The writer splits the file with the same front-matter expression as the readers and parses the YAML text with parseDocument. Each edit (set, delete, insert into a list, move within a list) serializes only the changed node with the yaml library and splices it into the source text at the node's line range. Every other byte keeps its text, including unknown keys, key order, comments and folded scalars. The writer parses the result again and rejects the edit when any other value differs. A list that the operation creates with at most four short scalars is written in flow style, as in depends_on: [tenant]; longer or nested values use block style. A document without front matter receives a front-matter block only when an operation adds a structural field. Parse errors in existing front matter reject the operation with the YAML message.

Body edits. A body save replaces everything after the front matter with the supplied text. A section edit locates the heading whose anchor equals the requested anchor, using the anchor rule of evidenceDetail, replaces the tokens up to the next heading of equal or higher depth, and appends a new heading at the end of the body when the section is missing. Line endings follow the file's existing convention; new files use LF and end with one newline.

Atomic replacement. Each file is written to a temporary file in the same directory and renamed over the target. New files use exclusive creation and fail when the target exists. A multi-file operation writes every temporary file first, then renames in a fixed order. If a rename fails, the writer restores the files it already replaced from the journal pre-images, deletes remaining temporary files and reports partial-write with the affected paths; Git status shows the resulting state.

Expected digests. A request may carry expected, a map from path to the SHA-256 hex digest of the bytes the client read. Before writing, the writer computes the current digests of every file it will modify or delete. A mismatch rejects the whole operation with status 409 and returns the current content of each mismatched file. Operations that modify a file without an expected digest are accepted only from the dry-run and apply pair described below: the dry run returns the digests, and the apply must repeat them.

Journal and undo. The server keeps, per repository root, the last 50 applied operations in memory with the pre-image and post-image digests and the pre-image bytes of each touched file. The undo operation restores the pre-images of one operation only while every touched file still has its post-image digest; otherwise it is rejected with 409. Undo of a file creation deletes the file; undo of a deletion recreates it. The journal is not persisted; after a restart Git holds the history.

## Operation service

Module server/knowledge-operations.js. One function applies a request and is shared by the HTTP route, the MCP tools and tests.

Request: path, optional worktree, operation, input, optional expected and dryRun. Processing: resolve the repository root and registered worktree exactly as repository-query does; check the branch; scan the worktree with scanRepository (metadata with full bodies for the touched artifact, units and flows); build the plan, a list of file edits with path, action (create, replace, delete), before and after text; build the post-image file map; validate; then apply or return the preview.

Validation. The service runs buildSnapshot, buildTaskGraph for every change of the touched artifact, parseUnitBrief and the duplicate-membership scan for all briefs, buildFlowGraph for the planning view, and the declared-evidence checks of workflow.js on the post-image. Every diagnostic that is not severity info and not flow-evidence-gap counts as an error. An operation is rejected with status 422 when the post-image has an error diagnostic whose code, path and message do not all appear in the pre-image. document.delete reports new unresolved references as warnings. Pre-existing diagnostics elsewhere do not block an unrelated edit. The response always lists the diagnostics of the touched records, labelled new or existing. Operations whose inputs already violate a field rule are rejected before planning with the field name.

Response: repository, worktree, operation, applied (false for a dry run), operationId (applied only), files with path, action, before, after and digest, diagnostics, and revision (the repository revision after the write, computed as in repository-query). A dry run writes nothing and returns the same files list and the expected digests for a following apply.

Identifiers. The service generates IDs from titles: NFKD normalization, removal of combining marks, lowercase, every run of characters outside a–z and 0–9 replaced by one hyphen, hyphens trimmed, a leading digit or letter required. Change names get the change- prefix. A collision within the plan, artifact, unit or flow namespace appends -2, -3 and so on. The response names the generated identifier so the user interface can show it before apply. A caller may supply an explicit ID that passes the same rules.

Templates. New documents use fixed templates derived from the ADD guidance, with headings only and short placeholder sentences that name what to replace: requirement (Need and constraints, Acceptance criteria, Self-check), specification (Governing requirement, Behavior and interfaces, Self-check), decision (Context, Alternatives, Decision, Consequences), change record (Reason and scope, Baseline and ownership), plan (tasks: [] front matter, Approval and prerequisites, Plan self-check), task (id and depends_on front matter, Scope and ownership, Governing knowledge, Prerequisites, Definition of Done with one unchecked item, Evidence with "Implementation has not started."), unit brief (front matter fields and the Purpose, Included scope, Excluded scope and Validation evidence headings), flow (front matter with the first step as the entry step), version record (source_change front matter, compatibility sentence and the link to the retained plan). Templates never contain a passed self-check or a checked DoD item.

### Operations

Inputs name domain objects; the service derives every path and record. Each row lists the files written and the derived facts.

| Operation | Input | Files | Derived and validated |
| --- | --- | --- | --- |
| artifact.create | title, purpose, dependsOn | README.md with current_version: null and depends_on; requirements/<id>.md from the requirement template (a root knowledge directory selects the in-place layout); changes/change-initial/README.md; changes/change-initial/tasks/README.md | ID from title; unique directory; dependencies exist; graph stays acyclic |
| artifact.dependencies.set | artifact, dependsOn | README.md front matter | Every ID exists; planning graph acyclic; proposed edges derived by the readers |
| change.start | artifact, title, reason, scope, unit (optional: existing unit ID or new unit title) | changes/change-<name>/README.md; tasks/README.md; optionally the unit brief | Name from title; the artifact has no open change; unit membership unique |
| document.add | artifact, kind, title, template body (optional) | requirements, specifications or decisions file | Path from title; no existing file; decision files get the next three-digit prefix |
| document.save | path, body, expected | that file | Front matter untouched; UTF-8; size limit |
| document.delete | path, expected | that file | Working knowledge only; references to it become diagnostics returned as warnings |
| document.properties.set | path, frontMatter (raw YAML text) | that file | Parses as a mapping; structural fields pass their rules; body untouched |
| reference.add / reference.remove | path, target artifact, target element, requires | references in front matter | Target resolves in the checked-out tree; no duplicate; label proposed or established by baseline |
| selfcheck.record | path, result, detail | self_check front matter and the Self-check section | source derived as path#self-check; result in passed, failed, incomplete; detail nonempty |
| task.add | artifact, change, title, prerequisites, scope, dod items, id (optional) | tasks/<nn>-<id>.md; tasks/README.md tasks list | ID from title; next sequence number; prerequisites listed; graph acyclic |
| task.update | artifact, change, id, title, prerequisites, dod items | the task file | Same checks; DoD edits keep checked state of unchanged items |
| task.remove | artifact, change, id | the task file; tasks/README.md | No other task depends on it; the change is not delivered |
| task.checklist.set | path, index, checked | the task file | Only `- [ ]` and `- [x]` characters change |
| evidence.record | path, method, result, detail, id (optional) | evidence_records front matter and the Evidence section | source derived as path#evidence; id unique in file; detail replaces or appends under a sub-heading named by the id |
| plan.selfcheck.record | artifact, change, result, detail | tasks/README.md | source derived as tasks/README.md#plan-self-check |
| unit.create | title, purpose, included, excluded, changes, acceptance, affectedFlows, flowAssessment | units-of-work/<id>/README.md | ID from title; members exist and are claimed by no other unit; acceptance IDs unique; integration criterion for several members; empty affectedFlows needs a reason |
| unit.member.add / unit.member.remove | unit, artifact, change | the brief | Same membership rules |
| unit.acceptance.set | unit, criteria | the brief | Unique safe IDs; nonempty text; evidence entries of removed criteria rejected |
| unit.evidence.record | unit, criterion, method, result, source (task evidence section or the brief's Combined checks), detail (for the brief) | the brief; optionally its Combined checks section | Criterion exists; source resolves to nonempty detail |
| unit.flows.set | unit, affectedFlows, flowAssessment | the brief | Owners exist; unique records; nonempty assessment |
| flow.create | artifact, title, trigger, outcome, firstStep title | specifications/flows/<id>.md | ID from title; entry step derived; parseFlow valid except the evidence gap of the first step |
| flow.step.add / flow.step.update / flow.step.move / flow.step.remove | artifact, flow, step title, supports, position, optional after (adds a transition from that step), target position for move | the flow file | Step ID from title; supports exist; removing a step removes its transitions and entry listing; at least one entry step remains |
| flow.transition.set / flow.transition.remove | artifact, flow, from, to, condition | the flow file | Endpoints exist; loops allowed |
| flow.support.add / flow.support.update / flow.support.remove | artifact, flow, kind, target (document, flow, implementation path or test path), requires, basis, evidence, optional steps that receive the support | the flow file | Target exists or is a tracked file; observed basis needs evidence paths; removal clears step references and interaction supports |
| flow.meta.set | artifact, flow, title, trigger, outcome, gaps, exclusions | the flow file | Nonempty strings |
| version.prepare | artifact, change, level (major, minor, patch), reason, summary | versions/<version>/README.md; README.md current_version | Version computed from current_version and level, or 1.0.0 first; change open and unnamed by any version; task graph valid; unchecked DoD items reported and block unless acknowledged in the input |
| publication.record | artifact, version, repository, pullRequest, scope, detail | README.md publication_reviews; the version record's Publication review section | Version record exists; HTTPS identities; repository derived from the remote by default; duplicate pair rejected; the version record body gains the section only when the version is unestablished on local protected refs, otherwise the detail goes to the owning unit brief |
| artifact.migrate | artifact, version (optional) | the migrate-layout plan | Reuses planMigration and applyMigration; dry run returns the plan |
| undo | operationId | the journal pre-images | Post-image digests still current |

Operations not listed, such as renames, are not supported; the raw front-matter editor and external tools remain available.

## Git lifecycle

Module server/knowledge-git.js. Operations run through the existing git helper, one mutation at a time per repository.

- status: branch, protected (true for main and master), detached, dirty knowledge paths with their status letters, count of dirty paths outside docs/artifacts, and HEAD. Returned with every edit response and on request.
- branch.create: name must match [A-Za-z0-9][A-Za-z0-9._/-]* and must not be main or master; runs git switch -c; uncommitted changes carry over as Git does.
- commit: paths must all lie inside docs/artifacts; message nonempty; refused on a protected branch or detached HEAD; runs git add -- paths then git commit -m message with the repository's configured author; returns the commit ID. The Plane adds no trailer and rewrites no history.
- discard: one path inside docs/artifacts; tracked files are restored with git checkout -- path; untracked knowledge files are deleted; the response names the restored or deleted path.

The Plane never runs push, fetch, pull, merge, rebase, reset, tag, stash or clean, and never edits Git configuration or hooks. Approval is not a file fact and is not recorded. Publication is team review and merge outside the Plane.

## HTTP interface

POST /api/knowledge/edit accepts the operation request and returns the operation response. POST /api/knowledge/git accepts operation status, branch, commit or discard with their inputs. Both routes use the existing loopback host and origin checks and the JSON content type. Their body limit is 2 MiB; other routes keep 16 KiB. Status codes: 400 malformed request, 403 protected branch or unconfigured root, 404 missing repository, worktree, artifact, change, unit, flow or file, 409 digest mismatch or undo conflict, 422 validation failure or unsafe path, 500 sanitized unexpected failure. Every error body carries error and, where available, diagnostics and current file contents.

## MCP interface

The stdio server registers preview_knowledge_operation and apply_knowledge_operation only when started with --allow-writes. Both tools accept the operation request with path defaulting to the single configured root, and return the operation response as structured content. Annotations: readOnlyHint false, destructiveHint true, idempotentHint false, openWorldHint false. Git operations are not exposed; an agent commits with its own Git access under the ADD coordinator rules. Without the flag the server registers only the existing read tools, so a write call fails as an unknown tool. A configured server refuses a repository outside its roots with status 403. The expected digests use the same SHA-256 of file bytes as the review service fingerprints, so an agent can pass fingerprints from read_change_context_source.

## Observation and freshness

A write changes repository bytes that the incremental observer already samples; the browser receives the repository event and reconciles. The flow index and review cursors invalidate through their existing revision checks. Edits in the user interface update the loaded snapshot from the operation response before the observer round trip to avoid a visible delay.

## Compatibility and limits

Existing read endpoints, MCP read tools, packet schemas, fixtures and legacy reading do not change. The yaml library may change the style of a modified node, for example from block to flow sequence; unmodified nodes keep their text. Files with CRLF keep CRLF. Operations are not transactional across Git; the journal is the recovery aid and Git is the backstop. The service does not lock the repository against external editors; expected digests detect their edits at write time.

## Validation plan

Tests cover, for every operation: a fixture round trip where only the targeted keys and sections change (line diff), unknown keys and comments preserved, dry run leaving bytes unchanged, generated identifiers, rejection of invalid inputs and of post-images with new error diagnostics, containment (symlink, traversal, versions, delivered tasks, legacy artifact, protected branch, detached HEAD), expected digest mismatch, partial-write recovery, undo success and conflict, Git status, branch, commit and discard, HTTP and MCP parity and the absence of write tools without the flag. validate-knowledge must report 0 errors on every fixture after the scenario sequences.

## Specification self-check

W3–W6, W8 and W9 map to the writer, operations, Git, HTTP and MCP sections; A2–A6, A8 and A9 map to the validation plan. The writer reuses the migrate-layout containment pattern and the yaml Document API already used there; validation reuses the readers without a second parser or schema store. KISS adds one writer, one service and two routes, no database and no new dependency. STE keeps refusals, limits and derivations explicit. No blocker prevents Plan.
