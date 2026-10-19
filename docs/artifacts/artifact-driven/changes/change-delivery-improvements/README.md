# Make delivery cost scale with the change

## Reason and scope

On 19 October 2026 the owner asked to build the improved ADD that the framework-comparison investigation recommends (releases R1 to R3 of its optimization record). Measurements on this repository show that every change, of any size, pays the same records, commits and gates: a fix with 50 code and test lines produced 312 knowledge lines in 13 files, 5 commits and 3 human gates. About 39% of task lines and 75% of unit-brief lines restate facts kept elsewhere. Agents read the same guidance again in many contexts, and the bundle has no validator in the default install.

This change makes the delivery cost scale with the change and keeps the five guarantees the owner fixed: `main` shows the current truth of each capability; traceability from requirement to specification to task to code and tests; versions and the established rule; dependent work waits for an established upstream version; a person approves the plan of a large change before implementation.

Included: change-size tiers with a small-tier path; one knowledge commit and approval by request for the small tier; semver level confirmed with plan approval; version number computed at Version; single-source facts; requirement IDs and `covers` for new and edited records; a deterministic validator in the default install; progressive guidance and implementer context rules; impact-selected local tests; a configuration file and Claude Code role profiles; an owner look before a version that changes a UI; one bundle source with the copy generated at build. The repository instructions in `AGENTS.md` change to match.

Excluded: a code-only maintenance tier without records (the owner deferred it), a required independent review (release R4), migration of existing requirement files to IDs, and Plane features (Artifact Plane change-delivery-improvements).

## Baseline and ownership

The established baseline is artifact-driven 2.9.0 on main. Knowledge is edited in place on branch claude/delivery-improvements. The owner chose a major version (3.0.0) because consumers follow changed rules. This change belongs to the delivery-improvements unit.

- [Requirements](../../requirements/delivery-improvements.md)
- [Delivery tiers contract](../../specifications/delivery-tiers.md)
- [Record checks contract](../../specifications/record-checks.md)
- Decisions: [tiers](../../decisions/015-change-tiers.md), [validator delivery](../../decisions/016-validator-delivery.md), [one bundle source](../../decisions/017-single-bundle-source.md)
- [Plan](tasks/README.md)
