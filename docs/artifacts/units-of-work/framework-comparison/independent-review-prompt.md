# Independent review prompt

Use this prompt to get an independent review of [the capability comparison](research.md). Run it with Claude Fable 5.1 at high or extra-high effort in a new session, with this worktree as the working directory. Do not give the reviewer the conversation that produced the comparison.

```text
You are an independent reviewer. You did not write ADD (Artifact-Driven Development), Artifact Plane, or the comparison you will review, and you have no reason to prefer any of the four subjects. The owner of this repository wrote ADD and the Plane, and an AI session working for that owner wrote the comparison. Your job is to find where the comparison is wrong, unfair or incomplete, especially where it favors ADD. Do not polish the text.

## Material

- Repository: the current working directory, branch claude/framework-comparison.
- Under review: docs/artifacts/units-of-work/framework-comparison/research.md.
- Secondary evidence from the same author pipeline (do not trust it): docs/artifacts/units-of-work/framework-comparison/surveys/*.md.
- Primary sources. Clone each one at the exact commit into a new empty directory outside the repository. Read them only, and never run their scripts or installers:
  - GitHub Spec Kit: https://github.com/github/spec-kit at c6a4c18f1d01a8bec241c618eb6dfea952508744
  - OpenSpec: https://github.com/Fission-AI/OpenSpec at c794978f4f8845ce59693373c9dd882ee776588c
  - BMAD Method: https://github.com/bmad-code-org/BMAD-METHOD at 61e01f82644c4bb533750cfa0d6d61ab61d2cc9b (V7 preview) and bab9082c3e884e0d72c759bcd1a6d90bcc01be84 (6.12.4)
  - ADD 2.8.1 and Artifact Plane 1.19.0: this repository at d931d07 (use `git show d931d07:<path>` or a separate worktree). ADD 2.9.0 is at 371e3ab.
- GitHub's REST API may be rate-limited. Use clones and plain web pages.

## Procedure

Phase 1, blind. Do not read research.md sections B to G yet. Read only its "Scope and method" section and the row names below. From the primary sources only, give each subject one label per row:
"Tool" (deterministic code computes or enforces it), "Method" (the core method text requires it, and an agent or person does it), "Partial" (present with a material limit), "Convention" (advice that nothing checks), or "No" (absent in core).
For each label, cite a file at the pinned commit.
Rows: current truth of delivered behavior; change to existing behavior; stable identifiers; product knowledge versions; dependencies between capabilities; decision records; requirement to task; task to evidence; code to reason; impact of a change; human gates; spec quality checks; implementation review; deterministic validator shipped with the method; roles; parallel work; multi-repository; Git and PR; human interface; agent portability; extensibility; minimum for one small change; fast path for trivial changes; maturity.
Use subagents in parallel if you have them (one per subject), and give each subagent the same label definitions.

Phase 2, compare. Now read all of research.md. For each cell where your label differs, check both claims against the primary source and decide which is correct.

Phase 3, targeted checks:
1. Label symmetry. ADD often gets "Method" for rules that an agent only reads and follows. Check whether a competitor's equivalent prompt instruction got "Convention" or "Partial" for the same kind of rule. Examples: OpenSpec "propose stops and waits", BMAD Build checkpoint, Spec Kit chat prompts. Apply one standard to all four.
2. Claims that "only ADD + Plane" does something (section C1). Search the cores and the official extension or module catalogs of the other three for an equivalent: Spec Kit extensions and workflows, OpenSpec Stores and schemas, BMAD modules and tickets.py. Report each counterexample.
3. Weaknesses of the competitors that the comparison may overstate. Check every "No" cell for the other three subjects.
4. Weaknesses of ADD that the comparison may understate or omit: learning curve, size of what an agent must read, onboarding time, failure modes in real use (read the repository history: decisions, changes and units of work under docs/artifacts), and dependence on one author.
5. Missing dimensions that would change the summary in section E. Candidates: onboarding effort, readability of specs for non-authors, IDE and agent integration depth, community and support, cost per change, recovery from a bad plan.
6. Accuracy. Check at least 25 cited claims across all four subjects. Prefer claims that sections C, E and F depend on.
7. Logic. Check that sections C, D, E and F follow from the evidence. Check that the expected leaders in the tier-2 scenarios of section F are not biased toward ADD.

## Output

Write one file: docs/artifacts/units-of-work/framework-comparison/independent-review.md. Do not edit research.md or the surveys. Do not commit or push.
Sections:
1. Verdict: how far and in which direction the comparison is biased (none, slight, material, severe), in three sentences or fewer.
2. Findings table: id, severity (critical, major, minor), section or cell, the claim, your evidence (path at the pinned commit, or URL), the correction.
3. Corrected matrix: only the cells you would change, with the old label, the new label and the evidence.
4. Your Phase 1 labels in full, so that a reader can see your blind view.
5. Accuracy sample: the claims you checked and the result (correct, wrong, unverifiable).
6. Missing dimensions, with what they would show.
7. What the comparison got right. Keep this short.
Write in plain, short sentences. Every finding needs evidence. If you cannot verify a claim, write "unverifiable" and give the reason. Do not guess.
```
