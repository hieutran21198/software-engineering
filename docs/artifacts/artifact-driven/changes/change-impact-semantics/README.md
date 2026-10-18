# Define change impact for ADD knowledge

## Reason and scope

On 18 October 2026 the user asked for a change impact capability that AI agents and Artifact Plane can use to understand the effect of a proposed or actual change, and reported that the delivered flow impact results were not useful. The investigation found that ADD defines impact analysis as an assessment of affected knowledge, artifacts, contracts and tasks but never defines what "affected" means, which relationship types propagate impact, or how a reader must explain and bound its answer. Readers therefore return reachable flows without tiers, scope or coverage.

This change adds the change-impact contract to ADD: the tiers changed, direct, transitive, potential and unresolved; a propagation rule for every declared and derived relationship type; the explanation record; the coverage statement; and the way the phases use the result. It amends the impact-analysis definition and adds an end-user guideline in both bundle copies. It adds no mandatory front matter and no workflow state.

Excluded: new artifact prerequisites, changes to approval or establishment rules, numeric confidence, and any reader implementation, which belongs to Artifact Plane.

## Baseline and ownership

The established baseline is artifact-driven 2.6.0 on main. Knowledge is edited in place on branch claude/impact-intelligence. Artifact Plane consumes the proposed contract through its own change. This change belongs to the change-impact-intelligence unit.

- [Requirements](../../requirements/change-impact.md)
- [Contract](../../specifications/change-impact.md)
- [Decision](../../decisions/012-typed-change-impact.md)
- [Plan](tasks/README.md)
