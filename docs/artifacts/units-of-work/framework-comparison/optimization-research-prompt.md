# Optimization research prompt

This prompt asks Claude Fable 5.1 to research how ADD and Artifact Plane can deliver software faster. The owner fixed the goal, the guarantees to keep and the measures on 19 October 2026. The session that wrote [the capability comparison](research.md) collected only measurements as input. It proposed no option, so that the design stays independent.

```text
You are researching how to make software delivery with Artifact-Driven Development (ADD) faster. "Faster" means faster software development: less time from a request to a change merged on main. It does not mean the runtime performance of Artifact Plane. Treat the Plane only as a tool that can make development faster, for example by generating records, validating, or shortening review.

## Goal

Shorten the time from a request to a merged change on main, and do not lose the guarantees that give ADD its value.

The time has three parts, and each part is a target:
1. Agent effort: reading guidance, writing knowledge, writing code, self-checks.
2. Human waiting and review: plan approval, semver confirmation, PR review, reading the knowledge that agents produce.
3. Rework: fixes after self-checks, reopened phases, patch versions soon after a minor version.

Guarantees to keep (the owner fixed this list; do not weaken them):
- main always shows the current truth of each capability.
- Traceability from requirement to specification to task to code and tests.
- Versions and the "established" rule.
- Dependent work waits for an established upstream version.
- A person approves the plan of a large change before implementation.

You may change:
- The number of files, commits and phases for small changes.
- The amount of guidance that an agent must read.
- The rule that every change needs a unit of work.
- Facts that the method records in more than one place.
- Which work an agent does by hand and which work a tool generates or checks.

Measures of success, for each change size (small, medium, across capabilities): lead time; number and duration of human waits; agent tokens and time; ratio of knowledge lines to code lines; rework rate.

## Material

Working directory: this repository, branch claude/framework-comparison (based on main 371e3ab, ADD 2.9.0, Artifact Plane 1.19.0).
- ADD bundle: docs/artifact-driven/** and AGENTS.md. Artifact Plane: apps/artifact-plane/**.
- Project knowledge that shows how ADD is used in practice: docs/artifacts/**.
- Comparison with Spec Kit, OpenSpec and BMAD: docs/artifacts/units-of-work/framework-comparison/research.md and surveys/*.md. Use them for mechanisms that you can borrow, for example OpenSpec skip_specs and validate --json, BMAD route rules, covers field, tickets.py and plan budgets, Spec Kit lean preset and analyze. Check a mechanism in its survey before you rely on it.
- Measurements (facts only, no proposals): docs/artifacts/units-of-work/framework-comparison/measurements/git-cost.md (delivery cost from Git history) and measurements/session-cost.md (agent time, tokens and human waits from local Claude Code and Codex sessions). Read their method and limits sections. Treat estimates as estimates.

## Procedure

1. Model the delivery time. From the measurements and the bundle, make a breakdown of where time goes for each change size. Mark each number as measured, estimated or assumed.
2. Find the causes. For each large cost, find the ADD rules, Plane gaps or habits that cause it. Cite path:line. For each rule, state the risk it controls and whether that risk is real for that change size.
3. Design options. Produce 8 to 15 options. Include at least: change-size tiers with a fast path (exact entry criteria and exclusions), fewer phases or commits for small changes, a deterministic validator that agents can call, generators for boilerplate records, less mandatory reading (progressive disclosure), structured traceability that replaces prose, batching or parallel approvals, and Plane features that cut human review time. You may reject any of these with a reason, and you may add others.
4. Evaluate each option: mechanism; expected saving per measure and change size, with the calculation; which guarantee it could touch and why it still holds; new risks; effort (S, M, L); owner artifact (artifact-driven or artifact-plane); conflicts with current rules or AGENTS.md.
5. Rank the options by saving against risk, and propose a sequence in releases (quick wins first). Say which options need a decision from the owner.
6. Propose how to measure the result after each release, using the same measures as the baseline.

Use subagents in parallel for independent reading if you have them. Do not run code from outside this repository.

## Output

Write one file: docs/artifacts/units-of-work/framework-comparison/optimization.md. Do not edit any other file. Do not commit or push.
Sections: summary (at most 10 lines); baseline time model; causes; options table; option details; ranking and release sequence; measurement plan; owner decisions; limits.
Write in plain, short sentences. Every claim needs a source path or a measurement reference. Do not guess. When the data cannot answer a question, say so.
```
