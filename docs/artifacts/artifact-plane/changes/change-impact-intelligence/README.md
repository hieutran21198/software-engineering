# Explain what a change affects

## Reason and scope

On 18 October 2026 the user reported that the flow impact results of Artifact Plane 1.17.0 are not as useful or accurate as expected and asked for a researched redesign. The investigation measured the delivered implementation on this repository: impact is a reverse traversal over declared relationships that returns flows only, cannot start from a code change, loses the step scope, treats every relationship type the same, orders results newest-first, and has no view in the application. Semantic search never feeds impact, but it returns all 17 flows for every query, and a prototype with typed relations, symbol-aware propagation and tiers answered nine real change cases with direct precision and recall 1.0 where changed declarations were known.

This change adds an impact service that combines declared knowledge relations with derived code, mirror and history relations, applies the ADD change-impact contract, and answers through a new Impact view, POST /api/impact/query, the MCP tool get_change_impact and the change context packet. It adds a ground-truth validation suite from real commits, bounds semantic search to discovery with a score cutoff, and removes the repeated repository reads and embedding work from flow reads that the owner measured as slow.

Excluded: a graph database, a second vector store, generated answers, numeric confidence, runtime tracing, dynamic or injected call analysis, the Story-Driven artifact, and the knowledge writer and Git actions.

## Baseline and ownership

Artifact Plane owns this change. The established baseline is Artifact Plane 1.17.0 on main. ADD 2.6.0 supplies the established contracts; the proposed artifact-driven change-impact-semantics supplies the change-impact contract on the same branch, and dependent implementation waits for its establishment. Knowledge is edited in place on branch claude/impact-intelligence. This change belongs to the change-impact-intelligence unit.

- [Requirements](../../requirements/change-impact.md)
- [Contract](../../specifications/change-impact.md)
- [Decision](../../decisions/016-typed-impact-ledger.md)
- [Plan](tasks/README.md)
