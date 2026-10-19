# OpenSpec: capability survey

Surveyed 2026-10-19. Source: shallow clone (`--depth 50`) of the default branch.

- Repository: https://github.com/Fission-AI/OpenSpec
- Commit: `c794978f4f8845ce59693373c9dd882ee776588c` ("Version Packages (#2112)", 2026-10-17 01:43:43 UTC). Tag `v1.14.3` points to this commit.
- Evidence paths below are repository-relative at this commit unless a URL is given.
- The clone was read only. No scripts, installers or package managers were run.

---

## 0. Identity

| Item | Value | Evidence |
|---|---|---|
| Name | OpenSpec (npm `@fission-ai/openspec`) | `package.json` |
| Version | 1.14.3 (latest tag `v1.14.3`; previous tags 1.14.2, 1.14.1, 1.14.0, 1.13.2) | `package.json`, `CHANGELOG.md` §1.14.3, `git tag` |
| Release date | 2026-10-17 (the "Version Packages" commit for 1.14.3). Earlier releases: 1.14.2 on 2026-10-15 (`f80d860`), 2026-10-05 (`87c3595`), 2026-09-30 (`94ca9c1`) | `git log` |
| License | MIT | `LICENSE`, `package.json` |
| Last commit | 2026-10-17 | `git log -1` |
| Activity | 995 commits, 72.3k stars, 4.9k forks, 287 watchers, 130 open issues, 67 open PRs (GitHub page on 2026-10-19). There are 23 distinct authors in the last 50 commits, and the most frequent is Clay Good with 18. Releases come about weekly (from changesets). | https://github.com/Fission-AI/OpenSpec, `git log` |
| Implementation | TypeScript CLI on Node.js ≥ 20.19.0. Distributed through npm and Homebrew, with Nix flake support | `README.md` (Quick Start), `flake.nix` |
| Supported agents | `AI_TOOLS` has 50 entries: amazon-q, amp, antigravity, atomcode, auggie, bob, claude, cline, command-code, codeartsagent, codex, dsh, devin (alias windsurf), forgecode, codebuddy, codestudio, continue, costrict, crush, cursor, easycode, factory, gemini, github-copilot, gigacode, grok, gsd, hermes, iflow, junie, kilocode, kimi, kiro, lingma, minimax-code, vibe, oh-my-pi, opencode, pi, codeassistant, qoder, qwen, rovodev, roocode, trae, veai, warp, zed, zcode, and `agents` (a shared `.agents/skills` target for AGENTS.md-compatible tools). The README says "30+" and `docs/cli.md` lists 40 IDs, so the docs trail the source. GitHub Copilot's cloud coding agent is an optional extra. | `src/core/config.ts` (lines 41–115), `docs/cli.md` §init, `docs/supported-tools.md` |

## 1. Purpose and target user

- **Problem claimed:** "AI coding assistants are powerful but unpredictable when requirements live only in chat history. OpenSpec adds a lightweight spec layer so you agree on what to build before any code is written." (`README.md` §Why OpenSpec?). `docs/overview.md` calls it "a lightweight agreement layer between you and your AI".
- **Philosophy:** "fluid not rigid / iterative not waterfall / easy not complex / built for brownfield not just greenfield / scalable from personal projects to enterprises" (`README.md`, `docs/concepts.md` §Philosophy).
- **Solo vs team:** Both. The README says "Solo, OpenSpec keeps you and your AI honest on a single repo". Team use has its own pages: `docs/team-workflow.md`, plus the beta "Stores" for cross-repo and cross-team planning (`README.md` §Why teams adopt OpenSpec, `docs/stores-beta/user-guide.md`).
- **Greenfield vs brownfield:** The docs call it "brownfield-first". Specs grow only as changes touch behavior. The docs advise against back-filling specs for code you are not changing (`docs/concepts.md` §Philosophy, `docs/existing-projects.md` §A few honest cautions, `docs/faq.md`).
- **Positioning against peers:** The README compares itself to Spec Kit ("Thorough but heavyweight. Rigid phase gates") and Kiro ("locked into their IDE") (`README.md` §How we compare).

