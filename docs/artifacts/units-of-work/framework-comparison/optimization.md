# Faster delivery with ADD and Artifact Plane: time model, causes and options

Status: research record, 19 October 2026. Input: [git-cost](measurements/git-cost.md), [session-cost](measurements/session-cost.md), [the comparison](research.md), [the scores](scores.md) and the four surveys. Baseline: `main` at `371e3ab` (ADD 2.9.0, Artifact Plane 1.19.0). This record proposes options. It decides nothing and changes no artifact.

Labels for numbers: **M** measured (from a measurement file or a file in this repository), **E** estimated (a calculation from measured numbers, with the calculation shown), **A** assumed (no data; stated as an assumption).

## Summary

1. A small change costs 9 to 13 knowledge files, about 250 to 310 knowledge lines, 5 commits and 3 human gates for about 50 code and test lines (M, git-cost §1, §3). The rules that cause this are size-blind: the same six-file scaffold, the same three phase commits, the same unit brief and the same gates apply to a 16-line CSS fix and to a 3,000-line feature.
2. About 39% of task lines and 75% of unit-brief lines restate facts stored elsewhere (M, git-cost §2). Removing restatement needs no rule change that touches a guarantee.
3. Agent tokens go mostly to standing context, not to ADD text: 52% of Claude input is the resent main context and 29% is forked context (M, session-cost §6). Guidance reads are 13% to 24% of tool-result tokens and 223 reads repeat a file already in context (M).
4. Human waits are not plan approval (median 2 min) but the waits after implementation and after the PR, plus 96 gate prompts that each end an agent turn (M, session-cost §5).
5. Rework is rare in text (fix commits 6.7%) and expensive in UI: one release was rebuilt within 4 hours after its tests passed (M, git-cost §4).
6. Sixteen options are evaluated. The top five by saving against risk: single-source facts (O7), a validator in the loop (O3), change-size tiers with a fast path (O1), structured coverage links (O6) and progressive guidance (O5).
7. Expected effect for a small change: knowledge lines 312 to about 130, commits 5 to 2, human gates 3 to 1, lead time 17 min to about 8 min (E). For medium and cross-capability changes the saving is in tokens and review time, not in lead time.
8. Under the revised anchors in scores.md, the options raise ADD from 35 to a target of 44 of 50, or 49 of 55 with the optional cross-capability criterion (E). Two steps need an owner decision that conflicts with a current rule.
9. Nine owner decisions are listed. The largest are tier thresholds, an optional unit of work for one-member outcomes, approval by request for the small tier, and a validator in the default install.
10. Every number for lead time after a release is an estimate. The measurement plan repeats the baseline scripts after each release.

## Baseline time model

### Change sizes used in this record

| Size | Definition used here | Measured examples |
| --- | --- | --- |
| Small | One artifact, one repository, patch-level compatibility, under 100 changed code and test lines | #34 (Plane 1.17.1, 42 lines), #37 (Plane 1.18.1, 50 lines) (M, git-cost §1) |
| Medium | One or two artifacts, minor version, hundreds to thousands of code lines | #31 (Plane 1.16.0), #32 (1.17.0), #36 (ADD 2.8.0 + Plane 1.18.0) |
| Cross-capability | Three or more artifacts in one unit, or a contract change with dependents | #38 (ADD 2.8.1 + Story-Driven 1.1.1 + Plane 1.19.0), #29 |
| Knowledge-only | Bundle or knowledge change with no code | #33, #35, #39 |

### Where the time goes, by size

