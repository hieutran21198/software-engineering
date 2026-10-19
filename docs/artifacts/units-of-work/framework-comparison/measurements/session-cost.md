# Where agent time and tokens go in ADD delivery

Repository: `software-engineering` (ADD bundle, Artifact Plane, Story-Driven). Data: the owner's local agent logs, 2026-10-12 to 2026-10-19.
Generated 2026-10-19 by local streaming scripts. The report contains only aggregates and short paraphrases. It contains no raw prompts and no secrets. No credential file was opened.

## Summary

- **Scope.** 11 Claude Code sessions (38 subagent transcripts) and 14 Codex sessions (21 spawned subagents, 25 "guardian" approval-reviewer threads). The current session (`fe189bf1`, framework comparison) is excluded; see "Current session". Two tiny unrelated Codex chats (`01a14772`, `01a15207`) are listed but excluded from totals. Session `14b85eb0` (human-cognitive-support) was still in progress when the logs were read.
- **Volume.** Claude: 3,573 API calls, **1,136 M input tokens processed** (98.3 % cache reads), 3.0 M output. Codex: 3,819 calls (490 of them by the guardian reviewer), **461 M input** (97.0 % cached), 1.8 M output. Claude Code's own cost estimate for the 10 finished Claude sessions is about **$509** (2633a05e $202, 2ff1f1e5 $131, bb30d7cf $90, 42ef7676 $76).
- **Time.** Claude: 29.6 h of session span, 14.8 h agent-active, 12.7 h waiting for the owner (18 waits). Codex: 74.9 h span, 23.6 h active, 44.9 h waiting (52 waits). 30 h of the Codex wait time is 3 overnight gaps.
- **Biggest token driver: context size, not tool output.** Tool results add only about 4.7 M (Claude) and 3.8 M (Codex) tokens of new text. But the context is sent again on every call. Claude main contexts average **345 k tokens per call**. **Fork subagents average 509 k per call** because they inherit the parent context, and they account for 332 M (29 %) of Claude input. Compaction was always manual (6 `/compact`, at 460–655 k tokens).
- **Phase cost.** In sessions with phase commits, **Implementation takes 72 % (Claude) and 68 % (Codex) of input tokens**, and 55 % and 52 % of active time. Requirement work (including orientation, interview and research before the first commit) is the second largest: 21–25 % of active time. Specification and Plan together take less than 11 % of time and less than 6 % of tokens.
- **Guidance re-reads.** Reads of the ADD bundle and skills are 6–8 % of tool calls, but **23.5 % of Codex tool-result tokens** (12.9 % in Claude). 223 bundle reads repeat a file already read in the same context. `kiss` and `asd-ste-100` SKILL.md are each read again in 25 extra contexts.
- **Owner gates.** Of 372 owner prompts, 96 are gate actions: 63 approvals, 14 version confirmations and 19 "merged" notices. Plan approval is fast (median 2 min after the plan commit). The long waits come after implementation or after a PR, and from overnight gaps and usage limits.

## Method

1. **Parsing.** Python scripts (run with `python3 -I`) read every JSONL line by line and keep only metadata, tool names, paths, command text (for classification) and the lengths of tool results. The scripts and intermediate files stayed in a session scratchpad and are not committed.
2. **Claude tokens.** One API call is one distinct `message.id`. The same usage is repeated on each content-block line, so it is counted once, with the largest `output_tokens`. "Input processed" = `input_tokens + cache_read_input_tokens + cache_creation_input_tokens`. Cache hit = cache read ÷ input processed.
3. **Codex tokens.** Sum of `token_usage_record.usage` where `thread_id` is that file's own thread. Codex `input_tokens` includes cached tokens, so uncached = input − cached. Forked children replay parent history, so tool calls are de-duplicated globally by `call_id`. Children are joined to their parent through `parent_thread_id`. Guardian threads have no parent link and are attached to the main session whose time span contains them. 5 guardian threads with no matching session are counted only in the guardian totals.
4. **Time.** All work events of a session (calls, tool calls and results, owner prompts, including subagents) are merged into one timeline. A gap of 5 min or less counts as active. A gap of more than 5 min is a **human wait** when an owner prompt, or an answer to an ask-the-owner tool, arrives before the next API call. Otherwise it is "other idle" (a long tool run, a permission prompt, or a resumed session). Session span runs from the first work event to the last.
5. **Buckets.** These are assigned from the tool and path. Read/Write/Edit use the file path. For Bash or Codex `exec`, the command is checked in this order: git/gh → (f); `playwright test` and npm/node/go test, build or validate → (e); screenshot, Chromium or curl to localhost → (g); write patterns (heredoc, `sed -i`, `apply_patch`) → (c) or (d) by path; else read → (a) `docs/artifact-driven`, `src/archs`, `.agents/skills`, `SKILL.md`, `required-skills`; (b) `docs/artifacts`; (d) code paths; (h) scratch/memory/other. One Codex `exec` cell that contains several commands is split, and its output is shared evenly between them.
6. **Token share of tool results.** "Result tokens" = characters ÷ 4, plus 1,600 per image. "Carried token-turns" = result tokens × the number of later API calls in the same context before the next compaction. This estimates how much of the cache-read volume a result causes. For Codex, the remaining-call count is divided by (1 + compactions) because compaction positions are not exact.
7. **Phases.** Commit messages are read from `git commit` commands. They are classified as Research, Requirement (also `define/require/amend…`), Specification (`specify`), Plan (`plan`), Version/PR (`version`, `prepare x.y`, `handoff`, `snapshot`, PR) or Implementation (`gh pr create` also counts as Version/PR). Other commits count as Implementation once the session has a Requirement, Specification or Plan commit. Each API call and each active interval belongs to the phase of the **next** phase commit. So "Requirement" includes the orientation, interview and research that come before the first requirement commit. Work after the last commit is "tail". Human waits are labelled with the phase of the last commit before the wait.
8. **Repeats and rewrites.** A re-read is a second read of the same normalized path in the same context. "Extra contexts" counts the other contexts (subagents) in the same session that read the same file. A rewrite is a second or later write to the same knowledge file in a session. "Before next commit" counts the rewrites that happen between two commits, which approximates self-check edits.
9. **Owner prompts.** These are classified by regular expressions (approval, merge notice, slash command, correction…), and the themes were paraphrased by reading truncated, redacted prompt text.

