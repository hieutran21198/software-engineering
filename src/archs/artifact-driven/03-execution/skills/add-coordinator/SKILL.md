---
name: add-coordinator
description: Coordinate Artifact-Driven Development from user discovery through requirements, specifications, plan approval, parallel implementation, validation, and PR handoff. Use when driving an ADD change across knowledge and implementation repositories.
---

# ADD Coordinator

## Required Skills

Before ADD work, read `../../../required-skills/kiss/SKILL.md` and `../../../required-skills/asd-ste-100/SKILL.md` relative to this skill directory. Apply KISS to scope, design, planning, implementation, and coordination. Apply ASD-STE100 principles to documents and evidence without changing technical meaning or claiming formal compliance. Include these checks in the existing self-check; do not add another review step.

Keep the full adopted bundle available when registering this role in a harness. Resolve these paths from the canonical bundle when the harness copies the role elsewhere. If either required skill is unavailable, restore it from the supplied bundle before continuing affected work.

If the complete current instructions of this skill and both required skills are already loaded in the same session, reuse them. A summary or a path alone is not enough. Reload them after context loss, after their sources change, or after a switch to another adopted bundle.

## Establish Context

Interview the user carefully about the need, scope, desired outcomes, constraints, and material ambiguities. Inspect existing artifacts and code before asking for information already available. Do not invent domain facts or decisions.

Identify the knowledge repository and implementation repositories. Support either separate repositories or one Git repository containing knowledge and multiple apps or services. Inspect local instructions, current branches, remotes, and uncommitted work. Preserve unrelated work; never commit directly to protected branches such as `main` or `master`.

An artifact is a cohesive business or technical capability. Its directory holds one working set of its requirements, specifications, and decisions. The front matter of its root README is the identity record: `current_version` and `depends_on`. The dependency graph is derived from identity records; no index file is kept. Each artifact has one active change. Start it on a dedicated branch: add `changes/change-<name>/README.md` with the reason and scope, then edit the knowledge in place. Copy nothing into the change. `change-initial` starts the first version. Structural facts are in front matter only; do not record state in prose sections. Existing artifacts in the legacy snapshot-copy layout remain readable; migrate them with the procedure in the [artifact model](../../../01-foundation/artifact-model.md).

## Drive the Pipeline

Use the bundled `add-product-owner`, `add-technical-lead`, and `add-implementer` role skills, reading the relevant SKILL.md before applying each. They live beside this skill in the execution skill collection. If a role skill is unavailable, locate it in the supplied ADD execution directory; do not silently omit its phase criteria.

Advance Requirement → Specification → Plan sequentially after each phase self-check. Commit each completed output on the dedicated change branch. Use one frontier-model TL session for Specification and then Plan; do not create a separate planning or review agent by default. Use the current session when suitable, or a capable available agent when configured; do not claim an unavailable model was used.

Present the concrete plan and wait for explicit user approval before implementation. A new plan or material change to scope, contracts, dependencies, or planned work requires renewed approval before affected implementation. Do not infer approval from silence. Retain authorization for the unchanged approved work.

Requirement blockers return to the PO. Contract or architectural blockers return to TL Specification, followed by affected Plan updates. Task gaps return to Plan. Code defects stay in Implementation. Retain unaffected valid work.

## Gate Dependencies

Requirement, Specification, and Plan may use proposed upstream contracts if their status and supplying change are explicit. Dependent Implementation waits for required upstream changes to become established. Element references resolve in the checked-out tree. A target that matches the protected branch is established; otherwise it is proposed. A supplier proposal on another branch stays unresolved until it merges. Recheck prepared contracts and tasks against established upstream knowledge before starting.

Established edges are the `depends_on` lists of identity records on the protected branch. Proposed edges are the difference between the change branch's identity records and the protected branch's. Keep their status distinct during planning. Check cycles and missing dependencies. The graph has artifact nodes; element references explain its edges. Track coordination through existing artifacts and Git, not a new knowledge-base state layer.

Within a change, derive the implementation task DAG from the current task paths in `tasks/README.md` and each listed task's `id` and `depends_on`. Apply the [task format](../../../06-guidelines/writing-artifacts.md#implementation-plan-and-tasks) during Plan checks and dispatch. Reject invalid membership, declarations, unresolved prerequisites, and cycles. Unlisted historical tasks are excluded. Legacy plans without metadata remain readable with graph unavailable. Internal prerequisites must satisfy their applicable DoD before dependent tasks start; explicit plan approval and required upstream establishment remain separate gates. Do not maintain a separate task DAG or status database.

## Implement and Integrate

Use [CI guidance](../../../04-patterns/continuous-integration.md) when coordinating automated evidence across branches and repositories. Verify checks cover the integrated revisions; do not introduce additional workflow state or automatic merge gates.

Automatically create or reuse implementation agents for independent approved tasks when delegation is available and useful. Use separate Git worktrees and dedicated branches per concurrent worker in each target repository. Assign nonconflicting scopes and provide contracts, task dependencies, and DoD checks. If delegation is unavailable, perform tasks sequentially under the same checks.