## 2. Workflow

Commands come in two kinds. Slash commands or skills run in the agent chat, and the `openspec` CLI runs in the terminal (`docs/how-commands-work.md`). This is the "OPSX" workflow. It replaced the legacy `/openspec:proposal|apply|archive` commands in 1.0.0 (`docs/migration-guide.md`, `CHANGELOG.md` §1.0.0).

**Default `core` profile** (`docs/commands.md` §Quick Reference, `docs/cli.md` §init):

```
/opsx:explore (optional) → /opsx:propose <name> → [human reads plan] → /opsx:apply → /opsx:archive
                                                 /opsx:update (revise plan)   /opsx:sync (optional)
```

| Command | Role | Evidence |
|---|---|---|
| `/opsx:explore` | Thinking partner. It reads code and must "NEVER write code or implement features". It may write change artifacts only after a yes/no confirmation. | `skills/openspec-explore/SKILL.md` (line 14, guardrails ~l.347), `docs/explore.md` |
| `/opsx:propose` | Creates `openspec/changes/<name>/` and generates every artifact that apply transitively requires (spec-driven: proposal, specs, design, tasks). It then stops: "The request that invoked this workflow authorizes planning only… stop and wait for a new user request to start the apply workflow". | `skills/openspec-propose/SKILL.md` (Guardrails), `docs/commands.md` §/opsx:propose |
| `/opsx:apply` | Works through `tasks.md` checkboxes, marks `[x]`, and re-runs `openspec instructions apply`. It pauses on unclear tasks, design issues or scope creep. | `skills/openspec-apply-change/SKILL.md` |
| `/opsx:update` | Revises planning artifacts and reconciles them with each other. It confirms each edit with the user and never edits code. | `docs/commands.md` §/opsx:update |
| `/opsx:sync` | Agent-driven merge of delta specs into main specs. The change stays active. | `docs/commands.md` §/opsx:sync, `skills/openspec-sync-specs/SKILL.md` |
| `/opsx:archive` | Checks artifact and task completion (warns, does not block), offers to sync, then moves the folder to `changes/archive/YYYY-MM-DD-<name>/`. | `docs/commands.md` §/opsx:archive, `skills/openspec-archive-change/SKILL.md` |

**Expanded profile (opt-in):** `/opsx:new` (scaffold only), `/opsx:continue` (next ready artifact), `/opsx:ff` (all planning artifacts), `/opsx:verify`, `/opsx:bulk-archive`, `/opsx:onboard`. You enable these with `openspec config profile` followed by `openspec update` (`docs/commands.md`, `docs/workflows.md` §Two Modes).

**Order and mandatory steps:** Artifact order comes from the schema dependency graph: proposal → (specs, design) → tasks → apply (`schemas/spec-driven/schema.yaml`). The docs call these dependencies "enablers, not gates": "Nothing locks" (`docs/overview.md` §"Enablers, not gates", `docs/concepts.md` §Schemas). The required parts are:
- Apply requires `tasks` (`apply.requires: [tasks]` in the schema). `openspec instructions apply` returns `state: "blocked"` when required artifacts are missing.
- `openspec validate` rejects a change with zero deltas unless `.openspec.yaml` has `skip_specs: true`.
- `design.md` is conditional: "create only if any apply" (`schemas/spec-driven/schema.yaml`).
- `/opsx:verify` is optional and "Does not block archive" (`docs/commands.md` §/opsx:verify).

**Approval gates:** There is no recorded approval artifact or state. The human gate is a convention:
- propose stops after planning and waits for a new user request (`skills/openspec-propose/SKILL.md`).
- The docs say "you review the plan before any code is written" (`README.md`) and give a review checklist (`docs/reviewing-changes.md`).
- The suggested team practice is to review the change in a PR (`docs/team-workflow.md` §The everyday loop).
- The CLI `archive` asks for confirmation unless you pass `--yes` (`docs/cli.md` §archive).
- Who approves: the human user or PR reviewer, by convention. The tool does not record it. Absent (checked: `docs/team-workflow.md`, `docs-lab/reference/configuration/change-metadata.md` fields list, `src/core/change-metadata/schema.ts`).