## 1. Per-session overview

Totals (excluding the current session and the two unrelated chats):

| Source | Sessions | Span h | Active h | Human-wait h (n) | API calls | Input processed M | Cache read M | Uncached M | Cache write M | Output M | Cache hit | Subagent input share | Compactions |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| claude | 11 | 29.6 | 14.8 | 12.7 (18) | 3573 | 1136.1 | 1117.0 | 0.0 | 19.1 | 3.01 | 0.983 | 48.2% | 6 |
| codex | 14 | 74.9 | 23.6 | 44.9 (52) | 3819 | 461.1 | 447.4 | 13.7 | 0.0 | 1.82 | 0.970 | 15.2% | 27 |

| Src | Session | Start (local) | Span h | Active h | Human waits n / h | Other idle h | API calls main+sub (+guardian) | Input processed M | of which cache read M | Uncached in M | Cache write M | Output k | Cache hit | Subagents | Compactions | Unit / branch worked on |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| claude | 100cc7f8 | 10-18 17:42 | 0.0 | 0.0 | 0 / 0.0 | 0.0 | 10+0 | 0.6 | 0.6 | 0.0 | 0.0 | 4 | 0.941 | 0 | 0 | ad-hoc question |
| claude | 14b85eb0 | 10-19 08:13 | 2.4 | 1.6 | 0 / 0.0 | 0.7 | 217+198 | 108.6 | 105.3 | 0.0 | 3.3 | 490 | 0.969 | 6 | 1 | human-cognitive-support, claude/human-cognitive-support |
| claude | 2633a05e | 10-17 08:33 | 7.6 | 4.5 | 3 / 2.2 | 0.9 | 516+868 | 486.2 | 480.2 | 0.0 | 6.0 | 971 | 0.988 | 8 | 2 | plane-workbench-redesign, claude/plane-workbench-redesign |
| claude | 2ff1f1e5 | 10-18 09:11 | 7.6 | 2.9 | 5 / 4.4 | 0.4 | 217+209 | 195.2 | 191.0 | 0.0 | 4.2 | 470 | 0.979 | 6 | 1 | change-impact-intelligence, claude/hidden-tab-streams |
| claude | 42ef7676 | 10-18 10:06 | 7.5 | 2.4 | 6 / 5.2 | 0.0 | 263+370 | 122.1 | 118.7 | 0.0 | 3.4 | 368 | 0.972 | 11 | 1 | visual-artifacts, claude/hidden-tab-streams |
| claude | 7d38a2f7 | 10-18 09:08 | 0.7 | 0.6 | 1 / 0.1 | 0.0 | 108+0 | 16.8 | 16.6 | 0.0 | 0.2 | 91 | 0.988 | 0 | 0 | adoption-guidance, add-adoption-guidance |
| claude | 97a3afea | 10-18 09:00 | 0.0 | 0.0 | 0 / 0.0 | 0.0 | 4+0 | 0.5 | 0.4 | 0.0 | 0.1 | 1 | 0.759 | 0 | 0 | ad-hoc question |
| claude | b95e4b2b | 10-18 09:58 | 0.0 | 0.0 | 0 / 0.0 | 0.0 | 15+0 | 1.0 | 0.9 | 0.0 | 0.1 | 7 | 0.916 | 0 | 0 | ad-hoc question |
| claude | bb30d7cf | 10-16 18:25 | 3.4 | 2.6 | 3 / 0.8 | 0.1 | 333+222 | 203.7 | 202.0 | 0.0 | 1.6 | 597 | 0.992 | 7 | 1 | add-agent-efficiency, claude/add-in-place-layout |
| claude | f456bc70 | 10-19 08:03 | 0.1 | 0.1 | 0 / 0.0 | 0.0 | 11+0 | 0.7 | 0.7 | 0.0 | 0.0 | 6 | 0.936 | 0 | 0 | ad-hoc question |
| claude | fea985f2 | 10-18 17:33 | 0.0 | 0.0 | 0 / 0.0 | 0.0 | 12+0 | 0.7 | 0.6 | 0.0 | 0.0 | 4 | 0.953 | 0 | 0 | ad-hoc question |
| codex | 01a12f34 | 10-12 15:25 | 9.3 | 4.3 | 17 / 3.9 | 1.1 | 260+3 (+71) | 32.3 | 31.4 | 0.9 | 0.0 | 106 | 0.972 | 1 (+3 guardian) | 4 | framework bootstrap (no ADD unit) |
| codex | 01a130eb | 10-12 23:24 | 10.7 | 2.5 | 4 / 7.8 | 0.5 | 367+24 (+72) | 48.2 | 46.7 | 1.5 | 0.0 | 226 | 0.968 | 1 (+6 guardian) | 10 | artifact-plane-initial |
| codex | 01a1333e | 10-13 10:13 | 0.7 | 0.7 | 0 / 0.0 | 0.0 | 105+16 (+2) | 12.9 | 12.6 | 0.3 | 0.0 | 56 | 0.978 | 1 (+1 guardian) | 0 | add/implementation-task-dag |
| codex | 01a13351 | 10-13 10:34 | 1.3 | 0.9 | 3 / 0.4 | 0.0 | 87+0 (+22) | 10.6 | 10.2 | 0.4 | 0.0 | 64 | 0.967 | 0 (+1 guardian) | 0 | tasks, change/units-of-work |
| codex | 01a133a5 | 10-13 12:07 | 5.3 | 1.8 | 4 / 1.3 | 2.2 | 110+0 (+31) | 17.3 | 16.9 | 0.4 | 0.0 | 83 | 0.974 | 0 (+1 guardian) | 0 | codex-execution-visualization, feat/codex-execution-visualization |
| codex | 01a13436 | 10-13 14:46 | 2.7 | 1.1 | 3 / 1.6 | 0.0 | 155+30 (+4) | 26.0 | 25.3 | 0.7 | 0.0 | 75 | 0.973 | 1 (+1 guardian) | 0 | task-retention-and-navigation, change/task-retention-and-plane-navigation |
| codex | 01a134ce | 10-13 17:29 | 2.5 | 2.4 | 1 / 0.1 | 0.0 | 212+0 (+73) | 33.2 | 32.4 | 0.8 | 0.0 | 153 | 0.976 | 0 (+2 guardian) | 2 | live-reload, change/artifact-plane-live-reload |
| codex | 01a1361f | 10-13 23:38 | 1.1 | 1.0 | 1 / 0.2 | 0.0 | 85+46 | 12.2 | 11.6 | 0.5 | 0.0 | 79 | 0.956 | 5 | 0 | story-driven-framework, feat/story-driven-framework |
| codex | 01a1381c | 10-14 08:54 | 4.0 | 0.8 | 2 / 1.1 | 2.2 | 83+0 (+27) | 8.7 | 8.4 | 0.3 | 0.0 | 27 | 0.963 | 0 (+1 guardian) | 0 | project-tabs, change/artifact-plane-project-tabs |
| codex | 01a1381f | 10-14 08:59 | 6.9 | 3.3 | 6 / 3.5 | 0.1 | 299+248 (+101) | 69.3 | 67.1 | 2.2 | 0.0 | 312 | 0.968 | 4 (+6 guardian) | 5 | flow-discovery-and-retrieval, feat/flow-discovery-and-retrieval |
| codex | 01a13ad4 | 10-14 21:33 | 12.6 | 2.6 | 6 / 9.8 | 0.2 | 400+345 | 107.0 | 104.1 | 2.9 | 0.0 | 353 | 0.973 | 5 | 4 | evidence-review-context, codex/evidence-review-context |
| codex | 01a13f34 | 10-15 17:56 | 16.2 | 1.8 | 3 / 14.4 | 0.0 | 332+0 | 65.2 | 63.9 | 1.3 | 0.0 | 203 | 0.980 | 0 | 2 | plane-ux-simplification, codex/plane-ux-simplification |
| codex | 01a14359 | 10-16 13:15 | 0.6 | 0.4 | 1 / 0.2 | 0.0 | 51+0 | 7.1 | 6.8 | 0.3 | 0.0 | 40 | 0.960 | 0 | 0 | evidence-and-usability, codex/add-plane-pain-points |
| codex | 01a1445f | 10-16 18:00 | 0.8 | 0.1 | 1 / 0.7 | 0.0 | 36+35 | 5.5 | 5.2 | 0.3 | 0.0 | 29 | 0.946 | 3 | 0 | add-agent-efficiency, codex/add-autonomy-efficiency |
| codex | 01a14772 | 10-17 08:21 | 0.0 | 0.0 | 0 / 0.0 | 0.0 | 2+0 | 0.1 | 0.0 | 0.0 | 0.0 | 0 | 0.473 | 0 | 0 | unrelated short chat (excluded from aggregates) |
| codex | 01a15207 | 10-19 09:40 | 0.0 | 0.0 | 0 / 0.0 | 0.0 | 3+0 | 0.1 | 0.1 | 0.1 | 0.0 | 1 | 0.627 | 0 | 0 | unrelated short chat (excluded from aggregates) |

