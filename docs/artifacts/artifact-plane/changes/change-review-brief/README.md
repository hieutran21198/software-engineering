# Show what a reviewer must know and check

## Reason and scope

On 19 October 2026 the owner approved the recommendation of the human-cognitive-support investigation and asked to start its first two phases. The investigation found that the Plane computes most facts a reviewer needs (changed records, tiered impact, declared and computed flows, task and unit evidence, publication state) but shows them on separate pages, and cannot show what an agent ruled out, which reached flows nobody decided, or whether a person checked anything.

This change adds a change brief to the change page and to the agent interfaces. The brief answers seven questions from derived facts: what changed, why, what is affected, what to care about, what to understand, what can be checked, and what needs a decision. It places every claim and check on one step of a verification ladder. It reads and writes the optional claim records that ADD defines in change-claim-records, and lets a person record their own check with an observed result.

Excluded: learning prompts, risk classes, competence signals, a workflow or approval store, changes to approval or establishment rules, and the Codex observer's data scope.

## Baseline and ownership

The established baseline is Artifact Plane 1.19.0 on main, with ADD 2.8.1 as its established supplier. The claim contract is proposed by the ADD change change-claim-records in the same unit; tasks that read or write claims wait until that change establishes. Knowledge is edited in place on branch claude/human-cognitive-support. This change belongs to the human-cognitive-support unit.

- [Requirements](../../requirements/review-brief.md)
- [Contract](../../specifications/review-brief.md)
