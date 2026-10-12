# Execution

Execution uses one coordinator and role-specific agent skills. The coordinator interviews the user, drives the phase pipeline, and uses commits and task validation as evidence. There is no command system or separate workflow state layer in the knowledge base.

## Operating Flow

1. Gather the user's intent and enough information to define the change. Reuse existing knowledge and ask focused questions about material gaps.
2. Complete Requirement, Specification, and Plan sequentially. Self-check and commit each phase's output on a dedicated branch.
3. Present the implementation plan and wait for explicit user approval.
4. Implement approved tasks, validate them, and validate the integrated change. Respect upstream version gates.
5. Prepare the proposed version and publication changes. Push branches and open PRs when remotes exist.
6. Stop for the team to review and merge. A version becomes established only when all required knowledge and implementation changes land on `main` or `master`.

A new plan or material change requires renewed plan approval before affected implementation continues. Ordinary fixes within the approved scope do not require another review.

## Role Skills

| Skill | Responsibility |
| --- | --- |
| [ADD coordinator](skills/add-coordinator/SKILL.md) | Interview, phase coordination, plan approval, dependency gates, integration, and PR handoff. |
| [ADD Product Owner](skills/add-product-owner/SKILL.md) | Author and self-check requirements. |
| [ADD Technical Lead](skills/add-technical-lead/SKILL.md) | Produce specifications, ADRs, and the plan sequentially, with self-checks in one frontier-model session. |
| [ADD implementer](skills/add-implementer/SKILL.md) | Implement assigned tasks, run DoD checks, and record validation evidence. |

Skills can run within one session. Separate agents are used automatically for independent implementation tasks when useful; roles do not require separate sessions or redundant reviews.

## Built-In Patterns

Use the [pattern library](../04-patterns/README.md) to select relevant guidance. PO work can use strategic DDD and BDD for discovery. TL work uses strategic DDD and contract-driven Specification, with tactical design where needed. Implementers use the selected tactical, contract, and behavior checks. Patterns produce knowledge and evidence in existing artifact files; they do not create additional workflow phases or state.

## Repository Layouts

- **Separate repositories:** One knowledge repository and separate implementation repositories. Create one PR per changed repository and cross-link the PRs for the coordinated artifact change.
- **One Git repository:** Knowledge and multiple applications or services share a repository. Use one coordinated PR.

Inspect the actual repositories, branches, remotes, and local instructions before working. Do not infer paths or repository ownership from names alone.

## Parallel Implementation

Create or reuse agents for independent approved tasks. Each parallel implementation agent uses a separate Git worktree on a dedicated branch in its target repository. The coordinator integrates their commits onto the change branch and runs combined validation.

Give agents the governing contracts, task scope, dependencies, and DoD. Keep knowledge updates under the coordinator's control to avoid agents concurrently editing the same task or artifact files. Integrate code commits, then record returned evidence in the relevant tasks.

## Evidence and Resuming Work

The knowledge base contains domain and technical knowledge, plans, task checklists, and validation evidence. Git contains commit history. Do not add phase status tables, copied commit hashes, approval registries, or a workflow database.

Derive progress from artifacts, implementation, validation results, Git history, and available user authorization. A commit records work; it does not prove that a phase or task passed its checks. If plan approval cannot be established from available context, ask before implementing.

## Publication and Establishment

Never commit directly to protected branches, including `main` and `master`. Prepare a complete proposed snapshot, root README updates, and regenerated DAG on the change branch. These updates describe the proposed post-merge state and must not make consumers treat an unmerged version as established.

When a remote exists, push the change branch and open a PR. For multiple repositories, describe the required companion PRs and their merge dependencies. Stop after handing off to the team; do not merge, enable automatic merging, or deploy.

If no remote exists, ask the user how to finish. They can choose a remote and PR workflow or explicitly authorize a local merge for solo work. The latter replaces the PR handoff only for the repositories the user authorizes. Merge the validated dedicated branch through Git's merge operation; do not create implementation commits directly on `main` or `master`. If branch protection prevents local integration, report that blocker. Do not assume either choice.

If required repositories merge at different times, the coordinated version remains unestablished until all required changes have landed. Report PR preparation separately from establishment. Verify all required merges before releasing dependent Implementation when work resumes.
