# Capability scores

Status: research record, 19 October 2026. The scores turn [the comparison](research.md) into one number from 1 to 5 for each of eleven criteria. The anchors below were fixed before any score was given, and every subject was scored with the same anchors. Each score cites a rubric section (§) of the surveys in [surveys](surveys/). Scores use whole numbers only, because the evidence does not support finer steps.

Baseline: ADD 2.8.1 with Artifact Plane 1.19.0 (ADD 2.9.0 changes no score), Spec Kit 1.2.1, OpenSpec 1.14.3, BMAD V7 preview. "ADD" below means ADD with the Plane.

## Anchors

| Criterion | 1 | 2 | 3 | 4 | 5 |
| --- | --- | --- | --- | --- | --- |
| Requirements | No requirement record | Free text inside a proposal | Structured record with acceptance criteria | 3, plus a required clarification step and a requirement-quality check | 4, plus stable IDs with coverage checked by a tool |
| Living knowledge | None | Per-feature snapshots only | Living documents, reconciled by hand after delivery | Living knowledge updated by the method in each change | 4, plus a tool merges or validates it in the default install |
| Change management | None | New feature directory per change, no link to the baseline | Change record, but new tickets or manual reconciliation | Explicit change against the baseline, reviewable diff, retained history | 4, plus tool-detected conflicts between concurrent changes |
| Traceability | None | Implicit (Git history, file paths) | IDs or labels on some links, prose on others | Structured links on most of the chain, checked by an agent | Full chain structured and checked by a tool, including code back to reason |
| Impact analysis | None | Free-text impact section or model judgment | Deterministic structural checks (ID citations, order) | Computed impact over knowledge and code, with partial coverage | Computed and explained impact with broad language coverage |
| Validation and review | None | Self-check by the author only | Checklists and human gates | 3, plus a deterministic validator in the default install or a required independent review | Both, with enforced gates |
| Workflow | Ad hoc | Suggested sequence | Defined phases with gates | 3, plus role separation and Git or PR integration in core | 4, plus orchestrated parallel or unattended execution |
| Extensibility | None | Edit the files by hand | Templates or configuration overrides | A plug-in mechanism (presets, schemas, modules) | 4, plus a catalog or ecosystem and broad agent integration |
| Low overhead | Six or more records and several gates for any change, no fast path | Several records; a lighter variant exists but is not the default | 3 to 5 steps; an optional light path | 3 steps or fewer; a documented skip for trivial changes | One command, with automatic routing by size |
| Human interface | Files only | CLI status output | Terminal dashboard or generated HTML reports | Interactive viewer of the knowledge | 4, plus authoring, graphs, impact and change review |
| Human comprehension and control | The person sees only raw files or chat; no defined control points | Human gates exist, but the person must read everything; facts, assumptions and checks are not told apart | Defined control points with a reviewable plan or proposal; open questions come to the person before commitment | 3, plus rationale and evidence linked to claims, so the person can tell verified facts from assertions and check them cheaply | 4, plus tool-supported review views (changes, impact, verification status) and review effort scaled to the size and risk of the change |

## Scores

| Criterion | ADD | Spec Kit | OpenSpec | BMAD |
| --- | --- | --- | --- | --- |
| Requirements | 4 | 4 | 3 | 4 |
| Living knowledge | 4 | 2 | 4 | 3 |
| Change management | 4 | 2 | 4 | 3 |
| Traceability | 3 | 3 | 2 | 4 |
| Impact analysis | 4 | 1 | 2 | 3 |
| Validation and review | 3 | 3 | 4 | 5 |
| Workflow | 5 | 3 | 3 | 5 |
| Extensibility | 2 | 5 | 4 | 4 |
| Low overhead | 1 | 3 | 4 | 5 |
| Human interface | 5 | 1 | 3 | 3 |
| Human comprehension and control | 4 | 3 | 3 | 4 |
| **Total (of 55)** | **39** | **30** | **36** | **43** |

## Reasons

### Requirements

- ADD 4: requirements with observable acceptance criteria; the coordinator interviews first and the product owner asks focused questions about material gaps; the self-check covers clarity, consistency, open blockers, and facts against assumptions (`docs/artifact-driven/03-execution/skills/add-product-owner/SKILL.md`). Requirement IDs are a writing convention, so 5 is not met (§1, §3, §8 of the ADD survey).
- Spec Kit 4: template with user stories, `FR-`/`SC-` IDs and acceptance scenarios; bounded clarification; a requirements checklist. Coverage is inferred by keyword, not checked by a tool (§3, §8).
- OpenSpec 3: requirements with SHALL/MUST and scenarios, checked for structure by `validate`. Clarification (`/opsx:explore`) is optional. No IDs (§3, §8).
- BMAD 4: `FR-n` → `R<n>` with `covers`; coverage checks run in validation subagents (model checks), and `tickets.py` checks only structure (§3, §5, §8).

### Living knowledge

