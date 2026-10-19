# ADD and Artifact Plane compared with Spec Kit, OpenSpec and BMAD: capability comparison

Status: research record, 19 October 2026. This file is an investigation, not a requirement, specification or decision. It changes no artifact. It is the input for a possible later unit of work. No change record exists for it yet, so this directory has no unit brief.

## Scope and method

**Question.** What can ADD with Artifact Plane do that Spec Kit, OpenSpec and BMAD cannot do, what can they do that ADD cannot do, and what does each approach cost?

**Tier.** This is tier 1: a capability comparison from current source and documentation. It measures no outcome. Tier 2, an empirical benchmark with the same tasks for each framework, is not done. Section F tells which tier-2 scenarios this comparison shows to be useful.

**Baseline.**

| Subject | Version | Commit | Date | License |
| --- | --- | --- | --- | --- |
| ADD | 2.8.1 | `d931d07` (this repository, `main`) | 2026-10-18 | none |
| Artifact Plane | 1.19.0 | `d931d07` | 2026-10-18 | none |
| GitHub Spec Kit | 1.2.1 (HEAD is `1.2.2.dev0`) | `c6a4c18` | 2026-10-16 | MIT |
| OpenSpec | 1.14.3 | `c794978` | 2026-10-17 | MIT |
| BMAD Method | V7 preview alpha on `main` (`6.13.0-next`); stable release 6.12.4 | `61e01f8` (V7), `bab9082` (6.12.4) | 2026-10-18 | MIT |

ADD 2.9.0 landed on `main` (`371e3ab`) after the surveys. It adds optional evidence-linked claim records (kind, status, basis, evidence, cheapest check) to requirements, specifications, decisions, plans, tasks and unit briefs. A claim status is evidence, never approval. This change makes no cell in section B different, so the record keeps 2.8.1 as its baseline.

For BMAD, this record describes the V7 preview, because the default branch and the documentation site ship it. The surveys tell where stable 6.12 is different.

**Method.**

1. One rubric with 16 dimensions (identity, purpose, workflow, artifact model, change on existing systems, traceability, impact analysis, roles, quality controls, parallel and multi-repository work, human interface, extensibility, ceremony, agent context, limits, assessment).
2. Four independent surveys, one for each subject. Each survey read a shallow clone of the default branch (or this repository) and the public documentation. No survey ran code from the clones. Each claim cites a file at the recorded commit or a URL. The surveys mark a gap as "absent (checked: …)" or "unknown (not found in …)".
3. A spot check of eleven claims that the conclusions depend on. All eleven matched the cited source.
4. This synthesis.

The full surveys are in [surveys/add-plane.md](surveys/add-plane.md), [surveys/spec-kit.md](surveys/spec-kit.md), [surveys/openspec.md](surveys/openspec.md) and [surveys/bmad.md](surveys/bmad.md). The section numbers in this record (for example "§6") refer to the rubric dimensions in those surveys.

**Bias control.** The owner of this repository wrote ADD and the Plane, so author bias is the main risk. The controls are: one fixed rubric before any survey, the same evidence rule for all four subjects, an ADD survey that had to report ceremony costs and weaknesses as plainly as strengths, and the spot check. These controls reduce the bias. They do not remove it. Section G lists the remaining limits.

## A. Positioning

| Subject | What it is | Main idea |
| --- | --- | --- |
| ADD + Plane | A method (46 Markdown and YAML files, about 37,500 words, 4 role skills and 2 required skills) and a local web app and MCP server (about 19,700 lines of JavaScript) | Versioned knowledge for each capability ("artifact"), edited in place on a branch. Git is the only store. A version is established only when it lands on the protected branch. Dependent work waits for established upstream versions. |
| Spec Kit | A Python CLI (`specify`) that installs slash commands and templates for 41 named agents, with presets, extensions and workflows | One spec, plan and task set for each feature. Strong checks on spec quality. The team chooses how specs persist after delivery. |
| OpenSpec | A TypeScript CLI that generates skills and commands for about 50 agent targets | A living spec for each capability, plus a change folder with delta specs (ADDED, MODIFIED, REMOVED, RENAMED). Archive merges the deltas. "Enablers, not gates." |
| BMAD | A skills repository with 6 personas, a product-owner ticket tree and one build loop | Requirements with stable IDs flow to tickets, plans and commits. Each build has a frozen, approved plan and a multi-lens review with triage. |

## B. Capability matrix

Labels:

- **Tool**: deterministic code computes or enforces it.
- **Method**: the method requires it; an agent or a person does it.
- **Partial**: present with a material limit (given in the cell).
- **Convention**: documented advice that nothing checks.
- **No**: absent in core. The surveys checked the cited places. A community extension can exist.

### B1. Knowledge model

