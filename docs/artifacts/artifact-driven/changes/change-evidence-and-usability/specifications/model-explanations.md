# Reusable models and explainable relationships

## Model declarations

A specification Markdown document may declare a top-level models list in YAML front matter. Each record has id, title, description and sources. IDs use the existing safe flow-ID syntax and are unique across an artifact snapshot. title and description are nonempty strings. sources is a nonempty unique list of existing safe knowledge-element paths within that owner's snapshot. A source is evidence, not model identity. Models can describe business or technical concepts without requiring a DDD category. Do not generate declarations from document names.

Logical identity is artifact:model-id; concrete identity also includes repository, worktree and snapshot, with a model node-kind namespace separate from flows and documents. Declarations remain owned by their artifact. Duplicate identities and unsafe/missing source paths produce diagnostics; never choose an arbitrary duplicate.

## Flow participants and interactions

A flow may add participants, a list of unique records with id, artifact, model and requires. IDs, owner and model use safe-ID syntax; requires is a nonempty description of the model's role in this journey. Optional status/change use the existing established/proposed selector rules. Same-owner implicit selection uses the flow snapshot; cross-artifact implicit selection uses the owner's declared current established version. Proposed selection explicitly identifies its supplying change.

A step may add interactions, a list of records with from, to, action, outcome and supports. Endpoints name declared participant IDs; action and outcome are nonempty text; supports is a nonempty unique list of existing flow support IDs. Self-interactions are allowed. Evidence basis and observed evidence are taken from those support records, not implied by the action text. A cross-artifact interaction is runtime/model meaning, not an artifact prerequisite. Missing model targets stay unresolved and visible. Invalid participant/interaction metadata does not invalidate an otherwise valid legacy step/transition record; diagnose the affected semantic layer.

Existing steps and transitions retain their identity, conditions, branches, joins and loops. Model nodes may participate in many steps/flows; never duplicate their definitions per journey. Flows without participants retain the step view and expose Model information not documented. No metadata migration or historical snapshot rewrite is required.

## Dependency explanations

Existing element references remain the explanation authority: consuming element, supplying artifact/element, requires, and established/proposed selectors. The supplier-to-consumer artifact DAG records prerequisites; model interactions never create its edges. A reference explains consumption only when it matches the selected consumer snapshot and actual supplying artifact edge. A reason can remain unresolved evidence without proving compatibility. An edge without such references has no structured rationale; readers must report the gap rather than infer a reason from dependency status or prose similarity.

## Delivery and compatibility

Apply the additive format to canonical guidance and its embedded bundle during implementation, preserving bundle/adoption parity. Author the pilot ADD model records from existing artifact/change/version and dependency-gate contracts; attach evidence at the exact owning knowledge paths. Update the dependency-gates flow using the same record authority. No new prerequisite or root version is asserted during preparation.

## Specification self-check

The contract uses existing source selection, support evidence and safe-path rules. Model identity is independent of document path and journey. Legacy interpretation and artifact/task prerequisite meanings remain intact. Canonical/bundle changes and pilot authoring are implementation tasks. KISS avoids a registry or fixed DDD taxonomy; STE makes evidence limits explicit. No Plan blocker remains.
