# GitHub Spec Kit: capability comparison

- Surveyed: 2026-10-19
- Clone: `git clone --depth 50 https://github.com/github/spec-kit` (default branch `main`)
- Commit: `c6a4c18f1d01a8bec241c618eb6dfea952508744` (2026-10-16 17:43 -0500, "Update Applied Epistemic Engineering extension to v1.5.2 (#5000)")
- Tag: the shallow clone has no tags (`git describe --tags` fails). The latest release is **1.2.1 (2026-10-16)**, from `CHANGELOG.md` and https://github.com/github/spec-kit/releases (marked "Latest"). HEAD is 5 commits after the release commit `49b855f` ("chore: release 1.2.1, begin 1.2.2.dev0 development"). `pyproject.toml` at HEAD says `version = "1.2.2.dev0"`.
- Unless a URL is given, every path below is relative to the repository root at this commit.
- Method: I read files only. I ran no repository scripts, installers or package managers. The only code I ran was a Python `-I` one-liner that counted entries in the catalog JSON files.

---

## 0. Identity

| Item | Value | Evidence |
|---|---|---|
| Name | Spec Kit. The CLI is `specify` (PyPI package `specify-cli`). | `README.md`, `pyproject.toml` |
| Repository | https://github.com/github/spec-kit | |
| Version / tag | 1.2.1, released 2026-10-16. HEAD is `1.2.2.dev0`. | `CHANGELOG.md` (`## [1.2.1] - 2026-10-16`), releases page |
| Commit | `c6a4c18f1d01a8bec241c618eb6dfea952508744` | `git log -1` |
| Earlier milestones | 0.0.1 on 2025-08-22. 1.0.0 on 2026-08-21. Initial commit on 2025-08-21. | `CHANGELOG.md`, `docs/history.md` |
| License | MIT, "Copyright GitHub, Inc." | `LICENSE` |
| Activity | 50 commits from 2026-10-09 to 2026-10-16. In that window: 18 by github-actions[bot], 16 by the lead maintainer (Manfred Riem), the rest by about 13 other people. Releases 1.1.1 to 1.2.1 came out between 06 Oct and 16 Oct. The repository page shows about 142k stars, 12.7k forks, 78 open issues and 111 open PRs. `docs/history.md` reported "270+ contributors" at 1.0.0. | `git log`, https://github.com/github/spec-kit (fetched 2026-10-19), `docs/history.md` |
| Stewardship | Founded by Den Delimarsky and John Lam (Aug 2025 to Jan 2026). Manfred Riem has been lead maintainer since 2026-01-22. | `docs/history.md` |
| Supported agents / harnesses | 41 named integrations plus `generic`: Alquimia, Amp, Antigravity, Auggie, Claude Code, Cline, CodeBuddy, Codex CLI, Command Code, Cursor, DeepSeek Harness, Devin, Docker Agent, Factory Droid, Firebender, Forge, Gemini CLI, GitHub Copilot (the default), Goose, Grok Build, Hermes, IBM Bob, Junie, Kilo Code, Kimi, Kiro CLI, Lingma, MiniMax Code, Mistral Vibe, Muse, Oh My Pi, opencode, Pi, Qoder, Qwen, RovoDev, SHAI, Tabnine, Trae, ZCode, Zed. `integrations/catalog.json` has 42 entries. Several integrations can be installed side by side only when each is declared "multi-install safe", or with `--force`. | `docs/reference/integrations.md`, `src/specify_cli/integrations/*/`, `integrations/catalog.json` |
| Runtime | Python 3.11+ and `uv`. Each helper script ships in three variants: Bash, PowerShell and Python. | `README.md`, `scripts/{bash,powershell,python}/` |

## 1. Purpose and target user

- **Claimed problem.** The project describes itself as "an open source toolkit that gives AI coding agents structured processes, reusable templates, and documented outcomes" (`README.md`). Its methodology inverts the usual relationship between specs and code: the specification becomes the "lingua franca" and the "source of truth", and code becomes "the last-mile approach" (`spec-driven.md` §"The Power Inversion", §"Core Principles").
- **Processes offered** (`README.md` §"Choose your process"):
  - SDD, which ships in core.
  - Bug fixing (`bug` extension).
  - Idea assessment (`assess` extension).
  - "Your own process", built from primitives.
  - The README says these are "independent entry points, not mandatory phases".