## 3. Artifact model

- **Two areas:** `openspec/specs/` holds the source of truth ("how your system currently behaves"). `openspec/changes/<name>/` holds one folder per proposed change. Archive moves a change to `openspec/changes/archive/YYYY-MM-DD-<name>/` (`docs/concepts.md` §The Big Picture, §Archive). `openspec/config.yaml` holds project configuration (`docs/cli.md` §init "What it creates").
- **Change folder (spec-driven schema):**
  - `proposal.md`: Why, What Changes, Capabilities (new or modified), Impact.
  - `specs/<capability-path>/spec.md`: delta specs.
  - `design.md`: Context, Goals/Non-Goals, Decisions with alternatives, Risks/Trade-offs, Migration Plan, Open Questions.
  - `tasks.md`: numbered checkbox tasks.
  - `.openspec.yaml`: metadata.
  - Evidence: `schemas/spec-driven/schema.yaml`, `schemas/spec-driven/templates/*.md`, `docs/concepts.md` §Change Structure.
- **Main spec format:** Markdown with `# <Title>`, `## Purpose`, `## Requirements`, `### Requirement: <name>` (must contain SHALL/MUST), and `#### Scenario: <name>` with WHEN/THEN (or GIVEN/WHEN/THEN) bullets. Keywords follow RFC 2119. Validation requires at least one scenario per requirement (`docs/concepts.md` §Spec Format, `src/core/validation/constants.ts`).
- **Front matter:** none in spec or artifact markdown. Metadata lives in `.openspec.yaml` with keys `schema` (required), `created`, `goal`, `affected_areas`, `initiative {store,id}`, `skip_specs`, `retire_capabilities`, and user `x-*` extension keys (`docs-lab/reference/configuration/change-metadata.md`). Open issue #2036 asks for JSON metadata in md headers (https://github.com/Fission-AI/OpenSpec/issues).
- **IDs:**
  - Changes are kebab-case names; a numeric prefix is allowed (`docs/cli.md` §new change).
  - Capabilities are path-based (`specs/<capability-path>/`).
  - Requirements are identified by header name, which archive matches exactly. `show -r` accepts a 1-based index (`docs/agent-contract.md` §4.2, `docs/cli.md` §show).
  - Tasks use hierarchical numbers such as 1.1.
  - There is no global or stable requirement ID scheme. Absent (checked: `docs/concepts.md`, `docs/agent-contract.md`, `src/core/parsers/requirement-blocks.ts`).
- **Artifacts not present by default:** PRD or requirement document separate from the proposal, user stories, and standalone ADRs. Decisions live inside `design.md`. These types are absent from the built-in schema (checked: `schemas/spec-driven/schema.yaml`). They can be added through custom or community schemas, for example `intent-driven` (ADRs) and `nanopm` (PRD) (`docs/customization.md` §Community Schemas).
- **Versioning over time:** "Living spec" model. Main specs are edited in place by archive. History lives in Git and in the dated archive folders. Specs carry no version number (`docs/concepts.md` §Why Archive Matters "Spec evolution"). JSON `show` output has `metadata.version`/`format` fields for the spec format, not for content history (`docs/agent-contract.md` §4.2).
- **Experimental alternatives in the repo itself:**
  - `openspec/work/` is a "Git-native work" experiment: goal → roadmap → slice (spec/plan/result/log) (`openspec/work/README.md`).
  - `openspec/initiatives/` and `openspec/explorations/` are the project's own planning folders.
  - None of these are shipped CLI concepts. The `initiative` metadata key is recorded, but "No command reads the link today" (`docs-lab/reference/configuration/change-metadata.md`).

## 4. Change on existing systems

- **Delta format:** A delta spec inside the change uses these sections (`docs/concepts.md` §Delta Specs, `schemas/spec-driven/schema.yaml` specs instruction):
  - `## ADDED Requirements`
  - `## MODIFIED Requirements`: the full requirement block is copied and edited, and the header must match exactly.
  - `## REMOVED Requirements`: needs **Reason** and **Migration**.
  - `## RENAMED Requirements`: `FROM:`/`TO:`.
  - A new capability also gets a `## Purpose` section.
