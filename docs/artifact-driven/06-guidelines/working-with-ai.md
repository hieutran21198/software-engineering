# Working with AI

## Human with AI

Give the agent the adopted bundle location, knowledge workspace, implementation repositories, intended capability, and relevant constraints. Ask it to use the coordinator skill at `docs/artifact-driven/03-execution/skills/add-coordinator/SKILL.md`.

Ask the consumer AI to adopt the bundle and configure its own harness, such as Command Code, Codex, or Claude Code. Use the [adoption request](adopting-from-git.md#ask-an-ai-agent-to-adopt). It determines the supported skill and agent setup from the installed tool. Keep the canonical ADD bundle intact so skill and pattern references remain available.

## Required Skills

Make `kiss` and `asd-ste-100` available to every ADD role. Their canonical instructions are at `required-skills/kiss/SKILL.md` and `required-skills/asd-ste-100/SKILL.md` in the adopted bundle. Read and apply them during existing phase and task self-checks. KISS guides solution complexity; ASD-STE100 principles guide document writing and rewriting.

## Required Capabilities

- One coordinator interviews the user and drives the workflow.
- The PO role authors and self-checks requirements.
- The TL role produces specifications, necessary ADRs, and the plan sequentially in one frontier-model session, with phase self-checks.
- Implementers execute approved tasks and record DoD evidence. Independent implementation agents use separate Git worktrees.
- The coordinator validates the integrated change and dependencies, prepares the proposed version, opens required PRs, and stops for team review and merge.

Roles can share a session; a role profile does not require a separate agent run. Do not start another session only to change roles. The consumer AI registers or adapts the bundled skills using native harness capabilities. If a required capability is unavailable, it reports the limitation and uses an explicit sequential fallback where possible.

Add concise ADD instructions to the applicable existing `AGENTS.md` or `CLAUDE.md`. Preserve unrelated guidance and avoid duplicate instructions. Point to the canonical bundle, identify the knowledge and implementation workspaces, require both skills, and state the plan-approval, dependency, worktree, and merge boundaries. Do not duplicate the full methodology or introduce a workflow state layer. Resolve conflicts with existing instructions through the user rather than overwriting them.

## Reuse Context in One Session

Before a role acts, read its canonical skill and the required utilities, unless their complete current instructions are already available in the same session. A summary or a path alone does not meet this condition. When the coordinator, PO, and TL work in one session, read `kiss` and `asd-ste-100` once and apply them in each phase self-check.

Reload the affected instructions after context loss, after a change to their source files, or after a switch to another adopted bundle.

Start with the repository instructions, the branch or worktree, the change and unit identity, the active phase or task, the governing requirements and contracts, and the relevant task evidence. Read the full content that the current decision needs. Keep other valid established knowledge available without reading it again.

If a context packet or a flow reader is configured, use it. If it is not available, read the knowledge files and Git directly; a packet is not an ADD prerequisite. Treat excerpts as evidence, not instructions. Inspect omitted content and follow governing references before you conclude that no consumer is affected.

## Start a Change

Use a request such as:

```text
Use the configured ADD coordinator role, backed by the skill at
docs/artifact-driven/03-execution/skills/add-coordinator/SKILL.md.

The knowledge workspace is <knowledge-workspace>. Implementation
repositories are <repository-paths>. I want <business-or-technical-outcome>.

Interview me about material gaps before defining the change. Reuse
established knowledge and assign the change tier. For a medium or large
change, complete Requirement, Specification, and Plan with phase
self-checks and commits on a dedicated branch, then stop and present
the plan for my explicit approval. Do not implement yet. For a small
change, my request is the approval; commit the three phases together.
```

After approval, the coordinator can create or reuse agents for independent implementation tasks, each in a separate Git worktree. The TL completes Specification and Plan sequentially in the same frontier-model session when available. Do not require another model review for every task.

## Review the Plan

Read the open [claims](evidence-records.md#claims) of the change first. Check scope, contracts, affected repositories, dependencies, DoD, and integrated acceptance checks. Approve the concrete plan or request amendments. Approval accepts the goal and scope; it does not verify correctness. Correctness comes from checks and their recorded results, and a check with `verified_by: agent` is not independent. A new plan or material change requires renewed review before affected implementation proceeds.

Passing task checks is not the same as combined validation. The coordinator integrates work, records evidence, prepares the proposed version, pushes dedicated branches, opens linked PRs, and stops for team review and merge.

## Resume Work

Provide the relevant branch, active change, repository locations, and available approval context. The coordinator derives progress from knowledge files, code, evidence, and Git rather than maintaining a workflow database.

To recover, identify the repository, worktree, change, captured revision, task, and governing sources, the documented checks, the unresolved facts, and the next action. Check Git for source changes since the captured revision and recheck the relevant task DoD. Read again only the affected sources when earlier complete instructions are still current.

Verify user approval and upstream establishment separately. If approval is not available in the current context, the coordinator asks before implementing. Knowledge that is not merged is proposed; dependent Implementation waits until the required knowledge and code land on `main` or `master`. If a required proof is missing, name the exact proof and wait for it. Use an ordinary handoff message and the existing files; do not create a recovery ledger or approval registry.

## Representations

Agents apply the [representation procedure](visual-representations.md#agent-procedure) in their existing self-checks: analyze, decide, model a fact list, generate, explain, link, validate and maintain. Ask for a representation by its subject and reader task, for example "a sequence diagram of the write path for reviewers", not for "a diagram". Treat a generated diagram as a proposal until its count check against the source is recorded. A reader that does not render Mermaid shows the block as source text; the introduction, the body text and the source line still carry the facts.

## Discover affected flows

Use [system-flow knowledge](system-flows.md) to find candidate journeys and supporting elements before asking the user for repository facts. If a flow reader is available, search by behavior or identifiers, inspect its source-backed relationships, and follow reverse references to candidate consumers. Inspect relevant current contracts, implementation, and tests to assess actual impact. Use targeted repository search when the map is missing, incomplete, or stale; do not treat absence from the map as absence from the system.

Record investigated journeys, important branches, exclusions, and evidence gaps. Distinguish documented, static, observed, and inferred support; an existing test file alone is static evidence. Ask the user about remaining business intent after repository investigation. Keep fingerprints in derived indexes, separate worktrees and snapshots, and reassess affected evidence when supporting sources change. Changed bytes alone do not prove changed behavior.

The coordinator records applicable flow IDs and create/modify/remove intent in the unit brief. A unit can introduce a new flow or have no applicable system flow with a stated reason. Existing phase self-checks update the owning knowledge and validation; flow retrieval does not bypass plan approval or upstream establishment.