- **Solo vs team.** Both. `spec-driven.md` says SDD "is supportive of a **team process**, where team-reviewed specifications are expressed and versioned, created in branches, and merged". The persistence models are matched to team situations; for example, flow-back fits when "the team is small enough to notice and reconcile drift quickly" (`docs/concepts/spec-persistence.md`). Role bundles exist for product manager, business analyst, security researcher and developer (`examples/bundles/*/bundle.yml`).
- **Greenfield vs brownfield.** Both.
  - Brownfield guidance: `docs/guides/existing-projects.md`. Run `specify init --here --force`, write a constitution from existing practice, and choose a bounded first change. The new spec "defines the change you intend to make, not a retroactive specification of every existing behavior".
  - `docs/history.md` frames SDD as useful for "greenfield development, parallel exploration, and brownfield enhancement".
  - Brownfield discovery is left to community extensions, for example Brownfield Bootstrap and BrownKit (`docs/community/extensions.md`).

## 2. Workflow

**Phases and commands.** These are agent slash commands or skills; their spelling depends on the agent (`/speckit.x`, `/speckit-x`, `$speckit-x` or `/skill:speckit-x`). Source: `docs/reference/agentic-sdd.md`, `templates/commands/*.md`.

```
/speckit.constitution -> /speckit.specify -> /speckit.clarify -> /speckit.plan -> /speckit.checklist
  -> /speckit.tasks -> /speckit.analyze -> /speckit.implement -> /speckit.converge
```

| Step | Mandatory? | Output |
|---|---|---|
| constitution | Recommended "once per project" | `.specify/memory/constitution.md` |
| specify | Required. "only `/speckit.specify` is strictly required before `/speckit.plan`" | `specs/<NNN-slug>/spec.md`, `checklists/requirements.md`, `.specify/feature.json` |
| clarify | Optional quality gate | Edits `spec.md` (adds a `## Clarifications` section) |
| plan | Core | `plan.md`, `research.md`, `data-model.md`, `contracts/`, `quickstart.md` |
| checklist | Optional quality gate | `checklists/<domain>.md` |
| tasks | Core | `tasks.md` |
| analyze | Optional gate, read-only | A report in chat only |
| implement | Core | Code; marks tasks `[X]` |
| converge | Core in the README loop. "Repeat implement → converge until convergence reports Converged" | Appends a `## Phase N: Convergence` section to `tasks.md`, or changes nothing |
| taskstoissues | Deprecated core command; replaced by the `github` extension | GitHub issues |

- **Paths.** A "Shorter path" is specify → plan → tasks → implement → converge. A "Full path" adds clarify, checklist and analyze (`docs/quickstart.md`).
- **Approval gates.**
  - In the agentic commands, gates are **prompts to the human in the chat session**.
  - `/speckit.specify` asks up to 3 `[NEEDS CLARIFICATION]` questions and waits for answers (`templates/commands/specify.md` step 8c).
  - `/speckit.implement` stops when any checklist item is unchecked and asks "Do you want to proceed with implementation anyway? (yes/no)" (`templates/commands/implement.md` step 2).
  - `/speckit.analyze` offers remediation, which the "user must explicitly approve" (`templates/commands/analyze.md`).
  - Custom checklists are "reviewer-owned"; implement "must not silently self-approve them" (`docs/reference/agentic-sdd.md`).
  - The plan template has a "Constitution Check" gate: "GATE: Must pass before Phase 0 research. Re-check after Phase 1 design." Unjustified violations are an ERROR, and a Complexity Tracking table records justified ones (`templates/plan-template.md`, `templates/commands/plan.md`).
  - The README tells users to run each step "one at a time, and review the result before continuing" (`README.md`). There is no persisted approval record in the core agentic flow.
- **Optional automated gates.** The `specify workflow` engine has `gate` steps (approve/reject, with `on_reject: abort|retry|skip`), persisted run state, and `specify workflow resume <run_id> --input verdict=approve` (`docs/reference/workflows.md` §"State and Resume", §"Gate Verdict Inputs"). The bundled `speckit` workflow runs specify → [gate review-spec] → plan → [gate review-plan] → tasks → implement (`workflows/speckit/workflow.yml`). The approver is whoever answers the gate. No role is enforced.
- **Other processes.**
  - Bug: assess → fix → test, with the final verdict `verified`, `partial` or `failed` (`docs/reference/agentic-bugfix.md`, `extensions/bug/`).
  - Assess: intake → research → define → shape → decide, ending in a `go`, `needs-clarification` or `kill` decision (`docs/reference/agentic-assessment.md`, `extensions/assess/`).

## 3. Artifact model

