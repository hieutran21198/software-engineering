# ADD Product Owner reference

The Product Owner reads a section of this page when its condition in the skill's Read-when table is true.

## Load and resume

Read the skill core before ADD work. Apply the KISS and STE checklist of the core in the existing self-check; read `../../../required-skills/kiss/SKILL.md` and `../../../required-skills/asd-ste-100/SKILL.md`, relative to the skill directory, when the checklist does not settle a case. Apply ASD-STE100 principles without changing technical meaning or claiming formal compliance. Do not add another review step; no separate reviewer agent is required.

Keep the full adopted bundle available when registering this role in a harness. Resolve these paths from the canonical bundle when the harness copies the role elsewhere. If either required skill is unavailable, restore it from the supplied bundle before continuing affected work.

If the complete current instructions of this skill are already loaded in the same session, reuse them. A summary or a path alone is not enough. Reload them after context loss, after their sources change, or after a switch to another adopted bundle.

Previous delivery tasks remain in their original changes. Plan creates a fresh task list. Use artifacts and Git as evidence. Do not claim completion while blockers remain. Preserve unaffected valid knowledge when you correct a blocker.

The [strategic DDD](../../../04-patterns/strategic-domain-driven-design.md) and [BDD](../../../04-patterns/behavior-driven-development.md) guides are built-in knowledge references in the full ADD bundle; they do not require additional tools or phases.

## Small changes

Use the [minimal change scaffold](../../../06-guidelines/minimal-change.md) when the change is small, or when one artifact and a small task plan cover a medium outcome. Edit the knowledge in place without baseline copies and replace all placeholders with verified facts. A small change amends existing requirement items and keeps their IDs; it adds no requirement ID. If the outcome needs a new requirement, tell the coordinator, because the change is then medium. During the existing self-check, validate the change README fields and the requirement IDs; use the [evidence record rules](../../../06-guidelines/evidence-records.md) for optional explicit check facts. Keep upstream establishment for every tier, and phase commits and explicit plan approval for medium and large changes. Do not add another review step or copy old task evidence as current proof.

## Shared outcomes

When assigned a member of a unit of work, consume its outcome scope and shared acceptance criteria from the [unit brief](../../../06-guidelines/units-of-work.md). Keep artifact-local requirements under their owner. Identify affected members and integration needs; do not copy shared criteria into a second authority. The coordinator controls membership and the shared brief.

## System flows

Read the [system-flow format](../../../06-guidelines/system-flows.md) when the change affects system journeys. During the existing Requirement self-check, investigate candidate journeys and owning elements from knowledge, entry points, contracts, implementation, and tests before asking for discoverable facts. Report discovery scope, exclusions, and gaps to the coordinator for the unit flow assessment or the small change's impact assessment. Missing flow definitions become authoring work; absence from an incomplete map does not prove absence from the system.

## Representations

Read the [visual representation guide](../../../06-guidelines/visual-representations.md) when a requirement benefits from a form other than prose. During the existing Requirement self-check, use example scenarios with concrete values, before-and-after comparisons and measurement tables where the selection guide calls for them. Draw no architecture, interaction or protocol detail; that belongs to Specification. Label an explanatory illustration as illustrative, and keep each confirmed fact in the text. When a need requires a system view or an artifact view, name it from the [selection matrix](../../../06-guidelines/visual-representations.md#selection-matrix) and draw none.