Notes: `2ff1f1e5` and `42ef7676` ran in parallel on 10-18 and share one 3.4 h usage-limit stop. `01a12f34` is the framework bootstrap interview (105 prompts, no ADD unit yet). Codex "+guardian" calls are the automatic approval reviewer. Unit/branch is the most-written `units-of-work/<name>` plus the most-used branch, so a session that delivered several units shows only the main one. For example, `2633a05e` delivered plane-authoring-workbench and then plane-workbench-redesign, and `2ff1f1e5` delivered change-impact-intelligence and hidden-tab-streams.

## 2. Tool calls and token spend by bucket

**Claude** (4463 tool calls; tool-result text ≈ 4.68 M tokens; carried ≈ 290 M token-turns)

| Bucket | Calls | % calls | Writes | Result tokens (est) | % result tokens | Carried token-turns (est) | % carried | Tool wall-clock h |
|---|---|---|---|---|---|---|---|---|
| (a) ADD bundle guidance / skills read | 266 | 6.0% | 0 | 605 k | 12.9% | 29.6 M | 10.2% | 0.2 |
| (b) project knowledge read (docs/artifacts) | 435 | 9.7% | 0 | 771 k | 16.5% | 32.1 M | 11.0% | 0.2 |
| (c) knowledge written | 189 | 4.2% | 189 | 45 k | 1.0% | 2.0 M | 0.7% | 0.8 |
| (d) code / tests read+write | 1300 | 29.1% | 309 | 1493 k | 31.9% | 113.2 M | 39.0% | 1.4 |
| (e) tests / builds / validation runs | 594 | 13.3% | 0 | 143 k | 3.0% | 9.8 M | 3.4% | 3.4 |
| (f) git / gh / PR | 458 | 10.3% | 0 | 158 k | 3.4% | 12.7 M | 4.4% | 1.2 |
| (g) Plane UI checks / screenshots | 419 | 9.4% | 0 | 418 k | 8.9% | 29.9 M | 10.3% | 1.1 |
| (h) other: scratch, memory, misc | 568 | 12.7% | 77 | 946 k | 20.2% | 54.2 M | 18.7% | 0.8 |
| (h) other: subagent orchestration | 90 | 2.0% | 0 | 12 k | 0.3% | 1.5 M | 0.5% | 0.2 |
| (h) other: web research / docs lookup | 128 | 2.9% | 0 | 87 k | 1.9% | 5.0 M | 1.7% | 0.6 |
| (h) other: ask-the-owner tool | 16 | 0.4% | 0 | 2 k | 0.0% | 0.2 M | 0.1% | 0.3 |

