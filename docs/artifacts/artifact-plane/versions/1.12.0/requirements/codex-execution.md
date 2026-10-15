# Codex execution requirements

## Need and boundary

Overlay observed agent activity on Artifact Plane implementation graphs. Each task identifies its artifact without inspector navigation. Readers distinguish concurrent work, returned execution, validated completion, and artifact establishment.

The first release observes work started in Codex through lifecycle hooks and explicit task binding. Plane does not launch, schedule, steer, interrupt, approve, or merge agent work. Existing sessions become observable only after integration activation; unavailable past activity remains unknown.

## Acceptance criteria

- R1: Implementation nodes show artifact identity, change identity, and readable task titles. Gates show artifact identity and retain establishment labels.
- R2: Bound tasks show No recorded execution, Processing, Validating, Done, Blocked, Failed, Interrupted, or Unknown with text and distinct colors. No recorded execution describes an absent matching attempt, not readiness or approval.
- R3: Attempts show agent/session identity, elapsed time, last observed activity, and freshness. Independent active tasks remain visible together without changing DAG edges.
- R4: Bindings identify repository, unit, artifact, originating change, task path, agent, and attempt. Identical task IDs across plans cannot collide. Retries remain separate attempts.
- R5: History survives browser reload, Plane restart, and implementation worktree removal. Missing sources retain recorded graph context with an archived-source label, never an establishment claim.
- R6: Events do not approve work, satisfy prerequisites, validate DoD, or establish versions. Returned execution enters Validating. Done requires an explicit validation assertion with evidence, labeled as reported until independently reviewed.
- R7: Stale observations, incomplete streams, missing bindings, unsupported hooks, and malformed events remain visible without invented liveness or success.
- R8: Hooks do not block work when Plane is unavailable. Do not persist prompts, transcripts, tool arguments, credentials, or tool output.
- R9: Inspection leaves repository files and Git metadata unchanged. Runtime writes stay outside repositories/worktrees. Hook activation is documented and user-controlled; existing configuration is preserved.
- R10: Unit and individual-task views share semantics. History remains inspectable from a remaining repository checkout when the original worktree is gone.

## Impact and self-check

Artifact Plane owns this observer/UI. Established artifact-driven contracts continue to govern task membership, dependencies, provenance, approval, and establishment. No ADD contract or artifact dependency change is required. Observations are execution evidence, not a workflow state registry. KISS reuses existing DAGs; STE distinguishes execution and delivery. No Requirement blocker remains for Specification.

## Approved visualization correction

R11: Completed documented checklists remain visible independently of runtime observation. An unobserved task must not look queued or be labeled Waiting.

R12: Implementation views hide transitively redundant task prerequisites by default and offer Show all prerequisites. Preserve all declared prerequisites in knowledge and inspectors, retain version gates, and preserve reachability.

The user requested these two concrete corrections with do the fix and reaffirmed retry. They amend this still-proposed delivery rather than create a separate outcome. Requirement self-check: the corrections address the screenshot without reconstructing agent history or changing execution authorization. KISS and STE preserve distinct evidence labels.