| Capability | ADD + Plane | Spec Kit | OpenSpec | BMAD |
| --- | --- | --- | --- | --- |
| Current truth of delivered behavior | Method: one living artifact per capability on `main` (§3) | No: team chooses flow-forward, living or flow-back; "None is the default" (§3) | Tool: `openspec/specs/`, merged by `archive` (§3, §4) | Partial: living PRD, spine and tickets; reconciliation after delivery is "by hand" (§4) |
| Change to existing behavior | Method: edit in place; the branch diff is the proposal. Plane shows New, Changed, Removed and line diffs (§4) | No delta format (§4) | Tool: delta specs with deterministic, rollback-safe merge (§4) | No delta format; a change is a new ticket or plan (§4) |
| Stable identifiers | Partial: logical IDs for elements, tasks, versions and flow steps; requirement IDs are a writing convention (§3) | Convention: `FR-`, `SC-`, `US#`, `T###` in templates; no schema (§3) | No: requirements are keyed by header name; issue #2056 asks for anchors (§3, §5) | Tool: `FR-n` → `R<n>` → `covers`, checked by validation (§3, §5) |
| Product knowledge versions | Method: semver for each artifact, version record, "established" only on `main` (§3, §9) | No: only the constitution has a semver (§9) | No (§9) | No (§9) |
| Dependencies between capabilities | Method: artifact DAG; dependent implementation waits for established upstream (§9) | Convention: manual "Depends on" column in a roadmap (§6) | No: `dependsOn` is an unimplemented proposal (§6) | Partial: `after` order and a collision check inside the ticket tree (§9) |
| Decision records | Method: ADR only when a choice has several options (§3) | No ADR type in core (§3) | Partial: decisions inside `design.md` (§3) | Partial: ADRs from deep recon or the retrospective (§3) |

### B2. Traceability and impact

