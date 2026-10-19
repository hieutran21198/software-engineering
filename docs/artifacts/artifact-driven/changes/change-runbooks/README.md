---
tier: large
---

# Give the coordinator runbooks for recurring situations

## Reason and scope

On 19 October 2026 the owner asked for runbook suggestions and approved seven runbooks. In this repository the same situations occur again and again, and the bundle gives one sentence or no text for them: the work after a merge, a protected branch that moves before merge, a change after plan approval, a change that stops, a defect in an established version, a check that needs a live environment, and a check that fails on one platform.

The tier is large: the change amends specifications/knowledge-layout.md, which Artifact Plane references, and the Plane needs no companion change (see the impact reconciliation of the unit brief). The owner decided on 19 October 2026: one guideline page with the runbooks, and rows in the coordinator's Read-when table that point to them. No new state, gate or registry.

Included:

- seven runbooks in the bundle, each with when it applies, inputs, steps, the done condition and the owner decisions;
- the rules that a change that stops and a change that reverses an established version need;
- links from the coordinator skill and the guideline index.

Excluded: hooks or Plane features that run a runbook, runbooks for other roles, release automation, a policy for release tags of consumer projects, and an update of the adopted bundle in Story-Driven.

Knowledge is edited in place on this branch. The unit brief is [ADD runbooks](../../../units-of-work/add-runbooks/README.md).

- [Requirements: runbooks](../../requirements/runbooks.md)
- [Specification: runbooks](../../specifications/runbooks.md)
- [Plan](tasks/README.md)
