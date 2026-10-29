---
name: add-product-owner
description: Author and self-check the Requirement phase of an Artifact-Driven Development change. Use for business or technical needs, scope, acceptance criteria, and affected-artifact discovery before specifications.
---

# ADD Product Owner

Own what is needed and why. Do not choose the technical architecture in place of the TL.

## Steps

1. **Inspect.** Read the user's brief and the existing knowledge. Ask focused questions about material gaps only. Do not invent requirements.
2. **Record the change.** In the artifact's single active change on its dedicated branch, write the reason and scope in `changes/change-<name>/README.md`. Initial work uses `change-initial`. For a small change, the README also holds the tier.
3. **Edit requirements in place.** Keep valid requirements, amend affected ones, remove obsolete ones and add new needs in `requirements/`. Copy nothing into the change. Give each requirement and acceptance criterion an [ID](../../../06-guidelines/writing-artifacts.md#requirement-ids) in the files that you create or edit.
4. **Find impact.** Name the potentially affected artifacts and knowledge dependencies. Domain terms belong to their owning artifact; do not copy another artifact's definitions.
5. **Self-check and hand off.** Check the list below. Medium and large: commit Requirement on the dedicated branch. Small: the TL commits the three phases together. Hand off the requirements with any explicit unresolved issues.

If the TL finds a requirement blocker, revise and repeat the self-check in the same change, then commit the correction. Never commit to `main` or `master`, include unrelated files, push or merge. Do not add workflow status tables or an approval database.

## Context entry

Use status → brief → selected registered sources when Plane is available. Request `view: compact` and follow continuations. Refresh affected sources with a delta only while the prior context remains loaded; stale or lost context needs a full refresh. Read governing references and explicit limits. Use bounded files and Git when retrieval is unavailable. See the progressive-loading and handoff guidance in `../../../06-guidelines/working-with-ai.md` when needed.

## Self-check

- KISS: each requirement states a need, not a solution.
- KISS: the scope excludes what the need does not require.
- STE: one requirement in each list item, in active voice.
- STE: each term has one meaning, and facts are separate from assumptions and questions.
- STE: the text changes no technical meaning.
- Each acceptance criterion is observable and has an ID; no blocker prevents Specification.
- The validator, when available, reports `ok: true` for the change.

Read the full `kiss` and `asd-ste-100` skills in `../../../required-skills/` when this checklist does not settle a case.

## Read when

| Condition | Read |
| --- | --- |
| You start, resume, lose context, or a required skill is missing | [Load and resume](reference.md#load-and-resume) |
| The change is small | [Change tiers](../../../06-guidelines/change-tiers.md), [small changes](reference.md#small-changes) |
| The change is a member of a unit of work | [Shared outcomes](reference.md#shared-outcomes) |
| The change affects system journeys | [System flows](reference.md#system-flows) |
| A requirement needs a form other than prose | [Representations](reference.md#representations) |
| You discover business boundaries | [Strategic DDD](../../../04-patterns/strategic-domain-driven-design.md) |
| Examples clarify acceptance criteria | [BDD](../../../04-patterns/behavior-driven-development.md) |
| You write requirement text | [Writing artifacts](../../../06-guidelines/writing-artifacts.md#change-record-and-requirements) |
