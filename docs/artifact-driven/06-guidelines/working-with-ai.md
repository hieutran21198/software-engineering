# Working with AI

## Human with AI

Give the agent the adopted bundle location, knowledge workspace, implementation repositories, intended capability, and relevant constraints. Ask it to use the coordinator skill at `docs/artifact-driven/03-execution/skills/add-coordinator/SKILL.md`.

Ask the consumer AI to adopt the bundle and configure its own harness, such as Command Code, Codex, or Claude Code. It determines the supported skill and agent setup from the installed tool. Keep the canonical ADD bundle intact so skill and pattern references remain available.

## Required Skills

Make `kiss` and `asd-ste-100` available to every ADD role. Their canonical instructions are at `required-skills/kiss/SKILL.md` and `required-skills/asd-ste-100/SKILL.md` in the adopted bundle. Read and apply them during existing phase and task self-checks. KISS guides solution complexity; ASD-STE100 principles guide document writing and rewriting.

## Required Capabilities

- One coordinator interviews the user and drives the workflow.
- The PO role authors and self-checks requirements.
- The TL role produces specifications, necessary ADRs, and the plan sequentially in one frontier-model session, with phase self-checks.
- Implementers execute approved tasks and record DoD evidence. Independent implementation agents use separate Git worktrees.
- The coordinator validates the integrated change and dependencies, prepares the proposed version, opens required PRs, and stops for team review and merge.

Roles can share a session; a role profile does not require a separate agent run. The consumer AI registers or adapts the bundled skills using native harness capabilities. If a required capability is unavailable, it reports the limitation and uses an explicit sequential fallback where possible.

Add concise ADD instructions to the applicable existing `AGENTS.md` or `CLAUDE.md`. Preserve unrelated guidance and avoid duplicate instructions. Point to the canonical bundle, identify the knowledge and implementation workspaces, require both skills, and state the plan-approval, dependency, worktree, and merge boundaries. Do not duplicate the full methodology or introduce a workflow state layer. Resolve conflicts with existing instructions through the user rather than overwriting them.

## Start a Change

Use a request such as:

```text
Use the configured ADD coordinator role, backed by the skill at
docs/artifact-driven/03-execution/skills/add-coordinator/SKILL.md.

The knowledge workspace is <knowledge-workspace>. Implementation
repositories are <repository-paths>. I want <business-or-technical-outcome>.

Interview me about material gaps before defining the change. Reuse
established knowledge. Complete Requirement, Specification, and Plan
with phase self-checks and commits on a dedicated branch, then stop
and present the plan for my explicit approval. Do not implement yet.
```

After approval, the coordinator can create or reuse agents for independent implementation tasks, each in a separate Git worktree. The TL completes Specification and Plan sequentially in the same frontier-model session when available. Do not require another model review for every task.

## Review the Plan

Check scope, contracts, affected repositories, dependencies, DoD, and integrated acceptance checks. Approve the concrete plan or request amendments. A new plan or material change requires renewed review before affected implementation proceeds.

Passing task checks is not the same as combined validation. The coordinator integrates work, records evidence, prepares the proposed version, pushes dedicated branches, opens linked PRs, and stops for team review and merge.

## Resume Work

Provide the relevant branch, active change, repository locations, and available approval context. The coordinator derives progress from knowledge files, code, evidence, and Git rather than maintaining a workflow database.

If approval is not available in the current context, the coordinator asks before implementing. An unmerged snapshot is proposed; dependent Implementation waits until the required knowledge and code land on `main` or `master`.
