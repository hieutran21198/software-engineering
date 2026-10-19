---
name: add-technical-lead
description: Complete Specification and Plan for an Artifact-Driven Development change, including contracts, necessary ADRs, impact analysis, task dependencies, and DoD checks. Use after requirements are complete and before user-approved implementation.
---

# ADD Technical Lead

Define how the artifact behaves and plan the work. Do Specification, then Plan, in one capable session. Report a model limitation if it affects the task.

## Steps

1. **Consume requirements.** Read the completed requirements and the artifact's working knowledge on the change branch. If a requirement blocks design, return it to the PO; do not invent a business rule.
2. **Specify.** Edit `specifications/` in place. Define behavior, owned domain terms and every applicable interface: APIs, events, data formats, errors and operations. Add an ADR in `decisions/` only for a necessary choice between several options; a small change adds none. Analyze dependency impact throughout.
3. **Reference upstream.** Declare element `references` in front matter with the owning artifact, element path and reason. Propose an artifact edge by editing `depends_on` in the identity record.
4. **Self-check Specification.** Medium and large: commit it before Plan.
5. **Plan.** Write a fresh `tasks/README.md` with the task list and `compatibility`, and task files with `id`, `depends_on`, `covers`, scope, location and concrete DoD. Add integration and validation joins. Find safe parallel work. A small change has one task and the plan paragraph in the change README.
6. **Self-check Plan.** Check coverage, membership, prerequisites, cycles and DoD. Medium and large: commit the plan and stop for explicit approval. Small: commit the three phases together.

Implementation waits until required upstream versions are established; recheck the plan against them first. For corrections, return to the phase that owns the missing information. Never commit to `main` or `master`, include unrelated files, push or merge.

## Self-check

- KISS: the design is the simplest that meets every requirement.
- KISS: no framework, layer or task without a requirement that needs it.
- STE: one rule in each sentence or table row, in active voice.
- STE: each term has one meaning, and each fact is written once.
- STE: the text changes no technical meaning.
- Every changed or added requirement ID is in the `covers` of a task, and every DoD item is observable.
- The validator, when available, reports `ok: true` for the change.

Read the full `kiss` and `asd-ste-100` skills in `../../../required-skills/` when this checklist does not settle a case.

## Read when

| Condition | Read |
| --- | --- |
| You start, resume, lose context, or a required skill is missing | [Load and resume](reference.md#load-and-resume) |
| You write specifications, references or the plan | [Specification and Plan](reference.md#specification-and-plan), [task format](../../../06-guidelines/writing-artifacts.md#implementation-plan-and-tasks) |
| The change is small, or you propose the compatibility level | [Change tiers](../../../06-guidelines/change-tiers.md), [small changes](reference.md#small-changes) |
| The change is a member of a unit of work | [Shared outcomes](reference.md#shared-outcomes) |
| The change affects system journeys | [System flows](reference.md#system-flows) |
| You assess what a change can reach | [Change impact](../../../06-guidelines/change-impact.md) |
| A contract, decision or plan has structure that prose spreads apart | [Representations](reference.md#representations) |
| A decision, assumption or unknown is consequential | [Claims](reference.md#claims) |
| A design problem matches a pattern | [Patterns](reference.md#patterns) |
