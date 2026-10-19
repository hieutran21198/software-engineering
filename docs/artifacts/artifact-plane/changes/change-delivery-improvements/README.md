# Support tiered delivery, shared checks and the PR description

## Reason and scope

ADD 3.0.0 (artifact-driven change-delivery-improvements) makes delivery cost scale with the change: change tiers, requirement IDs with `covers`, single-source facts, a validator in the default install and a version number computed at Version. The Plane reads and writes ADD records, so it must accept the new fields, run the same checks, create the smaller record set, and give the reviewer one description of a change instead of many files.

Included: the Plane readers and diagnostics for tier, requirement IDs and `covers`; the shared validator checks, with the same results as the default-install validator; a scaffold operation that writes the record set of each tier; version preparation that computes the number; a tier check over the change difference; a PR description rendered from the change review, the change brief and the checks; reading the project configuration file.

Excluded: pushing, opening PRs or merging (the Plane never does these), a required independent review, and migration of existing requirement files.

## Baseline and ownership

The established baseline is artifact-plane 1.20.0 on main. It depends on artifact-driven; implementation waits until ADD 3.0.0 is established on main. Knowledge is edited in place on branch claude/delivery-improvements. This change belongs to the delivery-improvements unit.

- [Requirements](../../requirements/delivery-improvements.md)
