---
self_check:
  result: passed
  source: docs/artifacts/artifact-driven/requirements/claim-records.md#requirement-self-check
---

# Claim record requirements

## Outcome

A reviewer can read, from the knowledge of a change, the consequential claims that the change rests on, how each claim was decided, how to check it, and whether a person or an agent checked it.

## Need

Facts measured on this repository at main d931d07 on 19 October 2026:

- The bundle tells authors to "Distinguish confirmed facts from assumptions" (06-guidelines/writing-artifacts.md) but gives no place to record an assumption. Assumptions appear as prose sections in three Artifact Plane requirements only.
- Tested hypotheses are not recorded. In change-hidden-tab-streams of Artifact Plane, the measurement that ruled out slow reads (0.33 s for one read) is one sentence of the change README; no record says that it decided a hypothesis.
- The impact service reached six flows for that change. The unit declared one and dismissed five in one prose paragraph. No reader can check that the paragraph decides exactly those five.
- No evidence record (`evidence_records`, `self_check`, unit `evidence`, `publication_reviews`) states whether a person or an agent did the check.
- The plan review checklist mixes the goal (scope, acceptance) with correctness (contracts, dependencies, DoD) in one approval.
- Four unit briefs record failed or incomplete criteria for versions that are established. No version step asks which assumptions remain unchecked.

The research basis is in the investigation record of the human-cognitive-support unit. Explanations raise acceptance of AI output whether it is right or wrong, and reduce overreliance only when they lower the cost of a check (Bansal 2021; Vasconcelos 2023). Offering hypotheses, not fault locations, raised debugging success (Alaboudi and LaToza 2020).

## Requirements

- C1: ADD defines one optional list of claims in the front matter of requirements, specifications, decisions, plans, tasks and unit briefs. A claim has an identifier, a kind and one statement. The kinds are decision, assumption, hypothesis, root cause, unknown and risk.
- C2: A claim has a status: open, supported, verified, refuted or superseded. A status describes evidence only. Supported, verified and refuted need an evidence source under the existing source rule. Superseded names the claim that replaces it. A status never records approval.
- C3: A claim states its evidence basis with the existing flow-support vocabulary: documented, static, observed or inferred. An observed basis needs evidence.
- C4: A decision, root cause or assumption that is not refuted or superseded states its check: the cheapest verification a reader can perform, such as a test that fails before the fix, a command, an invariant, a counterexample or a measurement to repeat. The check is inert text.
- C5: A verified claim states who verified it: a person or an agent. The value comes from the channel that wrote the record, not from the author's input. The record does not name the person. Git authorship remains the audit.
- C6: Authors record a claim only when it is consequential: it selects between options that change a contract, a flow, a dependency or files outside the task scope; or a DoD item, acceptance criterion or declared flow is wrong if the claim is wrong; or it dismisses a computed impact item or a tested hypothesis; or it names a limit that the version ships with. Readers warn when one file holds more than ten claims.
- C7: A decision claim may list the rejected options, each with one reason. An ADR states one reason for each rejected alternative.
- C8: The plan review reads the open claims first. The guidance separates acceptance of the goal and scope from verification of correctness. Verification comes from checks and their recorded results, never from an approval. No new gate is added.
- C9: Readers derive diagnostics from claims: invalid fields, a required evidence source that does not resolve, a claim that cites failed or incomplete evidence as support, a missing check, open or supported claims of the kinds decision, root cause and assumption when a version is prepared, and a list longer than ten claims.
- C10: Records without claims stay valid. No field becomes mandatory. A reader that does not know the field ignores it.

## Acceptance criteria

- A1: One contract element defines the claim fields, the status rules, the consequential rule and the diagnostics in tables that a reader implementation can test against.
- A2: The bundle guideline on evidence records gains a Claims section with an example in a text fence. The writing rules, the artifact model, the working-with-AI guidance and the coordinator, technical lead and implementer skills state their part. Both bundle copies are identical for the changed files, every relative link resolves, `go test ./...` passes and the website builds.
- A3: The hidden-tab example (one refuted hypothesis, one supported root cause with a failing-before check) and the dismissal of reached flows can be written with the defined fields without prose.
- A4: Existing knowledge stays valid without edits; validate-knowledge reports no new diagnostic on this repository.
- A5: No approval field, workflow state, registry, phase, role or gate is added.

## Affected artifacts and flows

Artifact Plane reads and writes claims and shows them; it changes in the same unit through change-review-brief. Story-Driven depends on ADD; its adopted bundle does not use the evidence fields, and its knowledge does not change. The ADD flow change-delivery changes: its approval step reads open claims and separates goal acceptance from verification, and its implement and publication steps use the claim checks. The flows adoption, dependency-gates, unit-validation and version-publication keep their steps.

## Facts, assumptions and exclusions

Facts: the measurements above come from the repository and the Plane impact service at d931d07. Assumption: agents follow the consequential rule without inflating the list; the unit measures this on its own records. Exclusions: learning prompts, risk classes, a person's identity in records, numeric confidence.

## Requirement self-check

Each requirement states what is needed and is testable by A1–A5. C2, C5 and C8 keep approval out of files, as the artifact model requires. C10 keeps every existing record valid. The technical design of the fields belongs to Specification. KISS: one optional list that reuses the evidence source rule and the basis vocabulary. STE: one rule per item; obligations are explicit. No blocker prevents Specification.
