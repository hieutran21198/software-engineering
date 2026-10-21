---
tier: small
---

# Read a change correctly after its record reaches main

## Reason and scope

PR #48 merged nix-packages/change-initial to main without a version record, because native checks on three platforms are still open. On main the Plane shows that change with three wrong facts:

1. The status and the stepper show the phase Requirement, and the readiness item "Requirement, specification and plan self-checks are recorded" is unmet. The requirement and the specification have passed self_check records. The reader reads them only from documents that differ from main.
2. The tier check reports one-artifact and no-contract as pass, and Changed knowledge says that no knowledge differs from main. On main the difference is empty, so these facts describe nothing.
3. code-limit counts 908 lines: the uncommitted .claude, .commandcode and .review files of the worktree, mostly Markdown review notes.

Included: read the self_check records of the committed documents when the change README is on the protected branch; mark the criteria that use the difference unresolved for such a change when no file of its artifact differs; say on the change page that its knowledge is already on main; exclude Markdown from the code count. Excluded: uncommitted work that does not belong to the change on a feature branch, and the open DoD item of nix-packages.

## Plan

One task adds `changeRecords` to the protected baseline, uses it in the declared evidence, the tier check and the Changed knowledge section, excludes Markdown from code-limit, and adds Node tests on a fixture where the change is merged to main. The task covers L3 in requirements/knowledge-layout.md, PI5 in requirements/delivery-improvements.md and W10 in requirements/authoring-workbench.md. Compatibility: patch.

## Tier decisions

One repository: the readers, the change page, the tests and the knowledge are in this repository.

Impact: the protected baseline, the declared evidence and the tier check are used by the Plane reader, the review services and the validator entry point of this artifact. The bundled validator `docs/artifact-driven/tools/add-validate.mjs` is a build output of the same code and is not committed. No flow record, decision, requirement ID or referenced element changes.

- [Task](tasks/01-deliver.md)
