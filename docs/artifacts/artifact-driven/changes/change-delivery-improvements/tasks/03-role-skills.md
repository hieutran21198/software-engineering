---
id: role-skills
depends_on: [tier-guidance]
---

# Role skills

## Scope and ownership

Coordinator, as implementer. The four role skills under `docs/artifact-driven/03-execution/skills/` (coordinator, product owner, technical lead, implementer): rewrite each SKILL.md as a core of at most 400 words with the duty, the phase steps by tier and a self-check checklist that includes five KISS and STE items, followed by a "Read when" table. Move rare-case content (legacy layout, multi-repository publication, flows, representations, claims, units, patterns) behind table rows that point to the existing guidance. Add the implementer context rules and the impact-selected local tests to `06-guidelines/working-with-ai.md`. Update `03-execution/README.md` for the core and table structure. The `kiss` and `asd-ste-100` skills and the `agents/openai.yaml` files keep their content.

## Governing knowledge

specifications/agent-efficiency.md (Progressive context and recovery, Progressive guidance, Implementer context, Harness profiles); requirements/delivery-improvements.md, DI9 to DI11 and A3.

## Prerequisites

Task tier-guidance.

## Definition of Done

- [x] `wc -w` on the body of each role SKILL.md, without front matter and without the Read-when table, is at most 400.
- [x] The guidance that the coordinator reads unconditionally (the coordinator core and its table, with an empty `reading.coordinator`) has at most 3,000 words.
- [x] Each rule that a skill held before the rewrite is either in the core or reachable through one Read-when row; a table in the evidence lists each removed paragraph and its new location.
- [x] `working-with-ai.md` states the implementer dispatch, section reads, short summaries, new contexts at phase boundaries and impact-selected local tests with the full suites in CI.
- [x] Every relative link resolves, `go test ./...` passes and `npm run build` in website exits 0.

## Evidence

| DoD item | Check | Result | Source |
| --- | --- | --- | --- |
| Core of at most 400 words | `wc -w` on each SKILL.md body without front matter and without the Read-when table: coordinator 399, product owner 320, technical lead 365, implementer 374. Each core has the duty, steps by tier, a self-check with five KISS and STE items plus role checks, and the line that sends the role to the full `kiss` and `asd-ste-100` skills | Passed | `03-execution/skills/*/SKILL.md` |
| Coordinator reading | The coordinator core with its Read-when table has 571 words (limit 3,000); the bundle has no configuration file, so `reading.coordinator` is empty | Passed | `add-coordinator/SKILL.md` |
| Each rule kept | A script compared every sentence of the four skills before the rewrite with the new SKILL.md and `reference.md` of the same role: 272 of 409 sentences are verbatim; the table below maps the other 137 | Passed | The table below |
| working-with-ai.md | New section Implementer context: dispatch in a new context with task path, governing paths and DoD; reads by section or symbol; short summary; new context at a phase boundary; the Verify list of the change impact and the fast unit suites, with the full suites in CI. Required Skills, Required Capabilities (harness registration for Codex and Claude Code), Reuse Context and Review the Plan follow the core-and-table structure and the tiers | Passed | `06-guidelines/working-with-ai.md` |
| Links, tests, build | The link script resolved 104 links of 03-execution/README.md, the four skills, the four reference pages and working-with-ai.md, with 0 findings and no link to an ancestor README; `go test ./...` passes; `npm run build` in website exits 0 with 44 bundle pages (the four reference pages are new) | Passed | Commands in this row |

| Old section (all four skills unless named) | New location |
| --- | --- |
| Required Skills: read both skills, apply KISS and STE, no extra review | Core self-check (five KISS and STE items) and the line to read the full skills; `reference.md#load-and-resume` keeps the paths, the formal-compliance limit, bundle availability, restoration and reuse or reload |
| Coordinator: Establish Context | Core step 1 (inspect, interview, ask only for missing facts, no invented facts or decisions); `reference.md#context` (repositories, artifact definition, layout, legacy migration) |
| Coordinator: Drive the Pipeline | Core steps 3 and 4 and the blocker line; `reference.md#load-and-resume` (role skills, model use, no planning agent) and `#context` (retained authorization and valid work). The rule changes for tiers: one knowledge commit and approval by request for small changes |
| Coordinator: Gate Dependencies | Core step 5; `reference.md#gates`, verbatim except "plan approval" in place of "explicit plan approval" |
| Coordinator: Implement and Integrate | Core step 6; `reference.md#implementation`, verbatim plus the implementer context link |
| Coordinator: Prepare Version and PRs, resume paragraph | Core step 7; `reference.md#publication` (number computed from the confirmed level, recomputed when the protected branch moves, three-sentence summary, small PR description, merges read from Git) and `#load-and-resume` (resume paragraph, verbatim) |
| PO: Requirements | Core steps 1 to 5, the blocker paragraph and the self-check; `reference.md#load-and-resume` (fresh plans, Git as evidence, no completion claim with blockers, no reviewer agent) |
| TL: phase sequence, Specification, Plan | Core steps 1 to 6; `reference.md#specification-and-plan` (references, edges, fresh plans, task format, approval for medium and large) and `#patterns` (one row for each pattern sentence) |
| Implementer: task, graph, implementation and return paragraphs | Core steps 1 to 6 and the gap paragraph; `reference.md#task-rules` (task format, legacy plans, delegated and sequential work, renewed approval, integration) and `#patterns` |
| Shared outcome, System-flow checks, Representations, Claims | `reference.md` sections of the same role, verbatim except the small change's impact assessment in place of a unit brief where the tier needs none |
| Small-change authoring | `reference.md#small-changes` of the coordinator, PO and TL, changed for tiers: no ADR, no new requirement ID, `compatibility: patch`, one task with `covers`, phase commits and explicit approval for medium and large only |

03-execution/README.md describes the core and table structure and the tiers in its Operating Flow. The remaining matches of the phrase search of task tier-guidance name their tier; the diagram of visual-examples.md shows the flow at revision 126990d.
