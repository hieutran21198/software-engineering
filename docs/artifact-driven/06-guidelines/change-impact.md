# Assess Change Impact

Use this guide to answer "what might break if I change this, why, and where should I look first" from ADD knowledge and a repository. A reader such as Artifact Plane computes the answer from declared knowledge and derived code relationships; this guide explains how to read it and how each phase uses it. The reader derives; it never approves, establishes or edits knowledge.

## Ask the question

Start from what changed: a knowledge element, a flow or step, a model, a source file or symbol, one commit, or the working branch compared with the protected branch. Give changed declarations when you know them; a reader that knows which top-level declarations changed excludes importers of unrelated exports. Keep the default depth and expand one hop when the answer reports relationships beyond it.

## Read the tiers

| Tier | Meaning | What to do |
| --- | --- | --- |
| Changed | The entities you named, with their changed declarations or sections. | Check that the reader resolved every one; an unknown path appears under unresolved with its reason. |
| Direct | One declared or derived relationship away from a changed entity. | Review every item. A direct item names the step, element, module or test and the relationship with its reason or symbols. |
| Transitive | More than one relationship away, within the depth. | Read the path. A path through a shared module such as a server entry point is broad; judge it by the symbols it carries and the step it reaches. |
| Potential | Evidence without a relationship: files that changed together in history, or code that shares the contract vocabulary of a changed document. | Confirm before acting. Adopt a confirmed coupling as a reference or a flow support; dismiss the rest in the specification prose. |
| Unresolved | A relationship the reader could not resolve: a missing or renamed path, a support that does not resolve, or an artifact that depends on the changed artifact but declares no relationship to the changed element. | Treat as unknown, not as absent. Investigate the artifact or fix the stale declaration. |

Two lists accompany the tiers. Verify names the tests that support affected steps; run them. Investigate names the implementation and test supports of affected steps that were not themselves reached; read them to confirm the step still behaves as specified.

Every answer ends with a coverage statement: the relationship sources it used, what it did not analyze (for example dynamic calls, injected functions and process boundaries), the depth and the count of relationships beyond it, the symbol level, the history window, and freshness. An empty direct and transitive tier means that no consumer was found in the analyzed relationships. It does not prove that no impact exists.

## Use the answer in each phase

- Requirement: run the question for the elements and sources the change touches. Record the direct and transitive consumers and the flows as candidates, and the discovery scope and gaps for the unit flow assessment.
- Specification: assess compatibility for each direct and transitive item and record the result in the affected contracts and flows. Decide each potential item: declare the relationship if it is real, or state in prose why it is not. Compare the unit's declared affected flows with the computed flows and explain each difference in the flow assessment.
- Plan: turn the verify list into concrete checks and the investigate list into task scope.
- Implementation: rerun the question on the working branch before the task self-check; a new direct consumer that the plan does not cover returns to Plan.
- Version preparation: rerun on the branch difference against the protected branch; unresolved items that name stale declarations are corrected before the version record.

## Keep the answer precise without a manual graph

Declared knowledge stays the authority and needs no new fields. Two optional declarations raise precision: a `symbol` on an implementation support when one file hosts several contracts, and a cross-artifact `references` entry with its `requires` reason when a document consumes another artifact's contract. Derived relationships cover imports, packages, embedded files and identical copies without maintenance. Do not copy computed results into knowledge files; the next answer is computed again from the current revision.

## Limits

The reader analyzes declared knowledge, static imports with their symbols, package relationships, embedded files, identical copies, change history and shared vocabulary. It does not analyze runtime calls, functions passed as parameters, HTTP or process boundaries, or semantic similarity. A reported path proves a relationship, not a failure; a missing path proves nothing. Treat numeric scores, if a reader shows any, as ranking aids, never as probabilities.