**Codex** (4062 tool calls; tool-result text ≈ 3.81 M tokens; carried ≈ 207 M token-turns)

| Bucket | Calls | % calls | Writes | Result tokens (est) | % result tokens | Carried token-turns (est) | % carried | Tool wall-clock h |
|---|---|---|---|---|---|---|---|---|
| (a) ADD bundle guidance / skills read | 314 | 7.7% | 0 | 895 k | 23.5% | 47.4 M | 22.9% | 0.0 |
| (b) project knowledge read (docs/artifacts) | 248 | 6.1% | 0 | 412 k | 10.8% | 26.7 M | 12.9% | 0.1 |
| (c) knowledge written | 288 | 7.1% | 288 | 32 k | 0.8% | 1.6 M | 0.8% | 0.1 |
| (d) code / tests read+write | 513 | 12.6% | 131 | 710 k | 18.7% | 43.3 M | 20.9% | 0.2 |
| (e) tests / builds / validation runs | 513 | 12.6% | 0 | 149 k | 3.9% | 7.0 M | 3.4% | 0.3 |
| (f) git / gh / PR | 869 | 21.4% | 0 | 689 k | 18.1% | 35.4 M | 17.1% | 0.5 |
| (g) Plane UI checks / screenshots | 351 | 8.6% | 0 | 274 k | 7.2% | 15.8 M | 7.7% | 0.2 |
| (h) other: scratch, memory, misc | 596 | 14.7% | 17 | 443 k | 11.6% | 18.3 M | 8.9% | 0.3 |
| (h) other: subagent orchestration | 292 | 7.2% | 0 | 1 k | 0.0% | 0.1 M | 0.0% | 0.3 |
| (h) other: web research / docs lookup | 54 | 1.3% | 0 | 200 k | 5.3% | 11.3 M | 5.5% | 0.1 |
| (h) other: ask-the-owner tool | 24 | 0.6% | 0 | 0 k | 0.0% | 0.0 M | 0.0% | 0.0 |

Reading the table:
- **(d) Code** is the largest Claude bucket by calls (29 %) and by carried tokens (39 %). Most of it is whole-file `cat`/`sed -n` of JSX and server modules during Plane work.
- **(a) Bundle guidance** has few calls but large results. In Codex it is the largest single share of tool-result tokens (23.5 %), because role SKILL.md files and guideline pages are read whole, often again in each spawned implementer.
- **(f) Git** is 21 % of Codex calls and 18 % of its result tokens (status, diff, log and show output). Claude's git share is smaller (10 %, 3 %).
- **(e) Tests and validation** produce little text but take the most wall-clock time: 3.4 h of Claude tool time, with single Playwright runs of up to 20 min.
- **(h) Other** in Claude (20 % of result tokens) is mostly scratchpad scripts, persisted large tool outputs read back, and memory files.
- The bucket table uses only tool results. Most of the 1.6 B tokens processed are the standing context: system prompt, tools, instructions, the conversation so far and inherited fork history. See section 6.

## 3. ADD phase cost

**Claude** — 6 sessions with phase commits

| Phase (work before the commit that closes it) | Active h | % active | API calls | Input processed M | % input | Output k |
|---|---|---|---|---|---|---|
| Research | 1.1 | 7.9% | 370 | 81.1 | 7.2% | 330 |
| Requirement | 3.0 | 20.6% | 397 | 90.3 | 8.0% | 727 |
| Specification | 1.4 | 9.7% | 257 | 52.0 | 4.6% | 360 |
| Plan | 0.1 | 0.6% | 16 | 4.8 | 0.4% | 31 |
| Implementation | 8.1 | 55.4% | 2293 | 818.7 | 72.3% | 1395 |
| Version/PR | 0.6 | 4.1% | 124 | 52.4 | 4.6% | 84 |
| tail | 0.3 | 1.9% | 64 | 33.2 | 2.9% | 61 |

| Human wait, by last phase commit before the wait | Waits | Hours |
|---|---|---|
| after-Implementation | 4 | 4.3 |
| after-Research | 1 | 1.2 |
| after-Specification | 3 | 3.8 |
| after-Version/PR | 6 | 1.2 |
| approval-plan | 1 | 1.2 |
| other | 3 | 1.1 |

