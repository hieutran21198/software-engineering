---
self_check:
  result: passed
  source: docs/artifacts/artifact-plane/requirements/knowledge-layout.md#impact-and-self-check
---

# Read the in-place knowledge layout

## Need and observed behavior

ADD proposes an in-place knowledge layout: one working knowledge tree per artifact, one-file version records, change records with retained plans, structural facts in front matter only, and Git as the version store. The Plane currently reads only the snapshot-copy layout. On this repository it issues 800 git commands and scans 9,400 files to explore ten worktrees, reports "current step is unknown" for 19 of 21 changes, derives unit completion from an English sentence pattern, and returns 116,052 to 156,422 JSON characters for a zero-excerpt context packet.

## Requirements

- L1: Detect each artifact's layout. Read identity records from front matter only for in-place artifacts. Keep the existing legacy parsing for snapshot-copy artifacts.
- L2: Resolve the established baseline from local main or master for both layouts. Compare working knowledge with that baseline through Git name-status and blob bytes. Record each knowledge file as added, modified, removed or unchanged. Do not compare version directories on the in-place path.
- L3: Derive phase and delivery evidence for in-place changes from declared self_check, evidence_records, task checklists and version records. Do not replay commit history for in-place changes. Keep legacy inference for legacy changes. When the change record is already on the protected branch, read the self_check records of all committed requirement, specification and decision documents of the artifact, because they no longer differ from the protected branch.
- L4: Resolve a version snapshot from the version record's introducing first-parent commit on the protected branch, with an optional `<artifact>/<version>` tag. Use it for in-place unit members. Legacy members keep their current resolution.
- L5: Use one source for in-place elements, the working tree. Flows, references, models and navigation identify elements as `<artifact>:<path>`. Label working knowledge and knowledge established on main distinctly.
- L6: Supply two deterministic scripts that reuse the readers: validate-knowledge, which prints diagnostics as JSON and sets a nonzero exit status for invalid knowledge, and migrate-layout, which defaults to dry-run, refuses ambiguous declarations and reports byte equivalence.
- L7: Preserve read-only containment, revision and freshness checks, HTTP and MCP parity, lazy loading and the existing packet schema. New fields are additive.

## Acceptance criteria

- M1: Fixtures cover legacy, in-place, mixed and transition repositories, where main is legacy and the branch is in-place. All existing tests pass on legacy fixtures.
- M2: On the in-place fixture, the review packet lists only changed and governing files once, the explore query issues no per-change history commands, and a shallow clone or missing protected ref yields a diagnostic.
- M3: The zero-excerpt packet for the migrated ADD change is at least 80 percent smaller than the recorded baseline, and exploring this repository issues at least 50 percent fewer git commands. Both are measured with a repeatable script.
- M4: Browser checks show working and established labels, change records, version records and task graphs for an in-place artifact.
- M5: The scripts validate the fixtures and this repository, and the migration dry-run on a legacy fixture reports the exact files it would create and change.

## Impact and self-check

The Plane consumes the proposed ADD in-place layout contract. Implementation waits for that contract to establish and be rechecked. The existing comparison, evidence, model explanation, refresh and responsive work in this change remains in scope; publication-evidence, comparison-service, comparison-interface and compact-context tasks are superseded by in-place reading because the single knowledge tree removes the inherited-copy noise and most packet size they addressed. KISS reuses the existing readers, service and adapters. STE keeps the legacy and in-place paths distinct. No unresolved Requirement blocker prevents Specification.

change-merged-change-status amends L3 and keeps its ID. The defect is observable: on main, nix-packages/change-initial has passed self_check records in its requirement and specification, but the status and the change page show the phase Requirement and an unmet self-check item. No requirement ID is added.
