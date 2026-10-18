# Principles

## Write Artifacts Before Code

Record requirements, specifications, applicable decisions, and the implementation plan before implementing the change. Actors use this shared knowledge instead of independently reconstructing requirements or making unrecorded assumptions.

## Give Knowledge One Owner

Each artifact has a clear purpose, scope, boundaries, owner, and dependencies. Its root README is the identity and navigation entry point. Its working knowledge on `main` or `master` is the authoritative detailed knowledge baseline.

Domain language and models belong to their owning artifact. Other artifacts reference the owner's knowledge through explicit contracts and dependencies. A separate shared domain directory must not become an unmanaged source of truth.

## Choose Cohesive Boundaries

For business capabilities, use strategic Domain-Driven Design to identify bounded contexts. The default is one artifact for an entire bounded context. Technical artifacts follow cohesive responsibility boundaries suited to their capabilities.

If an artifact becomes too large, the user can split it into smaller boundaries. Make ownership, contracts, and dependencies explicit after the split. Each shared definition still has one owning artifact.

## Keep One Active Change per Artifact

Requirements, specifications, ADRs, and tasks form one coordinated artifact change. A unit of work can group changes from several artifacts around one outcome, with shared scope and acceptance criteria. Membership adds no dependency and stores no workflow state. Parallel implementation tasks can work across applications, services, or repositories when their dependencies allow it. Independent artifacts can also progress in parallel under the artifact DAG.

## Establish Contracts Before Parallel Implementation

Use contract-driven development during Specification for all applicable interfaces. These can include APIs, events, shared data formats, error behavior, and operational interfaces.

Implementation tasks reference these contracts and check conformance through their DoD. If implementation exposes a required contract change, return to Specification within the same active change. Analyze its impact and revise affected dependencies and tasks before continuing dependent work.

## Separate Proposed and Established State

The protected branch, `main` or `master`, holds established state. A change branch holds proposed state: its difference from the protected branch is the proposal. Prepare the version record and identity record updates on the change branch. They become established only after all required knowledge and implementation changes land on `main` or `master`.

Planning can consider established and proposed dependencies together, but it must preserve their distinction. Do not store either state in a second file.

## Analyze Impact Instead of Rewriting Everything

For affected requirements, specifications, ADRs, and tasks, retain what remains valid, amend what needs correction, remove what no longer applies, and add what is missing.

Completed tasks remain as historical context only while they remain applicable. Earlier evidence does not automatically validate changed behavior. Repeat relevant checks when their covered behavior or dependencies change.

## Validate Completion and Dependencies

Validate implementation against task DoD checklists and the governing requirements, specifications, and decisions. Check dependency consistency before establishing a version.

Requirement, Specification, and Plan can prepare against proposed upstream contracts while keeping their proposed status explicit. Dependent Implementation waits until required upstream changes are complete and their versions are established. Before Implementation begins, recheck the prepared specifications and plan against those established contracts. Independent artifacts can proceed in parallel. The DAG must remain acyclic.

## Present Knowledge in the Form That Fits It

Select a table, listing, diagram or derived view from the structure of the information and the task of the reader, and keep the text authoritative. Each semantic diagram shows only stated facts, names its sources and has a text alternative; see [visual knowledge](visual-knowledge.md).

## Keep Complete, Recoverable Snapshots

Git holds the complete knowledge snapshot of every version. Current knowledge is readable in place, so actors do not reconstruct it by replaying old changes.

Retain delivered changes and their tasks while any version or unit of work references them. A defect or omission found after establishment becomes a new change; it does not alter the established snapshot.