| Capability | ADD + Plane | Spec Kit | OpenSpec | BMAD |
| --- | --- | --- | --- | --- |
| Requirement → task | Partial: tasks cite governing references in prose (§5) | Partial: `[US#]` labels; `/analyze` infers links by keyword (§5) | No: tasks are free text (§5) | Tool: `covers` field, checked by validation (§5) |
| Task → evidence | Method: DoD checklist and evidence records in each task (§8) | Partial: tasks marked `[X]`; no task-level DoD (§8) | Partial: each task states its check; `/opsx:verify` infers links (§5) | Method: I/O-matrix test audit (§8) |
| Code → reason | Tool, partial: Plane walks flow supports, references and JS/JSX/Go imports back to knowledge. Only flow-linked code and those languages (§5, §6) | No (§5) | No: Git history and archive folder only (§5) | Partial: plan `baseline_revision` commit range; a squash merge breaks it (#3063) (§5) |
| Impact of a change | Tool, partial: Plane gives tiered impact with a coverage statement; method requires impact analysis in Requirement and Specification (§6) | No (§6) | No (§6) | Partial: ID-citation staleness and structural checks in `tickets.py`; the rest is model judgment (§6) |

### B3. Process and quality

| Capability | ADD + Plane | Spec Kit | OpenSpec | BMAD |
| --- | --- | --- | --- | --- |
| Human gates | Method: plan approval, semver confirmation, team PR merge. Approval is not recorded as a fact (§2) | Partial: prompts in chat; the optional workflow engine persists `gate` steps (§2) | Convention: `propose` stops and waits (§2) | Method: Build checkpoint freezes the approved intent; a person marks `done` (§2) |
| Spec quality checks | Method: self-check by the phase owner, with KISS and STE checks (§8) | Method: requirements checklist, bounded clarification, `/analyze` with coverage, `/converge` (§8) | Tool: `validate --strict` checks structure; `/opsx:verify` is advisory (§8) | Method and Tool: fresh-context validation subagents, `lint_spine.py`, PRD checklist (§8) |
| Implementation review | Method: DoD evidence and integration validation; "No mandatory extra agent review" (§8) | Method: `/converge` compares code with spec (§8) | Partial: `/opsx:verify` does not block archive (§8) | Method: parallel review lenses, triage of each finding, loop limit of 5 (§8) |
| Deterministic validator shipped with the method | Partial: none in the bundle ("No standalone runner … is required"); the Plane has `validate-knowledge.mjs`, which `se-adopt` does not ship (§8) | No artifact linter (§8) | Tool: `openspec validate`, fit for CI (§8) | Tool: `tickets.py`, `lint_spine.py` (§8) |
| Roles | Method: coordinator, product owner, technical lead, implementer (§7) | No personas (§7) | No roles (§7) | Method: 6 personas; one skill writes each document (§7) |

### B4. Team, tools and cost

| Capability | ADD + Plane | Spec Kit | OpenSpec | BMAD |
| --- | --- | --- | --- | --- |
| Parallel work | Method: worktree for each parallel implementer; one active change per artifact (§9) | Partial: one active feature per checkout; worktrees advised (§9) | Partial: change folders in parallel; no Git support (§9) | Convention: parallel epic streams with owners; worktrees advised (§9) |
| Multi-repository | Method: companion PRs; a version is established only when all required PRs land (§9) | Partial: monorepo through `SPECIFY_INIT_DIR`; contract guidance (§9) | Partial: "Stores" beta, no sync (§9) | Convention: one store at the workspace root (§9) |
| Git and PR | Method: branch per change, commit per phase, PR; Plane commits and branches but never pushes (§9) | Partial: opt-in `git` extension; no PR creation (§9) | No: "OpenSpec doesn't touch git" (§9) | Tool: Build commits and offers a PR; never pushes (§9) |
| Human interface | Tool: Plane web app with graphs, authoring, impact, change review, Mermaid and live reload (§10) | No UI in core (§10) | Partial: terminal dashboard (§10) | Partial: chat board and HTML reports (§10) |
| Agent portability | Partial: Codex configured; other harnesses set up by the user (§0) | 41 named agents plus `generic` (§0) | About 50 targets (§0) | Skills-capable tools; plugins for Claude Code and Codex (§0) |
| Extensibility | Partial: pattern library; no configuration (§11) | Presets, extensions, workflows, bundles, catalogs (§11) | YAML schemas and community schemas (§11) | Layered TOML customization and modules (§11) |
| Minimum for one small change | 6–8 knowledge files, at least 5 commits, 3 human decisions, 1 PR (§12) | 4–5 agent commands (§12) | 3 agent commands and 1 review (§12) | 1 build call (§12) |
| Fast path for trivial changes | No (§12) | Partial: `lean` preset, `bug` extension (§12) | Yes: skip for one-line fixes; `skip_specs` (§12) | Yes: one-shot route when 100 lines or fewer (§12) |
| Maturity | One author, 7 days of history, no license, no release that clearly carries 2.8.1 (§0) | Active; releases 1.1.1 to 1.2.1 in 10 days (§0) | Active; about weekly releases (§0) | V7 is an alpha after its release date; stable is 6.12.4 (§0) |

## C. Findings

### C1. What only ADD + Plane does

1. **Versioned product knowledge with an establishment rule.** No other subject has a version for each capability or a rule that a version is real only when all its code and knowledge land on the protected branch (§3, §9).
2. **Dependency gates between capabilities.** Dependent implementation waits for an established upstream version (§9). The others leave this order to people or to model judgment.
3. **Multi-repository completion.** Companion PRs and one establishment rule across repositories (§9). OpenSpec Stores is the nearest feature, and it is a beta without sync.
4. **Computed impact and a code-to-reason path.** The Plane computes tiered impact with a coverage statement and goes from a file or symbol back to flows and knowledge (§5, §6). No other subject computes impact. This coverage has limits: code that a flow record links, plus JS, JSX and Go imports.
5. **A human interface for the knowledge.** A web app with graphs, authoring with validation, change review and live updates (§10). The others have a terminal dashboard (OpenSpec), HTML reports (BMAD) or nothing in core (Spec Kit).

### C2. Where ADD + Plane is weaker

1. **Ceremony.** ADD is the heaviest of the four for small work, and it has no fast path. A 16-line CSS change (Plane 1.17.1) produced 9 knowledge files with about 246 lines. In PR #38, knowledge lines were more than double the other lines (§12). OpenSpec tells users to skip it for one-line fixes; BMAD has a one-shot route; Spec Kit has the `lean` preset.
2. **Validation depends on agent discipline.** The bundle has no validator, and the author of a phase does its self-check. Extra review is excluded on purpose (§8). OpenSpec and BMAD ship deterministic checks; BMAD adds independent review lenses.
3. **Forward traceability is prose.** BMAD's `covers` field makes requirement → story → plan checkable by a tool. ADD's task-to-requirement link is text (§5).
4. **Spec quality aids.** Spec Kit has bounded clarification, a requirements checklist and a coverage analysis (§8). ADD relies on a self-check.
5. **Reach and maturity.** One author, no license, harness wiring for Codex only, no extension mechanism, and documentation drift between the Plane README and ADD (§0, §11, §14). The other three have MIT licenses, many integrations and active communities.
6. **Concurrency inside one capability.** One active change per artifact (§9). OpenSpec lets many change folders run in parallel and finds conflicts at archive.

### C3. Where the approaches agree

- All four now prefer living knowledge to per-feature snapshots, or offer it. ADD moved from snapshot copies to in-place edits in 2.4.0. Spec Kit documents a living-spec option. OpenSpec merges deltas. BMAD keeps planning documents current.
- No subject records approval as a structured fact in its core flow. Spec Kit's optional workflow engine is the only exception.
- No subject measures token cost. ADD, Spec Kit and BMAD each state that their context guidance is not measured (§13).
- No subject puts requirement IDs in code. BMAD forbids it on purpose (§5).

## D. Ideas for ADD and the Plane

These are candidates for a later unit of work. They are not decisions. Each needs its own requirement and owner approval.

| # | Idea | Source | Problem it addresses | Tension with ADD |
| --- | --- | --- | --- | --- |
| 1 | A documented fast path for trivial changes, with a size rule and a list of exclusions | OpenSpec `skip_specs`; BMAD one-shot rule; Spec Kit `lean` | C2.1 | Every outcome needs a unit of work in this repository (`AGENTS.md`) |
| 2 | Ship a deterministic validator with the bundle, for example the Plane's `validate-knowledge` checks in `se-adopt` | OpenSpec `validate --strict --json`; BMAD `tickets.py` | C2.2 | The bundle says no runner is required; a validator adds a tool dependency |
| 3 | A structured `covers` field from task to requirement, checked by the validator | BMAD `covers` | C2.3 | More front matter; ADD 2.9.0 claim records link claims to evidence, not tasks to requirements |
| 4 | An optional independent review step for high-risk tasks | BMAD review lenses and triage | C2.2 | ADD excludes mandatory extra review on purpose |
| 5 | Bounded clarification questions and a coverage check in the Requirement and Specification self-checks | Spec Kit `/clarify`, `/analyze` | C2.4 | Small; fits the existing self-checks |
| 6 | A license, a release that carries the current bundle, and harness wiring for Claude Code | All three | C2.5 | Owner decision |

## E. Summary

ADD + Plane is the most complete of the four for **governed knowledge across many capabilities and repositories**: versions, establishment, dependency gates, computed impact and a human interface. It is the weakest of the four for **cost of small changes, automatic validation, reach and maturity**. OpenSpec is the nearest in knowledge model (living spec for each capability). BMAD is the strongest in forward traceability and implementation review. Spec Kit is the strongest in spec-quality checks, extensibility and agent coverage.

The comparison does not show which approach gives better software or less rework. Only tier 2 can measure that.

## F. Implications for a tier-2 benchmark

The matrix shows that these scenarios would separate the subjects. The expected direction is a hypothesis from this comparison, not a result.

| Scenario | Expected leader | Expected weakest | Measure |
| --- | --- | --- | --- |
| A one-line fix | BMAD, OpenSpec | ADD | Time, tokens, files written |
| Change existing behavior in one capability | OpenSpec, ADD | Spec Kit | Spec correctness after the change; drift |
| Change that crosses two dependent capabilities | ADD | OpenSpec, Spec Kit | Missed dependents; integration defects |
| Requirement changes after the plan is approved | BMAD, ADD | OpenSpec | Stale tasks or specs left behind |
| "Why does this code exist?" after 5 changes | ADD (flow-linked code), BMAD | OpenSpec, Spec Kit | Accuracy of the answer; time to answer |
| Two people change one capability at the same time | OpenSpec | ADD | Conflicts; lost work |

The benchmark must fix scenarios and measures before any run. Blind graders or automatic tests must do the scoring. The scenarios must include small changes, where ADD is expected to lose, as well as cross-capability changes, where ADD is expected to win.

## G. Limits

- **Author bias.** The ADD survey and this synthesis were made for the owner of ADD. An independent review (another model or a person who did not write ADD) would reduce this risk.
- **Documentation, not behavior.** The surveys read source and documentation. They did not run any tool. A documented feature can fail in use, as Plane 1.16.0 did (§8 of the ADD survey).
- **Moving targets.** All three outside tools released in the week before this survey. BMAD V7 is an alpha with breaking changes. This record is valid for the commits in the baseline table.
- **Core only.** Spec Kit has 182 community extensions, and OpenSpec and BMAD have community schemas and modules. Some fill gaps marked "No" here. They are unaudited and were not surveyed.
- **Adoption numbers.** The surveys copied star counts from the repository pages on 19 October 2026 (Spec Kit about 142k, OpenSpec about 72k, BMAD about 54k). These numbers were not checked against another source, and they are not a measure of quality.

## Sources

- ADD 2.8.1 and Artifact Plane 1.19.0: this repository at `d931d07`.
- GitHub Spec Kit: https://github.com/github/spec-kit at `c6a4c18f1d01a8bec241c618eb6dfea952508744`.
- OpenSpec: https://github.com/Fission-AI/OpenSpec at `c794978f4f8845ce59693373c9dd882ee776588c` (tag `v1.14.3`).
- BMAD Method: https://github.com/bmad-code-org/BMAD-METHOD at `61e01f82644c4bb533750cfa0d6d61ab61d2cc9b` (V7 preview) and `bab9082c3e884e0d72c759bcd1a6d90bcc01be84` (6.12.4).
- Surveys with file-level evidence: the four files in [surveys](surveys/).