- **Artifact types.**
  - Constitution: project principles with a semantic version and ratified/amended dates (`templates/constitution-template.md`).
  - Feature spec: user stories with priorities P1/P2/..., Given/When/Then acceptance scenarios, edge cases, `FR-###` functional requirements, key entities, `SC-###` success criteria and assumptions (`templates/spec-template.md`).
  - Plan: technical context, constitution check, project structure and complexity tracking (`templates/plan-template.md`).
  - Plan outputs: `research.md` (Decision / Rationale / Alternatives considered), `data-model.md`, `contracts/` and `quickstart.md` (`templates/commands/plan.md`).
  - Tasks: `T###` IDs, a `[P]` parallel marker and `[US#]` story labels, grouped into phases (Setup, Foundational, one phase per user story, Polish) (`templates/tasks-template.md`).
  - Checklists: `CHK###` items with `[Spec §X.Y]` references (`templates/commands/checklist.md`, `templates/checklist-template.md`).
  - Optional roadmap ("spec of specs"): a plain Markdown table with `R#` IDs (`docs/concepts/spec-of-specs.md`).
  - Bug reports: `.specify/bugs/<slug>/assessment.md` and related files. Assessments: `.specify/assessments/<slug>/`.
  - **No ADR type in core.** I checked `templates/` and `docs/reference/`. The closest record is `research.md` decisions; community extensions such as adrkit and Architecture Governance add ADRs (`docs/community/extensions.md`, `CHANGELOG.md`).
  - **No separate PRD or requirement document** above the spec. The spec plays that role (`spec-driven.md` calls it the "PRD").
- **File layout.**

  ```text
  .specify/
    memory/constitution.md
    templates/
    scripts/
    extensions.yml
    feature.json
    init-options.json
  specs/<NNN-short-name>/
    spec.md
    plan.md
    research.md
    data-model.md
    contracts/
    quickstart.md
    tasks.md
    checklists/
  ```

  - Feature directories are numbered sequentially (`NNN`) or by timestamp (`YYYYMMDD-HHMMSS`) (`templates/commands/specify.md` step 3).
  - `.specify/feature.json` points at the active feature. It is git-ignored as machine-local state (`docs/reference/core.md`).
- **Format.**
  - Plain Markdown. Only `tasks-template.md` has YAML front matter (`description:`).
  - Spec metadata is inline bold text ("**Feature Branch**", "**Created**", "**Status**: Draft", "**Input**").
  - IDs: `FR-###`, `SC-###`, `US#`, `US#/AC#` (used by converge), `T###`, `CHK###`, `R#`.
  - No machine-readable schema for artifacts. I checked `templates/`; the `specify` CLI does not parse specs.
- **Source of truth.** The methodology puts the spec as the source of truth (`spec-driven.md`). During delivery, converge treats `spec.md`, `plan.md` and `tasks.md` together as "the **sole source of intent**", with the constitution as governing constraints (`templates/commands/converge.md`). After delivery, the source of truth is a team choice (§4).
- **Versioning over time.**
  - Specs are per-feature directories. There is no spec version field. The constitution alone carries a semver (`templates/commands/constitution.md` step 2).
  - Git branches are optional, through the `git` extension (`extensions/git/README.md`).
  - Three persistence models are documented, and "None is the default, and none is required by Spec Kit" (`docs/concepts/spec-persistence.md`):
    - **Flow-forward:** an immutable per-feature snapshot plus a new directory for each change.
    - **Living spec:** edit `spec.md` and regenerate plan and tasks.
    - **Flow-back:** reconcile any artifact.

## 4. Change on existing systems

- **How a change is expressed.** Either a new feature directory (flow-forward) or an edit of the existing `spec.md` (living or flow-back). The team decides (`docs/guides/evolving-specs.md`). There is no delta or diff format against a baseline spec. I checked `templates/` and `docs/guides/evolving-specs.md`.
- **Archival and merge of completed changes.** Absent in core. I checked `templates/commands/`, `docs/concepts/spec-persistence.md` and `docs/guides/evolving-specs.md`. The docs say: "The core workflow has no dedicated command that automatically reconciles differences among `spec.md`, `plan.md`, and `tasks.md`" (`docs/concepts/spec-persistence.md`). Community extensions fill this gap:
  - Archive Extension: "Archive merged features into main project memory".
  - Reconcile Extension: "surgically updating the feature's own spec, plan, and tasks".
  - Spec Refine: "propagate changes to plan and tasks".
  - Spec Sync.
  - OpenSpec, which adds "propose → implement → verify → archive" (`docs/community/extensions.md`).
  - Open issue #4944, "Explore opt-in persistence extensions for flow-back, flow-forward, and flow-always", is labeled feature-needs-clarification (https://github.com/github/spec-kit/issues).
- **How current truth is kept.**
  - Through team convention, documented "in your project constitution or team onboarding notes" (`docs/concepts/spec-persistence.md`).
  - Under flow-forward, current truth is spread across many feature directories: "Related decisions can be spread across multiple feature directories" (same file).
  - There is no consolidated system-level spec in core. I checked the `specs/` layout and the docs.
  - Converge checks only the current feature against the code; "This is **not** a diff tool and does **not** track changes ... no git, no branch comparison, no history" (`templates/commands/converge.md`).

