# Record consequential claims with their evidence and check

## Context

The human-cognitive-support investigation of 19 October 2026 measured that ADD has no place for assumptions, tested hypotheses or dismissed impact items, and no record of who checked a claim. Research on human reliance on AI shows that explanations raise acceptance of AI output whether it is right or wrong, and that they reduce overreliance only when they lower the cost of a check. Model-written reasoning is not a faithful record, and a second model is not an independent check. The investigation compared three designs independently; this decision records the choice.

## Alternatives

| Option | Description | Assessment |
| --- | --- | --- |
| A. Derive only | No format change. Readers derive views from existing records; agents write prose lead-ins such as "Hypothesis rejected:". | Cannot tell a tested hypothesis from a conclusion, a person's check from an agent record, or a dismissed impact item from an ignored one. Prose matching drifts; decision 009 already rejected readers based on regular expressions. Rejected as the whole answer; kept as the first Plane phase. |
| B. One optional claim list | One front-matter list in existing records with kind, status that needs evidence, basis, check, the writing channel for verification, rejected options and the entities it concerns. | Answers completeness and consistency questions with one validator beside `evidence_records`. Agents write; people read and check. Selected. |
| C. ADR status and task hypotheses | ADR front matter with status and assumptions, and a separate `hypotheses` list on tasks. | ADR status `accepted` is an approval fact in a file, which the artifact model forbids. Two shapes need two validators and share no evidence rule. Rejected. |
| D. Adaptive workbench first | Risk classes, prediction prompts and familiarity signals in the Plane before any record. | Has nothing precise to ask about without records. The learning evidence comes mostly from education, and prompts people dislike become reflexes. Rejected for now; a later, measured phase. |
| E. Separate claim file per change | A `claims.md` registry in each change directory. | A second place for facts that belong to the documents they concern, and a registry the bundle forbids. Rejected. |

## Decision

Adopt option B as specifications/claim-records.md. Claims live in the front matter of the records they concern. A status describes evidence and needs a source; `verified` also needs `verified_by`, which the writing channel sets. The consequential rule limits records to claims that change or bound the outcome. Readers derive diagnostics, ladders and views; nothing aggregates claims into a store.

## Consequences

Reviewers can see what a change rests on and check it without replaying agent work. Agents spend a few records per phase document. Existing records stay valid. The channel rule records the interface, not a person's identity: a script that calls the person interface is recorded as a person, so Git authorship stays the audit. Semantic drift between a claim and the code is not detected. Whether agents follow the consequential rule is measured on the unit's own records before the method recommends claims more strongly.