**Codex** — 13 sessions with phase commits

| Phase (work before the commit that closes it) | Active h | % active | API calls | Input processed M | % input | Output k |
|---|---|---|---|---|---|---|
| Research | 0.0 | 0.0% | 0 | 0.0 | 0.0% | 0 |
| Requirement | 4.9 | 25.0% | 637 | 63.2 | 14.9% | 286 |
| Specification | 0.5 | 2.6% | 34 | 3.7 | 0.9% | 53 |
| Plan | 0.8 | 4.1% | 85 | 9.4 | 2.2% | 72 |
| Implementation | 10.0 | 51.5% | 2202 | 288.9 | 68.3% | 1103 |
| Version/PR | 1.9 | 9.8% | 313 | 42.7 | 10.1% | 167 |
| tail | 1.4 | 7.0% | 127 | 15.3 | 3.6% | 20 |

| Human wait, by last phase commit before the wait | Waits | Hours |
|---|---|---|
| after-Implementation | 8 | 32.3 |
| after-Requirement | 2 | 1.4 |
| after-Version/PR | 8 | 1.5 |
| approval-plan | 4 | 1.1 |
| other | 13 | 4.5 |

Per session (active hours / input tokens processed, millions):

| Src | Session | Commits R/S/P/I/V | Req h / M | Spec h / M | Plan h / M | Impl h / M | Version/PR h / M |
|---|---|---|---|---|---|---|---|
| claude | 14b85eb0 | 3/1/1/4/5 | 0.11 / 8 | 0.06 / 5 | 0.02 / 2 | 0.29 / 16 | 0.14 / 3 |
| claude | 2633a05e | 2/1/1/43/5 | 1.12 / 45 | 0.28 / 8 | 0.02 / 1 | 2.93 / 405 | 0.03 / 6 |
| claude | 2ff1f1e5 | 3/2/2/28/4 | 1.22 / 22 | 0.19 / 3 | 0.01 / 0 | 1.34 / 159 | 0.11 / 9 |
| claude | 42ef7676 | 1/2/1/11/3 | 0.10 / 7 | 0.77 / 32 | 0.03 / 1 | 1.20 / 62 | 0.04 / 3 |
| claude | 7d38a2f7 | 2/2/2/3/4 | 0.13 / 5 | 0.03 / 1 | 0.01 / 1 | 0.35 / 9 | 0.04 / 1 |
| claude | bb30d7cf | 1/1/0/24/7 | 0.32 / 4 | 0.08 / 1 | 0.00 / 0 | 1.95 / 168 | 0.24 / 30 |
| codex | 01a130eb | 11/7/10/19/15 | 0.61 / 12 | 0.04 / 0 | 0.13 / 1 | 1.26 / 27 | 0.41 / 7 |
| codex | 01a1333e | 2/1/1/5/8 | 0.12 / 1 | 0.02 / 0 | 0.03 / 0 | 0.26 / 6 | 0.22 / 4 |
| codex | 01a13351 | 1/1/1/3/6 | 0.39 / 1 | 0.03 / 0 | 0.03 / 0 | 0.33 / 7 | 0.09 / 2 |
| codex | 01a133a5 | 2/2/2/4/4 | 0.44 / 4 | 0.04 / 0 | 0.04 / 1 | 0.56 / 7 | 0.15 / 2 |
| codex | 01a13436 | 3/1/1/4/6 | 0.35 / 3 | 0.03 / 0 | 0.05 / 0 | 0.44 / 14 | 0.18 / 5 |
| codex | 01a134ce | 3/3/2/8/5 | 0.38 / 2 | 0.06 / 0 | 0.02 / 0 | 1.76 / 29 | 0.10 / 2 |
| codex | 01a1361f | 2/1/1/3/3 | 0.45 / 2 | 0.01 / 0 | 0.01 / 0 | 0.27 / 4 | 0.11 / 2 |
| codex | 01a1381c | 2/1/1/1/4 | 0.04 / 1 | 0.01 / 0 | 0.01 / 0 | 0.22 / 3 | 0.06 / 2 |
| codex | 01a1381f | 6/4/5/21/7 | 0.64 / 6 | 0.05 / 0 | 0.20 / 2 | 2.13 / 56 | 0.26 / 5 |
| codex | 01a13ad4 | 4/3/5/34/7 | 0.78 / 16 | 0.03 / 0 | 0.16 / 2 | 1.50 / 85 | 0.09 / 4 |
| codex | 01a13f34 | 4/3/3/16/6 | 0.47 / 11 | 0.08 / 1 | 0.04 / 1 | 1.09 / 48 | 0.12 / 4 |
| codex | 01a14359 | 1/1/1/3/3 | 0.12 / 1 | 0.05 / 0 | 0.01 / 0 | 0.15 / 2 | 0.09 / 3 |
| codex | 01a1445f | 1/1/1/0/0 | 0.07 / 4 | 0.03 / 0 | 0.04 / 1 | 0.00 / 0 | 0.00 / 0 |

Research phases with their own commits: `14b85eb0` 0.9 h / 67 M (deep investigation with 3 Explore and 3 Plan subagents), `42ef7676` 0.2 h / 14 M (representation survey).

