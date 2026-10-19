# Delivery cost of ADD changes, measured from Git history

Measured on 2026-10-19 against `main` at `371e3ab` (#39) and the local branches `claude/human-cognitive-support`, `claude/claim-records-add`, `claude/human-cognitive-support-old` and `claude/framework-comparison`. The repository was only read. The analysis scripts ran with `python3 -I` in a session scratchpad and are not committed. This file holds measurements only, not proposals.

## Summary

1. Since the in-place layout (#29–#39, without the #30 conversion), the median PR adds 1,040 knowledge, 59 code and 123 test lines. Knowledge is a median 61% of added lines (p90 86%).
2. Per PR, K:C (added lines) has median 2.29 and p90 24.7. Summed over all these PRs it is only 1.11 (K:(C+T) 0.63): 13,009 knowledge lines against 9,873 code and 7,614 test lines.
3. Small fixes cost the most knowledge per code line: #37 has 312 knowledge lines for 50 code and test lines, #34 has 247 for 42, and #38 has 3,049 for 309. Three of the 10 PRs have no code at all.
4. Before the in-place layout (#8–#28), the median PR added 2,083 knowledge lines and the aggregate K:(C+T) was 7.41. Of all knowledge lines ever added on main, 67% have been deleted (54,344 of 80,809).
5. Where knowledge lines go (#29–#39 without #30): specifications 43%, change directories 30%, unit briefs 15%, requirements 8%, decisions 3%, version records 1%.
6. File anatomy (in-place era, 15,727 lines): 30.5% front matter, 22.4% blank, 9.5% headings, 35.4% prose. Unit briefs are 75% front matter. In task files, 44% is the evidence section and about 39% restates or points to other records.
7. Repeated facts: 4.6% of sentences in in-place units restate another file of the same unit, plus 2.8% shared template sentences (legacy units: 10.4%, up to 28%). 55% of unit files mention approval. One 5-file change states its task DAG 4 times and its approval 6 times.
8. Agents write the phases in minutes: Requirement→Plan has a median of about 8 min. Plan→first implementation (the approval wait) has a median of 14.5 min, with 70–73 min for #31 and #32 and 245 min for #35, which ran alongside #36. Version→merge has a median of 7 min. A whole PR (Requirement→merge) takes a median of about 2.1 h (p90 4.4 h).
9. Every gap over 30 min inside a unit is a human gate (plan approval, a user confirmation, an owner acceptance) or overlap with parallel work. The longest is a 218-min pause in the middle of #36.
10. Explicit fix commits are rare: 13 of 194 pre-squash commits (6.7%), adding 414 code and test lines. Spec rework is small: outside #29, 86–94% of Requirement/Specification/Plan lines survive to the branch tip. In #29 only 42% survived, because a superseded Codex plan of 2,139 lines was replaced.
11. The largest rework was the Plane 1.16.0→1.17.0 rebuild. 85% of the 1.16.0 UI source lines (1,666 of 1,970) and 47% of its test lines were replaced within 3 h 54 m, after its tests and DoD had all passed. There were also 4 follow-up patch versions: 1.17.1 (+17 h), 1.18.1 (+30 min), ADD 2.8.1 (+82 min) and Story-Driven 1.1.1. One branch was rebuilt and repackaged, rewriting 1,996 knowledge lines.
12. The bundle is kept in two byte-identical copies (`docs/artifact-driven` and `src/archs/artifact-driven`), so 1,152 lines per copy appear twice in the diffs of #29–#39. Also, the phase history of #35, #36 and #38 survives only as 187 dangling commits, which `git gc` deletes after 2 weeks by default.

## Method

**Line accounting.** `classify.py` runs `git show --numstat -M` on each squash merge and sorts each file into one bucket:

- (a) knowledge: `docs/artifacts/**`
- (b) bundle: `docs/artifact-driven/**` and `src/archs/**/*.md`, both copies counted
- (c) code
- (d) tests: `test/`, `*_test.go`, `*.test.*`, `*.spec.*`, `playwright.config*`
- (e) lockfiles and generated files: `package-lock.json`, `go.sum`, `dist/`
- other: READMEs, `package.json`, `AGENTS.md`

"+lines" means added lines, and every ratio uses added lines.

**Recovering the phase commits that the squash merges hide.** Two sources:

- The HEAD reflog (`git log -g HEAD`): 441 entries back to the first commit.
- `git fsck --unreachable --no-progress`: 187 unreachable commits. These hold the impact, visual-knowledge and visual-artifacts branches, whose worktrees are gone.

`inventory.py` keeps every commit that is not on main and was authored on or after 2026-10-16 17:00 +07. It drops stash commits and treats rebased or cherry-picked copies as one commit when author time and subject match. Result: 194 unique commits, plus 24 extra copies of 19 of them.

**Assigning commits.** `phases.py` gives each commit a PR (from its subject or its time window) and a phase class from subject keywords: requirement, specification, plan, implementation, evidence, fix, version, approval, merge, research or repackage.

**Survival.** `survival.py` runs `git blame` on the Plane code at the 1.16.0 merge, the 1.17.0 merge and HEAD. `spec_survival.py` runs `git blame -C -C -M` at each PR's branch tip and matches rebased copies by author time and subject.

**Anatomy.** `anatomy.py`, `tasksections.py`, `facts.py` and `numfacts.py` read the knowledge files on `main` through `git show` and `git cat-file`.

## 1. Lines per merged PR, #29–#39

Bundle columns count both copies; each copy received exactly half.

| PR | Versions | Knowledge files / + / - | Bundle files / + | Code files / + / - | Tests files / + / - | Lockfile/gen + | Other + | K:C | K:(C+T) |
|---|---|---|---|---|---|---|---|---|---|
| #29 | ADD 2.4.0 + Plane 1.14.0 in-place | 136 / +3631 / -217 | 42 / +526 | 27 / +1583 / -171 | 18 / +1364 / -9 | +2 | +38 | 2.29 | 1.23 |
| #30 | ADD 2.5.0 + Plane 1.15.0 legacy conversion | 1010 / +609 / -46100 | 6 / +8 | 2 / +95 / -9 | 2 / +36 / -2 | +2 | +5 | 6.41 | 4.65 |
| #31 | Plane 1.16.0 authoring workbench | 31 / +1471 / -5 | 0 | 38 / +3346 / -1182 | 33 / +1840 / -187 | +2 | +42 | 0.44 | 0.28 |
| #32 | Plane 1.17.0 redesign | 32 / +1061 / -181 | 0 | 60 / +3376 / -3272 | 36 / +2955 / -1936 | +32 | +22 | 0.31 | 0.17 |
| #33 | ADD 2.6.0 adoption guidance | 10 / +302 / -1 | 12 / +128 | 0 | 0 | 0 | 0 | n/a | n/a |
| #34 | Plane 1.17.1 nav hierarchy | 9 / +247 / -1 | 0 | 1 / +13 / -3 | 1 / +29 | 0 | 0 | 19.00 | 5.88 |
| #35 | ADD 2.7.0 visual knowledge | 15 / +738 / -1 | 30 / +1330 | 0 | 0 | 0 | 0 | n/a | n/a |
| #36 | ADD 2.8.0 + Plane 1.18.0 impact | 33 / +1180 / -2 | 6 / +78 | 22 / +1437 / -69 | 14 / +1185 / -9 | +23 | +23 | 0.82 | 0.45 |
| #37 | Plane 1.18.1 hidden-tab streams | 13 / +312 / -4 | 0 | 3 / +26 / -4 | 2 / +24 / -1 | 0 | +1 | 12.00 | 6.24 |
| #38 | ADD 2.8.1 + SD 1.1.1 + Plane 1.19.0 visual artifacts | 52 / +3049 / -34 | 0 | 3 / +92 / -7 | 2 / +217 | +938 (Mermaid) | +3 | 33.14 | 9.87 |
| #39 | ADD 2.9.0 claim records | 12 / +1018 / -1 | 18 / +234 | 0 | 0 | 0 | 0 | n/a | n/a |

| Metric | All 11 PRs: median / p90 / sum | Without #30: median / p90 / sum |
|---|---|---|
| Knowledge + | 1018 / 3049 / 13618 | 1040 / 3107 / 13009 |
| Knowledge files | 31 / 136 / 1353 | 23 / 60 / 343 |
| Bundle + (both copies) | 8 / 526 / 2304 | 39 / 606 / 2296 |
| Code + | 92 / 3346 / 9968 | 59 / 3349 / 9873 |
| Test + | 36 / 1840 / 7650 | 123 / 1951 / 7614 |
| Lockfile/gen + | 2 / 32 / 999 | 1 / 123 / 997 |
| Knowledge share of + lines | 70% / 85% | 61% / 86% |
| K:C, PRs with code | 4.35 / 23.24 / aggregate 1.16 (n=8) | 2.29 / 24.66 / aggregate 1.11 (n=7) |
| K:(C+T) | 2.94 / 7.33 / aggregate 0.66 | 1.23 / 7.69 / aggregate 0.63 |
| Knowledge-only PRs | 3 | 3 |

Knowledge + lines by record kind:

| PR | Requirements | Specifications | Decisions | Changes | Versions | Unit | Other |
|---|---|---|---|---|---|---|---|
| #29 | 403 | 2032 | 212 | 640 | 27 | 281 | 36 |
| #30 | 2 | 5 | 0 | 300 | 187 | 110 | 5 |
| #31 | 113 | 656 | 45 | 528 | 11 | 114 | 4 |
| #32 | 109 | 307 | 25 | 513 | 11 | 94 | 2 |
| #33 | 43 | 65 | 0 | 125 | 9 | 59 | 1 |
| #34 | 52 | 14 | 0 | 111 | 9 | 60 | 1 |
| #35 | 56 | 285 | 23 | 277 | 13 | 83 | 1 |
| #36 | 76 | 367 | 64 | 520 | 18 | 131 | 4 |
| #37 | 20 | 53 | 0 | 165 | 9 | 64 | 1 |
| #38 | 159 | 1628 | 23 | 841 | 27 | 368 | 3 |
| #39 | 57 | 140 | 23 | 119 | 9 | 669 (563 research) | 1 |
| Sum without #30 | 1088 (8%) | 5547 (43%) | 415 (3%) | 3839 (30%) | 143 (1%) | 1923 (15%) | 54 |

**Before the in-place layout (#8–#28, n=21).** Knowledge + lines: median 2,083, p90 5,731, sum 59,982. Code+test + lines: median 273, sum 8,098. K:(C+T): median 5.19, p90 30.1, aggregate 7.41. Biggest knowledge PRs: #26 +11,414, #28 +6,496, #27 +5,731. #9 deleted 7,425 snapshot lines.

**Rewriting before the squash** (pre-squash added lines ÷ squash added lines):

| PR | Knowledge | Code+test |
|---|---|---|
| #29 | 1.07 | 1.02 |
| #30 | 5.87 (the conversion deleted 49,005 lines, then restored 3,086) | – |
| #31 | 1.07 | 1.03 |
| #32 | 1.05 | 1.03 |
| #33–#38 | 1.02–1.08 | – |
| #39 | 1.48 (research and change-brief text moved to a later PR) | – |

Almost no text is written and then rewritten inside a branch.

## 2. Knowledge-file anatomy

**Scope.** All change directories, unit briefs and version records on main, plus the 137 requirement, specification and decision files touched by #29–#39: 533 files and 26,383 lines. The in-place-era subset (files added in #29 and #31–#39, plus those requirements, specifications and decisions) is 283 files and 15,727 lines.

| Set | Front matter | Blank | Headings | Prose | DoD checklist | Link-only |
|---|---|---|---|---|---|---|
| All eras | 28.3% | 26.2% | 11.6% | 29.5% | 3.8% | 0.6% |
| In-place era | 30.5% | 22.4% | 9.5% | 35.4% | 1.8% | 0.4% |

By type, in-place era:

| Type | Files | Lines | Front matter | Prose | Notes |
|---|---|---|---|---|---|
| Unit brief | 10 | 946 | 75% | 9% | |
| Change README | 13 | 218 | 0% | 22% | plus 24% link-only lines |
| Plan README | 13 | 416 | 31% | 31% | |
| Task | 62 | 3081 | 19% | 29% | plus 9% checklist |
| Version record | 14 | 143 | 29% | 28% | |
| Requirements | 41 | 1635 | 3% | 48% | |
| Specifications | 66 | 7781 | 42% | 35% | flow records |
| Decisions | 30 | 577 | 0% | 34% | |

- **Unit-brief front matter across all 25 briefs:** evidence 444 lines, acceptance 414, affected_flows 271, flow_assessment 164.
- **In-place task files**, 1,693 non-blank lines: evidence section 43.8%; front matter (`evidence_records` restating the evidence, plus `depends_on`) 26.5%; DoD 17.0%; scope and ownership, governing knowledge, prerequisites 12.6%. About 39% of task lines restate or point to facts kept elsewhere.

**Boilerplate.** "Content lines" are lines longer than 25 characters. A line is "templated" when, after replacing digits, links and code with placeholders, it appears in 3 or more files.

| Set | Content lines | Templated | Exact duplicates (2+ files) |
|---|---|---|---|
| All eras | 10,878 | 14.3% | 33.5% |
| In-place era | 7,148 | 6.9% | 11.6% |

The all-era duplicate rate is inflated by the 50 legacy requirement and specification copies in `change-model-explanations`, which account for 989 duplicate lines.

Phrase counts on main (lines / files / in-place files):

| Phrase | Lines | Files | In-place files |
|---|---|---|---|
| "approv" | 764 | 361 | 114 |
| "self-check" | 424 | 239 | 82 |
| "KISS" | 335 | 265 | 66 |
| "STE" | 322 | 256 | 65 |
| "npm test" | 126 | 85 | 29 |
| "validate-knowledge" | 90 | 50 | 47 |
| "established…" | 60 | 53 | 23 |
| "Explicit user approval of this plan" | 42 | 42 | 17 |
| "Executed on N October" | 33 | 33 | 29 |
| "This record holds no knowledge directories and no tasks." (verbatim) | 16 | 16 | 14 |
| "renewed approval" | 15 | 15 | 10 |

Task Prerequisites sections contain only approval sentences and restatements of `depends_on`.

**The same fact in several places** (6-word shingles; a sentence counts as restated when at least 50% of it appears in another file of the same unit):

| Units | Sentences | Restated in the same unit | Shared template |
|---|---|---|---|
| In-place units | 2,808 | 4.6% | 2.8% |
| All 25 units | 7,963 | 10.4% | 2.7% |

- Worst legacy units: model-explanations 28%, unit-of-work-exploration 21%, codex-execution 16%.
- Task sentences are mostly restated in other tasks (396 of 475 restated task sentences).
- Change READMEs and version records restate each other (25 sentences in each direction).
- Numeric results (such as test counts) in the in-place units: 33 of 89 appear in 2 or more files, and one appears in 8.
- 63 of 114 unit files (55%) mention approval.
- A single version number is stated in 2–7 files per unit.

Example, `change-hidden-tab-streams`: task DAG stated 4 times (`depends_on`, Prerequisites, the plan list, the plan self-check); approval stated 6 times; each DoD result stated 3 times (the checked box, the evidence prose, `evidence_records`), and the unit-brief evidence adds a fourth.

## 3. Phase timing

The unmerged branches, on 10-19:

- `claude/human-cognitive-support-old`: Research 09:54, Requirement 09:58, Specification 10:01, Plan 10:03, Implementation 10:08–10:15, Version 10:19.
- `claude/claim-records-add`: one commit at 10:22, merged as #39 at 10:24.
- `claude/human-cognitive-support`: Requirement, Specification, Plan and Implementation recreated in the same second at 10:24:54. An earlier recreation at 10:24:38 was discarded. Then Implementation commits at 10:28 and 10:30.
- `claude/framework-comparison`: one research commit.

Recovered timings for all PRs (times +07):

| Unit | Commits | Requirement | Specification | Plan | Plan→first impl | Impl span | Version→merge | Requirement→merge | Approval commits |
|---|---|---|---|---|---|---|---|---|---|
| #29 | 29 | 10-16 18:05 | 18:06 | 18:54 | 17 min | 98 min | 19 min | 3.0 h | – |
| #30 | 4 | – | – | – | – | 7 min | – | – | user confirmation 21:51 (31 min wait) |
| #31 | 25 | 10-17 08:53 | 08:59 | 09:01 | **70 min** | 2.3 h | 14 min | 3.8 h | – |
| #32 | 39 | 10-17 12:56 | 13:13 | 13:14 | **73 min** | 95 min | 32 min | 3.6 h | – |
| #33 | 5 | 10-18 09:12 | 09:14 | 09:14 | 7 min | 0 | 7 min | 16 min | – |
| #34 | 5 | 09:34 | 09:34 | 09:35 | 14 min | 0 | 4 min | 21 min | – |
| #36 | 43 | 10:07 | 10:17 | 10:17 | 15 min | 5.0 h | 37 min | 6.1 h | plan decisions 10:29; owner accepted Impact page 16:09 |
| #35 | 5 | 10:35 | 10:43 | 10:43 | **4.1 h** (parallel with #36) | 0 | 2 min | 4.2 h | – |
| #38 | 14 | 16:17 (survey 15:01) | 16:34 | 16:35 | 7 min | 47 min | 1 min | 75 min | – |
| #37 | 5 | 16:23 | 16:24 | 16:24 | 6 min | 0 | 2 min | 17 min | – |
| #39 | 9 | 10-19 09:58 | 10:01 | 10:03 | 6 min | 1 min | – | 26 min | mockup for approval 10:15; approved 10:19 |

- **Requirement→Plan:** median about 8 min.
- **Plan→implementation:** median 14.5 min.
- **Version→merge:** median 7 min.
- **Requirement→merge:** median about 2.1 h, p90 about 4.4 h.
- 11 PRs merged in about 37 h of wall-clock time, with overnight gaps between units.

Gaps of 20 minutes or more inside a unit:

| Unit | Gap | What came before → after |
|---|---|---|
| #29 | 41 min | superseded Codex plan → new in-place Requirement |
| #29 | 29 min | implementation pause |
| #30 | 31 min | waiting for user confirmation |
| #31 | 70 min | plan approval |
| #31 | 25 min, 29 min | implementation pauses |
| #32 | 73 min | plan approval |
| #35 | 245 min | parallel work |
| #36 | 218 min | 10:56–14:34, implementation pause |
| #36 | 35 min | owner acceptance |
| #38 | 76 min | survey → Requirement |

Every gap over 30 minutes matches a human gate or parallel work.

Lines added by phase class:

| Class | Commits | Knowledge | Bundle | Code | Test |
|---|---|---|---|---|---|
| Implementation | 82 | 5180 | 2306 | 10406 | 7664 |
| Requirement | 12 | 3322 | – | – | – |
| Specification | 11 | 3362 | – | – | – |
| Plan | 11 | 2713 | – | – | – |
| Evidence | 22 | 1813 | – | 6 | 17 |
| Version | 12 | 512 | – | – | 5 |
| Fix | 13 | 19 | 2 | 134 | 280 |
| Repackage | 9 | 1996 | 234 | – | – |
| Approval | 4 | 36 | – | – | – |
| Research | 2 | 802 | – | – | – |
| Merge | 15 | – | – | – | – |

Requirement, Specification and Plan together are 9,397 knowledge lines, 1.8 times the knowledge written during implementation.

## 4. Rework signals

- **Fix commits:** 13 of 194 (6.7%). #32 has 5 (suite-found gaps and shell fixes); #29 has 3 (a responsive regression after a merge, a legacy publication rule, and a "wip" commit); #36 has 2 ("Correct the discovery cutoff criterion", "Align the impact contracts"); #31 has 1 contract amend; #38 has 2. Together they add 134 code and 280 test lines.
- **Subject keywords:** fix 8, replace/remove 5, regression/repair 3, align/reconcile/renumber 3, gaps 2, again/recheck 2, amend 1, correct 1, wip 1. No commit subject says rework, redo, re-open or self-check.
- **Reflog activity in the in-place era:** 5 resets, 3 amends, 4 cherry-picks and 9 merges (6 from agent worktrees). 19 commits have 24 extra copies.
- **Superseded plan in #29:** Codex `add-autonomy-efficiency` (2,139 lines, Requirement/Specification/Plan at 18:05–18:09) was replaced at 18:49.
- **Spec survival to branch tip** (`blame -C -C -M`; this includes DoD ticks, so it is an upper bound on spec rework): #29 42% (1,656 of 2,862 lines changed); #31 87%; #32 89%; #33 93%; #34 91%; #35 86%; #36 86%; #37 91%; #38 94%; #39 91%.
- **Renumbering:** change-impact-semantics was renumbered from ADD 2.7.0 to 2.8.0 after #35 took 2.7.0 (merge `4762ec6`).
- **Repackaging:** human-cognitive-support was renamed to `-old`. ADD 2.9.0 was recreated as `278bb9c` (+1,018 knowledge, +234 bundle lines), and the Plane part was recreated twice. In all, 9 commits and 1,996 knowledge lines were rewritten.
- **Patch versions:**

| Version | Time after the minor | Cause | Code+test lines | Knowledge lines |
|---|---|---|---|---|
| Plane 1.17.1 | +17 h | owner UX feedback | 42 | 247 |
| Plane 1.18.1 | +30 min | latent stream defect found by the owner | 50 | 312 |
| ADD 2.8.1 | +82 min | additive, with 2 drawn-passage defects corrected | – | – |
| Story-Driven 1.1.1 | – | additive | – | – |

- **Knowledge text:** "first run failed / rerun" appears in 12 in-place files and "supersed" in 9. These are mostly test-rerun notes.
- **Plane 1.16.0→1.17.0 rebuild.** #31 merged at 12:41. The redesign Requirement started at 12:56 and #32 merged at 16:35. Blame survival of #31's lines: `src/` 1,970 → 304 (85% replaced); `test/` 1,834 → 979 (47% replaced); `server/` 1,376 → 1,375. #32 cost code +3,376/−3,272, tests +2,955/−1,936 and knowledge +1,061. #31's tests and DoD had passed.

## 5. Other places where effort goes

- **Bundle duplication.** `docs/artifact-driven` and `src/archs/artifact-driven` have identical git tree hashes. 13 of the 14 main commits that touch the first also touch the second. All history: +3,415/−286 and +3,666/−344. #29–#39: +1,152 lines per copy. In the method-only PRs, half the bundle diff is a mechanical copy: #33 64 of 128 lines, #35 665 of 1,330, #39 117 of 234.
- **Migration.** #29 and #30 touched 1,146 knowledge files, and #30 deleted 46,100 lines. The tooling is small: `migrate-layout.mjs` 217 lines and `validate-knowledge.mjs` 47 lines.
- **Validator.** Changes are rare: +43, then +4/−3, then +5/−2 on the unmerged branch. Evidence about validator runs is more common: 90 lines in 50 files.
- **Tests against code.** Test lines are 0.77 times code lines.
- **Research documents.** 930 lines on main, plus 1,566 lines of framework comparison that are not merged.
- **Version records.** Cheap (1% of knowledge lines). The cost is the chain of evidence restatements around them.

## Limits

- **Dangling commits will disappear.** The phase history of #35, #36 and #38 exists only as 187 dangling commits, which `git gc` prunes after `gc.pruneExpire` (2 weeks by default).
- **Missing branch names.** The reflogs of removed worktrees are lost. Some commits were assigned to a unit by time window.
- **Lines are not effort.** Agents write most of the text, so the timings show agent speed plus human gates. Work done before a phase's first commit is not visible.
- **Phase classes are approximate.** They come from commit subjects, and implementation commits also record evidence.
- **Blame-based numbers.** Blame undercounts lines that were moved and reformatted. The survival figures also count DoD ticks as changes.
- **Repetition is a lower bound.** Detection is lexical, so paraphrases are missed.
- **Scope.** The main table starts at ADD 2.4.0 / Plane 1.14.0 (#29). Earlier releases are covered by the #8–#28 comparison. Story-Driven appears in #29 (1.1.0 copied in place), #30 and #38 (1.1.1).