- **Merge on archive:**
  - Order of operations: ADDED appended, MODIFIED replaces, REMOVED deleted, RENAMED renamed.
  - Removing the last requirement of a capability deletes its spec file only when `.openspec.yaml` has `retire_capabilities: true`. Otherwise archive stops.
  - The CLI `openspec archive` validates first, merges deterministically (`src/core/specs-apply.ts`), then moves the folder. If a spec write or the move fails, it rolls back (`docs/cli.md` §archive "What it does" steps 1–7).
  - Since 1.14.2, validate and archive warn when delta text would be dropped by the merge (`CHANGELOG.md` §1.14.2, #2054).
- **Agent merge path:** `/opsx:sync` and `/opsx:archive` run an "agent-driven intelligent merge" (`skills/openspec-archive-change/SKILL.md` step 4, `skills/openspec-sync-specs/SKILL.md`). There are therefore two merge mechanisms: the deterministic CLI and the semantic agent merge. Open issue #2033 asks "should OpenSpec stop merging specs deterministically in openspec archive?" (https://github.com/Fission-AI/OpenSpec/issues).
- **Current truth:** `openspec/specs/` after archive. Validation checks MODIFIED requirements against the main specs they would replace (`docs/cli.md` §validate). `openspec show <change> --diff` renders MODIFIED deltas as unified diffs against main specs (`src/cli/index.ts` l.504/621, `openspec/changes/spec-diffs/proposal.md`).
- **Changes with no behavior change:** `skip_specs: true` in `.openspec.yaml`, or `archive --skip-specs` for a single run (`docs/cli.md` §archive).

## 5. Traceability

- **Proposal → specs:** The proposal's "Capabilities" section names new and modified capabilities. Each needs a matching delta spec file, and the schema says it "creates the contract between proposal and specs phases" (`schemas/spec-driven/schema.yaml`). This is an agent-followed instruction, not a CLI cross-check. unknown whether validate cross-checks proposal capabilities against delta files (not found in `src/core/validation/constants.ts` message catalogue).
- **Specs → tasks:** tasks are free-text checkboxes ("Reference specs for what needs to be built"). There is no requirement reference field. Absent (checked: `schemas/spec-driven/schema.yaml` tasks instruction, `src/core/validation/task-*.ts`).
- **Tasks/specs → code/tests:** Each task must "state how to verify completion (a test, command, observable behavior…)" (`schemas/spec-driven/schema.yaml`). `/opsx:verify` searches the codebase for evidence of each requirement and scenario and checks whether tests exist for scenarios (`skills/openspec-verify-change/SKILL.md` ~l.95–141). This link is inferred by the agent at verify time. No link is recorded.
- **Code → reason:** There are no code annotations or IDs. The route back is Git history plus the dated archive folder holding proposal and design (`docs/concepts.md` §Why Archive Matters "Audit trail", `docs/team-workflow.md`). Absent as an explicit mechanism (checked: docs/, skills/).
- **Open requests:** #2056 "Stable anchors for design decisions so other artifacts can link to them" and #2105 "Add an OpenSpec-Identifier to the prompts" are open (https://github.com/Fission-AI/OpenSpec/issues).

## 6. Impact analysis

- **No automatic impact or staleness detection for spec changes.** Absent (checked: `docs/cli.md` command list, `src/core/` file list, `docs/faq.md`).
- **What exists:**
  - The propose instruction tells the agent to research existing specs (`openspec list --specs`, `openspec show <id> --type spec --json --no-scenarios`) and reuse existing capability paths (`schemas/spec-driven/schema.yaml` proposal instruction). Issue #2021 (P1-high) asks to strengthen this.
  - The proposal has an "Impact" section ("Affected code, APIs, dependencies, or systems"), written as free text.
  - `.openspec.yaml` has an `affected_areas` list that is recorded only.
  - `openspec validate` checks MODIFIED/REMOVED headers against main specs (`docs/cli.md` §validate).
  - `/opsx:bulk-archive` "detects spec conflicts across changes" and "resolves conflicts by checking what's actually implemented". This is agent-driven (`docs/commands.md` §/opsx:bulk-archive).
  - `openspec doctor` reports relationship health for stores and references, not for spec-to-spec dependencies (`docs/cli.md` §Doctor).
- **Proposed, not implemented:** `openspec/changes/add-change-stacking-awareness/proposal.md` proposes `dependsOn`/`provides`/`requires`/`touches`/`parent` metadata, cycle and overlap validation, and `openspec change graph|next|split`. No `dependsOn` exists in `src/` (grep). The change is still active.

## 7. Roles and agents

- **No personas or roles.** The model is one human plus one AI assistant. Absent (checked: `skills/` (12 skills), `docs/concepts.md` §Human + Agent Collaboration, `docs/workflows.md`).
- **Phase-specific skills:** explore, propose, new, continue, ff, apply, update, verify, sync, archive, bulk-archive, onboard (`skills/*/SKILL.md`). These are workflow steps, not role personas.
- **Multi-agent orchestration:**
  - Not built in.
  - The archive skill requires the inline sync to run synchronously and not as a background delegation (`skills/openspec-archive-change/SKILL.md` step 4).
  - The community schema `anvil` adds a fresh-context, read-only reviewer step. `superpowers-bridge` integrates subagent-driven TDD (`docs/customization.md` §Community Schemas).
- **Handoff format:** Artifacts are files. Agents query state through `openspec status --json` and `openspec instructions <artifact|apply|archive> --json`. The JSON contract is documented in `docs/agent-contract.md` (envelopes, shapes, exit codes, diagnostic code catalogue). Skills end by naming the next command (e.g. propose → "run `/openspec-apply-change`"). Issue #2058 notes that handoffs are inconsistent.

## 8. Quality controls

- **`openspec validate`** (`docs/cli.md` §validate, `src/core/validation/constants.ts`):
  - Structural rules:
    - Purpose and Requirements sections.
    - SHALL/MUST in each requirement.
    - ≥1 scenario per requirement, at level-4 headers.
    - Why section 50–1000 characters.
    - What Changes not empty.
    - ≥1 delta (unless skip_specs).
  - Warnings: more than 10 deltas per change, requirement text over 500 characters, Purpose under 50 characters or still a placeholder, dropped delta text.
  - `--strict` turns warnings into failures. `--json` and `--concurrency` are available.
  - `--archived` fails if any archived change has unchecked tasks ("handy in a pre-commit hook").
- **`openspec schema validate`** checks custom schemas (`docs/cli.md` §schema validate).
- **`/opsx:verify`:** Agent check across Completeness, Correctness and Coherence, rated CRITICAL/WARNING/SUGGESTION. It does not claim readiness when a check was skipped. It is advisory: "Does not block archive" (`docs/commands.md` §/opsx:verify, `skills/openspec-verify-change/SKILL.md` l.182–212).
- **Task-level definition of done:** each task states its verification. Each group lands its own tests and docs, with no final "testing" group (`schemas/spec-driven/schema.yaml` tasks instruction).
- **Principles and project rules:** There is no constitution file. `openspec/config.yaml` provides `context` (injected into all artifact instructions, max 50 KB), per-artifact `rules`, and `operations.apply|archive.guidance`. The docs state "These are behavioral contracts for generated agents, not enforceable CLI checks" (`docs/customization.md` §Project Configuration, `docs/cli.md` §instructions).
- **Writing guidance:** a review checklist (`docs/reviewing-changes.md` §The two-minute checklist) and a spec checklist (`docs/writing-specs.md` §A quick checklist).
- **Test requirement:** Scenarios "should be testable". Verify checks for test coverage of scenarios as a warning or suggestion. No hard test gate. Absent as an enforced gate (checked: `src/core/validation/`, `docs/cli.md`).
- **Known gap:** open issue #2078 says a scenario with no WHEN/GIVEN/THEN step still passes validate.

## 9. Parallel, team and multi-repo

- **Concurrent changes:**
  - Changes are separate folders, and "you can work on multiple changes in parallel without conflicts" (`docs/concepts.md`).
  - Conflicts surface in `specs/` only when two changes modify the same requirement. They are resolved like a Git merge conflict (`docs/team-workflow.md` §Two people, parallel changes).
  - `/opsx:bulk-archive` archives in creation order with agentic conflict resolution (`docs/commands.md`).
  - Guidance is "One change, one owner".
- **Worktrees:** no Git worktree support. Absent (checked: grep `worktree` across `docs/*.md` and `skills/*/SKILL.md`; the only hit is Zed worktree trust).
- **Git, branch and PR integration:** "OpenSpec doesn't touch git. It never commits, branches, pushes, or pulls" (`docs/team-workflow.md`). The recommended convention is one change per branch and PR, archiving after merge (recommended) or inside the PR.
- **Multi-repo (beta "Stores"):**
  - A store is a standalone OpenSpec repo registered per machine (`openspec store setup|register|unregister|remove|list|doctor`).
  - Commands act in it with `--store <id>`.
  - A code repo can declare `references:` to stores. These are read-only and inject a spec index into instructions. It can also declare `store: <id>` to externalize all planning.
  - Other commands: `openspec context` (assembled working set, optional VS Code workspace file), `openspec doctor` (health), `openspec workset` (personal local multi-folder views opened in an editor or CLI agent).
  - "Recording a remote is not sync: OpenSpec never clones, pulls, or pushes" (`docs/cli.md` §Stores…§Personal worksets, `docs/stores-beta/user-guide.md`).
  - Beta caveats: format and JSON may change, one checkout per store id per machine, and snake_case vs camelCase JSON split (`docs/stores-beta/user-guide.md` §Known limitations).
- **Release and version handling for the user's product:** none. OpenSpec has no concept of product or spec versions or establishment. Absent (checked: `docs/concepts.md`, `docs/cli.md`). Its own releases use changesets (`.changeset/`, `CHANGELOG.md`).

## 10. Human interface

- **CLI and Markdown only for the user's project.**
  - `openspec view` is a terminal dashboard. It prints sections for Draft, Active (with per-schema artifact progress), Completed Changes, Specifications, and a Summary (`src/core/view.ts`, `docs/cli.md` §view). The README shows a dashboard screenshot (`assets/openspec_dashboard.png`).
  - `openspec status` shows an artifact checklist (`[x]`/`[ ]`/`[-] blocked`/`[~] skipped`).
  - `show --diff` shows colored diffs.
  - The `init` welcome screen is animated.
- **No web UI, graph or diagram viewer.** Absent (checked: `src/ui/`, `docs/cli.md`). Specs may contain Markdown or ASCII diagrams, as `design.md` examples do (`docs/concepts.md`). `website/` is the docs site (openspec.dev, a Next.js static export) and not a project viewer (`website/`, `CHANGELOG.md` §1.14.3 #2110).
- **Interactive prompts:** searchable multi-select at `init`, and `openspec config profile` wizard (`docs/cli.md`).

## 11. Extensibility

- **Custom schemas:**
  - Defined as YAML: an artifacts list with `id`, `generates` (glob allowed), `template`, `instruction`, `requires`, plus an `apply` block. They live in `openspec/schemas/<name>/` with templates.
  - Commands: `openspec schema init|fork|validate|which`, `openspec schemas`, `openspec templates`.
  - Resolution order: CLI flag → change `.openspec.yaml` → `config.yaml` → default.
  - Evidence: `docs/customization.md` §Custom Schemas, §Schema Resolution Order; `docs/cli.md` §Schema Commands.
- **Community schemas** are copied in by hand: intent-driven (ADRs), superpowers-bridge, nanopm (PRD pipeline), e2e-runbooks, anvil (adversarial review and TDD), ml-research (`docs/customization.md` §Community Schemas).
- **Project config:** `context`, per-artifact `rules`, `operations` guidance, `language` (`docs/customization.md`, `docs/multi-language.md`).
- **Profiles and delivery:** profiles choose which workflows to install (`core` or `custom`). Delivery is `skills`, `commands`, or `both` (`docs/cli.md` §config). Skills are also installable with `npx skills add Fission-AI/OpenSpec` (`skills/README.md`).
- **Generated files belong to OpenSpec:** "generated files are OpenSpec's to own — keep your own instructions elsewhere". `openspec update` overwrites drift (`docs/cli.md` §update). Custom commands therefore go through schemas and config, not through editing the generated skills.
- **Metadata extension:** `x-*` keys in `.openspec.yaml` (`docs-lab/reference/configuration/change-metadata.md`).
- **Workset openers** are configurable in the global `config.json` (`docs/cli.md` §Personal worksets).

## 12. Setup cost and ceremony

- **Install:** `npm install -g @fission-ai/openspec@latest` or `brew install openspec`. pnpm, yarn, bun and Nix are also supported. There is an AI-pasteable setup prompt. Requires Node ≥ 20.19.0. Issue #2055 asks for install without Node (`README.md` §Quick Start, `docs/installation.md`).
- **`openspec init`** creates `openspec/specs/`, `openspec/changes/` and `openspec/config.yaml`, plus per-tool skills and/or command files (e.g. `.claude/skills/openspec-*/SKILL.md`). The default is profile `core` with 6 workflows and delivery `both` (`docs/cli.md` §init). Telemetry is on by default with opt-out (`README.md` §Telemetry).
- **Minimum steps for one small change:** `/opsx:propose <name>` → read the plan → `/opsx:apply` → `/opsx:archive`. That is 3 agent commands and one human review (`docs/faq.md` §What's the simplest possible flow?).
- **Fast path for trivial changes:**
  - The docs say ceremony "may not pay off" for one-line fixes, and to skip OpenSpec there (`docs/overview.md`, `docs/faq.md` §Do I have to use it for everything?).
  - `skip_specs: true` covers refactors, tooling and docs.
  - `design.md` is optional.
  - A custom "rapid" schema example skips specs and design (`docs/customization.md` §Rapid Iteration Workflow).
- **Upgrades:** run `openspec update` per project to regenerate skills (`docs/cli.md` §update).

## 13. Agent context efficiency

- **Scoped CLI reads:**
  - `openspec show <spec> --json --no-scenarios` and `--requirements` / `-r <n>` return only parts of a spec.
  - The propose instruction says to use the filtered read "without pulling whole spec files into context", then read only relevant specs in full.
  - `show --deltas-only` exists for changes.
  - Evidence: `docs/cli.md` §show, `schemas/spec-driven/schema.yaml`.
- **Instructions on demand:** `openspec instructions <artifact> --json` returns the template, project context, artifact rules and dependency info for one artifact at a time. `instructions apply` returns `contextFiles` (the concrete files to read) and task status with source line numbers (`docs/cli.md` §instructions, `skills/openspec-apply-change/SKILL.md` steps 3–4).
- **Store references:** these inject an index only (spec id, one-line Purpose, fetch command). "Spec content is never copied into the output" (`docs/cli.md` §Referencing stores).
- **Design guidance against duplication:** "Reference the proposal for motivation instead of restating it" (`schemas/spec-driven/schema.yaml` design instruction).
- **Size limits:** `context` max 50 KB. Delta and requirement length warnings exist (`docs/migration-guide.md` §config.yaml Structure, `src/core/validation/constants.ts`).
- **Hygiene advice:** "Clear your context before starting implementation". The docs recommend high-reasoning models (`README.md` §Usage Notes).
- **Known cost:** MODIFIED deltas copy whole requirement blocks ("duplicate large portions of existing specs", `openspec/changes/spec-diffs/proposal.md` §Why).
- **No token-cost measurement.** Startup-time work is recorded in issue #2026 and `CHANGELOG.md` §1.14.2 #2064. Absent for token cost (checked: `docs/`, `CHANGELOG.md`).

## 14. Known limitations

- **Gates are not enforced.** "Nothing locks"; "because nothing forces you forward, it's on you to keep a change focused" (`docs/overview.md`). Config context and guidance are "not enforceable CLI checks" (`docs/cli.md` §instructions). The anvil schema notes that "OpenSpec only checks that artifacts exist, so enforce the gate with your own CI or hook" (`docs/customization.md`).
- **Ceremony for tiny fixes** may not pay off (`docs/overview.md`, `docs/faq.md`).
- **Back-filled specs go stale** "because nothing forces them to track reality" (`docs/existing-projects.md` §A few honest cautions).
- **One owner per change.** Simultaneous edits conflict like files. The same requirement modified by two changes conflicts at archive (`docs/team-workflow.md`).
- **Stores beta caveats:** shape may change, no sync, per-machine registry, JSON casing split (`docs/stores-beta/user-guide.md` §Known limitations, `docs/agent-contract.md` §Known inconsistencies).
- **Formatting pitfall:** scenarios with 3 hashtags "will fail silently". MODIFIED with partial content "loses detail at archive time" (`schemas/spec-driven/schema.yaml`).
- **Generated skills and commands are overwritten on update** (`docs/cli.md` §update).
- **Deprecated surface:** the noun-form `openspec change …` commands still exist (`src/cli/index.ts` l.490–497).
- **Open issue themes** from 130 open issues (page 1, 2026-10-19, https://github.com/Fission-AI/OpenSpec/issues):
  - Validation fidelity: #2119 BOM, #2078 scenario without steps, #2098 verify near-equivalent heading, #2069 configurable limits.
  - Skills not auto-triggering: #2043.
  - Workflow handoff consistency: #2058, #2057.
  - Agents approving without checking purpose: #2032.
  - Deterministic vs semantic merge: #2033.
  - Linkable anchors and IDs: #2056, #2105.
  - Metadata in headers: #2036.
  - Non-markdown spec artifacts: #2115.
  - Skills-only and command deprecation: #2022.
  - Install without Node: #2055.
  - Update dry-run: #2088.
  - Store discovery and library layout: #2076, #2011, #2008.
  - Archive `--yes` skipping the incomplete-task stop: #2006.

## 15. Assessment

*(Opinions are limited to this section.)*

**Strengths**

1. **Brownfield delta model with deterministic merge.** The ADDED/MODIFIED/REMOVED/RENAMED requirement deltas fold into one living spec per capability, with rollback-safe archive and validation against main specs (§3, §4). This keeps current truth explicit without per-feature snapshots.
2. **Low ceremony and broad reach.** A three-command default loop, optional design, `skip_specs`, and generation for about 50 agent targets from one CLI (§0, §2, §12).
3. **Strong agent/CLI contract.** JSON `status` and `instructions`, a documented agent contract with exit codes and diagnostic codes, and scoped reads (`--no-scenarios`, index-only store references) make agent behavior state-driven and context-economical (§7, §13).
4. **Schema-based extensibility.** Artifact graphs are defined in YAML and resolved per change, and a growing community schema catalogue adds ADRs, PRDs, TDD, review and ML flows (§11).
5. **Structural validation suitable for CI.** `validate --strict --json`, `--archived` task completion checks, and length and format rules (§8).
6. **Active, high-adoption project.** Weekly releases, 72k stars, and the tool dogfoods itself with 30 active and 85 archived changes in `openspec/changes` (§0).

**Weaknesses**

1. **Approval and review are convention only.** No approval record, no enforced gate before apply, and verify does not block archive. Issues #2032 and #2006 show the effects (§2, §8, §14).
2. **Thin traceability.** Requirements are keyed by header name only. Tasks do not reference requirements. Code-to-reason relies on Git and archive history. Stable anchors are still an open request (#2056) (§5).
3. **No impact or staleness analysis.** Dependencies between changes and specs (`dependsOn`, overlap warnings, graph) exist only as an unimplemented proposal. Bulk-archive conflict handling is agent judgment (§6).
4. **Two merge paths.** CLI deterministic archive and agent "intelligent" sync/archive can diverge. This is itself an open design question (#2033) (§4).
5. **No roles, multi-agent orchestration, worktree or PR automation.** OpenSpec deliberately never touches Git. Multi-repo support is beta and manual-sync (§7, §9).
6. **No product versioning or visual layer.** Specs have no version or establishment concept, and the only UI is a terminal dashboard (§9, §10).
