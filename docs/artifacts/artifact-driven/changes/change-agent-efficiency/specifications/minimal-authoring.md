# Minimal authoring scaffold

Governs A3 and A5. Add one canonical guide at docs/artifact-driven/06-guidelines/minimal-change.md and the matching embedded bundle path. It supplies a complete copyable single-artifact outcome: unit brief, change README, one requirements file, one specification, tasks/README.md and one task. Existing complete baseline knowledge is retained when applicable. The scaffold is an authoring aid; users provide domain facts.

Use the current unit/task schemas, explicit empty depends_on, affected_flows and a reasoned flow_assessment, stable acceptance IDs, unchecked DoD, and empty evidence until checks actually run. Show a separate illustrative example of a filled evidence record referencing task details once. Never ship a default passed assertion or imply that copying a template authorizes execution. Explain when an ADR is necessary without creating an empty mandatory ADR. Keep phase commits, self-checks, concrete-plan approval and upstream establishment.

Coordinator/PO/TL guidance points to this guide and checks the existing required fields within normal phase self-checks. Bundle/adoption tests verify the scaffold's YAML examples and references. Plane diagnostics validate explicit evidence fields when read; this outcome adds no generator CLI, parser dependency to Go, mandatory service or new phase. The scaffold does not overwrite a consumer's files.

Self-check: passed. The guide reduces repeated authoring while preserving complete knowledge and ownership. Canonical and embedded guides must match, and adoption retains the full bundle.