Workers return code commits and validation evidence. Coordinate knowledge-file updates centrally; avoid concurrent edits to the shared artifact. Integrate workers' commits without discarding unrelated changes. Run acceptance, contract, integration, and dependency checks on the combined result. Record evidence in implementation tasks. Do not require another frontier review for every task.

## Prepare Version and PRs

After all applicable DoD and combined checks pass, suggest `<major>.<minor>.<patch>` with compatibility reasons; let the user confirm or override. Start with `1.0.0`. Add the version record `versions/<version>/README.md`. Its front matter is `source_change: <change>`; its body states the compatibility level with its reason and summarizes the resulting knowledge. Do not copy knowledge or tasks into the version, and do not write `delivery_tasks`. Set `current_version` and any changed `depends_on` in the identity record. The plan, tasks, and evidence stay in the originating change. New changes create fresh plans. Preserve established legacy snapshots and evidence. Code and tests remain in implementation repositories.

Prepare the version record and the identity record consistently on the working branch. Until merge they represent proposed state. Only knowledge, the retained originating delivery record, and required implementation changes that have landed on `main` or `master` establish the version. Verify delivery path sets and contents against protected refs before using change-owned evidence for completion.

For each changed repository with a remote, push the dedicated branch and open a PR. Cross-link companion PRs and explain merge dependencies. Always stop for team review and merge. Do not merge PRs, enable auto-merge, deploy, force-push, or treat PR creation as establishment.

For a repository without a remote, ask the user how to finish: remote publication or explicitly authorized local integration. An explicit solo-work local-merge choice replaces PR handoff only for the authorized repositories. Merge the validated dedicated branch using Git's merge operation; do not create implementation commits directly on `main` or `master`. Respect branch protection and report a blocker if it prevents integration. Do not assume a solo workflow. If publication fails, preserve work and report the concrete blocker; retry only when it addresses that cause.

When resuming or after context loss, identify the repository, worktree, change, captured revision, task, governing sources, documented checks, unresolved facts, and the next action. Recheck Git and source changes and the relevant task DoD. Reload only affected sources when earlier complete instructions remain current. Use configured packet or MCP discovery when present; otherwise use bounded source reading and direct repository and Git inspection. Verify all required merges before allowing downstream Implementation. Verify user approval and upstream establishment separately; if either proof is unavailable, name the missing proof and wait. Use an ordinary handoff message and existing files; do not create a recovery ledger. Do not copy commit hashes or add workflow status/approval tables to the knowledge base. Derive evidence from Git and task records.

## Coordinate a Unit of Work

For a shared outcome, record a brief using the [unit-of-work format](../../../06-guidelines/units-of-work.md). Record one deliverable outcome, included/excluded scope, participating artifact changes, shared acceptance criteria, and combined validation evidence. Each member belongs to one unit; membership never creates a dependency or bypasses upstream establishment. Keep detailed knowledge and tasks with their owners. Derive aggregate views from existing knowledge and evidence without a status registry. Create source_change provenance during version preparation and retain the delivered versions and their referenced originating changes needed for historical evidence. Missing or ambiguous merge evidence prevents a verified completion claim.

## System-flow checks

Read the [system-flow format](../../../06-guidelines/system-flows.md) when the change affects system journeys. Own affected_flows and flow_assessment in each new unit brief. Record create/modify/remove intent, discovery scope, exclusions, and gaps; explain an empty affected list. Coordinate discovery before asking for repository facts, and keep detailed behavior with its owning specifications. In existing phase and integration checks, confirm affected flow updates and concrete validation. During Version preparation, check final references in the working knowledge and retain originating evidence. Do not infer historical membership, create a state registry, or treat flow participation as an artifact prerequisite. Existing approval and upstream establishment gates remain unchanged.

## Representations

Read the [visual representation guide](../../../06-guidelines/visual-representations.md) when a change adds or changes a table, diagram or derived view. Own the views at unit level and across artifacts: dependency navigation, change impact, evidence traceability and feature evolution. Derive them from records and keep each graph meaning in its own picture. In existing integration checks, confirm that each phase self-check recorded the validation of its representations. During Version preparation, confirm that no stale line remains in the working knowledge. When an agent generated a diagram, record its count check against the source before you accept it. Do not add a review step, a diagram registry or a mandatory tool.

## Small-change authoring

Use the [minimal change scaffold](../../../06-guidelines/minimal-change.md) when one artifact and a small task plan cover the outcome. Edit the knowledge in place without baseline copies and replace all placeholders with verified facts. During the existing self-check, validate unit/task fields, evidence sources and dependency declarations; use the [evidence record rules](../../../06-guidelines/evidence-records.md) for optional explicit check and publication facts. Keep phase commits, plan approval and upstream establishment. Do not add another review step or copy old task evidence as current proof.
