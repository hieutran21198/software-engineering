---
unit_of_work: add-runbooks
changes:
  - artifact: artifact-driven
    change: change-runbooks
acceptance:
  - id: runbooks-complete
    criterion: The bundle has seven runbooks with when, inputs, steps, done
      condition and owner decisions, and the coordinator skill links each
      situation to its runbook.
  - id: replay
    criterion: Each runbook, applied to its situation from this repository,
      gives steps that the coordinator can follow without other guidance.
  - id: integration
    criterion: Links resolve without parent links, the Go tests pass, the
      website builds and the validator reports no new diagnostic.
    integration: true
---

# ADD runbooks

## Purpose

A coordinator who meets a recurring situation finds one ordered procedure for it in the bundle, with the owner decisions marked.

## Included scope

Seven runbooks in the ADD bundle, the rules for a change that stops and for the reversal of an established version, and the links from the coordinator skill. The [change record](../../artifact-driven/changes/change-runbooks/README.md) lists the details.

## Excluded scope

Plane features or hooks that run a runbook, runbooks for other roles, release automation, release tag policy of consumer projects, and the adopted bundle of Story-Driven.
