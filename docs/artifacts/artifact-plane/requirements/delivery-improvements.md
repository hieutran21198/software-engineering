---
self_check:
  result: passed
  source: docs/artifacts/artifact-plane/requirements/delivery-improvements.md#requirement-self-check
references:
  - artifact: artifact-driven
    element: requirements/delivery-improvements.md
    requires: change tiers, requirement IDs and covers, the default-install
      validator checks, the version number rule and the configuration file
---

# Delivery improvement requirements for Artifact Plane

## Outcome

A person or an agent uses the Plane to create the records of a change at its tier, to check them with the same rules as the default-install validator, and to give a reviewer one description of the change for its PR.

## Need

Facts measured on this repository on 19 October 2026 (`docs/artifacts/units-of-work/framework-comparison/measurements/git-cost.md`, `session-cost.md`, and `optimization.md` in the same directory):

- The Plane validator script has 47 lines and checks scanner, snapshot, task, unit and flow diagnostics. It does not resolve self-check or evidence sources, relative links or template placeholders, and it does not compare the version record with the identity record.
- The operations `change.start`, `task.add`, `unit.create` and `version.prepare` exist separately. An agent calls them one by one and fills the version number by hand. ADD 2.8.0 was renumbered after a parallel change took 2.7.0.
- A reviewer of PR #38 had 52 knowledge files to read. The change page and the change brief (1.20.0) show a change in the Plane, but the PR description is written by hand.
- Knowledge writes are about 1% of agent tool-result tokens; the cost of hand-written records is in errors that self-checks find later: 179 extra writes of 98 knowledge files.

## Requirements

- PI1: The readers accept the change tier, parseable requirement IDs and task `covers` of ADD 3.0.0, and keep every record without them valid. Missing requirement IDs are information, not an error.
- PI2: The Plane runs the checks of the ADD default-install validator and reports the same diagnostics for the same tree. Each rule has one implementation that both use. The Plane validator command returns machine-readable output, can be limited to one change, and runs in CI.
- PI3: One scaffold operation writes the record set of a change at its tier: for a small change the change record with tier and plan, one task and no unit brief; for a medium or large change the existing set. The written records pass the validator. Placeholder text that is not replaced is a diagnostic.
- PI4: Version preparation computes the version number from the compatibility level and `current_version` on the protected branch, writes the version record and the identity record, and refuses a number that is not greater than the established one.
- PI5: A tier check over the change difference reports the tier that the ADD criteria allow and names each criterion that fails or stays unresolved, with the impact answer it used. When the change record is already on the protected branch and no file of its artifact differs, the difference no longer holds the change, and the criteria that use the difference are unresolved. The code count holds no Markdown document.
- PI6: The Plane renders a PR description in Markdown from the change review, the change brief and the checks: tier, changed knowledge, task DoD and evidence, requirement coverage, validator result, impact coverage statement, proposed compatibility level and open claims. The change page, HTTP and MCP return the same description for the same revision. The Plane does not push, open a PR or merge.
- PI7: The Plane reads the project configuration file of ADD 3.0.0 for tier limits and brief rules, and uses the ADD defaults without the file.
- PI8: Existing routes, tools, packet fields and pages keep their behavior, except where a requirement above adds a field.

## Acceptance criteria

- PA1: On a fixture with one seeded defect for each check, the Plane validator and the ADD default-install validator report the same diagnostics; on this repository both report no error.
- PA2: The scaffold for a small change writes at most 7 knowledge files that pass the validator; for a medium change it writes the existing set with a unit brief.
- PA3: Version preparation computes the next number on a fixture where a parallel change took the next minor number, and refuses a number that is not greater.
- PA4: The tier check reports small for the knowledge and code of change-hidden-tab-streams (#37) and change-navigation-hierarchy (#34), and not small for change-impact-intelligence (#36) with the failing criteria named.
- PA5: The PR description of change-review-brief contains every section of PI6, and the page, HTTP and MCP return the same text for the same revision.
- PA6: Node and browser suites pass, existing route, tool and packet tests pass without edits, and screenshots at 1440 and 390 pixels show the tier and the description on the change page.

## Affected artifacts and flows

This change consumes artifact-driven change-delivery-improvements. Plane flows: knowledge-authoring changes (scaffold operation, version number computed); change-review changes (tier check and PR description on the change page); context-handoff changes (the packet gains the description). Change-impact keeps its steps; the tier check calls it. Repository-exploration, repository-refresh, unit-inspection, execution-observation, project-tabs and source-retrieval keep their steps.

## Facts, assumptions and exclusions

Facts: the counts above come from the Plane source at 1.20.0 and the measurement records. Assumption: one rule implementation can serve both the Plane and the default-install validator; Specification decides where it lives. Exclusions: pushing and PR creation, a required independent review, migration of existing requirement files.

## Requirement self-check

Each requirement states what is needed and is testable through PA1 to PA6. PI2 keeps one implementation of each rule, so the two validators cannot drift. PI6 keeps approval out of the description and keeps the Plane from publishing. The location of the shared rules and the description format belong to Specification. KISS: the scaffold composes the existing operations; the description renders existing review and brief data. STE: one rule per item. No blocker prevents Specification; implementation waits for the established ADD version.

change-merged-change-status amends PI5 and keeps its ID. The defect is observable: on main, the tier check of nix-packages/change-initial reports "No knowledge file under docs/artifacts changes" and "no requirement ID added", although the change added NP1 to NA6, and it counts 908 lines of uncommitted Markdown review notes and settings as code. No requirement ID is added.