## 5. Traceability

- **Requirement to task.** Tasks carry `[US#]` labels that map to spec user stories (`templates/tasks-template.md` Notes: "[Story] label maps task to specific user story for traceability"). Tasks do not have to cite `FR-###`. `/speckit.analyze` infers the task-to-requirement mapping "by keyword / explicit reference patterns" and reports a Coverage Summary table (Requirement Key → Has Task? → Task IDs) and "Unmapped Tasks" (`templates/commands/analyze.md` §3, §6).
- **Convergence tasks.** These must cite a source, for example "`- [ ] T042 <description> per <source-ref> (<gap-type>)`", where source-ref is `FR-003`, `SC-002`, `US1/AC2`, `plan: storage decision` or `Constitution II` (`templates/commands/converge.md` §7).
- **Checklist items.** At least 80% must carry a `[Spec §X.Y]` reference or a marker such as `[Gap]` (`templates/commands/checklist.md`).
- **Task to code.** Task descriptions include exact file paths ("Include exact file paths in descriptions", `templates/tasks-template.md`). No code annotations link back.
- **Code to reason.** Absent in core. I checked `templates/commands/implement.md` and `tasks-template.md`; there is no commit or code annotation convention. The git extension's optional auto-commit adds per-command messages such as "[Spec Kit] Add specification" (`extensions/git/README.md`). The `github` extension turns tasks into issues and "checks existing task IDs to avoid duplicates" (`docs/reference/agentic-sdd.md`).
- **Requirement to test.** Tests are optional: "Tests are OPTIONAL - only include them if explicitly requested" (`templates/tasks-template.md`). There is no requirement-to-test matrix in core. The community extensions Spec Trace (requirement → test matrix) and Reqnroll BDD add one (`docs/community/extensions.md`).
- **Roadmap to sub-spec.** Bidirectional plain-text links by convention: `**Input**: Parent roadmap: ... → entry R3` (`docs/concepts/spec-of-specs.md`).

## 6. Impact analysis

- **Detecting what a spec or requirement change affects.** Absent in core. I checked `templates/commands/*.md`, `docs/guides/evolving-specs.md` and `docs/concepts/spec-persistence.md`.
  - `spec-driven.md` claims: "Change a core requirement in the PRD, and affected implementation plans update automatically." No core command implements this. Downstream artifacts are regenerated or edited by hand (`docs/guides/evolving-specs.md` §"Living Spec", step 3: "Reconcile `plan.md` and `tasks.md` directly or through an extension").
- **Staleness and drift within one feature.** Partly covered.
  - `/speckit.analyze` reports inconsistencies, coverage gaps and terminology drift across spec, plan and tasks, but only after tasks exist and without editing anything (`templates/commands/analyze.md`).
  - `/speckit.converge` finds code-vs-artifact gaps (`missing`, `partial`, `contradicts`, `unrequested`) inside the feature's own scope (`templates/commands/converge.md`).
  - Neither crosses feature directories. There is no dependency graph between specs. Roadmap `Depends on` columns are manual (`docs/concepts/spec-of-specs.md`).
- **Constitution changes.** `/speckit.constitution` writes a temporary "Sync Impact Report" HTML comment (version change, modified, added and removed principles). The comment "is expected to be removed before the amended constitution file is committed" (`templates/commands/constitution.md` step 4). Spreading constitution changes into templates is opt-in through the `constitution-sync` preset (`presets/constitution-sync/README.md`).
- **Community.** Architect Impact Previewer, Spec Refine ("diff impact across artifacts"), Architecture Guard, CI Guard and Blueprint Index (`docs/community/extensions.md`).

## 7. Roles and agents

- **Personas or roles.** No agent personas in core. I checked `templates/commands/` and `src/specify_cli/agents.py`.
  - The human/agent split is implicit: the user reviews each step; checklists are "reviewer-owned".
  - Role is a packaging concept in bundles (`role: "product-manager"` in `examples/bundles/product-manager/bundle.yml`). Bundles curate components; they do not create agent personas.
- **Handoffs.** Command front matter declares `handoffs:` (label, target agent such as `speckit.plan`, prompt, and `send: true`). Agents such as Copilot that support the field render them as next-step buttons (`templates/commands/specify.md`, `plan.md`, `tasks.md`, `clarify.md`, `constitution.md`).
- **Multi-agent orchestration.**
  - `/speckit.plan` Phase 0 says "Generate and dispatch research agents" for each unknown (`templates/commands/plan.md`).
  - `docs/concepts/complex-features.md` suggests telling implement to "delegate each parallel [P] task to a sub-agent".
  - The workflow engine provides `fan-out`, `fan-in` and per-step `integration`, `model` and `integration_options`, so different steps can run on different agents or models (`docs/reference/workflows.md` §"Step Types", §"Per-Step Integration Configuration").
  - The handoff format between steps is files on disk (spec, plan and tasks), plus workflow `state.json` and captured outputs (`docs/reference/workflows.md` §"State and Resume", §"Capturing Command and Prompt Output").
