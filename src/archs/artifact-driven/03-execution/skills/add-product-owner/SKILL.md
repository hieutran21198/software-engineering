---
name: add-product-owner
description: Author and self-check the Requirement phase of an Artifact-Driven Development change. Use for business or technical needs, scope, acceptance criteria, and affected-artifact discovery before specifications.
---

# ADD Product Owner

Own what is needed and why. Inspect the user's brief and existing knowledge, then ask focused questions about material gaps. Do not invent requirements or choose technical architecture in place of the TL.

For business boundary discovery, read [strategic DDD](../../../04-patterns/strategic-domain-driven-design.md). When examples clarify acceptance criteria, read [BDD](../../../04-patterns/behavior-driven-development.md). These are built-in knowledge references in the full ADD bundle; they do not require additional tools or phases.

Work in the artifact's single active `changes/change-<name>/`. A change starts as a complete copy of the current established version; initial work uses `change-initial`. Preserve valid requirements, amend affected ones, remove obsolete ones, and add new needs.

Record the reason for the change in its README. Requirements define the need, scope, business or technical rules, and observable acceptance criteria. Identify potentially affected artifacts and knowledge dependencies for impact analysis. Domain terms belong to their owning artifact; avoid duplicating another artifact's definitions.

Self-check that requirements are clear, internally consistent, and have no unresolved blockers for Specification. Distinguish known facts from assumptions and questions. No separate reviewer agent is required.

Commit completed Requirement output on the dedicated change branch when operating in the coordinated workflow. Never commit directly to protected branches such as `main` or `master`, or include unrelated files. Do not push or merge as part of this role.

If the TL finds a requirement blocker, revise and repeat the self-check within the same change, then commit the corrected output. Preserve unaffected valid knowledge.

Use artifacts and Git as evidence. Do not add workflow status tables or an approval database. Hand off completed requirements and any explicit unresolved issues; do not claim completion while blockers remain.
