# Store knowledge once, in place, with Git as the version store

## Context

ADD stores each snapshot as a directory: a change copies the current version, and a version copies the change. In this repository 72 percent of docs/artifacts bytes are copies, readers parse prose and commit history to recover facts the copies hide, and PRs change 60 to 254 files. The user asked whether a separate structural model layer would reduce complexity, and asked for a simpler alternative if one exists.

## Alternatives

| Option | Description | Assessment |
| --- | --- | --- |
| A. Two physical layers | A model file per artifact holds identities, lifecycle, dependencies, tasks and flow topology; Markdown holds prose. | Every fact needs an entry in two files. The model file becomes a merge hotspot and a second authority for task lists and flows that already live beside their prose. Does not remove the copies. Rejected. |
| B. Logical layers in each file, one tree, Git versions | Front matter is the structural layer, the Markdown body is the semantic layer, knowledge lives once per artifact, versions and changes are records, Git holds history. | Removes copies, prose parsing and stored indexes. Reuses the front matter contracts of 2.1.0 to 2.3.0. Legacy layout stays readable. Selected. |
| C. Keep copies, add structured fields and compact packets | The earlier plan direction. | Keeps the duplication and adds a third syntax beside prose and copies. Packets still enumerate copies. Rejected. |
| D. Workflow database or registry | Store lifecycle state outside the files. | Second source of truth; excluded by the constraints. Rejected. |
| E. Generate the copies with tooling | Scripts create the snapshot copies. | Automates the symptom; readers and reviewers still see copies. Rejected. |

## Decision

Adopt option B as the in-place knowledge layout defined in specifications/knowledge-layout.md. Structural facts live only in YAML front matter; readers never interpret prose. Established knowledge is the protected branch's tree, proposed knowledge is the branch difference, and historical versions resolve through the version record's introducing commit. Legacy artifacts remain readable; established snapshots are never rewritten. Migration is a documented, byte-preserving procedure.

## Consequences

Starting a change copies nothing and a version adds one file, so PRs show only real changes. Readers drop directory comparison, prose regexes and commit archaeology on the in-place path, but must support two layouts during the transition and need the protected ref to label proposed knowledge. Historical snapshot retrieval needs Git history; shallow clones get a diagnostic. Concurrent changes to one artifact conflict at merge, which enforces the one-active-change rule in Git rather than by convention.
