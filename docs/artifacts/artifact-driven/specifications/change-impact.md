# Change impact contract

Governs M1–M6 in requirements/change-impact.md. Applies to every reader that answers which entities a change affects, including Artifact Plane. A reader derives its answer from the current revision; it writes nothing, approves nothing and establishes nothing. This contract adds no mandatory front matter.

## Entities and origins

Entities are artifacts, knowledge elements, flows, steps, models, units, source modules and packages, tests and other tracked files. Identities follow the artifact model: `<artifact>:<path>` for elements, `<artifact>:<flow>` and `:<step>` for flows and steps, `<artifact>:<model>` for models, and repository-relative paths for files. Concrete identity adds repository, worktree and revision.

Origins are the changed entities. A reader accepts tracked paths; element, flow, step and model IDs; the changed top-level declarations of a module; one commit or a commit range; or the working tree compared with the protected branch. It resolves renamed and deleted paths through Git and reports an origin it cannot find as unresolved with the reason. For a knowledge origin it records the changed sections; for a module origin it records the changed declarations and the exports they affect.

## Tiers

Every reported entity carries exactly one tier.

- changed: an origin.
- direct: one propagating relationship away from a changed entity.
- transitive: two or more propagating relationships away, within the depth limit. The reader reports the depth and the number of relationships beyond it (the frontier) and accepts a deeper query.
- potential: evidence without a propagating relationship, from change history or shared contract vocabulary. The reader caps each evidence kind, ranks potential items after transitive items and never promotes them.
- unresolved: an origin that cannot be found; a support, reference or participant that does not resolve; an artifact that depends on the changed artifact but declares no reference, flow support, participant or model source for the changed element; or input that changed during the query.

Two lists accompany the tiers. Verify holds the test supports of every affected step and the tests reached through code relationships; they are work to run, not affected behavior. Investigate holds the implementation supports of affected steps that were not themselves reached; they are places to look, not affected entities.

## Propagation rules

Each relationship type has one rule. "Next hop" means that the dependent entity receives the tier of its hop count: direct at one hop, transitive beyond. A step lifts to its flow at the same hop. An affected flow acts as its own document for flow-kind supports and references that name it.

| Relationship | Source | Propagates | Evidence carried |
| --- | --- | --- | --- |
| Element reference (consumer element → supplier element) | declared | Yes, next hop. | requires text; established or proposed. |
| Flow support of kind element or flow (step → element or flow) | declared | Yes, to the step, next hop. | requires text, basis. |
| Flow support of kind implementation (step → module) | declared | Yes, to the step, next hop. When the support names a symbol and the origin names changed declarations that do not include it, the step is potential with that note. | requires text, basis, symbol. |
| Flow support of kind test (step → test) | declared | No. The test enters Verify for that step. | requires text, basis. |
| Model declaration, model source and participation (element → model → flow) | declared | Yes, next hop at each relationship. | requires text. |
| Artifact prerequisite (depends_on) | declared | No. For each changed element, every artifact that depends on its artifact and declares no relationship to it is reported unresolved. | - |
| Unit affected flows | declared | No. The declared assessment is shown beside the computed flows, with the flows declared but not reached and reached but not declared. | effect. |
| Step transition | declared | No. Transitions give context only. | condition. |
| Module import with named symbols | derived | Yes, next hop. When the origin's changed declarations are known, only an importer of an affected export propagates. Affected exports are the closure of top-level declarations that mention a changed or affected name within the module. A namespace import, a default import, a dynamic import and an affected module-level statement count as all exports. | imported names, affected exports. |
| Package import, same-package test, embedded file | derived | Yes, next hop. | package, test flag, embed pattern. |
| Identical-content mirror | derived | Yes, one hop from a changed file only. Copies whose bytes differ produce a diagnostic. | same bytes or not. |
| Change history (co-change) | historical | No. Potential when two files changed together in at least two commits and in at least half of the commits that changed the origin, within the history window. Commits that touch many files are excluded. Two knowledge documents are never paired. | support, total, confidence, window. |
| Shared contract vocabulary (code spans, snake_case and camelCase tokens and front matter keys of a changed document, against identifiers of source files) | lexical | No. Potential when at least two distinctive terms are shared; source files only. | shared terms. |
| Semantic similarity | search | Never. | - |

Hop counting: every propagating relationship is one hop. The default depth is 2.

## Explanation record

Each reported entity has the fields entity, kind, tier, hops, strength, origins and paths, and, when known, affected_exports and reason. A flow adds steps, each with step, tier, hops, strength and reason. A path is the ordered list of relationships from an origin to the entity; each has from, to, relationship and the evidence of its rule. strength is one ordered label, strongest first: declared+observed, declared+documented, declared+static, static+symbol, static, declared+inferred, historical, lexical. Readers rank by tier, then strength, then hops, then the number of origins, then identity; never by creation date. A numeric score is permitted only when it is calibrated against a measured case set and labeled with that set.

## Coverage statement

Each answer has the fields sources_used, not_analyzed, depth, frontier, symbol_level, history_window, freshness, completeness and, when a unit owns the change, the declared assessment comparison. Empty direct and transitive tiers mean that no consumer was found in the analyzed relationships. Input that changed during the query makes the answer partial.

## Phase use

Requirement uses direct, transitive and potential items to find candidate consumers and journeys, and records the discovery scope. Specification assesses compatibility for each direct and transitive item, decides each potential item by declaring the relationship or dismissing it in prose, updates the affected flows, and explains each difference between declared and computed flows in the unit flow assessment. Plan turns Verify into checks and Investigate into task scope. Implementation reruns the question on the working branch before the task self-check. Version preparation reruns it on the branch difference and corrects stale declarations. The result never grants approval, establishes a version or creates a prerequisite.

## Authoring

No new field is mandatory. A symbol on an implementation support and a cross-artifact references entry with its requires reason are the two optional declarations that raise precision. Computed results are not copied into knowledge files.

## Self-check

M1 maps to Tiers, M2 to Propagation rules, M3 to Explanation record, M4 to Coverage statement, M5 to Phase use and M6 to Authoring. Existing knowledge stays valid: the contract reads the declared relationships that exist and adds none. KISS: one contract, one guideline, no state. STE: each rule is one row with one condition. No Specification blocker remains for Plan.
