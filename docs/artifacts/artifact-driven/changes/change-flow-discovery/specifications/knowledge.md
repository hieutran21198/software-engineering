# Knowledge and execution contract

Governs R1–R4, R6, R8–R9 and A1–A4, A7 in [baseline requirements](../requirements/baseline.md). Evidence is identified in [the inventory](../requirements/evidence.md). This retains the recovered baseline. The implementation task DAG extension is defined in specifications/task-dag.md.

## Owned concepts and responsibilities

An artifact is cohesive, versioned knowledge. An element is a requirements, specification, or decision file in version knowledge, or a task file in change-owned delivery work. A change is the single active candidate started from complete current version knowledge with a fresh plan; change-initial has no previous snapshot. A version is the complete resulting knowledge, established only after required merges.

| Internal responsibility | Maintained implementation or guidance | Contract |
| --- | --- | --- |
| Method and model | Canonical local docs/artifact-driven/01-foundation and 02-methodology | Identity, changes, five phases, version and dependency rules. |
| Roles | 03-execution and local harness registrations | Coordinator/PO/TL/implementer responsibilities and required skills. |
| Patterns and consumer guidance | 04-patterns and 06-guidelines | Optional practices applied within phases; setup instructions rather than an installer. |
| Bundle and adoption | src/archs, src/utils/agents/skills, cmd/se-adopt, internal/adopt | Package and copy the same supported ADD method and required skills. |
| Publishing | website and .github/workflows/ci.yml | Derive docs and release assets from maintained implementation sources. |

These are internal implementation relationships, not artifact DAG edges. Artifact Plane remains outside this boundary; ADD does not require its visualization to execute the method.

## Knowledge layout

Project identity is docs/artifacts/artifact-driven/README.md. Detailed proposed knowledge and delivery work are in changes/change-flow-discovery/{requirements,specifications,decisions,tasks}. Established 2.0.0 is the baseline. The new flow-format delivery retains complete knowledge without task copies and links to its originating plan; it remains proposed until required merges. Root README links to the current snapshot and one active change. Later changes copy complete knowledge excluding legacy tasks, remove delivered provenance, and create fresh plans. Historical tasks stay with their original changes. Obsolete material is removed or amended. Snapshots do not require replaying old changes and are not edited to fix later defects. The units-of-work extension defines shared outcome membership. specifications/task-retention.md defines source_change plus delivery_tasks: change, retention, protected-ref evidence, and legacy compatibility.

The root owns purpose, scope, owner, established version and dependency names. docs/artifacts/dag.yaml indexes roots as artifacts: <id>: {path: <relative artifact path>, depends_on: [<ids>]}. It is derived, not independently authoritative. A new unestablished artifact has no current version and is not inserted into the established graph during phase preparation. Publication prepares consistent root and index changes as proposed state until merge.

Within a consumer element, references entries contain artifact, element and requires. Element paths are relative to the owning artifact snapshot; established references resolve through its root's current version, not a pinned historical directory. Proposed references explicitly identify their supplying active change. dependencies.yaml inside a change uses artifact, add and remove lists for proposed edges. Planning combines roots with proposals, preserving their distinction and checking cycles/missing artifacts. Dependent Implementation waits for required upstream establishment and then rechecks contracts.

ADD has no required external artifact contract. The canonical reusable bundle is evidence and an implementation deliverable, not an upstream project artifact. Do not create a self-dependency to govern ADD with ADD. No proposal file is needed for an unchanged empty dependency list.

## Phase contract

1. Requirement: PO records reason, scope, rules, outcomes, acceptance criteria and potential impacts. Self-check and commit before Specification.
2. Specification: TL defines behavior, applicable interfaces, necessary ADRs and impact analysis. Self-check and commit before Plan.
3. Plan: the same TL session produces tasks with locations, governing references, prerequisites, concrete DoD and integration checks. Self-check and separate commit; explicit user approval before Implementation or material plan amendment.
4. Implementation: assigned implementers execute approved tasks and record real validation results. Coordinator checks combined acceptance, contracts and dependencies. Independent useful tasks may use separate worktrees; sequential execution is valid. Required upstream versions gate dependent work.
5. Version: coordinator suggests semantic version, user confirms, coordinator prepares complete snapshot/root/DAG and opens required PRs. Team review and merge establish only after all required knowledge/code land on main or master. No direct protected-branch commit, assistant merge, auto-merge, or deployment is authorized by preparation.

ADRs belong to Specification. Validation is an obligation within phases, not a sixth ADD phase. Missing rules return to Requirement, contract/architecture gaps to Specification, task gaps to Plan, code/test defects to Implementation. Corrections remain in the same change, repeat affected checks, and retain unaffected work.

## Role and harness contract

The full bundle supplies four role SKILL.md files and KISS/STE required skills. Skill-relative references resolve from canonical docs/artifact-driven/03-execution/skills/<role>. Harness copies/registrations must preserve access to the full bundle. Local .agents/skills registrations and .codex/agents profiles are evidence of this repository's configuration, not a portable runtime API. All roles apply required skills within existing self-checks. Roles may share a session; TL Specification and Plan use the same capable session. Report unavailable model/tool/delegation capabilities and use supported sequential execution where possible.

Git records history; tasks in retained originating changes record durable checks/results and source/test references. Versions link to those plans rather than copying them. No phase status table, copied commit history, approval database or workflow engine is part of the contract. Prose gates require responsible human/agent execution and do not provide mechanical proof of approvals or running agents.

## Guidance and source reuse

The canonical local bundle remains intact. Packaged Markdown under src/archs/artifact-driven and utility skill sources under src/utils/agents/skills feed the Go bundle and website. Recovery checks their correspondence to the local bundle; it does not silently choose one side of a conflict. Artifact contracts summarize stable behavior and reference identifiable sources; they do not copy all pattern or skill text. A future approved ADD change must keep affected delivered sources and the local method consistent.

Nine pattern guides cover strategic DDD, tactical DDD, contract-driven development, behavior-driven development, event-driven development, test-driven development, ports/adapters, policy as code and continuous integration. They are selectable guidance, not executable components or mandatory extra phases.

## Specification self-check

All R1–R4, R6, R8–R9 behavior is recovered from the inventory. One cohesive boundary avoids artificial version prerequisites. Role/phase ownership, error return paths and proposed/established distinctions remain explicit. KISS and STE checks found no blocker for Plan. No cross-artifact implementation prerequisite is introduced.

## System flow extension

Specifications/system-flows.md defines owned runtime/method journeys and unit flow assessment. Flow documents are specification elements; their runtime transitions do not become artifact or task prerequisites. Readers derive views and indexes from these records.