- ADD 4: each artifact is edited in place in the same branch as the code; `main` is the current truth. The validator is in the Plane, which `se-adopt` does not ship (§3, §4, §8).
- Spec Kit 2: per-feature directories; the living-spec model is one of three team choices, and "None is the default" (§3).
- OpenSpec 4: one living spec for each capability with a deterministic merge at archive. Archive time is a convention, so specs can lag the code (§3, §4, §9).
- BMAD 3: living PRD, spine and tickets; reconciliation after delivery is "by hand" (§3, §4).

### Change management

- ADD 4: change record, branch diff against `main`, Plane line diffs, retained changes and versions. Concurrent edits conflict only at Git merge (§4, §9).
- Spec Kit 2: a change is a new feature directory or an edit; no delta format and no reconciliation in core (§4).
- OpenSpec 4: delta specs, `show --diff`, dated archive. Conflicts surface at archive, partly by agent judgment (§4, §9).
- BMAD 3: REPLAN keeps IDs and names stale entries; no delta format (§4).

### Traceability

- ADD 3: requirement → specification → task links are prose; the task DAG and version → change links are structured; code → reason exists through flow supports and the Plane (§5).
- Spec Kit 3: `[US#]` labels and keyword inference; convergence tasks cite a source (§5).
- OpenSpec 2: tasks are free text; the way back from code is Git history (§5).
- BMAD 4: `FR` → `R` → `covers` → plan → baseline commits, checked by validation subagents; a squash merge breaks the commit link (§5).

### Impact analysis

- ADD 4: the Plane computes tiered impact with a coverage statement over knowledge, JS, JSX and Go (§6).
- Spec Kit 1: absent in core (§6).
- OpenSpec 2: a free-text Impact section and header checks; dependency metadata is only a proposal (§6).
- BMAD 3: ID-citation staleness and `tickets.py` structural checks; the rest is model judgment (§6).

### Validation and review

- ADD 3: self-checks by the author, DoD evidence and human gates. Extra review is excluded on purpose. The validator is not in the default install (§8).
- Spec Kit 3: checklists, `/analyze` and `/converge`, all run by the agent; no artifact linter (§8).
- OpenSpec 4: deterministic `validate --strict`; `/opsx:verify` is advisory (§8).
- BMAD 5: deterministic `tickets.py` and `lint_spine.py`, parallel review lenses with triage, and a frozen approved plan (§8).

### Workflow

- ADD 5: five phases, four roles, three gates, branch, commits per phase and PR; the coordinator runs parallel implementers in separate worktrees (§2, §7, §9). The missing routing by change size is scored under low overhead.
- Spec Kit 3: defined commands, plus an optional workflow engine with gates, fan-out and resume. No roles, and Git is an opt-in extension, so 4 is not met (§2, §7, §9).
- OpenSpec 3: propose, apply, archive; no roles; it never touches Git (§2, §7, §9).
- BMAD 5: Build steps with a plan checkpoint, six personas, Build commits and offers a PR, and an unattended worker for an orchestrator. The bundled orchestrator cannot yet read the ticket tree (§2, §7, §9).

### Extensibility

- ADD 2: a pattern library; no configuration or plug-in mechanism; Codex wiring only (§0, §11).
- Spec Kit 5: presets, extensions, workflows, bundles, catalogs, 41 named agents (§0, §11).
- OpenSpec 4: YAML schemas, community schemas and about 50 agent targets; community schemas are copied by hand (§0, §11).
- BMAD 4: layered TOML customization, modules and a toolsmith (§11).

### Low overhead

- ADD 1: 6 to 8 knowledge files, at least 5 commits, 3 human decisions and a PR for any change; no fast path (§12).
- Spec Kit 3: 4 to 5 agent commands; the `lean` preset is not the default (§12).
- OpenSpec 4: three commands; a documented skip for one-line fixes (§12).
- BMAD 5: one Build call with automatic routing by size (§12).

### Human interface

- ADD 5: the Plane gives a web interface with authoring, graphs, impact, change review and live updates. It is local and for one user only, and release 1.16.0 was found unusable before its redesign (§10, §14).
- Spec Kit 1: no UI in core (§10).
- OpenSpec 3: a terminal dashboard (§10).
- BMAD 3: HTML reports and a board in chat (§10).

## Optional criterion: cross-capability governance

This criterion is not in the owner's list of ten. It is added because the ten criteria do not measure the capabilities that only ADD has (section C1 of the comparison). It is reported separately and is not in the totals above.

| 1 | 2 | 3 | 4 | 5 |
| --- | --- | --- | --- | --- |
| None | Manual ordering or dependency guidance | Structural dependency or order checks inside one backlog | Dependencies between capabilities with gates, or multi-repository coordination | Versioned capabilities with an establishment rule, dependency gates and multi-repository completion |

| ADD | Spec Kit | OpenSpec | BMAD |
| --- | --- | --- | --- |
| 5 | 2 | 2 | 3 |

- ADD 5: per-artifact versions, the establishment rule, gates on established upstream versions, and companion PRs across repositories (§3, §9).
- Spec Kit 2: a manual "Depends on" column in a roadmap and monorepo guidance (§6, §9).
- OpenSpec 2: no dependency metadata; "Stores" beta gives read-only references across repositories without sync (§6, §9).
- BMAD 3: `after` order, cycle and order-conflict checks in `tickets.py`; a ticket names the projects it touches (§6, §9).