Interpretation: Specification and Plan are cheap because the Technical Lead writes them in the same session right after the Requirement, using the context already loaded. The Plan commit usually follows the Specification commit within minutes. Implementation (subagent implementers, browser suites, evidence) and the orientation before the first Requirement commit take most of the time and tokens. In Claude sessions the Version/PR step is small (4 % of time). In Codex it is about 10 %, because each version needs a confirmation, a snapshot and a PR handoff commit.

## 4. Repeated work, self-check rewrites, compaction, cache

| Measure | Claude | Codex |
|---|---|---|
| Bundle / skill file reads (a) | 335 | 577 |
| …same file read again in the same context | 60 | 163 |
| Project knowledge reads (b) | 464 | 194 |
| …same file read again in the same context | 59 | 26 |
| Reads of `kiss` / `asd-ste-100` SKILL.md | 21 | 83 |
| Knowledge files written | 145 | 167 |
| …files written 2 or more times | 38 | 60 |
| …extra writes (rewrites) | 61 | 118 |
| …rewrites before the next commit (self-check revision proxy) | 48 | 75 |
| Context compactions | 6 (all manual `/compact`, at 459 k–655 k tokens) | 27 (automatic; `01a130eb` had 10) |
| Cache hit (cache read ÷ input processed) | 0.983 | 0.970 |
| Cache-write tokens | 19.1 M | n/a (not reported) |

Most re-read bundle files (all sessions):

| Bundle file / skill | Re-reads in same context | Extra contexts reading it |
|---|---|---|
| `required-skills/asd-ste-100/SKILL.md` | 19 | 25 |
| `required-skills/kiss/SKILL.md` | 18 | 25 |
| `AGENTS.md` | 21 | 7 |
| `skills/add-implementer/SKILL.md` | 10 | 16 |
| `skills/add-coordinator/SKILL.md` | 14 | 7 |
| `skills/add-product-owner/SKILL.md` | 14 | 1 |
| `artifact-driven/06-guidelines/system-flows.md` | 4 | 9 |
| `skills/add-technical-lead/SKILL.md` | 13 | 0 |
| `README.md` | 11 | 1 |
| `artifact-driven/06-guidelines/writing-artifacts.md` | 7 | 5 |
| `artifact-driven/06-guidelines/visual-representations.md` | 4 | 8 |
| `artifact-driven/06-guidelines/visual-examples.md` | 6 | 5 |
| `artifact-driven/06-guidelines/units-of-work.md` | 6 | 4 |
| `artifact-driven/06-guidelines/working-with-ai.md` | 5 | 4 |
| `artifact-driven/06-guidelines/evidence-records.md` | 5 | 3 |

Interpretation: role skills (`add-coordinator`, `add-product-owner`, `add-technical-lead`, `add-implementer`) and the two required skills are read again in each role and phase self-check, and again in each subagent. Each self-check leads to about 0.4 rewrites per knowledge file written: 123 rewrites before a commit across 312 files written. The cache hit rate is high, so the repeated context is cheap per token but large in volume.

## 5. Human wait

| Source | Human waits (gap > 5 min ending in an owner prompt or answer) | Total h | Median min | Waits > 3 h (away/overnight/limit) | h in those | Plan-approval waits n / h | Median plan-approval min |
|---|---|---|---|---|---|---|---|
| claude | 18 | 12.7 | 13 | 2 | 6.8 | 1 / 1.2 | 71 |
| codex | 52 | 44.9 | 8 | 3 | 30.1 | 4 / 1.1 | 11 |

Owner prompts by class (372 prompts in the counted sessions):

| Owner prompt class | Claude | Codex | Total |
|---|---|---|---|
| question / design discussion | 10 | 123 | 133 |
| approval / go-ahead | 15 | 48 | 63 |
| slash command (/model, /effort, /compact, /clear) | 38 | 0 | 38 |
| scope / process correction | 4 | 30 | 34 |
| new task brief (long prompt) | 6 | 21 | 27 |
| defect / UX correction | 3 | 18 | 21 |
| merge / test notice | 9 | 10 | 19 |
| structured answer (version confirm / choice) | 0 | 14 | 14 |
| resume after stop / limit | 4 | 9 | 13 |
| ambient UI state (not typed) | 0 | 6 | 6 |
| interrupt | 4 | 0 | 4 |

Plan approval latency (time from a Plan commit to the next owner prompt): Claude n = 7, median 2 min (max 71 min). Codex n = 33, median 2 min (max 44 min). Plan approval is rarely the bottleneck. The long waits are after implementation or after a PR (owner tests the UI, merges, then returns), and overnight or usage-limit gaps. Waits of 3 h or less: Claude 16 waits / 5.8 h (median 13 min), Codex 49 / 14.8 h (median 7 min).

What the owner asked or corrected (themes, paraphrased):
- **Gate actions (about 26 % of prompts):** "approve", "approve and implement", "confirm version x.y.z", "I merged". Codex asked for an explicit version confirmation at each release (14 structured answers). Claude sessions mostly combined the approval with the next instruction.
- **UI quality of Artifact Plane (most corrections):** a delivered workbench release was judged unusable ("a mess") and redesigned. Other issues: UI that is not consistent across the left, centre and right panels and between search views; cramped text; a switcher that loses state; DAG nodes without labels; slow flow-canvas load and slow refresh; documents that time out with several tabs open; a build failure after a change.
- **Scope and process corrections:** pull the latest `main` before starting; some tasks did not belong to the current change; fix legacy records first; do not reference an external examples folder; remove features that are not used; do not split work into separate changes when that costs more tokens and reasoning; do not add workflow state to the knowledge base; revert drafts and interview first.
- **Explicit cost concerns:** why one session took so long and used so much quota; whether to clear context and change model or effort before "approve and implement"; how much effort and how many tokens a cross-artifact change needs; frontier model versus a cheaper model for planning. The owner also used `/model`, `/effort`, `/compact` or `/clear` 38 times in Claude sessions, mostly to change model or effort between phases.
- **Resumes:** "continue" or "retry" after usage-limit resets, network loss and overnight stops (13 prompts). There were 4 interrupts.
- **Design discussion:** most Codex prompts in `01a12f34` (framework bootstrap interview) and in short Q&A before each unit.