| Measure | Small | Medium | Cross-capability | Source and label |
| --- | --- | --- | --- | --- |
| Lead time, Requirement to merge | 17 to 21 min | 3.6 to 6.1 h | 75 min (#38), 3.0 h (#29) | M, git-cost §3 |
| Knowledge lines added | 247 to 312 | 1,061 to 1,471 | 3,049 | M, git-cost §1 |
| Code and test lines added | 42 to 50 | 2,622 to 6,331 | 309 (plus 938 lockfile) | M, git-cost §1 |
| K:C ratio (knowledge to code, added lines) | 12 to 19 | 0.31 to 0.82 | 33 (9.9 against code and tests) | M, git-cost §1 |
| Knowledge files touched | 9 to 13 | 31 to 33 | 52 | M, git-cost §1 |
| Commits before squash | 5 | 25 to 43 | 14 (#38), 29 (#29) | M, git-cost §3 |
| Human gates | 3 (plan, version, merge) | 3, plus owner acceptance in #36 | 3 | M, add-plane survey :240-253; git-cost §3 |
| Plan approval wait | 6 to 14 min | 15 to 73 min | 7 min | M, git-cost §3 |
| Version to merge | 2 to 4 min | 14 to 37 min | 1 min | M, git-cost §3 |
| Agent active time | about 0.6 h (#33 session `7d38a2f7`, knowledge-only) | 2.2 h per change (E: session `2633a05e` 4.5 h for #31 and #32) | 2.4 h (session `42ef7676`) | M and E, session-cost §1 |
| Input tokens processed | 16.8 M (#33) | about 240 M per change (E: 486 M for two) | 122 M | M and E, session-cost §1 |
| Rework observed | 0 fix commits in #34 and #37; #37 is itself a patch 30 min after 1.18.0 | 5 fix commits in #32; 1.16.0 to 1.17.0 rebuild of 85% of UI lines in 3.9 h | 2 fix commits in #38; ADD 2.8.1 corrected 2 defects | M, git-cost §4 |

Limits of this table: no session isolates a small code change, so the small-change token figure is a knowledge-only proxy (session-cost §7, limits). Sessions that delivered two units are split evenly (E). Lines are not effort (git-cost, limits).

### Where agent effort goes, all sizes

| Component | Share | Source |
| --- | --- | --- |
| Implementation phase | 55% of Claude active time, 72% of Claude input; 52% and 68% in Codex | M, session-cost §3 |
| Requirement phase, including orientation and interview | 21% (Claude), 25% (Codex) of active time | M, session-cost §3 |
| Specification and Plan together | under 11% of time, under 6% of tokens | M, session-cost §3 |
| Version and PR | 4% (Claude), 10% (Codex) of active time | M, session-cost §3 |
| Standing context resent per call | 52% of Claude input (345 k tokens per main call); forks 29% (509 k per call) | M, session-cost §6 |
| Guidance reads | 12.9% (Claude) and 23.5% (Codex) of tool-result tokens; 912 reads, 223 repeats in the same context | M, session-cost §2, §4 |
| Git and PR output | 21% of Codex calls, 18% of its result tokens | M, session-cost §2 |
| Tests and browser suites | 3.4 h of Claude tool time; single runs up to 20 min | M, session-cost §2, §6 |
| Knowledge rewrites before a commit (self-check proxy) | 123 extra writes over 312 files written, about 0.4 per file | M, session-cost §4 |

### Where human time goes

| Component | Value | Source |
| --- | --- | --- |
| Gate prompts | 96 of 372 owner prompts: 63 approvals, 14 version confirmations, 19 merge notices | M, session-cost §5 |
| Plan approval latency | median 2 min (Claude n=7, Codex n=33); max 71 min | M, session-cost §5 |
| Waits after implementation | Claude 4 waits, 4.3 h; Codex 8 waits, 32.3 h (30 h overnight) | M, session-cost §3 |
| Waits after version or PR | Claude 6 waits, 1.2 h; Codex 8 waits, 1.5 h | M, session-cost §3 |
| Reading time for the knowledge of one change | not measured | session-cost has no reading-time data |

The data cannot say how long the owner spends reading 13 knowledge files before a merge. Version-to-merge (median 7 min, git-cost §3) is the only upper bound, and it includes CI time.

### Where rework comes from

| Signal | Value | Source |
| --- | --- | --- |
| Fix commits | 13 of 194 (6.7%), 134 code and 280 test lines | M, git-cost §4 |
| Spec survival to branch tip | 86% to 94% outside #29 | M, git-cost §4 |
| UI rebuild after passing tests | 1,666 of 1,970 UI lines replaced in 3 h 54 m | M, git-cost §4 |
| Patch versions soon after a minor | 1.17.1 (+17 h), 1.18.1 (+30 min), ADD 2.8.1 (+82 min) | M, git-cost §4 |
| Renumbering | change-impact-semantics 2.7.0 to 2.8.0 after a parallel unit took 2.7.0 | M, git-cost §4 |
| Repackaging | 9 commits, 1,996 knowledge lines rewritten | M, git-cost §4 |

## Causes

Each cause names the rule or gap, the risk the rule controls, and whether that risk is real for each change size.

### C1. The record set does not scale with the change

- Rule: six files form "the minimum example" (`docs/artifact-driven/06-guidelines/minimal-change.md:17`), plus the version record and the identity edit (`docs/artifact-driven/06-guidelines/writing-artifacts.md:112-120`). The scaffold "Keep[s] phase commits, plan approval and upstream establishment" (`docs/artifact-driven/03-execution/skills/add-coordinator/SKILL.md:76`). No size tier, fast path or trivial-change exemption exists (add-plane survey `surveys/add-plane.md:260`; bundle grep in the rule inventory found no "tier", "fast path" or "hotfix").
- Rule: every outcome needs a unit of work, "including outcomes with one artifact change" (`AGENTS.md:23`). The bundle makes the brief optional (`docs/artifact-driven/06-guidelines/units-of-work.md:3`).
- Effect: #37 has 13 knowledge files and 312 lines for 50 code and test lines; the unit brief alone is 64 lines, 50 of them front matter (unit profile A3). #34 has 9 files and 247 lines for 42 (M, git-cost §1).
- Risk controlled: the unit brief lets completion be derived from member versions and shared evidence (`units-of-work.md:80-82`). For a unit with one member, the brief's scope repeats the change README (`docs/artifacts/units-of-work/hidden-tab-streams/README.md:60` equals `docs/artifacts/artifact-plane/changes/change-hidden-tab-streams/README.md:10`) and its evidence repeats the task evidence (`.../hidden-tab-streams/README.md:64`). The risk is real for multi-member units and not real for one-member units.

### C2. Facts are recorded in several places

- Rules: each task states "prerequisites" (`writing-artifacts.md:57`); the scaffold gives each task a Prerequisites section and an Evidence section (`minimal-change.md:124-153`); `evidence_records` restate the evidence in front matter (`docs/artifact-driven/06-guidelines/evidence-records.md:9`); the unit brief restates acceptance and evidence (`units-of-work.md:58`).
- Effect: in `change-hidden-tab-streams` the task DAG is stated 4 times and the approval 6 times (M, git-cost §2); about 39% of task lines restate or point to facts kept elsewhere; unit briefs are 75% front matter (M, git-cost §2). In #38 the test count appears in 3 files and the validator result in 4 (unit profile C2). Approval sentences appear in 55% of unit files (M).
- Risk controlled: none is stated for the restatement itself. The bundle's own rule points the other way: "Keep one authoritative source for each fact" (`docs/artifact-driven/required-skills/kiss/SKILL.md:15`). The Plane's task reader parses only `id`, `depends_on`, title and DoD boxes (`apps/artifact-plane/server/task-graph.js:40-42`), so the restated sections serve no tool.

### C3. Self-check blocks multiply

- Rule: "Record `self_check` where readers need it" (`docs/artifact-driven/02-methodology/workflow.md:20`); the Plane's readiness list needs Requirement, Specification and Plan self-checks recorded (`apps/artifact-plane/src/pages/ChangePageModel.js:40-50`).
- Effect: #37 added four identical 6-line `self_check` blocks (24 of 54 added requirement and specification lines), three pointing at the same anchor in another file (unit profile A8).
- Risk controlled: phase evidence (`docs/artifact-driven/01-foundation/artifact-model.md:92`). One block per phase would carry the same evidence.

### C4. Mandatory reading is large and repeated

- Rules: every role reads its skill and both required skills before acting (`add-coordinator/SKILL.md:10`, `:14`; `docs/artifact-driven/03-execution/README.md:35`; `AGENTS.md:15`). The coordinator also reads the three other role skills (`add-coordinator/SKILL.md:26`), the claim rules (`:80`), the task format (`:40`), the unit format (`:64`) and the CI pattern (`:44`).
- Effect: unconditional reading per role is 2,576 (PO) to 10,117 (coordinator) words; conditional guidance raises the coordinator to 16,402 words (M, rule inventory from `wc -w`). The bundle is 39,197 words. In sessions, 912 bundle reads produced 1.5 M result tokens and 77 M carried token-turns; `kiss` and `asd-ste-100` were read 104 times and again in 25 extra contexts each (M, session-cost §4, §6).
- Risk controlled: acting on a summary or stale instruction (`add-coordinator/SKILL.md:14`). The rule already allows reuse in the same session, so the 223 same-context re-reads control nothing; they are a habit, not a rule.

### C5. No deterministic validator is in the loop

- Rule: "No standalone runner or CLI validator is required: authors and coordinators apply these rules in existing phase self-checks" (`writing-artifacts.md:96`). The Plane has `apps/artifact-plane/scripts/validate-knowledge.mjs` (JSON output, exit codes at `:41-43`), but it is not in `package.json` scripts (`apps/artifact-plane/package.json:9-16`), not in CI (`.github/workflows/ci.yml:20-28`) and not named by the bundle or by `se-adopt` (Plane inventory §1).
- Gaps in the validator: it does not check task governing links, `self_check` or `evidence_records` sources (`apps/artifact-plane/server/workflow.js:74-80` is not called by the script), relative links, placeholder text or the version record against the identity record (Plane inventory §1).
- Effect: self-checks are done by rewriting: 123 extra writes before a commit (M, session-cost §4). Evidence about validator runs is written by hand in 50 files (M, git-cost §5).
- Risk controlled: the rule avoids "a second tracking system" (`kiss/SKILL.md:17`) and a workflow database (`03-execution/README.md:64`). A validator is a check, not a store, so this risk does not apply.

### C6. Traceability is prose, so coverage is restated and read by hand

- Rule: tasks state "governing references" in prose (`writing-artifacts.md:57`). Requirement IDs are a writing convention (add-plane survey `:73`).
- Effect: every task's Governing knowledge is a sentence (unit profiles A6, B6, C6), and the plan self-check restates coverage ("Task hidden-tab-streams covers R11", `docs/artifacts/artifact-plane/changes/change-hidden-tab-streams/tasks/README.md:25-27`). No tool can check that R11 exists.
- Risk controlled: none is stated for prose over structure. The structured form already exists for cross-artifact links (`references:` in `docs/artifacts/artifact-plane/specifications/change-impact.md:2-5`).

### C7. Three gates for every size

- Rules: plan approval (`AGENTS.md:17`; `add-coordinator/SKILL.md:30`), version confirmation by the user (`docs/artifact-driven/02-methodology/validation.md:35`), team review and merge (`validation.md:39`).
- Effect: 96 gate prompts; each ends an agent turn (M, session-cost §6). Codex asked 14 structured version confirmations. Plan approval is fast (median 2 min) but for small changes it is still 6 to 14 min of the 17 to 21 min lead time (M, git-cost §3).
- Risk controlled: authorization comes only from the user (`artifact-model.md:94`); the semver level drives consumer behavior (`artifact-model.md:140-144`). For a small change the owner has already asked for the fix, and a patch level follows from the definition "corrects a defect or clarifies knowledge without breaking compatibility" (`artifact-model.md:142`). The owner's guarantee requires approval for "the plan of a large change", so the gate is real for medium and cross-capability changes and not real for small ones.

### C8. Three phase commits in one minute

- Rule: "Each completed phase produces a commit" (`workflow.md:70`); "separate phase commits" (`AGENTS.md:17`).
- Effect: #33, #34 and #37 committed Requirement, Specification and Plan within 0 to 1 min of each other (M, git-cost §3). Git output is 21% of Codex calls (M, session-cost §2).
- Risk controlled: per-phase evidence and the return of corrections to the owning phase (`workflow.md:66`, `:70`). Three commits one minute apart give no reader more than one commit would.

### C9. Implementation context is the largest token sink, and the method keeps it in one session

- Rules: one TL session for Specification and Plan (`add-coordinator/SKILL.md:28`); knowledge edits stay with the coordinator (`:48`); workers return commits (`:46`). Nothing in the bundle advises how to keep implementer context small.
- Effect: 13 fork subagents averaged 509 k tokens per call and 332 M input (29%); general-purpose subagents averaged 168 k (M, session-cost §6). Whole-file code reads are 39% of carried tokens (M).
- Risk controlled: continuity of context. BMAD's practice gives the implementer only the plan path (`surveys/bmad.md:233`); ADD's dispatch rule already lists what to give (`03-execution/README.md:60`).

### C10. Rework comes from unseen UI and from parallel version numbers

- Plane 1.16.0 passed its tests and DoD, and the owner found it unusable; the redesign cost 3.9 h and replaced 85% of the UI lines (M, git-cost §4). The method has no human look before the version (gates are plan, version, merge; `surveys/add-plane.md:240-251`). Later units added screenshot acceptance ad hoc (`docs/artifacts/artifact-plane/changes/change-navigation-hierarchy/tasks/02-validation.md:29`).
- The version number is chosen at plan time (`docs/artifacts/artifact-plane/changes/change-hidden-tab-streams/tasks/README.md:23`), so two parallel units both chose 2.7.0 and one was renumbered (M, git-cost §4).

### C11. The bundle is kept in two copies

- Fact: `src/archs/artifact-driven/bundle.go:14` embeds a byte-identical mirror; 13 of 14 bundle commits touch both (M, git-cost §5). Half of the bundle diff in method PRs is a copy (M).
- Risk controlled: a self-contained `se-adopt` release (`docs/artifacts/artifact-driven/specifications/delivery.md:16`). The risk is real; the mechanism (a committed copy) is not required by it.

### C12. Browser suites run serially

- Fact: `apps/artifact-plane/playwright.config.js` sets `workers: 1`; 14 spec files and 101 tests; single runs took 20, 10 and 10 min (M, session-cost §6; Plane inventory §7). The impact service already lists "tests to run" (`apps/artifact-plane/server/impact.js:228`), but no rule uses that list for a local run.

## Options table

| # | Option | Targets | Saving (small / medium / cross) | Guarantee touched | Effort | Owner artifact | Conflicts |
| --- | --- | --- | --- | --- | --- | --- | --- |
| O1 | Change-size tiers with a fast path | lead time, gates, files, K:C | large / none / none | plan approval (kept: small tier only) | M | artifact-driven, AGENTS.md | `AGENTS.md:17, :23`; `add-coordinator/SKILL.md:76` |
| O2 | One knowledge commit for small changes | commits, git tokens | small / none / none | none | S | artifact-driven, AGENTS.md | `AGENTS.md:17`; `workflow.md:70-72` |
| O3 | Validator in the loop and in the default install | rework, review time, self-check rewrites | medium / medium / medium | none (strengthens traceability) | M | artifact-plane, artifact-driven | `writing-artifacts.md:96` wording |
| O4 | Scaffold generator for change, plan, tasks, version | agent writing, placeholder errors | small / small / small | none | M | artifact-plane | none |
| O5 | Progressive disclosure of guidance | agent tokens | small / small / small | none | S | artifact-driven | `add-coordinator/SKILL.md:26`; `03-execution/README.md:35` |
| O6 | Structured `covers` links and requirement IDs | review time, traceability | small / medium / medium | none (strengthens traceability) | M | artifact-driven, artifact-plane | `writing-artifacts.md:57` prose rule |
| O7 | Single-source facts: derive, do not restate | K:C, writing, review | medium / medium / large | none | S | artifact-driven | scaffold in `minimal-change.md:104-153` |
| O8 | Batched and lighter gates | gate count, turns | medium / small / small | plan approval (kept for medium and cross) | S | artifact-driven, AGENTS.md | `validation.md:35`; `add-coordinator/SKILL.md:52` |
| O9 | Version number assigned at Version phase against `main` | rework (renumbering) | none / small / small | versions (kept) | S | artifact-driven, artifact-plane | plan template `minimal-change.md:104-122` |
| O10 | Plane review packet as PR body | human review time | small / medium / large | none | M | artifact-plane | none |
| O11 | Owner look before the version for UI changes | rework | none / large / small | none; adds one wait | S | artifact-driven | none |
| O12 | Implementer context rules (plan path, fresh agents, section reads) | agent tokens | none / large / medium | none | S | artifact-driven | none |
| O13 | Build-time bundle mirror | agent effort on method changes, diff size | none / none / medium (knowledge-only PRs) | none | S–M | artifact-driven (delivery spec) | `delivery.md:16` |
| O14 | Impact-selected local tests, full suite in CI | tool wall-clock | small / medium / small | none | S | artifact-plane, artifact-driven | none |
| O15 | Configuration file and harness profiles | extensibility; enables O1 and O5 thresholds | none directly | none | M | artifact-driven | none |
| O16 | Required independent review for the large tier | rework; Validation score | negative tokens / rework down (A) | none | S | artifact-driven | `validation.md:7`; `workflow.md:29` |

Rejected: skipping knowledge for "one-line fixes" as OpenSpec advises (`surveys/openspec.md:209`). A fix that changes documented behavior must edit the requirement or specification, or `main` stops showing the current truth. O1 keeps that edit and removes the rest. A code-only maintenance tier (tier 0) is offered inside O1 as an owner decision.

## Option details

### O1. Change-size tiers with a fast path

Mechanism. Three tiers, decided by the coordinator at Requirement and recorded as `tier:` in the change README front matter (the README "needs no front matter" today, `writing-artifacts.md:22`; an optional key breaks no reader).

- **Small tier entry criteria** (all must hold): one artifact; one repository; patch compatibility level by the definition at `artifact-model.md:142`; no change to a `references:` consumer, flow contract, route or API; no new requirement ID and no new flow; no ADR; no upstream version needed that is not established; under 100 changed code and test lines (BMAD's one-shot threshold, `surveys/bmad.md:375`; the measured small changes are 42 and 50 lines, git-cost §1); the Plane impact query over the diff reports no direct or transitive entity outside the artifact (`apps/artifact-plane/server/impact.js:228`, coverage statement at `:262-264`).
- **Exclusions**: anything the validator (O3) or the impact query marks as unresolved; any change the owner names as large.
- **Small-tier path**: change README with reason, scope, tier and the one-paragraph plan; requirement and specification edited in place with one `self_check` block each; `tasks/README.md` with one task; one task file; version record and identity bump; no unit brief (needs the `AGENTS.md:23` change); one knowledge commit (O2); the request counts as plan approval, and the plan is shown in the PR body (O10); patch version confirmed by the owner at merge, not as a separate prompt (O8).
- **Medium and large tiers**: unchanged phases, approval and gates. The large tier (cross-capability or contract change) adds O11 and, if the owner decides, O16.
- **Tier 0 (owner decision)**: code-only maintenance with no documented behavior change (lint, typo, dependency bump). No change record, no version; the PR title carries `maintenance`. The validator cannot check "no behavior change", so the PR reviewer enforces it.

Saving. Small: files 13 to 7 (unit brief 64 lines, two task files about 80 lines and three duplicated self-check blocks 18 lines removed; plan 27 to about 8 lines): 312 to about 130 lines (E, from unit profile A1 and A8). Commits 5 to 2. Gates 3 to 1. Lead time: the 6 to 14 min plan wait and the version prompt disappear; 17 to 21 min becomes about 8 min (E: measured Requirement-to-Plan of #37 is 1 min, implementation 0 to 10 min, merge 2 to 4 min). Tokens: fewer written and self-checked files; no direct measure; A: 20 to 30% per small change. Medium and cross: no change.

Guarantees. `main` truth: requirement and specification are still edited in place. Traceability: the one task still names its governing IDs (O6). Versions and established rule: the patch version record is still written and establishes on `main`. Upstream wait: an unestablished upstream excludes the small tier. Plan approval: the owner fixed this for "a large change"; the small tier is not large.

New risks. Mis-tiering: a change that touches a consumer slips through as small. Control: the impact query and validator check the entry criteria; the PR reviewer sees `tier: small` in the packet (O10). Tier 0 hides behavior changes if misused.

Conflicts. `AGENTS.md:17` (phase commits, approval for every plan), `AGENTS.md:23` (unit for every outcome), `add-coordinator/SKILL.md:76` (keep phase commits and plan approval for the small scaffold), `workflow.md:70-72`.

### O2. One knowledge commit for small changes

Mechanism. For the small tier, Requirement, Specification and Plan are committed together when they complete in the same session. Medium and large keep separate phase commits.

Saving. Small: 5 commits to 2 (knowledge; implementation with version). Git calls per change: no per-change measure; Codex git is 21% of calls (M), so A: 10 to 15% fewer calls in a small Codex session. Measured phase gaps show nothing is lost: R, S and P of #33, #34, #37 are 0 to 1 min apart (M, git-cost §3).

Guarantees. None touched; commits are evidence of work, not a guarantee (`03-execution/README.md:66`).

Conflicts. `AGENTS.md:17`; `workflow.md:70-72`; `add-technical-lead/SKILL.md:16, :34, :44`.

### O3. Validator in the loop and in the default install

Mechanism. (a) Add `npm run validate` (wrapping `scripts/validate-knowledge.mjs`) and a CI step in `.github/workflows/ci.yml`. (b) Extend the script: resolve `self_check.source` and `evidence_records[].source` (reuse `server/workflow.js:74-80`); resolve relative links; reject placeholder text from the templates ("Replace this text.", `server/knowledge-operations.js:68-72`); check the version record against the identity record and `package.json`; check that `depends_on` targets have an established version on the protected ref (`server/knowledge-baseline.js`); check O6 `covers` ids; check tier entry criteria (O1); list other branches with an open change on the same artifact (`git for-each-ref`, a conflict check). (c) Add a `--scope <change>` flag so a run on a large repository stays fast. (d) Bundle rule: "When the validator is available, its passing run is the structural part of the self-check; record its output path, not its prose. Without it, apply the rules by hand." (e) Ship it: `se-adopt` copies the script and runs it when Node is present; a Go port is an owner decision.

Saving. Self-check rewrites: 123 extra writes over 312 files; A: half are structural and avoidable, so about 0.2 rewrites per file less. Evidence prose about validator runs (90 lines in 50 files, M, git-cost §5) becomes one line. Review time: the reviewer no longer checks links and sources by hand (not measured). Rework: catches wrong anchors like the three self-check blocks pointing at another file (unit profile A8) before the commit. All sizes.

Guarantees. None weakened; traceability and the established rule gain a check.

New risks. A Node dependency for adopters without the Plane. Control: the rule keeps the by-hand path.

Conflicts. `writing-artifacts.md:96` says no runner is required; the wording changes to "not required, but used when available".

### O4. Scaffold generator for change, plan, tasks and version

Mechanism. One composite operation `change.scaffold` (Plane operation or `node scripts/scaffold.mjs`) that calls the existing `change.start` (`knowledge-operations.js:245`), `task.add` (`:327`), `unit.create` (`:396`, medium and large only) and, at Version, `version.prepare` (`:563`) with derived fields: `source_change`, compatibility level from the tier, `current_version` bump, the version record summary from the change README first paragraph. Templates lose the sections that O7 removes.

Saving. Knowledge writes are 1% of result tokens (M, session-cost §2), so the token saving is small. The saving is in errors: placeholder text, wrong anchors and inconsistent version numbers are the defects the validator finds today by hand. A: 5 to 10 min per change of self-check and correction.

Guarantees. None. Effort M because the operations exist and a composite with digests is new (Plane inventory, gap b).

### O5. Progressive disclosure of guidance

Mechanism. (a) Each role skill becomes a core of at most 400 words with a "read when" table; today they are 730 to 1,854 words (M). (b) `kiss` and `asd-ste-100` become a one-screen checklist embedded in the self-check section of each role skill; the full skills stay for reference. (c) The unconditional reads of the three other role skills by the coordinator (`add-coordinator/SKILL.md:26`), the claim rules (`:80`) and the unit format (`:64`) become conditional on the phase. (d) A rule: a harness that lists a skill's full text in context counts as "loaded"; re-reading a file already in the same context is a defect, not diligence (`add-coordinator/SKILL.md:14` already allows reuse).

Saving. Unconditional reading: coordinator 10,117 to about 2,500 words; PO 2,576 to about 1,200 (E, from the `wc -w` table). Guidance reads cost 1.5 M result tokens and 77 M carried token-turns over 25 sessions (M); A: 60% avoidable, about 46 M carried token-turns, which is about 3% of all input. The lead-time effect is small. The clearer effect is on Codex, where guidance is 23.5% of tool-result tokens (M).

Guarantees. None.

Conflicts. `03-execution/README.md:35`; `AGENTS.md:15` ("read and apply" both skills); `add-coordinator/SKILL.md:26`.

### O6. Structured `covers` links and requirement IDs

Mechanism. (a) Requirement files declare IDs in a parseable form: a `### R11` heading or a front-matter `requirements:` list with `id` and `text`. (b) Task front matter adds `covers: [{artifact, element, ids}]`, replacing the prose Governing knowledge section. (c) Plan front matter needs no coverage paragraph; the validator (O3) computes coverage: every id in the change's requirement edits is covered by a task, every `covers` id exists. This is BMAD's `covers` with validation (`surveys/bmad.md:119, :176`), done by a script instead of a model. (d) Optional: `evidence_records[].paths` for code and test files, checked for existence, so the task-to-code link is structured.

Saving. Plan self-check coverage paragraphs (about 3 to 6 lines per plan) and Governing knowledge prose (3 lines per task) are replaced by 2 to 4 front-matter lines. The reviewer gets a computed coverage table instead of reading tasks. Medium and cross-capability changes gain most: #36 has 10 tasks and 12 requirement IDs restated in `docs/artifacts/artifact-plane/changes/change-impact-intelligence/tasks/README.md:37-42`.

Guarantees. Traceability becomes checkable; nothing weakened.

New risks. A migration of existing requirement files to parseable IDs. Control: IDs are already written as `R11`-style tokens in body text; a heading convention needs no rewrite of meaning. Effort M.

Conflicts. `writing-artifacts.md:57` (prose references). The claim records of 2.9.0 (`evidence-records.md:57`) link claims to evidence, not tasks to requirements, so no overlap.

### O7. Single-source facts: derive, do not restate

Mechanism. Guideline and scaffold changes:

- Remove the task Prerequisites section; `depends_on` and the plan's approval line are the source (`writing-artifacts.md:94` already forbids guessing dependencies from prose).
- Remove the approval sentence from the task evidence preamble; approval is stated once in the plan README (or in the PR under O8).
- `evidence_records.source` defaults to the task's own Evidence section when omitted; today every record points at its own file (unit profile D).
- Unit brief evidence entries reference task evidence; they do not restate results. Unit acceptance criteria reference requirement acceptance IDs instead of copying the text ("within 5 seconds" in three files, unit profile A2).
- Numeric results (test counts, validator output) are stated once, in the task that ran them; other records link.
- The version record body is the change README's first paragraph plus the level; the boilerplate line about "no knowledge directories" is dropped (it is in 16 files verbatim, M, git-cost §2).

Saving. About 39% of task lines restate (M); unit-brief front matter is 75% (M); 4.6% of in-place sentences restate another file (M). Small: 312 to about 200 lines without tiers (E: Prerequisites 3 × 3 lines, evidence preambles 3, unit evidence 17 of 64 brief lines, boilerplate, duplicated acceptance). Medium (#36): the 131-line brief loses about 30 evidence lines and 10 tasks lose about 50 lines (E). Cross (#38): about 1,242 of 3,049 lines are process records (unit profile C1); A: 25% of those are restatement.

Guarantees. None; the facts stay, each in one place.

Conflicts. Scaffold text in `minimal-change.md:104-153`; `units-of-work.md:58` (evidence entries with method and result).

### O8. Batched and lighter gates

Mechanism. (a) Small tier: the request is the approval; the plan appears in the PR body. (b) Multi-member units: one approval for all member plans (already practiced: "Present this plan with the plans of the other unit members", `docs/artifacts/artifact-driven/changes/change-visual-artifacts/tasks/README.md:17`). (c) The semver level is proposed in the plan and confirmed with the plan approval; the coordinator asks again only if the level changes. (d) The merge notice is read from Git, not asked.

Saving. Gate prompts: 14 version confirmations and 19 merge notices of 96 (M) disappear or merge into other prompts; A: 30% fewer gate turns. Plan-approval latency is already 2 min median, so the lead-time saving is in the small tier (6 to 14 min, M) and in Codex's Version/PR phase (10% of active time, M).

Guarantees. Plan approval stays for medium and large. Version confirmation is not one of the five guarantees; the level is still a human decision, taken earlier.

Conflicts. `validation.md:35`; `add-coordinator/SKILL.md:52`; `AGENTS.md:17`.

### O9. Version number assigned at Version phase against `main`

Mechanism. The plan states only the level (patch, minor, major). The number is computed at Version from `current_version` on the protected ref, and the validator (O3) rejects a record that is not greater than it. The Plane's `version.prepare` (`knowledge-operations.js:563`) can compute it.

Saving. Removes the renumbering rework of 2.7.0 to 2.8.0 (M, git-cost §4) and the number restated in 2 to 7 files per unit (M, git-cost §2). Effort S. No guarantee touched.

### O10. Plane review packet as PR body

Mechanism. A server-side Markdown rendering of the change packet (`server/change-review.js:149`): tier, changed knowledge with line diffs (today client-only, `src/pages/ChangePageReview.jsx:75-109`), task DoD and evidence table, coverage table (O6), validator result (O3), impact coverage statement, proposed level, open claims. The agent runs `gh pr create --body-file`; the Plane never pushes (`apps/artifact-plane/README.md:63`).

Saving. The reviewer reads one page instead of 13 to 52 files. Not measured: session-cost has no reading-time data. Version-to-merge medians are 7 min (M); the plan is to measure after release. Largest effect for cross-capability changes.

Guarantees. None. Approval stays "not a file fact" (`artifact-model.md:94`); the packet keeps "Approval not verified by this reader." (`server/change-review.js:14`).

### O11. Owner look before the version for UI changes

Mechanism. For medium and large tiers that change the Plane UI, the plan includes one criterion "owner viewed screenshots or the running page" before Version. `scripts/impact-screenshots.mjs` exists for screenshots. This adds one wait but moves it before the version.

Saving. The 1.16.0 rebuild cost 3.9 h and a 1.17.1 patch at +17 h (M). The small tier is excluded (CSS fixes still get a screenshot in the PR). Effort S. New wait: one owner look, which happened anyway after the version in #36 (35 min, M).

### O12. Implementer context rules

Mechanism. Add to `working-with-ai.md`: dispatch implementers as fresh agents with the task path, governing paths and DoD (BMAD's "sole source of truth", `surveys/bmad.md:233`), not as forks; read code by section or symbol; compact or start a new context at phase boundaries; subagents return short summaries.

Saving. Forks: 652 calls at 509 k average (332 M). At the general-purpose average of 168 k the same calls cost 110 M, a saving of about 220 M or 19% of Claude input (E; assumes the same call count). Medium and large changes only, where forks are used.

Guarantees. None. Effort S.

### O13. Build-time bundle mirror

Mechanism. `src/archs/artifact-driven` is generated at build time (`go generate` copying from `docs/artifact-driven`, ignored by Git) or the embed root moves next to the bundle. `go:embed` cannot reach a parent directory, so a generate step is needed.

Saving. 1,152 duplicated lines across #29 to #39 (M, git-cost §5); half of the bundle diff in method PRs. Agent effort: one copy step and one diff check per method change (`docs/artifacts/artifact-driven/changes/change-adoption-guidance/tasks/01-guidance.md:50`). Effort S to M. The release must still be self-contained (`delivery.md:16`).

### O14. Impact-selected local tests, full suite in CI

Mechanism. The implementer runs the tests that `get_change_impact` lists under `verify` plus the unit suite; CI runs the full browser suite. Raise `workers` in `playwright.config.js` where the tests allow it.

Saving. 3.4 h of Claude test wall-clock over 11 sessions, with 20-min runs (M). A: half the local runs become 2 to 5 min runs. Risk: a regression found only in CI. Control: CI stays complete.

### O15. Configuration file and harness profiles

Mechanism. `docs/artifacts/add.config.yaml` (or front matter in `AGENTS.md`) holds tier thresholds, whether a unit brief is required for one-member outcomes, the required-reading set per role, and optional sections. Role profiles for Claude Code (`.claude/agents`) join the Codex ones (`.codex/agents`). The validator reads the config.

Saving. None directly; it makes O1 and O5 adjustable without editing the bundle. Effort M. Moves Extensibility to anchor 3 ("Templates or configuration overrides").

### O16. Required independent review for the large tier

Mechanism. A fresh-context review agent reads the diff as a path and the plan, and returns findings triaged as fix, defer or false (BMAD lenses, `surveys/bmad.md:244-250`). Required only for the large tier; optional elsewhere.

Saving. Unknown. Fix commits are 6.7% (M), and the costly rework was UI quality, which a text review would not catch. It adds tokens. It is listed because the Validation anchor 5 needs "a required independent review" (scores.md anchors). Conflicts with `validation.md:7` and `workflow.md:29`. Owner decision.

## Ranking and release sequence

Ranking by expected saving against risk (E; saving labels from the option details):

| Rank | Option | Why |
| --- | --- | --- |
| 1 | O7 single-source facts | Large line saving at every size, no guarantee touched, effort S |
| 2 | O3 validator in the loop | Removes hand-checking, enables O1 entry criteria and O6; effort M |
| 3 | O1 tiers with a fast path | Largest small-change saving; needs owner decisions |
| 4 | O6 structured coverage | Replaces restated coverage; raises two scores; effort M |
| 5 | O5 progressive guidance | Token saving, effort S, no risk |
| 6 | O8 lighter gates | Fewer turns; depends on O1 and O10 |
| 7 | O12 context rules | 19% of Claude input (E); effort S; outside knowledge records |
| 8 | O2 one knowledge commit | Small, safe, depends on O1 |
| 9 | O10 review packet | Review-time saving not measurable yet; effort M |
| 10 | O9 version at Version phase | Removes one rework class; effort S |
| 11 | O11 owner look for UI | Prevents the most expensive rework seen; adds a wait |
| 12 | O14 impact-selected tests | Tool time; small risk |
| 13 | O4 scaffold generator | Convenience; small token effect |
| 14 | O13 build-time mirror | Method PRs only |
| 15 | O15 configuration | Enabler; score effect only |
| 16 | O16 independent review | Unknown saving, token cost, conflicts with a stated rule |

Release sequence:

| Release | Options | Decisions needed first | Expected effect (E) |
| --- | --- | --- | --- |
| R1 "less text, less reading" (ADD 2.10.0, Plane 1.20.0) | O7, O5, O12, O9, O14, O13 | D7 (mirror) only | Small-change knowledge lines 312 to about 200; guidance tokens down 3%; fork tokens down up to 19%; no score change |
| R2 "validator in the loop" (ADD 2.11.0, Plane 1.21.0) | O3, O6, O4, O10 | D5 (default install), D8 (IDs) | Self-check rewrites down; coverage computed; review packet in PRs; scores: Requirements 5, Living knowledge 5, Change management 5, Traceability 4, Validation 4 |
| R3 "tiers and gates" (ADD 3.0.0, AGENTS.md change) | O1, O2, O8, O11, O15 | D1, D2, D3, D4, D6 | Small change: 7 files, about 130 lines, 2 commits, 1 gate, about 8 min; scores: Low overhead 4, Extensibility 3 |
| R4 optional | O16, O6(d) code paths | D9 | Validation 5, Traceability 5 |

ADD 3.0.0 is a major version because R3 changes rules consumers follow (`artifact-model.md:134-144`); the owner confirms the level.

## Target profile

Anchors are those in `scores.md:9-20` after the revision at `scores.md:129-135`. Current ADD scores are at `scores.md:24-36` (35 of 50). The optional cross-capability criterion is at `scores.md:110-127` (ADD 5, totals of 55).

| Criterion | Now | Target | Options | Why the anchor is met |
| --- | --- | --- | --- | --- |
| Requirements | 4 | 5 | O6, O3 | Anchor 4 (required clarification and a quality check) is already met by the interview (`add-coordinator/SKILL.md:18`), the focused questions (`add-product-owner/SKILL.md:18`) and the self-check (`:24`). Anchor 5 needs stable IDs with coverage checked by a tool. O6 makes IDs a schema and `covers` a field; O3 checks that every edited requirement ID has a task and every cited ID exists. |
| Living knowledge | 4 | 5 | O3 (default install) | Anchor 5 needs a tool that validates it in the default install. Met only if `se-adopt` ships and runs the validator (D5). Without D5 the score stays 4. |
| Change management | 4 | 5 | O3 (conflict check) | Anchor 5 needs tool-detected conflicts between concurrent changes. The validator lists other branches with an open change on the same artifact or overlapping knowledge files. |
| Traceability | 3 | 4 (5 with O6d) | O6, O3 | Anchor 4 needs structured links on most of the chain, checked. Requirement to task is `covers`; task to version is `source_change`; code to reason is flow supports and the Plane. Anchor 5 needs the task-to-code link structured and checked: O6(d) `evidence_records[].paths` resolved by the validator. |
| Impact analysis | 4 | 4 | none | Anchor 5 needs broad language coverage; no option here widens it (JS, JSX, Go today, `research.md:72`). |
| Validation and review | 3 | 4 (5 with O16) | O3, O16 | Anchor 4 needs a deterministic validator in the default install (O3 with D5). Anchor 5 needs both the validator and a required independent review with enforced gates: O16 plus the CI step. |
| Workflow | 5 | 5 | none | Already met: roles, Git and PR integration, and parallel implementers in worktrees (`03-execution/README.md:56-60`). Routing by size (O1) is scored under Low overhead after the revision (`scores.md:133`). |
| Extensibility | 2 | 3 | O15 | Anchor 3 is templates or configuration overrides. A plug-in mechanism (anchor 4) is not proposed. |
| Low overhead | 1 | 4 (3 without tier 0) | O1, O2, O7, O8 | Anchor 4 needs 3 steps or fewer and a documented skip for trivial changes. Small tier: scaffold and knowledge commit, implement, PR; tier 0 is the documented skip (D1). Without tier 0 the small tier is an optional light path: anchor 3. Anchor 5 (one command with automatic routing) would need O4 to route by the impact query; not claimed. |
| Human interface | 5 | 5 | O10 | Unchanged. |
| Total (of 50) | 35 | 44 (41 without D1 and D5) | | BMAD is 39 (`scores.md:36`). |
| Cross-capability governance (optional) | 5 | 5 | O3 | Already met. O3's established-upstream check (`depends_on` targets have a version on the protected ref) makes the dependency gate tool-checked instead of agent-checked; the anchor does not need it. |
| Total (of 55) | 40 | 49 | | BMAD is 42 (`scores.md:127`). |

Expected profile after each release:

| Criterion | Now | after R1 | after R2 | after R3 | after R4 |
| --- | --- | --- | --- | --- | --- |
| Requirements | 4 | 4 | 5 | 5 | 5 |
| Living knowledge | 4 | 4 | 5 | 5 | 5 |
| Change management | 4 | 4 | 5 | 5 | 5 |
| Traceability | 3 | 3 | 4 | 4 | 5 |
| Impact analysis | 4 | 4 | 4 | 4 | 4 |
| Validation and review | 3 | 3 | 4 | 4 | 5 |
| Workflow | 5 | 5 | 5 | 5 | 5 |
| Extensibility | 2 | 2 | 2 | 3 | 3 |
| Low overhead | 1 | 1 | 1 | 4 | 4 |
| Human interface | 5 | 5 | 5 | 5 | 5 |
| Total (of 50) | 35 | 35 | 40 | 44 | 46 |
| Cross-capability governance | 5 | 5 | 5 | 5 | 5 |

R1 changes no score because the anchors measure mechanisms, not line counts. R2 depends on D5 for two of its points (Living knowledge 5 and Validation 4); without D5 the R2 total is 38.

## Score challenges

Scores are not edited here. Two scores look generous under their own anchors.

1. **BMAD, Validation and review 5.** Anchor 5 needs "Both, with enforced gates". The survey shows the step order enforced by prompt text ("NEVER skip steps", `surveys/bmad.md:80`) and an open issue where a build on a named ticket "skips the gates tickets.py next applies" (`surveys/bmad.md:436`). The verification-gap lens "reports clean when it cannot read the content" (`:438`). Prompt-level enforcement with a known bypass fits anchor 4 better than 5. If changed, BMAD's total is 38.
2. **ADD, Requirements 4.** The revised anchor 4 needs "a required clarification step". The skills say "Interview the user carefully" (`add-coordinator/SKILL.md:18`) and "ask focused questions about material gaps" (`add-product-owner/SKILL.md:18`). Neither bounds the questions or records them, as Spec Kit's `/clarify` does (at most 5 questions, recorded under a dated heading, `surveys/spec-kit.md:187`). The anchor says "required", not "bounded" or "recorded", so the score holds under the anchor as written. If the owner wants the anchor to mean a recorded step, ADD drops to 3 until O6 or a recorded clarification section is added.

No ADD score is too low under the anchors. Low overhead 1 is exact: "Six or more records and several gates for any change, no fast path" (`scores.md:19`) is what `minimal-change.md:17` and `surveys/add-plane.md:253` describe. Workflow 5 is consistent with the revised anchor, which moved routing by size out of Workflow (`scores.md:133`).

## Measurement plan

Repeat the baseline scripts after each release and report the same tables. Group by tier, which R3 records in the change README (`tier:`); before R3, group by the size definition above.

| Measure | Method | Baseline value |
| --- | --- | --- |
| Lead time, Requirement to merge, per tier | git-cost §3 method (reflog and dangling commits; run before `git gc` prunes) | small 17 to 21 min; medium 3.6 to 6.1 h; cross 75 min to 3 h |
| Human waits: count and duration per change | session-cost §5 method (gaps over 5 min ending in an owner prompt) | Claude 18 waits, 12.7 h; gate prompts 96 of 372 |
| Agent time and tokens per change | session-cost §1 method, one session per change where possible | small knowledge-only 0.6 h, 16.8 M; medium about 240 M; cross 122 M |
| Knowledge lines to code lines | git-cost §1 `classify.py` per squash merge | small 12 to 19; medium 0.31 to 0.82; cross 9.9 |
| Knowledge files per change | same | small 9 to 13; medium 31 to 33; cross 52 |
| Commits per change | git-cost §3 inventory | small 5; medium 25 to 43 |
| Restated facts | git-cost §2 shingle method | 4.6% of sentences; task lines 39% restated |
| Guidance read tokens and same-context re-reads | session-cost §4 | 912 reads; 223 re-reads; 23.5% of Codex result tokens |
| Rework: fix commits, patch versions within 48 h, spec survival, rewrites before commit | git-cost §4, session-cost §4 | 6.7%; 3 patches; 86 to 94%; 0.4 per file |
| Review time | new: time from PR open to merge, and the owner's reading time if logged | not measured |
| Validator failures caught before commit | new: count of error diagnostics in the pre-commit run (O3) | not measured |

Targets after R3 (E): small-tier lead time under 10 min; small-tier gates 1; K:C for small changes under 4; restated sentences under 2%; same-context re-reads under 20 per 25 sessions; no patch version within 48 h caused by an unseen UI.

Keep one session per change where possible, so tokens attribute cleanly (session-cost limits). Run the git-cost scripts within two weeks of each PR, before dangling commits are pruned (git-cost limits).

## Owner decisions

| # | Decision | Options affected | Current rule |
| --- | --- | --- | --- |
| D1 | Tier thresholds (100 lines; patch level; one artifact) and whether tier 0 (code-only maintenance, no record, no version) exists | O1 | none; `minimal-change.md:17` |
| D2 | Unit of work optional for one-member outcomes | O1 | `AGENTS.md:23` |
| D3 | Small tier: the request counts as plan approval, with the plan in the PR | O1, O8 | `AGENTS.md:17`; `add-coordinator/SKILL.md:30` |
| D4 | Semver level confirmed with plan approval instead of a separate prompt; patch confirmed at merge | O8 | `validation.md:35` |
| D5 | Validator in the default install: ship the Node script with `se-adopt`, or port to Go | O3 | `writing-artifacts.md:96`; `delivery.md:16` |
| D6 | One knowledge commit for the small tier | O2 | `AGENTS.md:17`; `workflow.md:70` |
| D7 | Generate the bundle mirror at build time | O13 | `delivery.md:16` |
| D8 | Requirement IDs as a schema (heading or front matter) and `covers` in tasks, with migration of existing files | O6 | `writing-artifacts.md:57` |
| D9 | Required independent review for the large tier | O16 | `validation.md:7`; `workflow.md:29` |

ADD 3.0.0 as the version for R3 is also the owner's call.

## Limits

- Savings after a release are estimates from measured baselines; none is measured yet. The calculations are shown so they can be checked.
- The small-change token figure is a knowledge-only proxy (#33), because no session isolates a small code change (session-cost §7).
- Human reading time is not in any measurement. The review-time effect of O10 cannot be stated as a number.
- The score targets use the anchors as written in `scores.md`. The session that wrote the scores also wrote the comparison, and the independent review may change the anchors or the current scores; targets would then move.
- Rules were read on branch `claude/framework-comparison` at `371e3ab` plus the research commit. Line numbers hold for that state. The other checkout (`claude/human-cognitive-support`) adds claim operations and a change brief to the Plane that this record does not count.
- Lines are not effort, phase classes come from commit subjects, and restatement detection is lexical (git-cost limits). Token shares use characters divided by 4 (session-cost limits).
- This record was written by the same model family that writes most of the knowledge it measures. Options that reduce agent text may look more attractive to it than to a human reader.
