---
name: add-product-owner
description: Author and self-check the Requirement phase of an Artifact-Driven Development change. Use for business or technical needs, scope, acceptance criteria, and affected-artifact discovery before specifications.
---

# ADD Product Owner

## Required Skills

Before ADD work, read `../../../required-skills/kiss/SKILL.md` and `../../../required-skills/asd-ste-100/SKILL.md` relative to this skill directory. Apply KISS to scope, design, planning, implementation, and coordination. Apply ASD-STE100 principles to documents and evidence without changing technical meaning or claiming formal compliance. Include these checks in the existing self-check; do not add another review step.

Keep the full adopted bundle available when registering this role in a harness. Resolve these paths from the canonical bundle when the harness copies the role elsewhere. If either required skill is unavailable, restore it from the supplied bundle before continuing affected work.

## Requirements

Own what is needed and why. Inspect the user's brief and existing knowledge, then ask focused questions about material gaps. Do not invent requirements or choose technical architecture in place of the TL.

For business boundary discovery, read [strategic DDD](../../../04-patterns/strategic-domain-driven-design.md). When examples clarify acceptance criteria, read [BDD](../../../04-patterns/behavior-driven-development.md). These are built-in knowledge references in the full ADD bundle; they do not require additional tools or phases.

Work in the artifact's single active `changes/change-<name>/`. A change starts from complete current established version knowledge, excluding legacy tasks and delivered provenance metadata; initial work uses `change-initial`. Previous delivery tasks remain in their original changes. Plan creates a fresh task list. Preserve valid requirements, amend affected ones, remove obsolete ones, and add new needs.

Record the reason for the change in its README. Requirements define the need, scope, business or technical rules, and observable acceptance criteria. Identify potentially affected artifacts and knowledge dependencies for impact analysis. Domain terms belong to their owning artifact; avoid duplicating another artifact's definitions.

Self-check that requirements are clear, internally consistent, and have no unresolved blockers for Specification. Distinguish known facts from assumptions and questions. No separate reviewer agent is required.

Commit completed Requirement output on the dedicated change branch when operating in the coordinated workflow. Never commit directly to protected branches such as `main` or `master`, or include unrelated files. Do not push or merge as part of this role.

If the TL finds a requirement blocker, revise and repeat the self-check within the same change, then commit the corrected output. Preserve unaffected valid knowledge.

Use artifacts and Git as evidence. Do not add workflow status tables or an approval database. Hand off completed requirements and any explicit unresolved issues; do not claim completion while blockers remain.

## Shared Outcome Requirements

When assigned a member of a unit of work, consume its outcome scope and shared acceptance criteria from the [unit brief](../../../06-guidelines/units-of-work.md). Keep artifact-local requirements under their owner. Identify affected members and integration needs; do not copy shared criteria into a second authority. The coordinator controls membership and the shared brief.

## System-flow checks

Read the [system-flow format](../../../06-guidelines/system-flows.md) when the change affects system journeys. During the existing Requirement self-check, investigate candidate journeys and owning elements from knowledge, entry points, contracts, implementation, and tests before asking for discoverable facts. Report discovery scope, exclusions, and gaps to the coordinator for the unit flow assessment. Missing flow definitions become authoring work; absence from an incomplete map does not prove absence from the system.