- **Community.** MAQA ("coordinator → feature → QA workflow"), Multi-Model Review, Squad Bridge, Superspec, and cc-spex ("parallel implementation via agent teams") (`docs/community/extensions.md`, `docs/community/friends.md`).

## 8. Quality controls

- **Constitution.**
  - The template has principle slots, additional sections, governance, and a version with ratified/amended dates (`templates/constitution-template.md`).
  - It is "non-negotiable" in analyze and converge, where a violation is CRITICAL (`templates/commands/analyze.md`, `converge.md`).
  - `spec-driven.md` describes "Nine Articles" (Library-First, CLI, Test-First, Simplicity, Anti-Abstraction, Integration-First, ...) and "Phase -1 Gates". The current `templates/plan-template.md` has a generic "Constitution Check" and no "Phase -1" section (`grep 'Phase -1' templates/` returns nothing).
- **Self-checks.**
  - `/speckit.specify` generates `checklists/requirements.md` (content quality, requirement completeness, feature readiness) and revalidates up to 3 iterations (`templates/commands/specify.md` step 8).
  - Every command template ends with a `## Done When` checklist, for example in `templates/commands/implement.md` and `specify.md`.
- **Clarification.** At most 3 `[NEEDS CLARIFICATION]` markers in specify. `/speckit.clarify` runs a taxonomy-based scan and asks at most 5 questions, recorded under `## Clarifications / ### Session YYYY-MM-DD` (`templates/commands/clarify.md`).
- **Checklists.** `/speckit.checklist` writes "unit tests for your requirements" by domain (UX, API, security, ...). It checks requirement quality, not implementation (`docs/reference/agentic-sdd.md`, `templates/commands/checklist.md`).
- **Consistency analysis.** `/speckit.analyze` is read-only and covers duplication, ambiguity, underspecification, constitution alignment, coverage gaps and inconsistency. It assigns CRITICAL/HIGH/MEDIUM/LOW severities, reports at most 50 findings, and reports coverage metrics (`templates/commands/analyze.md`).
- **Implementation vs intent.** `/speckit.converge` is append-only. It severity-grades gaps (missing, partial, contradicts, unrequested) and appends tasks until the result is "✅ Converged" (`templates/commands/converge.md`).
- **Definition of done.** Per command, a `Done When` list. For implement: "All tasks in tasks.md completed and marked `[X]`" and "Implementation validated against specification, plan, and test coverage" (`templates/commands/implement.md`). There is no per-task DoD field.
- **Tests.**
  - Optional unless requested or required by the constitution (`templates/tasks-template.md`, `templates/commands/tasks.md`).
  - When tests are included they come first: "Tests (if included) MUST be written and FAIL before implementation".
  - The bug process requires verification: "Missing verification is not a successful fix" (`README.md`).
- **Validation commands and linters.** No artifact linter in the CLI. I checked `docs/reference/overview.md` and the `src/specify_cli/` command groups. What exists:
  - `specify check` for tool presence.
  - `specify workflow validate` and `specify bundle validate` for package manifests (`docs/reference/workflows.md`, `src/specify_cli/bundles/command_validate.py`).
  - Shell `check-prerequisites` scripts, which verify that required feature files exist (`scripts/bash/check-prerequisites.sh`).

## 9. Parallel, team and multi-repo

- **Concurrent changes.**
  - One "active feature" per checkout, held in `.specify/feature.json` or `SPECIFY_FEATURE_DIRECTORY`.
  - `SPECIFY_FEATURE_NO_PERSIST=1` exists "when multiple agents run concurrently against the same checkout ... without it, each invocation's persist step can overwrite another agent's pinned feature directory" (`docs/reference/core.md`).
  - For parallel slices: "use separate worktrees so each run has isolated active-feature state" (`docs/concepts/spec-of-specs.md`).
  - Git extension numbering counts worktree branches (`CHANGELOG.md`: "fix: count worktree branches in git extension numbering (#3054)").
  - No worktree tooling in core. Community: spec-kit-worktree and spec-kit-worktree-parallel (`docs/community/extensions.md`).
