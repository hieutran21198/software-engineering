# Capability survey: Artifact-Driven Development (ADD) 2.8.1 and Artifact Plane 1.19.0

Source: this repository at commit `d931d07667d6f1c30ec552fb48c58c52f3374e07` (branch `main`, committed 2026-10-18 17:32 +0700). Paths below are repository-relative; `path:N` or `path:N-M` gives line numbers at that commit. Nothing was run in the worktree (no `node_modules`; read-only). Test claims are therefore "tests exist", not "tests pass".

Two subjects are kept apart throughout:

- **ADD (the method)**: Markdown guidance plus six agent skills in `docs/artifact-driven/` (46 files: 40 Markdown, 6 `agents/openai.yaml`; about 37,500 words). It is shipped to other projects by the Go CLI `se-adopt`.
- **Artifact Plane (the tool)**: a local Node 24 web app and MCP server in `apps/artifact-plane/` (about 19,700 lines of JS/JSX including tests). It reads and writes ADD records. `se-adopt` does not ship it.

---

## 0. Identity

| Item | ADD | Artifact Plane |
| --- | --- | --- |
| Name | Artifact-Driven Development | Artifact Plane |
| Version | 2.8.1 (`docs/artifacts/artifact-driven/README.md:2`) | 1.19.0 (`apps/artifact-plane/package.json:3`, `docs/artifacts/artifact-plane/README.md:2`) |
| Repository | Remote `git@github.com:hieutran21198/software-engineering.git` (`git remote -v`). The caller describes the project as unpublished/personal. I did not check whether the GitHub repository is public. | Same repository, `apps/artifact-plane/` |
| Commit | d931d07 | d931d07 |
| Release date | Version 2.8.1 was merged 2026-10-18 (PR #38, commit d931d07). No tag exists for it. Local tags `v1.0.0`, `v1.1.0`, `v1.1.1` (2026-10-12) and `v2.0.0` (2026-10-14) are `se-adopt` binary releases. Their numbers do not follow ADD's own version numbers. No local tag holds a binary with the 2.8.1 bundle. | Merged 2026-10-18. `"private": true` (`package.json:4`). Not published to npm. Run it from a source checkout. |
| License | **None.** The repository has no LICENSE file (checked the root and `git ls-files`). | Same. No `license` field in `package.json`. |
| Activity | 42 commits from 2026-10-12 to 2026-10-18, about 7 days. One human author under two names: "Trần Minh Hiếu (Cirius)" (38 commits) and "Minh Hieu Tran" (4). Commit trailers name AI co-authors: Claude Opus 5.5 (59), Claude Fable 5.1 (5), Claude (3). Most commits are squash merges of PRs #19–#38. Stars, forks and open issues: unknown (GitHub not queried). | Same history. 20 version records, 1.5.0–1.19.0. |
| Supported agents/harnesses | Codex is configured: `.agents/skills/*` symlinks to the six skills, `.codex/agents/*.toml` holds four role profiles, `.codex/config.toml` enables agents, and every skill has an `agents/openai.yaml` file. The guidance names "Command Code, Codex, or Claude Code" as harnesses that the consumer AI configures itself (`06-guidelines/working-with-ai.md:7`). The repository has no `.claude/` directory and no `CLAUDE.md`, so Claude Code is not configured here. Harness-neutral entry point: `AGENTS.md` (31 lines). | Any MCP stdio client (`apps/artifact-plane/README.md:284-300`). The execution observer works with Codex only, through Codex lifecycle hooks checked with codex-cli 0.160.1 (`apps/artifact-plane/integration/README.md:1-12`). |

The repository also holds a second bundle, the Story-Driven Knowledge Framework (`src/archs/story-driven`, `docs/artifacts/story-driven`). It is outside the scope of this survey.

## 1. Purpose and target user

**ADD.** The stated problem: as projects grow, "tasks, tickets, documents, conversations, and code can become inconsistent". The results are fragmented knowledge, conflicting versions, wrong progress reports, unclear dependencies, missing decision history and validation that misses requirements. Humans and AI agents "repeat investigations, make conflicting assumptions, lose context, and implement incompatible contracts" (`docs/artifact-driven/01-foundation/README.md:5-11`). ADD supplies "a common knowledge baseline" of versioned artifacts, one per business or technical capability (`01-foundation/definitions.md:6`, `01-foundation/principles.md:13-17`).

- **Solo vs team.** The method is written for a team. It names PO, TL, implementer and coordinator roles, team PR review and multi-repository PRs (`02-methodology/workflow.md:5-15, 68-74`). It also lets one person "perform multiple roles" and offers a local-merge path for solo work when the user authorizes it (`06-guidelines/getting-started.md:40`, `03-execution/README.md:74`). All evidence of real use comes from a single human working with AI agents (see 0).
- **Greenfield vs brownfield.** The method supports both. A new artifact starts with `change-initial` and `current_version: null` (`06-guidelines/getting-started.md:13`). For existing artifacts, changes edit knowledge in place (`getting-started.md:15`). The repository itself migrated from an older "legacy snapshot-copy" layout (`01-foundation/artifact-model.md:145-165`). There is **no** procedure for reverse-engineering artifacts from an existing undocumented codebase. Adoption "does not invent domain artifacts" (`05-adoption/README.md:126`). The guidance does tell agents to investigate existing code, flows and tests before asking the user (`06-guidelines/working-with-ai.md:72-78`).

**Plane.** "Explore and author a local Artifact-Driven Development repository" (`apps/artifact-plane/README.md:3`). It also retrieves context for agents over MCP and can observe Codex runs (`docs/artifacts/artifact-plane/README.md:8-12`). Its target user is one person on a local machine: it binds to loopback and checks the request origin (`apps/artifact-plane/server/http.js:57-63`).

## 2. Workflow

**ADD phases** (`01-foundation/artifact-model.md:105-117`; `02-methodology/workflow.md:5-23`):

| # | Phase | Owner | Output | Gate |
| --- | --- | --- | --- | --- |
| 1 | Requirement | PO | `changes/change-<name>/README.md`, `requirements/*` edited in place | PO self-check and commit. No reviewer (`workflow.md:29`). |
| 2 | Specification | TL | `specifications/*`, ADRs in `decisions/` only when a choice has several options | TL self-check and commit |
| 3 | Plan | TL, in the same "frontier-model" session as Specification (`workflow.md:39`) | `tasks/README.md` (task list in front matter) and task files with `id`, `depends_on` and a DoD checklist | TL self-check and commit, then **explicit user approval of the plan** (`workflow.md:41`) |
| 4 | Implementation | Implementers, plus one coordinator for integration | Code, tests, evidence recorded in task files | Task DoD and integration validation (`02-methodology/validation.md:9-29`). Upstream artifacts must be *established* first. |
| 5 | Version | Coordinator prepares; the team reviews and merges | `versions/<v>/README.md` (`source_change` only), `current_version` updated in the artifact README, PR | **User confirms or overrides the suggested semver** (`validation.md:35`). **Team review and merge.** The version is "established" only when everything lands on `main`/`master` (`validation.md:39`). |

- **Commands.** ADD has no command system: "There is no command system or separate workflow state layer" (`03-execution/README.md:3`). The user prompts a coordinator skill in natural language. A template prompt is given in `06-guidelines/working-with-ai.md:37-50`. The coordinator interviews the user first (`03-execution/skills/add-coordinator/SKILL.md:18`).
- **Mandatory steps.** All five phases, a commit per phase on a dedicated branch, plan approval, and PR review and merge (`workflow.md:68-74`). Never commit to `main`/`master`. Without a remote, the agent must ask the user how to finish (`03-execution/README.md:74`). A new plan or "material change" needs approval again. Ordinary fixes inside the approved scope do not (`03-execution/README.md:14`).
- **Corrections** return to the phase that owns the problem (`workflow.md:57-66`).
- **Unit of work.** An outcome brief groups changes across artifacts (`06-guidelines/units-of-work.md`). The bundle calls it optional for legacy projects (`units-of-work.md:3`; `getting-started.md:19`). This repository's `AGENTS.md:19` requires one for every outcome.
- **Who approves.** "Approval: Not a file fact. Authorization comes from the user" (`01-foundation/artifact-model.md:93`). No structured record of approval exists. In practice, approval is noted in prose in plan files, for example "The owner approved it on 18 October 2026" (`docs/artifacts/artifact-plane/changes/change-navigation-hierarchy/tasks/README.md`, "Approval and prerequisites").

**Plane** adds a UI around this workflow but no new gates. The work page lists open changes "with their phase and next step" (`apps/artifact-plane/README.md:20`). Phases are inferred from `self_check` front matter, `evidence_records`, checklists and version records (`README.md:88`; `server/workflow.js:72-100`). Edit operations include `change.start`, `selfcheck.record`, `plan.selfcheck.record`, `version.prepare` and `publication.record` (`README.md:61`). The Plane can commit and create branches but "never pushes, fetches, merges…" and "Approval and publication happen outside the Plane" (`README.md:63`).

## 3. Artifact model

**ADD** (`01-foundation/artifact-model.md:5-61`):

```text
docs/artifacts/
├── units-of-work/<outcome>/README.md      unit brief (front matter: changes, affected_flows, acceptance, evidence)
└── <artifact>/
    ├── README.md                          identity record: current_version, depends_on
    ├── requirements/  specifications/  decisions/      working knowledge, edited in place
    ├── specifications/flows/<id>.md       system-flow records
    ├── changes/change-<name>/README.md    reason and scope (prose, no front matter)
    │   └── tasks/README.md, tasks/*.md    plan (task list) and tasks (id, depends_on, DoD, evidence)
    └── versions/<x.y.z>/README.md         version record: source_change only
```

- **Types.** Requirement, specification, ADR, system flow (a structured YAML journey with steps, transitions and "support" links to knowledge, code and tests, `06-guidelines/system-flows.md:9-53`), domain model, change record, plan, task, version record and unit brief. ADD has no separate "design" or "story" type. Requirements and acceptance criteria are free-form Markdown (example: `06-guidelines/minimal-change.md:68-84`).
- **Format.** Markdown with YAML front matter. "Readers interpret structural facts only from YAML front matter, never from prose" (`artifact-model.md:38`). Logical IDs: `<artifact>:<path>`, `<artifact>/<change>/<task id>`, `<artifact>@<version>`, `<artifact>:<flow>:<step>` (`artifact-model.md:63-78`). Requirement IDs such as `R1` and `UX13` are a writing convention in body text, not a schema.
- **Source of truth.** The artifact directory on `main`/`master` is established knowledge. The difference between a change branch and the protected branch is the proposal. Git is "the version store": a version snapshot is "the tree of the first-parent protected-branch commit that introduced `versions/<version>/README.md`" (`artifact-model.md:80-95`).
- **Versioning.** Each artifact has a living spec edited in place, with per-artifact semver. Each version names exactly one originating change (`artifact-model.md:61`, `133-143`). Until ADD 2.4.0 the model was a full snapshot copy per version and per change (legacy layout, `artifact-model.md:145-155`). Readers still support that layout, and a six-step migration is documented (`artifact-model.md:156-165`).

**Real use (repository knowledge):** 3 artifacts. `artifact-driven` has 12 version records, 11 changes and 14/21/13 requirement/specification/decision files. `artifact-plane` has 20 versions, 20 changes and 23/38/15. `story-driven` has 3 versions, 3 changes and 3/6/1. In total: **35 version records, 34 change directories, 24 unit-of-work briefs** (`ls docs/artifacts/units-of-work` → 24), 18 flow records, 526 Markdown files, 3.3 MB. Version records start at ADD 1.1.0 and Plane 1.5.0. Earlier history is described as converted legacy records (`docs/artifacts/artifact-plane/README.md:28`).

**Plane** reads both layouts and detects the layout per artifact (`apps/artifact-plane/README.md:69-113`). Its 37 domain operations write these files (`README.md:61`). It writes no state of its own into the repository: "Git stays the only store; the Plane keeps no workflow state, approval or index" (`README.md:48`).

## 4. Change on existing systems

**ADD.**
- **How a change is expressed.** Edit in place on a dedicated branch: "retain, amend, remove and add" (`artifact-model.md:99`; `01-foundation/principles.md:35-39`). No delta format exists. The proposal is the Git diff against `main`/`master` (`principles.md:29-33`).
- **Archival.** Delivered change directories (record and tasks with evidence) are kept "while any version or outcome references them" and never overwritten (`artifact-model.md:103`). The version record links to them through `source_change`. Nothing is merged into another file, because the knowledge is already in place.
- **Current truth.** Read the artifact's working tree on `main`. Nobody has to replay changes (`principles.md:51-55`). Each new change creates a fresh plan and copies no historical tasks (`02-methodology/validation.md:47`).
- **Defects after establishment** require a new change. Established records are never edited (`validation.md:43-47`).
- **Concurrency limit.** "One active change per artifact remains a rule; two branches that edit the same knowledge conflict at merge" (`artifact-model.md:103`; `principles.md:19-21`).

**Plane.** Labels each file New, Changed or Removed against `main` (`README.md:23, 88`). The change page has a review with inline line diffs and folded unchanged passages (`README.md:320-321`). It shows delivered changes read-only under **Show history**, inspecting at most 200 commits per worktree (`README.md:202-205`). `scripts/migrate-layout.mjs` automates the legacy-to-in-place migration and the history conversion (`README.md:207-218`).

## 5. Traceability

**ADD.**
- **Requirement → specification.** A convention: specifications "reference governing requirements" in prose (`06-guidelines/writing-artifacts.md:30`). Within one artifact no structured requirement→spec link exists. Across artifacts, `references:` front matter names an artifact, an element and a `requires` reason (`02-methodology/dependencies.md:14-27`).
- **Specification → task.** Each task lists "governing references" in its body (`writing-artifacts.md:55`). The task DAG is structured (`tasks` list plus `id`/`depends_on`, `writing-artifacts.md:59-94`). The task→requirement link is prose.
- **Task → code/test.** Evidence sections record commands, results and code/test paths in prose. Optional `evidence_records` add `method`/`result`/`source` (`06-guidelines/evidence-records.md:7-22`).
- **Version → change → evidence.** Structured through `source_change` (`artifact-model.md:53-61`).
- **Code → reason.** No IDs in code. The repository's Plane source has no requirement IDs (grep for `R[0-9]+`/`UX[0-9]+` in `apps/artifact-plane/server`, `src`: no hits). The reverse path is flow `support` records (`kind: implementation|test`, `path`, optional `symbol`, basis `documented|static|observed|inferred`; `06-guidelines/system-flows.md:13-19`), plus Git history.
- **Unit → evidence.** Each acceptance criterion links to evidence entries with `source` paths (`units-of-work.md:56-76`).

**Plane.** Gives the code→reason path tool support. The impact service starts from a file path or symbol and walks flow supports, element references and derived import edges up to flows, steps and knowledge elements (`apps/artifact-plane/README.md:272-281`). The flow page shows step supports grouped as knowledge, code and tests, and opens source excerpts (`README.md:248`). Coverage is limited to code that is linked through flow records, plus JS/JSX/Go import analysis (see 6).

## 6. Impact analysis

**ADD (method).** Impact analysis is a required manual activity "throughout Requirement and Specification" (`artifact-model.md:117`; `definitions.md:33`; `dependencies.md:66-70`). The method defines five reporting tiers (changed, direct, transitive, potential, unresolved) and requires a coverage statement (`06-guidelines/change-impact.md:9-21`). It says how each phase uses the answer (`change-impact.md:23-29`). The guide assumes "a reader such as Artifact Plane" computes the answer (`change-impact.md:3`). Without the Plane, the agent does it by reading files. Other staleness rules: embedded diagrams must be marked stale when their source changes (`01-foundation/visual-knowledge.md:15`). Earlier evidence "does not automatically validate changed behavior" (`principles.md:39`). Upstream contracts must be rechecked before dependent implementation (`dependencies.md:41-46`).

**Plane (tool).** `POST /api/impact/query` and the MCP tool `get_change_impact` (`apps/artifact-plane/README.md:270-282`):
- Origins: path (optionally symbols or commit), element, flow, step, model, commit, range, or branch diff against the protected branch. Depth 1–4 (default 2).
- Relationship sources: declared knowledge (references, flow supports, artifact edges), static imports with named symbols, Go packages and `go:embed`, identical-content copies, co-change history (last 500 commits) and shared "vocabulary" (`server/impact-index.js:1-3, 20`).
- **Language limit:** source files are only `.js`, `.mjs`, `.jsx` and `.go` (`server/impact-index.js:21`). Other languages get only declared and history-based relationships.
- Output: tiers with typed paths and edge evidence, a "verify" list (tests) and an "investigate" list, plus a coverage statement. Documented non-coverage: "runtime calls, functions passed as parameters, HTTP or process boundaries, or semantic similarity" (`docs/artifact-driven/06-guidelines/change-impact.md:35-37`).
- It compares the result with the unit's declared `affected_flows` (`README.md:277`).
- The index is a disposable SQLite file outside the repository (`README.md:281`).
- The change review and context packet embed impact tiers (`README.md:314`).

## 7. Roles and agents

**ADD.** Four role skills (`03-execution/README.md:24-33`):
- **coordinator:** interview, pipeline, approval, gates, integration and PRs.
- **product owner:** requirements.
- **technical lead:** specification and plan in one session.
- **implementer:** tasks and evidence.

All roles must also load two required skills: `kiss` (simplicity) and `asd-ste-100` (Simplified Technical English writing) (`03-execution/README.md:16-22`).

- Roles can share one session. "A role profile does not require a separate agent run" (`working-with-ai.md:21`).
- Multi-agent use applies to implementation only. The coordinator creates agents for independent approved tasks, each "in a separate Git worktree on a dedicated branch". Knowledge-file edits stay with the coordinator (`03-execution/README.md:56-60`; `add-coordinator/SKILL.md:46-48`).
- Agent review is explicitly excluded: "No mandatory extra agent review" (`validation.md:7`), and "do not require frontier-model review of every task" (`validation.md:15`).
- Handoff format: "an ordinary handoff message and existing files; do not create a recovery ledger" (`add-coordinator/SKILL.md:60`). Implementers return commits and evidence (`add-implementer/SKILL.md:30`).
- Harness wiring in this repository: `.codex/agents/*.toml` (four profiles that point to the canonical skills) and `.agents/skills/*` symlinks.

**Plane.** Has no agent personas. It is a tool that agents and humans use:
- **MCP read tools:** `search_flows`, `get_flow`, `get_impact_context`, `read_flow_source`, `get_change_impact`, `get_change_review`, `get_change_context`, `read_change_context_source`.
- **MCP write tools**, only when started with `--allow-writes`: `preview_knowledge_operation` and `apply_knowledge_operation` (`README.md:67, 300`; `server/flow-mcp.js:27-64`).
- **Codex observer:** an optional hook that records sessions and subagents bound to tasks through a CLI. "The observer does not launch agents, approve tasks, or establish versions" (`README.md:230-232`; `integration/README.md`).

## 8. Quality controls

**ADD (method).**
- **Phase self-checks** by the phase owner before each commit (`validation.md:3-7`). They include KISS and STE checks (`03-execution/README.md:22`) and checks of each changed table or diagram (`06-guidelines/visual-representations.md:140`). They can be recorded as `self_check: {result, source}` (`evidence-records.md:22`).
- **Task DoD checklists** with recorded evidence. "A checked box alone does not establish that the implementation satisfies the criterion" (`validation.md:9-15`).
- **Integration validation** by the coordinator (`validation.md:19-29`).
- **Unit completion** needs at least one `passed` evidence entry and no `failed`/`incomplete` entry for every criterion. It also needs every member version established on `main`, with retained task bytes matching (`units-of-work.md:56-82`).
- **Task-graph validation rules** in detail: membership, unique IDs, prerequisite resolution, acyclicity (`writing-artifacts.md:90-94`). The bundle states: "**No standalone runner or CLI validator is required**: authors and coordinators apply these rules in existing phase self-checks" (`writing-artifacts.md:94`). Without the Plane, all checks are performed by an agent or human reading the rules.
- **No constitution file.** Principles are in `01-foundation/principles.md`. Testing is a practice, not a gate: "Prefer executable tests and contract checks for repeatable criteria" (`validation.md:15`). TDD is an optional pattern (`04-patterns/README.md:18`).
- **Pattern library:** strategic/tactical DDD, contract-driven, BDD, event-driven, TDD, ports and adapters, CI, policy as code (`04-patterns/README.md:7-19`).

**Plane (tool).**
- `scripts/validate-knowledge.mjs` prints scanner, snapshot, task, unit and flow diagnostics as JSON and exits 1 on errors (`apps/artifact-plane/README.md:207-218`).
- Every edit operation is validated by the same readers. An operation that adds an error diagnostic is refused with HTTP 422 (`README.md:48, 56`).
- Diagnostics appear in the UI.
- The Plane's own tests: 46 `node --test` files and 14 Playwright specs (`apps/artifact-plane/test/`), run in CI (`.github/workflows/ci.yml`, job `artifact-plane`).
- `se-adopt` has Go tests. `TestCanonicalBundleFidelity` checks that `docs/artifact-driven` equals the embedded bundle (`src/archs/artifact-driven/bundle_test.go:130-131`).

Recorded limit of automated checks: Plane 1.16.0 passed its tests, and its owner then found the merged UI "unusable" (`docs/artifacts/artifact-plane/changes/change-workbench-redesign/README.md:5`; `decisions/015-rebuild-workbench-pages.md:5`). Later units added owner screenshot acceptance as a criterion (e.g. `docs/artifacts/units-of-work/navigation-hierarchy/README.md`, criterion `owner-acceptance`).

## 9. Parallel, team and multi-repo

**ADD.**
- **Concurrency.** One active change per artifact. Independent artifacts run in parallel under the artifact DAG (`principles.md:19-21`). Within a change, tasks run in parallel as their `depends_on` allows (`dependencies.md:48-56`).
- **Conflicts.** Two branches that edit the same knowledge "conflict at merge" (`artifact-model.md:103`). No other mechanism exists.
- **Cross-artifact gates.** Dependent implementation waits until the upstream version is *established* (merged). Requirement, Specification and Plan can prepare against proposed upstream contracts (`dependencies.md:35-47`).
- **Worktrees.** One per parallel implementer. The coordinator integrates (`03-execution/README.md:56-60`).
- **Multi-repo.** Separate knowledge and implementation repositories are supported, with "one PR per changed repository" and cross-linked companion PRs. A version stays unestablished until every required PR lands (`03-execution/README.md:49-53, 70-76`). Optional `publication_reviews` record the required PR URLs (`evidence-records.md:55-72`).
- **Release handling.** Per-artifact semver in version records. Optional Git tags `<artifact>/<version>` (`artifact-model.md:90`). This repository has none. Its `v*` tags are `se-adopt` binary releases.

**Plane.**
- Lists registered Git worktrees and switches between them (`README.md:22, 203`).
- Opens several repositories as tabs (`README.md:34-42`).
- Shows proposed dependency edges dashed in green/red (`README.md:25`).
- Unit pages check completion against local `main`/`master`. It "does not scan arbitrary external repositories". Code in other repositories is reported as unverified unless review evidence exists (`docs/artifact-driven/06-guidelines/units-of-work.md:82`).
- It reads only local refs and does not fetch (`README.md:63`; `evidence-records.md:70`).
- It recognizes only the protected branch names `main` and `master` (`README.md:53`).

## 10. Human interface

**ADD (method).** Markdown and YAML only. The method includes a research-based guide for tables and Mermaid diagrams (`01-foundation/visual-knowledge.md`, 14 cited findings; `06-guidelines/visual-representations.md`; 9 worked examples in `06-guidelines/visual-examples.md`). Each diagram needs a text alternative, a source line and a count check against its sources. A Docusaurus site renders the bundle with Mermaid (`README.md`, "Documentation Website"). It shows the method, not project artifacts.

**Plane (tool).** A local React 19 single-page app on `http://127.0.0.1:4310` (`apps/artifact-plane/README.md:5-17`):
- **Pages:** work, artifact, document, change, unit, flow, source, Discover behavior, Recorded executions. A sidebar tree shows current work and artifacts, with New/Changed/Removed against `main`. Keyboard navigation is supported, and the sidebar becomes a drawer at ≤800 px (`README.md:19-24`).
- **Graphs**, opened on request (React Flow and dagre): artifact dependencies with proposed edges, the task DAG, unit members, flow steps (`README.md:25, 29-32`).
- **Mermaid:** fenced blocks render with bundled Mermaid 11.17.2 at `securityLevel: 'strict'`, with DOMPurify-sanitized SVG. Blocks that are invalid, use directives, or exceed 50,000 characters fall back to code (`README.md:26`; `src/diagram-render.js:5-14`).
- **Authoring in place:** edit documents (Ctrl+S), DoD checkboxes, evidence, self-checks, prepare version, units, flow steps. Undo covers the last 50 operations per worktree, in memory. Writes use optimistic concurrency with SHA-256 digests (409 on conflict). Writes are refused on `main`/`master`/detached HEAD (`README.md:44-59`).
- **Git:** status, create branch, commit (selected `docs/artifacts` paths only), discard (`README.md:63`).
- **Live reload:** the server samples knowledge bytes, refs and status, then waits 2 s before the next sample. Updates go out over SSE (`/api/repository/events`). Open pages update and unsaved editor text is kept (`README.md:27, 234-240`; `server/repository-events.js:172`; `server/http.js:65`). Measured cost: about 4.4 s per scan on a 10-worktree corpus of about 100,000 files (`README.md:240`).
- **Search:** the sidebar filters by title and ID only (`README.md:23`). "Discover behavior" searches **flows** with exact IDs, SQLite FTS5 and an optional local embedding model (MiniLM, CPU, cosine cutoff 0.5) (`README.md:252`; `server/flow-index.js:1, 24, 279`). There is no full-text search across all knowledge documents outside flows (not found in README or `src/SearchField.jsx` usage).
- **Change review:** line diff and context export as Markdown/JSON (`README.md:320-321`).
- **Codex execution view:** live attempts on task nodes, recorded history (`README.md:230-232`).

## 11. Extensibility

**ADD.**
- **Templates.** No template directory. The copyable minimal scaffold (`06-guidelines/minimal-change.md:19-153`) and examples inside guidelines serve as templates.
- **Patterns.** New patterns follow a documented outline (`04-patterns/README.md:34-36`).
- **Domain adaptation.** Artifacts can be business or technical capabilities (`definitions.md:35`). Flows, models and the pattern library are generic.
- **Other architectures.** `se-adopt` has an architecture catalog. Adding one means writing Go and rebuilding (`src/archs/catalog.go`; root `README.md`, "Adding an Architecture"). Story-Driven is the second entry.
- **Configuration.** None. The method has no config file. Harness registration is left to "native harness capabilities" (`working-with-ai.md:21`).
- **Upgrades.** No automatic upgrade. A re-adopt with local edits lists conflicts and stops (`05-adoption/README.md:128-138`).

**Plane.**
- **Configuration:** `PORT` and `ARTIFACT_PLANE_STATE_DIR` environment variables, MCP flags `--repository`, `--state-dir`, `--allow-writes` (`README.md:15, 262, 300`).
- **Programmatic surfaces:** HTTP API and MCP.
- **Fixed assumptions:** the ADD layout under `docs/artifacts`, `main`/`master` as protected branches, impact parsing for JS and Go only. No plugin mechanism (absent; checked README and `server/`).

## 12. Setup cost and ceremony

**Install, method only (`docs/artifact-driven/05-adoption/README.md:5-158`):**

1. Download the platform binary and `SHA256SUMS`, then verify the checksum (scripted).
2. Run `se-adopt --project <ws> --dry-run`, then adopt.
3. Re-run the dry run to confirm "0 new files".
4. Configure the harness to load the 4 role skills and the 2 required skills (manual or agent-driven; `se-adopt` "does not register them in an agent tool or modify consumer `AGENTS.md` or `CLAUDE.md`", `05-adoption/README.md:126`).
5. Add ADD instructions to `AGENTS.md`/`CLAUDE.md`.
6. Commit setup on a branch and PR it.

Files created at init: **46** (the `docs/artifact-driven` bundle). No project artifacts are created. Caveat: the newest local release tag is `v2.0.0` (2026-10-14), so a release binary may embed a bundle older than 2.8.1. The guide warns that "The bundle in a release can be older than `main`" (`05-adoption/README.md:20`).

**Install, Plane (`apps/artifact-plane/README.md:5-17`).** Node ≥ 24, Git, source checkout, `npm ci`, `npm run build`, `npm start`. Dependencies include `@huggingface/transformers` and `onnxruntime` (`package.json`). Optional steps: `npm run flow:model-install` (downloads the embedding model), MCP client registration, Codex hooks. The consumer repository must keep artifacts at `docs/artifacts`.

**Minimum to deliver one small change (existing in-place artifact, no upstream dependency, remote present).** Counted from `06-guidelines/minimal-change.md:9-17`, `02-methodology/workflow.md:17-23, 68-74` and `03-execution/README.md:5-12`.

Knowledge files:

| # | File | New/edit |
| --- | --- | --- |
| 1 | `docs/artifacts/units-of-work/<unit>/README.md` (brief with front matter: changes, affected_flows, flow_assessment, acceptance, evidence) | new. Bundle: optional (`units-of-work.md:3`). This repo: mandatory (`AGENTS.md:19`). |
| 2 | `<artifact>/changes/change-<name>/README.md` (reason and scope) | new |
| 3 | `<artifact>/requirements/<x>.md` (with self-check) | new or edit |
| 4 | `<artifact>/specifications/<x>.md` (with self-check) | new or edit |
| 5 | `<artifact>/changes/change-<name>/tasks/README.md` (task list, plan self-check, approval note) | new |
| 6 | `<artifact>/changes/change-<name>/tasks/01-<task>.md` (id, depends_on, DoD, evidence) | new |
| 7 | `<artifact>/versions/<x.y.z>/README.md` (`source_change`, compatibility reason) | new |
| 8 | `<artifact>/README.md` (`current_version` bump) | edit |

That is 6 to 8 knowledge files besides code and tests. The bundle's scaffold names 6 as "the minimum example" (`minimal-change.md:17`). The version record and identity edit add 2 more. An ADR is needed only for a real choice between options. Flow records are updated if the change affects a journey.

Steps and gates:

1. Create a branch.
2. Coordinator interview.
3. Requirement, self-check, **commit 1**.
4. Specification, self-check, **commit 2**.
5. Plan, self-check, **commit 3**.
6. **Gate A:** present the plan and wait for explicit user approval.
7. Implement, run the DoD checks, record evidence in the task (**commit 4+**).
8. Integration validation. Record unit evidence.
9. **Gate B:** suggest semver; the user confirms.
10. Add the version record and identity edit (**commit 5**).
11. Push and open the PR.
12. **Gate C:** team review and merge. Establishment.

That makes **at least 5 commits, 3 human decision points and 1 PR**. Without a remote, gate C becomes "ask the user how to finish".

Observed cost in this repository:
- **Plane 1.17.1**, sidebar indentation (commit `126990d`): code was `styles.css` (16 changed lines) and one browser test (+29). Knowledge was **9 files, about 246 lines**: unit brief 60, change README 13, plan 20, 2 tasks 78, requirement 52, spec edit 14, version 9, README 2.
- **Plane 1.18.1**, bug fix (commit `3c317fd`): 6 code/test files (about 57 added lines) and **13 knowledge files, about 313 lines**.
- **PR #38** (`d931d07`): about 3,049 added knowledge lines vs about 1,250 other lines, of which about 940 are `package-lock.json`.

**Fast path for trivial changes.** None that skips phases. The "minimal change scaffold" is the small-change path. It keeps "phase commits, plan approval and upstream establishment" (`add-coordinator/SKILL.md:74-76`; `minimal-change.md:9-15`). No typo or trivial-fix exemption is documented (absent; checked `workflow.md`, `getting-started.md`, `minimal-change.md`, `03-execution/README.md`). Two reductions exist: ADRs are optional, and the method rules out extra review agents (`validation.md:7, 15`).

**Plane's effect on ceremony.** It does not remove steps. It automates file creation and path derivation (for example `change.start`, `task.add`, `version.prepare`), validates records on write, and shows the inferred phase. Version records are "created once and never changed" (`README.md:54`).

## 13. Agent context efficiency

**ADD.**
- **Skill sizes.** The six skills total about 5,500 words. They point to guidance totalling about 13,000 words (artifact model, methodology, writing, units, flows, visuals, evidence). The whole bundle is about 37,500 words, measured with `wc -w`. Roles are told "Load only relevant guidance" (`add-technical-lead/SKILL.md:24`) and "Read only the relevant pattern" (`04-patterns/README.md:23`).
- **Session reuse.** Skills are read once per session and reloaded only after context loss or a source change. "A summary or a path alone does not meet this condition" (`03-execution/README.md:35`; `working-with-ai.md:25-33`).
- **Scoped knowledge.** One artifact per bounded context. Current knowledge is read in place, with no replay of changes (`principles.md:51-53`). Resume is a short checklist: repository, worktree, change, revision, task, sources (`add-coordinator/SKILL.md:60`).
- **Counter-pressure.** Knowledge files are verbose (see 12 counts). The required-skill rule makes every role load `kiss` and `asd-ste-100` as well.
- **Measurement.** A unit named `add-agent-efficiency` exists (`docs/artifacts/units-of-work/add-agent-efficiency/`). No token-cost measurement of the method was found: grep for "token" in that unit brief returned no hits.

**Plane.**
- **Budgeted context packets:** `get_change_context` (default 20 records, 12,000 excerpt characters, cursors for paging, freshness and omission metadata). "The character budget does not cap the full response or token count" (`apps/artifact-plane/README.md:304-318`).
- **Other budgets:** impact answers have `limit`/`budget` and a compact text form (`README.md:277-279`). Flow queries have `budget` (`README.md:264`).
- **Benchmarks** (`scripts/benchmark-flows.mjs`, `layout-benchmark.mjs`) report response bytes and latency, but "These measurements do not estimate hidden reasoning or token savings" (`README.md:302`).

## 14. Known limitations (documented)

**ADD.**
- **No validator in the method.** Rules are applied in self-checks. "No standalone runner or CLI validator is required" (`writing-artifacts.md:94`). Enforcement depends on the agent's or human's diligence, or on the separate Plane script.
- **Approval is not recorded** as a structured fact (`artifact-model.md:93`). Tools cannot verify it. The Plane states "Approval is not verified" (`apps/artifact-plane/README.md:318`).
- **One active change per artifact.** Concurrent edits conflict at merge (`artifact-model.md:103`).
- **Impact limits:** "A reported path proves a relationship, not a failure; a missing path proves nothing" (`change-impact.md:35-37`). Flow maps may be incomplete; "absence from the map" is not absence from the system (`working-with-ai.md:74`).
- **Evidence is author-asserted:** "readers label it documented evidence, not independently verified test success" (`units-of-work.md:76`; `evidence-records.md:5`).
- **Visual guidance** is partly hypothesis: "recommendations, because they are design hypotheses with partial evidence" (`visual-knowledge.md:18, 43`).
- **Adoption** has no automatic upgrade or forced overwrite. Conflicts are reconciled by hand (`05-adoption/README.md:138`). Release binaries can lag the source (`05-adoption/README.md:20`).
- **Legacy layout** support and migration add rules that readers must still handle (`artifact-model.md:145-165`).

**Plane.**
- Local, single-machine use. The server is loopback-only (`server/http.js:57-63`). No auth or multi-user mode (absent; checked README).
- Polling costs I/O and CPU on large repositories (`README.md:240`).
- Code impact covers JS/JSX/Go only (`server/impact-index.js:21`). No runtime, HTTP or process-boundary analysis (`change-impact.md:37`).
- History limited to 200 commits per worktree for change history (`README.md:205`) and 500 for co-change (`server/impact-index.js:20`).
- Undo journal is in memory and lost on restart (`README.md:59`).
- Observer works with Codex only. It reports "Unknown" after 10 minutes without hook activity and has no heartbeat (`integration/README.md`, "Read the graph and history").
- Recorded checks are "not independently run" (`README.md:318`).
- **Documentation drift at d931d07.** `apps/artifact-plane/README.md:224` says "New versions also declare delivery_tasks: change". ADD 2.8.1 says new version records must not write `delivery_tasks` (`docs/artifact-driven/01-foundation/artifact-model.md:61`; `06-guidelines/units-of-work.md:54`).
- **Usability history.** Version 1.16.0 passed its tests and was found unusable by its owner, so 1.17.0 replaced it (`docs/artifacts/artifact-plane/changes/change-workbench-redesign/README.md:5`).

**Open issues / FAQ:** unknown (GitHub issues not queried; no FAQ file found in `docs/artifact-driven` or `apps/artifact-plane`).

## 15. Assessment

**Strengths**

1. **Living, in-place specs with Git as the only store.** Current knowledge is read directly on `main`. Versions are Git commits named by a one-line record, and proposed vs established state is derived from branches rather than duplicated (§3, §4; `artifact-model.md:80-103`). This avoids both replaying per-feature deltas and maintaining a second state database.
2. **Unusually explicit epistemics about evidence.** Checked boxes, recorded results, merged PRs and approval are kept as distinct facts. Gaps are reported as "unknown", not "absent", in the method and in the tool (§8, §14; `validation.md:13`, `units-of-work.md:76-82`, `change-impact.md:21`).
3. **Cross-artifact and multi-repo coordination is designed in.** Artifact DAG gates on *established* upstream versions, element references carry a `requires` reason, unit briefs carry shared acceptance criteria, and companion PRs are cross-linked (§9). Few spec-driven methods address dependent capabilities at this level.
4. **Real tool support for impact and retrieval (Plane).** Tiered, explained impact with coverage statements over declared knowledge plus JS/Go imports and co-change. Budgeted MCP context packets. Safe, validated authoring operations with digest-based conflict detection (§6, §10, §13).
5. **Sustained real use.** 35 version records, 34 changes and 24 units of work in about a week, each with retained plans and evidence that can be inspected (§3). This is a lot of dogfooding, though by a single author (see weakness 5).

**Weaknesses**

1. **High ceremony for small changes, with no fast path.** At least 5 commits, 3 human decision points, 6 to 8 knowledge files and a PR for any change. Measured: a 16-line CSS change produced about 246 lines of knowledge in 9 files, and PR #38 added more than twice as many knowledge lines as code lines (§12).
2. **The method relies on agent discipline for validation.** The bundle has no validator ("No standalone runner… is required"). Approval leaves no structured record. Self-checks are done by the same actor that wrote the phase, with extra review explicitly excluded (§8, §14). The only automated validator is in the Plane, which `se-adopt` does not ship.
3. **The method is large and dense for agents and newcomers.** About 37,500 words in the bundle, with many interacting rules (legacy and in-place layouts, establishment, provenance, publication reviews, flow supports, evidence records). Every role must also load two writing and simplicity skills (§11, §13). No measurement shows that the context cost pays off (§13).
4. **Tooling is narrow and local.** The Plane needs a Node 24 source checkout, polls the file system, is loopback/single-user, analyses code imports only for JS/JSX/Go, and observes Codex only (§10, §14). Harness setup is described for Codex and left to the consumer for Claude Code and others (§0).
5. **Maturity and distribution risk.** One human author over about 7 days, with heavy AI co-authorship. No license. No released binary that clearly carries 2.8.1. Fast version churn (ADD 1.1.0 → 2.8.1, Plane 1.5.0 → 1.19.0) including a layout change from snapshot copy to in-place with migration rules. Documentation drift between Plane README and ADD at the same commit (§0, §14).
6. **Concurrency within one capability is serialized.** One active change per artifact, and same-knowledge edits conflict only at Git merge time (§9). With one-artifact-per-bounded-context sizing (`principles.md:15`), parallel feature work in the same context has to wait or be split.
