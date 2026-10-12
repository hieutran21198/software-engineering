# Writing Artifacts

## Root README

Record purpose, scope, boundaries, ownership, established dependencies, and current established version. Link to the relevant knowledge snapshot without duplicating its contents.

For a new artifact, state that no established version exists. For an established artifact, keep proposed identity and dependency changes in the active change until publication. Working-branch root updates describe proposed post-merge state, not an already established version.

Do not add workflow status tables, copied commit hashes, or an approval registry. Git records history; the knowledge files contain the work and its validation evidence.

## Change README and Requirements

In `changes/change-<name>/README.md`, explain the reason for the change, scope, and proposed artifact identity changes when applicable.

Write requirements under `requirements/`. The PO defines what is needed and why, required outcomes, constraints, acceptance criteria, and potentially affected artifacts. Distinguish confirmed facts from assumptions. Resolve material blockers before Specification.

For example, after stakeholder confirmation: “A user can sign in to a tenant only when the user has active membership in that tenant.” Include examples of accepted and denied behavior where useful. Do not invent protocol details to make the requirement appear complete.

## Specifications and Decisions

Under `specifications/`, the TL defines precise behavior, owned domain terms/models, and all applicable interface contracts. Specify inputs, outputs, error behavior, and relevant lifecycle or consistency rules. Reference governing requirements.

Create an ADR in `decisions/` only for a necessary architectural choice involving multiple options. Record the context, alternatives, chosen option, reasoning, and consequences. A routine specification statement does not need an ADR.

## References and Dependencies

Detailed references name the owning artifact, element path within its snapshot, and reason:

```yaml
references:
  - artifact: tenant
    element: specifications/tenant-identity.md
    requires: tenant identifier format and lifecycle rules
```

Resolve established knowledge through the owner's current version. Identify proposed upstream contracts and their supplying change explicitly during preparation.

Propose artifact-level edge changes in the active change's `dependencies.yaml`:

```yaml
artifact: authentication
add:
  - tenant
remove: []
```

Established root dependencies generate `docs/artifacts/dag.yaml`. Keep the artifact DAG acyclic; runtime event flows are a different graph. Diagram arrows point from upstream prerequisite to dependent artifact.

## Implementation Plan and Tasks

Use `tasks/README.md` to organize tasks and their dependencies. Each task states its scope, repository or location, governing references, prerequisites, and concrete DoD checklist. Include integration work needed to validate parallel implementations.

For example, a task to implement tenant-scoped login might check that allowed login succeeds, login without membership is denied, and the defined response contract is satisfied. Choose exact checks from the confirmed requirements and specifications.

Record commands or review methods, results, and relevant code/test references with tasks. Keep failed and incomplete checks visible. Historical completed tasks remain only while applicable; recheck evidence when its covered behavior changes.

## Version Snapshot

After validation, copy the full resulting requirements, specifications, applicable decisions, and tasks with evidence into the proposed version. The snapshot must not require replaying old changes. Code and executable tests remain in implementation repositories.

Prepare consistent root README and DAG updates. Establishment requires all required merges. Later defects or missing evidence are handled by a new change, not edits to the established snapshot.