- **Conflict handling between features.** Absent in core. I checked the docs and templates. Within a feature, `[P]` tasks must touch different files ("Tasks affecting the same files must run sequentially", `templates/commands/implement.md`). Bundles have version and component conflict checks for packages, not for specs (`docs/reference/bundles.md`).
- **Git, branches and PRs.**
  - Git is opt-in through the bundled `git` extension (made opt-in at v0.10.0, `CHANGELOG.md` #2873). It provides repo initialization, numbered feature branches (`{author}/{app}/{number}-{slug}` templates), branch validation, remote detection and optional auto-commit before or after each command (`extensions/git/README.md`).
  - Feature state does not follow the branch: "`git checkout` alone does not change it" (`docs/quickstart.md`).
  - No PR creation in core. The workflow `github` step adds issue or PR labels (`docs/reference/workflows.md` §"GitHub step"). The `github` extension creates issues from tasks.
  - Converge's last instruction is "proceed to review or open a PR" (`docs/reference/agentic-sdd.md`).
- **Multi-repo and monorepo.**
  - Monorepo: several `.specify/` projects, each with its own constitution and numbering, selected with `SPECIFY_INIT_DIR`. There is no constitution inheritance: "Spec Kit does not provide a built-in base/inheritance mechanism" (`docs/guides/monorepo.md`).
  - Across repositories: Contract-Driven Development guidance with "one authoritative owner per contract", where other repositories consume "a versioned artifact or synchronized copy" (`docs/guides/contract-driven-development.md`).
  - Community: Multi-Repo Branch Sync (`docs/community/extensions.md`).
- **Release and version handling.** Not handled for the user's product or specs in core. I checked the templates and the docs. Only the constitution semver and component versioning (extensions, presets, workflows, bundles, with catalog pinning and SHA-256 digests) exist (`docs/reference/presets.md`, `docs/reference/bundles.md`). Community: Ship Release Extension.

## 10. Human interface

- **Core.** CLI (`specify`, with Rich terminal output) plus Markdown files edited in the agent or IDE. There is no UI, dashboard or viewer in core; I checked `src/specify_cli/` and `docs/reference/overview.md`.
  - `templates/vscode-settings.json` recommends prompt files and auto-approves `.specify/scripts/` in VS Code chat.
  - The documentation site is https://github.github.io/spec-kit/ (DocFX, `docs/docfx.json`).
- **Experimental MCP server.** `specify mcp` uses stdio only and has read-only tools `specify_version`, `specify_artifact_list` and `specify_artifact_info`. "Artifact" here means commands, templates, scripts and hooks, not specs (`docs/reference/mcp.md`, `docs/reference/artifacts.md`).
- **Diagrams.** No diagram generation in the core templates. The project's own docs use Mermaid (`docs/guides/agentic-sdlc.md`).
- **Community.** Spec Diagram (Mermaid workflow, progress and task dependencies), Data Model Diagram (Mermaid ER), ASCII Diagram Renderer, Spec Kit TLDR (HTML dashboard), Axi (local browser review and annotation), Spec Kit Preview (HTML previews), AgentDocx (React monitoring dashboard) and Taco Review (`docs/community/extensions.md`).

## 11. Extensibility

The README lists five primitives plus bundles and catalogs (`README.md` §"Capabilities", `docs/reference/overview.md`):

- **Integrations.** Adapters per agent, plus `generic` with `--commands-dir`, and `specify integration scaffold` (`src/specify_cli/integrations/command_scaffold.py`).
- **Extensions.**
  - Add commands, templates, scripts and lifecycle hooks (`before_<command>` / `after_<command>` in `.specify/extensions.yml`; `optional: false` means mandatory).
  - Hooks are carried out by the agent following the template text ("EXECUTE_COMMAND:"), not by a runtime. Hook `condition` expressions are skipped by the command templates (`docs/reference/extensions.md` §"Project Extension and Hook Configuration").
  - Bundled: git, github, bug, assess, agent-context, selftest (`extensions/`).
  - Catalogs: 5 core and 182 community entries (`extensions/catalog.json`, `extensions/catalog.community.json`).
- **Presets.**
  - Override templates, commands and terminology. They stack by priority with prepend, append or wrap strategies.
  - Resolution order: project override → presets → extensions → core (`docs/guides/customization.md`, `docs/reference/presets.md`).
  - Bundled: `lean`, `constitution-sync`, `scaffold`, `self-test`. Catalogs: 2 core and 42 community.
  - Project-local overrides go in `.specify/templates/overrides/`.
- **Workflows.** YAML with step types command, prompt, shell, github, init, slot, gate, if, switch, while, do-while, fan-out, fan-in and workflow. They support overlays (patch without forking), custom step packages, and resume (`docs/reference/workflows.md`). Catalogs: 3 core and 2 community.
- **Bundles.** Versioned role or team setups that pin components (`docs/reference/bundles.md`, `bundles/`, `examples/bundles/`).
- **Catalogs.** Priority-ordered, can be private, have authentication for GitHub, Azure DevOps and Bitbucket, and support air-gapped use (`docs/reference/catalogs.md`, `docs/reference/authentication.md`, `docs/install/air-gapped.md`).
- **Domain adaptation.** Presets "adapt the methodology to Agile, Kanban, Waterfall, jobs-to-be-done, or domain-driven design" and can localize terminology (`docs/guides/customization.md`).
- **Inspection.** `specify artifact list|info --json` shows which layer supplies each command or template (`docs/reference/artifacts.md`).
- **Trust.** Catalog listings "are not audits or endorsements" (`README.md`). Maintainers "do not review, audit, endorse, or support the extension code itself" (`docs/community/extensions.md`).

## 12. Setup cost and ceremony

- **Install.** `uv tool install specify-cli`, then `specify init <dir> --integration <key>`. Use `--here --force` for an existing repo (`README.md`, `docs/guides/existing-projects.md`). Requires Python 3.11+ and uv. Alternatives: pipx, uvx one-shot, pinned release, air-gapped (`docs/installation.md`, `docs/install/`).
- **Files generated at init.**
  - `.specify/` with `templates/` (core templates), `scripts/<sh|ps|py>/`, `memory/constitution.md` (materialized from the template if missing), `init-options.json`, `integrations/speckit.manifest.json` and a managed `.gitignore` (`src/specify_cli/shared_infra.py`, `src/specify_cli/command_init.py` `ensure_constitution_from_template`, `docs/reference/core.md`).
  - Agent command or skill files for 10 core commands, for example `.github/skills/speckit-*/SKILL.md` for Copilot or `.claude/skills` for Claude (`docs/reference/integrations.md`).
  - Not installed by default: the git extension, the agent context file updater (agent-context, opt-in) and all other extensions (`docs/reference/core.md`, `extensions/agent-context/README.md`).
- **Minimum steps for one small change.** Agent steps:
  1. `/speckit.specify`
  2. `/speckit.plan`
  3. `/speckit.tasks`
  4. `/speckit.implement`
  5. `/speckit.converge`

  The "Shorter path" also asks for a one-time `/speckit.constitution`. Only specify is strictly required before plan (`docs/reference/agentic-sdd.md`). Each step is one agent invocation that the user reviews.
- **Fast path for trivial changes.**
  - The `lean` preset replaces the five core commands with short prompts: each is 0.5 to 1.4 KB, against 8 to 22 KB for the core command templates (`presets/lean/commands/*.md` vs `templates/commands/*.md`, by `wc -c`).
  - The `bug` extension handles repairs without SDD.
  - The project itself says: "Small fixes can use the normal issue, pull request, review, and test process" (`CONTRIBUTING.md` §"Does Spec Kit use Spec Kit?").
  - There is no "skip spec" mode in core SDD.

## 13. Agent context efficiency

- **Scoped loading in templates.** analyze and converge instruct "Load only the minimal necessary context from each artifact (Progressive Disclosure)" and name the sections to read. Analyze caps findings at 50 and asks for "Token-efficient output" (`templates/commands/analyze.md` §2, §"Context Efficiency"; `templates/commands/converge.md` §2).
- **Path discovery by script.** `check-prerequisites` returns JSON with `FEATURE_DIR` and `AVAILABLE_DOCS`, so the agent reads only files that exist (`scripts/bash/check-prerequisites.sh`, referenced in the command front matter `scripts:`).
- **Per-feature sharding.** Each feature has its own small artifact set. Implement reads `tasks.md` and `plan.md` (required) and the other plan outputs if they exist (`templates/commands/implement.md` step 3).
- **Context-window guidance.** `docs/concepts/complex-features.md` names "context window exhaustion" as the cause of degradation in long `/speckit.implement` runs. Remedies:
  - Limit tasks per run ("only execute tasks T001-T010").
  - Sub-agent delegation.
  - "spec of specs" decomposition (`docs/concepts/spec-of-specs.md`).
- **Command template size.** The core command templates total about 140 KB across 10 files (`wc -c templates/commands/*.md`). A large share of each file is repeated extension-hook boilerplate (pre- and post-hook sections in `specify.md` and `analyze.md`). The `lean` preset is the documented small alternative.
- **Other controls.** Claude `--no-model-invocation` makes the core skills user-invocable only, so the model does not load them automatically (`docs/reference/integrations.md`). Agent context file management is opt-in (`extensions/agent-context/README.md`).
- **Token cost measurements.** Unknown; I found none in `docs/`, `README.md` or `spec-driven.md`.

## 14. Known limitations

Documented:

- **No artifact reconciliation.** No core reconciliation or amendment command; analyze is read-only and converge only appends tasks (`docs/concepts/spec-persistence.md`, `docs/guides/evolving-specs.md`).
- **Persistence left open.** The persistence model is unprescribed; risks named are "Silent drift between artifacts", "Duplicate or fragmented context" and "Lost rationale in regenerated files" (`docs/concepts/spec-persistence.md` table).
- **Long implementation runs.** Agents "lose track of the plan, ignore tasks, or hallucinate — usually right before or after context compaction" (`docs/concepts/complex-features.md`).
- **Monorepo.** No constitution inheritance; one Git branch namespace is shared across member projects; `SPECIFY_INIT_DIR` may not reach interactive agents (`docs/guides/monorepo.md`).
- **One active feature per checkout.** Concurrent agents can overwrite `.specify/feature.json` unless `SPECIFY_FEATURE_NO_PERSIST` is set (`docs/reference/core.md`).
- **Forced refresh.** `specify init --here --force` can overwrite a customized constitution, templates or scripts (`docs/guides/evolving-specs.md` §"Before Updating Spec Kit Project Files").
- **Hooks.** Command templates skip hooks that have a `condition`, and `priority` is not used for sorting in templates (`docs/reference/extensions.md`).
- **Workflow overlays.** Cannot change metadata or inputs, or target fan-out templates (`docs/reference/workflows.md` §"Limitations"). Gate verdict inputs are not supported inside fan-out.
- **Filesystem policy migration.** Symlink policy covers only migrated FileHelper operations (`docs/reference/core.md` §"Migration limit").
- **Per-integration gaps.**
  - SHAI cannot run workflow command or prompt steps.
  - Kiro CLI does not substitute `$ARGUMENTS`.
  - Pi lacks MCP, so `taskstoissues` does not work.
  - Docker Agent is not multi-install safe (`docs/reference/integrations.md`).
- **MCP server.** Experimental; the contract may change (`docs/reference/mcp.md`).
- **Community components** are unaudited (`README.md`, `docs/community/extensions.md`).

Open issue themes (https://github.com/github/spec-kit/issues, first page, fetched 2026-10-19; 78 open):

- Integration-specific invocation bugs: #4954 Codex `$` prefix, #4797 Kiro, #4794 Junie.
- Extension and bundle lifecycle robustness: #5002, #4815, #4744, #4819.
- Git hook failure: #5003.
- Init failure: #4994, severity-high.
- Workflow engine features: #4916, #4913, #4792, #4808.
- Persistence extensions: #4944.
- Phasing out first-party shell scripts: #4884.
- A requested cross-stage status report, `speckit-status` (#4705), is labeled triage-out-of-scope.

## 15. Assessment

**Strengths**

1. **Agent portability.** 41 named integrations plus a generic adapter, and the same process across agents (§0; `docs/reference/integrations.md`).
2. **Layered quality gates for the spec.** An auto-generated requirements-quality checklist, bounded clarification, reviewer-owned checklists, a read-only cross-artifact analysis with coverage metrics, and an append-only convergence loop that checks code against FR/SC/US IDs (§8; `templates/commands/analyze.md`, `converge.md`).
3. **Customizable without forking.** Presets, extensions with lifecycle hooks, workflows with overlays, gates and resume, bundles and private catalogs, plus layer inspection with `specify artifact` (§11).
4. **Large ecosystem and active development.** 182 community extensions and 42 community presets; four releases in ten days; very high adoption signals (§0, §11).
5. **Explicit about what it does not decide.** The persistence models, brownfield limits and context-window failure modes are named with mitigations rather than hidden (§4, §13, §14).

**Weaknesses**

1. **No change model for existing behavior.** No delta specs, no archive or merge into a consolidated current-truth spec, no core reconciliation; the persistence model is left to team convention (§3, §4).
2. **No impact analysis.** No dependency graph across specs and no staleness propagation. The methodology's claim that plans "update automatically" has no core implementation (§6).
3. **Thin traceability past tasks.** Tasks link to stories by `[US#]` and to files by path. FR-to-task links are inferred by keyword during analysis, and there is no code-to-reason or requirement-to-test link in core (§5).
4. **Parallel and team support is thin in core.** One active feature per checkout; worktrees, PR creation, release handling, cross-feature conflict detection and role separation are left to the user or community extensions; approvals are not recorded outside the workflow engine (§2, §7, §9).
5. **Ceremony and context cost.** Core command templates total about 140 KB, much of it repeated hook boilerplate. The full path is 9 steps, and the minimum per change is 4 to 5 agent invocations; the lean preset and bug extension are the only lighter routes (§12, §13).
6. **Quality depends on outside code.** Much capability (archive, impact, trace, dashboards, worktrees) lives in unaudited community extensions, so quality and maintenance vary. The methodology doc (`spec-driven.md` "Phase -1 Gates", "Nine Articles") also no longer matches the shipped plan template (§8, §11).