With this criterion, the totals out of 60 are ADD 44, Spec Kit 32, OpenSpec 38, BMAD 46.

## Revisions

Before publication, a consistency pass changed two anchors and three scores:

- Workflow: the 5 anchor no longer includes routing by change size, because low overhead already scores it. ADD 4 → 5.
- Workflow: Spec Kit has no roles in core, so the 4 anchor is not met. Spec Kit 4 → 3.
- Requirements: the 4 anchor now names a required clarification step and a quality check. The product-owner skill requires both. ADD 3 → 4.
- Later the same day, the owner added an eleventh criterion, human comprehension and control. Totals moved from 50 to 55 points.

### Human comprehension and control

This criterion measures how well a person can understand what agents produced and decided, and keep control of it. It was added on 19 October 2026 at the owner's request, after the other ten.

- ADD 4: plan approval before implementation; the product owner separates facts from assumptions; evidence records carry method, result and source, and readers label them "documented evidence, not independently verified test success" (`06-guidelines/evidence-records.md`, `06-guidelines/units-of-work.md:76`); the Plane shows change review with line diffs, impact tiers and context export (§8, §10). ADD 2.9.0 adds claim records with status (`open`, `supported`, `verified`, `refuted`, `superseded`), evidence, the cheapest check and `verified_by` (`06-guidelines/evidence-records.md:67-80`). Anchor 5 is not met: review effort does not scale with the change. Knowledge is a median 61% of added lines, and 26% of owner prompts are gate actions (`measurements/git-cost.md` §1, `measurements/session-cost.md` §5).
- Spec Kit 3: the user reviews each step "one at a time"; checklists are "reviewer-owned"; up to 3 clarification markers come to the user; `research.md` records decision, rationale and alternatives. Claims are not linked to evidence, and core has no review view (§2, §3, §7, §10).
- OpenSpec 3: `propose` stops for review; a two-minute review checklist; `show --diff`; `design.md` keeps decisions with alternatives and open questions. Approval is a convention, and issue #2032 reports agents that approve without checking purpose (§2, §8, §14).
- BMAD 4: open questions must be answered before the plan checkpoint, and the approved intent is frozen so "only the human can change it"; review triage logs a verdict for every finding and sends intent gaps back to the person; `bmad-walkthrough` guides a human review; routing by size shortens review for small work. Anchor 5 is not met: there is no review view of its own, only HTML reports and chat (§2, §8, §10, §12).

## Rescore after delivery

On 19 October 2026, after ADD 3.0.0 (merged in #41) and with Artifact Plane 1.21.0 prepared, ADD was scored again with the anchors above. Only ADD changed. Each raised score names the delivered mechanism that meets its anchor.

| Criterion | Before | After | Mechanism |
| --- | --- | --- | --- |
| Requirements | 4 | 5 | Requirement IDs (list items and paragraph labels) and task `covers`; the validator reports `covers-unknown-id` and `requirement-uncovered` (record-checks.md, Covers). |
| Living knowledge | 4 | 5 | The validator in the default install (`tools/add-validate.mjs`, built by the release) checks the knowledge of the whole repository. |
| Change management | 4 | 5 | `open-change-conflict` reports another branch with an open change on the same artifact or an edit of the same knowledge file. |
| Traceability | 3 | 4 | Requirement to task is structured (`covers`) and checked by a tool; flow supports and references link knowledge to code. Specification to requirement and code to reason stay prose, so anchor 5 is not met. |
| Impact analysis | 4 | 4 | No change in language coverage. |
| Validation and review | 3 | 4 | A deterministic validator in the default install. Anchor 5 needs a required independent review as well; release R4 was excluded. |
| Workflow | 5 | 5 | No change. |
| Extensibility | 2 | 3 | `docs/artifacts/add.config.yaml` overrides the code limit, the tiers that need a unit brief and the reading of each role; change.scaffold writes the record set of a tier. |
| Low overhead | 1 | 3 | The small tier is an optional light path: one knowledge commit, approval by request, one human gate (the #37 replay: 9 files, 130 lines, 2 commits). Anchor 4 needs a documented skip for trivial changes; the owner deferred a code-only tier. |
| Human interface | 5 | 5 | No change. |
| Human comprehension and control | 4 | 5 | Review effort now scales with size and risk (tiers), and the Plane adds the PR description with the tier criteria next to the change brief. |
| **Total (of 55)** | **39** | **48** | |

The total meets the unit criterion of at least 48 of 55. The same session that built the improvements gave these scores; the independent review prompt can challenge them.

## Notes

- The total gives each criterion the same weight. A team that needs governed knowledge across capabilities would weight living knowledge, change management, traceability and impact more. A team that ships many small changes would weight low overhead more.
- Maturity is not one of the ten criteria. BMAD V7 is an alpha with known defects. ADD has one author and no license. Read the totals with this in mind.
- The same session that wrote the comparison gave these scores. The independent review in [the review prompt](independent-review-prompt.md) can challenge them.