## 6. Top 10 time and token sinks

| # | Sink | Evidence | Size |
|---|---|---|---|
| 1 | **Standing context resent on every call (Claude main)** | 1,706 main calls average 345 k tokens each. `2633a05e` main: 516 calls × 439 k = 227 M. `bb30d7cf` main: 333 × 386 k = 129 M. Compaction only by hand, at 460–655 k. | 589 M (52 % of Claude input) |
| 2 | **Fork subagents inherit the parent context** | 13 fork contexts (`bb30d7cf` ×7, `2ff1f1e5` ×5, `2633a05e` ×1), 652 calls, average 509 k per call. `2633a05e` fork: 241 calls / 133.5 M. General-purpose subagents average 168 k and Explore subagents 234 k. | 332 M (29 % of Claude input) |
| 3 | **Implementation phase** | 72 % / 68 % of phase-attributed input. `2633a05e` Implementation: 2.9 h / 405 M, 43 implementation commits, 8 subagents. `bb30d7cf`: 2.0 h / 168 M. `01a13ad4`: 1.5 h / 85 M. | Claude 819 M, 8.1 h. Codex 289 M, 10.0 h |
| 4 | **Owner wait and away time** | 70 waits / 57.6 h. 5 waits over 3 h hold 36.9 h: Codex overnight gaps of 832, 530 and 445 min (`01a13f34`, `01a13ad4`, `01a130eb`) and a 204-min Claude usage-limit stop shared by `2ff1f1e5` and `42ef7676`. | 57.6 h (20.6 h within the day) |
| 5 | **Fixed prompt prefix per call** | The first call of a context already carries 53 k tokens (Claude main: system, tools, AGENTS.md, memory, skill list), 38 k (Claude subagent), 26 k (Codex main) and 20 k (guardian). Including fork-inherited context, the first-call size × calls comes to 476 M. | About 30 % of all 1.6 B input |
| 6 | **Whole-file code reads during Plane work (d)** | Claude 1,300 code calls, 1.49 M result tokens, 39 % of carried tokens. The top single results are `cat` of 4–6 JSX pages or server modules in `2633a05e` and `bb30d7cf`, each carried for about 1.3–1.8 M token-turns. | 113 M carried (Claude) and 43 M (Codex) |
| 7 | **ADD bundle and skill guidance reads** | 912 reads (335 Claude, 577 Codex), 1.5 M result tokens. 223 re-reads in the same context. `kiss` and `asd-ste-100` SKILL.md read 104 times and again in 25 extra contexts each. `01a12f34` alone: 50 re-reads. | 77 M carried; 23.5 % of Codex result tokens |
| 8 | **Browser suites and UI screenshots (e, g)** | Claude: 594 test/build calls (3.4 h tool wall time; Playwright runs of 20, 10 and 10 min in `2633a05e`) and 419 UI or screenshot calls (418 k tokens, 1.1 h). Codex: 351 UI calls. | About 4.5 h Claude tool time, 40 M carried |
| 9 | **Git and PR output in Codex (f)** | 869 git/gh calls (21 % of Codex calls), 689 k result tokens (18 %), 35 M carried. Mostly status, diff and log checks around each phase commit and PR handoff. | 35 M carried |
| 10 | **Codex guardian approval reviewer** | 25 guardian threads, 490 calls, 33.5 M input (7.3 % of Codex input). Each escalated command starts a separate review with a 20 k-token prefix. Largest: `01a1381f` 101 calls, `01a134ce` 73, `01a130eb` 72. | 33.5 M |

Also noted:
- Knowledge rewrites from self-checks: 179 extra writes, 123 of them before a commit.
- Codex automatic compactions: 27, of which 10 in `01a130eb`.
- 96 gate prompts. Each one ends an agent turn.

Largest single tool results by carried tokens (for reference):

