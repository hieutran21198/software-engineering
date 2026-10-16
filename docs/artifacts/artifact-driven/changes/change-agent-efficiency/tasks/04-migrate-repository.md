---
id: migrate-repository
depends_on: [layout-guidance]
evidence_records: []
---

# Migrate this repository's artifacts to the in-place layout

## Scope and ownership

Coordinator owns this knowledge operation; an implementer can execute the mechanical steps. Scope: docs/artifacts/artifact-driven, docs/artifacts/artifact-plane, docs/artifacts/story-driven and docs/artifacts/dag.yaml. Established versions/<version>/ directories and delivered change directories are not modified.

## Governing knowledge and prerequisites

N7, N8, K4 to K6; specifications/knowledge-layout.md migration section; the reconciliation procedure in the established evidence-records contract. Explicit plan approval and the layout-guidance DoD are required. No upstream artifact contract is required.

## Definition of Done

- [ ] Reconcile each declared current version against local and remote main: artifact-driven 2.3.0 through PR #28; artifact-plane by verifying which complete snapshot and retained delivery record among 1.11.0 to 1.13.0 landed through PRs #23 to #26; story-driven 1.1.0 through PR #21. Record the method and result. Stop on ambiguity.
- [ ] artifact-driven: the artifact's working knowledge is the knowledge of change-agent-efficiency; those directories are removed from the change, which keeps README.md and tasks/. The README carries the identity record and no Markdown declaration or state sections. dependencies.yaml does not exist.
- [ ] artifact-plane: the working knowledge is the knowledge of change-evidence-and-usability; those directories are removed from the change. The identity record declares the verified established version and depends_on: [artifact-driven].
- [ ] story-driven: the working knowledge is byte-identical to versions/1.1.0 knowledge; the identity record declares 1.1.0 and depends_on: [artifact-driven]; the stale active-change link is removed; the delivered change directory is unchanged.
- [ ] docs/artifacts/dag.yaml is deleted. `git diff --stat` shows no change under any versions/<version>/ knowledge directory or delivered change.
- [ ] `diff -r` shows byte equality between each artifact's working knowledge and its source; the dependency graph has the same two edges; the legacy reader shows historical versions and units unchanged; the census script shows zero copied knowledge files in current knowledge. Record the before and after census.

## Evidence

Not executed. Record methods, results, source references and limitations here.
