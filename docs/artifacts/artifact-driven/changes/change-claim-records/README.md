# Record consequential claims with their checks

## Reason and scope

On 19 October 2026 the owner approved the recommendation of the human-cognitive-support investigation and asked to start its first two phases. The investigation found that ADD gives no place for the assumptions a change rests on, the hypotheses an agent tested, the impact items a coordinator dismissed, or the person who checked a claim. Reviewers therefore approve plans and versions without the facts they need to verify the work, and approval of a goal is not separated from verification of correctness.

This change adds one optional list, `claims`, to existing ADD records. A claim is a consequential assertion with a kind, a status that needs evidence, an evidence basis, the cheapest check and, when checked, whether a person or an agent checked it. It amends the evidence guideline, the writing rules, the artifact model, the working-with-AI guidance and the three role skills, in both bundle copies. It adds no phase, role, gate, mandatory field or workflow state.

Excluded: the Plane reader, writer and pages (Artifact Plane change-review-brief), learning prompts, risk classes, and any change to approval or establishment rules.

## Baseline and ownership

The established baseline is artifact-driven 2.8.1 on main. Knowledge is edited in place on branch claude/human-cognitive-support. Artifact Plane consumes the proposed contract through its own change. This change belongs to the human-cognitive-support unit. The investigation is recorded in the unit directory.

- [Requirements](../../requirements/claim-records.md)
- [Contract](../../specifications/claim-records.md)
- [Decision](../../decisions/014-evidence-linked-claims.md)
- [Plan](tasks/README.md)