| # | Src | Session | Ctx | Bucket | Call | Result tokens (est) | Carried token-turns (est) |
|---|---|---|---|---|---|---|---|
| 1 | claude | 2633a05e | main | h | `Artifact` | 8.7 k | 2.79 M |
| 2 | claude | 42ef7676 | main | h | `Read 42ef7676-5dbb-45fa-ab5a-91e656bd42cb/tool-results/b6b7bvk6s.txt` | 10.5 k | 2.48 M |
| 3 | claude | 2633a05e | main | d | `shell: cat NavigationTree.jsx pages/WorkPage.jsx pages/UnitPage.jsx pages/Flo` | 5.4 k | 1.83 M |
| 4 | claude | bb30d7cf | main | d | `shell: cat server/git-reads.js server/change-review.js` | 6.6 k | 1.81 M |
| 5 | claude | 2633a05e | sub | d | `shell: cat TaskGraph.jsx task-canvas.js unit-canvas.js reload.js request.js k` | 7.1 k | 1.66 M |
| 6 | codex | 01a13f34 | main | g | `js` | 14.5 k | 1.59 M |
| 7 | claude | 2633a05e | sub | d | `shell: sed -n 800,1243p src/style.css / grep -v '^\s*$' / tr '\n' ' ' / sed '` | 6.6 k | 1.50 M |
| 8 | claude | 2633a05e | sub | d | `shell: cat Delivery.jsx UnitsOfWork.jsx Reader.jsx Workspace.jsx SearchField.` | 6.3 k | 1.48 M |
| 9 | claude | 2633a05e | main | d | `shell: cat pages/GraphPage.jsx / cut -c1-500; cat UnitsOfWork.jsx / cut -c1-6` | 5.7 k | 1.47 M |
| 10 | claude | 2633a05e | main | d | `shell: head -c 6000 src/work-model.js; echo; grep -n '^export' src/*.js src/*` | 4.9 k | 1.47 M |
| 11 | claude | 2633a05e | sub | d | `shell: sed -n 300,620p src/main.jsx` | 6.2 k | 1.46 M |
| 12 | claude | 2633a05e | sub | h | `shell: cat <session transcript>` | 6.5 k | 1.46 M |
| 13 | claude | 2633a05e | main | d | `shell: cut -c1-260 src/main.jsx / head -200` | 4.9 k | 1.44 M |
| 14 | claude | bb30d7cf | main | d | `shell: cat server/units-of-work.js` | 4.8 k | 1.33 M |
| 15 | claude | 2633a05e | main | d | `shell: sed -n 200,375p src/main.jsx` | 5.0 k | 1.32 M |

Longest single tool calls (wall-clock):

| Src | Session | Bucket | Call | Wall-clock min |
|---|---|---|---|---|
| claude | 2633a05e | e | `shell: PLAYWRIGHT_PORT=4312 PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/nix/store/0f` | 20 |
| claude | 2633a05e | e | `shell: until grep -qE "passed/failed" $SCRATCH/pw-all.log 2>/dev/null && ! pg` | 10 |
| claude | 2633a05e | e | `shell: PLAYWRIGHT_PORT=4331 PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/nix/store/0f` | 10 |
| claude | 2ff1f1e5 | f | `shell: git add apps/artifact-plane/scripts/impact-screenshots.mjs && git comm` | 8 |
| claude | 2633a05e | f | `shell: git add -A apps/artifact-plane/src apps/artifact-plane/test && git com` | 8 |
| claude | 2633a05e | f | `shell: git add -A apps/artifact-plane/src && git commit -qm "Plane change-wor` | 7 |
| claude | 2ff1f1e5 | c | `shell: node -e "` | 6 |
| claude | 2ff1f1e5 | h | `Write scratchpad/report/build-data.mjs` | 6 |
| claude | bb30d7cf | f | `shell: gh run rerun 38915095544 --failed && sleep 20 && for i in $(seq 1 40);` | 5 |
| claude | 2633a05e | e | `shell: rm -f test-results/authoring-scenarios.json && PLAYWRIGHT_PORT=4312 PL` | 5 |

Largest contexts:

| Src | Session | Context | API calls | Input processed M | Avg context per call k |
|---|---|---|---|---|---|
| claude | 2633a05e | main | 516 | 226.7 | 439 |
| claude | 2633a05e | sub (fork) | 241 | 133.5 | 554 |
| claude | bb30d7cf | main | 333 | 128.6 | 386 |
| claude | 42ef7676 | main | 263 | 81.2 | 309 |
| claude | 2ff1f1e5 | main | 217 | 69.9 | 322 |
| codex | 01a13ad4 | main | 400 | 66.6 | 167 |
| codex | 01a13f34 | main | 332 | 65.2 | 197 |
| claude | 14b85eb0 | main | 217 | 62.3 | 287 |
| codex | 01a130eb | main | 367 | 43.4 | 118 |
| codex | 01a1381f | main | 299 | 40.1 | 134 |

## Current session (reported separately)

`fe189bf1` (this analysis plus the framework comparison): 0.45 h so far, 36 main + 210 subagent calls (7 general-purpose subagents), 28.5 M input processed, 82 bundle reads (21 re-reads). It is not included in any table above.

## Limits

- **Token-share proxy.** The tool-result share uses characters ÷ 4 and an assumed 1,600 tokens per image. It does not count the system prompt, thinking or assistant text. Carried token-turns are an upper-bound attribution: they ignore cache-write and TTL effects and, for Codex, the exact compaction positions.
- **Buckets come from regular expressions on paths and commands.** A Bash line that reads and writes several areas gets one bucket only. Relative paths use the `cd` prefix where one exists. Codex `exec` cells with several commands share their output evenly.
- **Phase attribution is approximate.** It relies on commit messages. It assigns work to the *next* phase commit, so orientation and research go to Requirement, and validation and evidence go to Implementation or Version. Amendment cycles (a new Requirement after Implementation) are counted as Requirement. Sessions that delivered several units are merged. `bb30d7cf` has no Plan commit (the plan was committed under a different message).
- **Human wait is a lower bound for owner involvement.** Prompts that arrive within 5 min are not counted as waits. Permission prompts are not logged, so they appear as "other idle". Parallel sessions (`2ff1f1e5` and `42ef7676`) double-count shared wall time.
- **Codex logs.** Codex reports no cache-write tokens. Exec wall time is measured from the call to its output; long commands polled with `write_stdin` are under-counted. Guardian threads are attached to sessions by time overlap.
- **Excluded.** `14b85eb0` was still running. The Claude cost figures are Claude Code's own `cost-state` estimates (not available for `14b85eb0`). Artifact Plane observer state (`~/.local/state/artifact-plane`) holds only search and flow indexes (no run records), so it was not used.
