---
self_check:
  result: passed
  source: docs/artifacts/artifact-plane/specifications/delivery-support.md#specification-self-check
references:
  - artifact: artifact-driven
    element: specifications/delivery-tiers.md
    requires: tier record, small-tier criteria and their deciders, compatibility
      level, version number rule and the configuration file
  - artifact: artifact-driven
    element: specifications/record-checks.md
    requires: requirement IDs, covers, single-source rules, validator interface,
      output schema, check codes and the install directory
  - artifact: artifact-driven
    element: decisions/016-validator-delivery.md
    requires: the Plane implements the validator rules and builds the single file
claims:
  - id: impact-in-validator
    kind: decision
    statement: The standalone validator reports the impact-contained criterion
      as coordinator-decided; only the Plane services decide it with the impact
      service.
    status: verified
    basis: observed
    verified_by: agent
    evidence:
      - docs/artifacts/artifact-plane/changes/change-delivery-improvements/tasks/03-tier-check.md#evidence
      - docs/artifacts/artifact-plane/changes/change-delivery-improvements/tasks/07-validation.md#evidence
    check: Run the built validator with --change on change-hidden-tab-streams in
      a repository without a Plane state directory and confirm that the
      criterion result is coordinator and that no index is built.
    rejected:
      - option: Build the impact index inside the validator.
        reason: The index needs the Plane state directory and minutes on a large
          repository; the validator must stay a fast read-only check.
  - id: template-prompts-warn
    kind: decision
    statement: The prompts of the Plane templates ("Replace this text.") are
      placeholder-text warnings; the uppercase placeholder of the ADD scaffold
      stays an error.
    status: verified
    basis: observed
    verified_by: agent
    evidence:
      - docs/artifacts/artifact-plane/changes/change-delivery-improvements/tasks/05-operations.md#evidence
    check: Run npm test; the existing operation tests create documents from the
      templates and expect no validator error.
    rejected:
      - option: Report the template prompts as errors.
        reason: Records that the existing operations write would fail
          validation, against PI8.
      - option: Ignore the template prompts.
        reason: An unedited template would look complete.
---

# Delivery support contract

Governs PI1 to PI8 and PA1 to PA6 in requirements/delivery-improvements.md. It consumes the proposed ADD 3.0.0 contracts of artifact-driven change-delivery-improvements: specifications/delivery-tiers.md and specifications/record-checks.md. Implementation waits until that version is established on main.

## Readers

| Record | Field | Reader behavior |
| --- | --- | --- |
| change README | front matter `tier` | Parsed into the change model; absent means medium; other values are `invalid-tier` errors. |
| `tasks/README.md` | front matter `compatibility` | Parsed into the plan; absent is allowed; other values are `invalid-compatibility` errors. |
| task | front matter `covers` | Parsed into the task; the ID rules of record-checks.md apply. |
| task | `evidence_records` without `source` | Source becomes `<task path>#evidence`. |
| requirement file | list-item IDs and paragraph labels | Parsed into a list of `{id, line, form}` with form `list` or `paragraph`; a duplicate in either form is an error. |
| `docs/artifacts/add.config.yaml` | all keys | Parsed with defaults; errors are `config-invalid`. |

Existing records without these fields read as before. The diagnostic codes are the codes of record-checks.md.

## Shared checks

`server/record-checks.js` implements every check of the record-checks contract that is not already a reader diagnostic. Readers, the validator entry point and the review service call it; no second implementation exists. Checks that need Git use the existing read-only Git helpers and local refs. `placeholder-text` is an error for the ADD scaffold placeholder `REPLACE` and a warning for the prompts of the Plane templates, such as "Replace this text." (claim template-prompts-warn). The [version record identity contract](version-record-identity.md) defines when a working version record is established.

## Tier check

`server/tier-check.js` returns the `tier` object of record-checks.md for one change: the declared tier, the allowed tier and one result for each criterion of delivery-tiers.md.

| Criterion | Decision in the Plane |
| --- | --- |
| one-artifact | knowledge paths of the difference against the merge base with the protected branch, and unit briefs that name the change |
| one-repository | `coordinator` |
| patch-level | plan `compatibility` |
| no-contract | added or removed flow files, changed elements named by another artifact's `references`, added decision files, added requirement IDs |
| upstream-established | identity `depends_on` targets against protected-ref identity records |
| code-limit | `git diff --numstat` against the merge base, without `docs/artifacts/**`, `docs/artifact-driven/**`, Markdown files, lockfiles and `dist/` |
| impact-contained | the impact service with the branch difference as origin, depth 2: pass when no reached entity belongs to another artifact and the coverage statement has no unresolved reached item; `unresolved` when the index is not available; `coordinator` in the standalone validator |

When the protected baseline lists the change in `changeRecords` and the difference has no file under `docs/artifacts/<artifact>/`, the difference no longer holds the change. Then one-artifact, no-contract, code-limit and impact-contained are `unresolved` with the detail "The change record is already on the protected branch; the difference no longer holds this change." The standalone validator keeps `coordinator` for impact-contained.

The allowed tier is small when every criterion is `pass` or `coordinator`, large when one-artifact fails or no-contract fails on an element that another artifact references, and medium otherwise.

## Validator entry point and build

`scripts/validate-knowledge.mjs` implements the validator interface of record-checks.md: `--repository`, `--change`, one JSON object with schema `add-validate.result.v1`, and exit status 0, 1 or 2. `npm run validate` runs it on the repository. The validator imports no server module that starts a process, opens a port or builds an index.

`npm run build:validator` bundles the entry point and its imports into one ES module at `docs/artifact-driven/tools/add-validate.mjs`, with no runtime package dependency, for Node.js 24 or later. Git ignores the file. The CI job of the Go module and the release job run `npm ci` and `npm run build:validator` in `apps/artifact-plane` before `go test` and the release build, so the release embeds the file.

## Knowledge operations

| Operation | Change |
| --- | --- |
| change.start | Gains optional `tier` (default medium) and `compatibility`. Writes `tier` into the change README front matter and `compatibility` into the plan front matter. For a small change the input `plan` paragraph goes into the README; no unit brief is written unless the configuration requires one for the tier. |
| task.add, task.update | Gain optional `covers`. The task template has no Prerequisites section and no approval sentence; `depends_on` stays the only prerequisite record. |
| evidence.record | Omits `source` in the written record, because the default is the same section. |
| change.scaffold | New. Input: the change.start fields plus a list of tasks with title, covers and DoD items. Calls change.start and task.add in one operation with one undo entry. For a small tier exactly one task is accepted. The result must pass the shared checks, or the operation is refused with the diagnostics. |
| version.prepare | `level` becomes optional and defaults to the plan `compatibility`. The base is `current_version` of the identity record on the protected branch, not of the working tree. A computed number that is not greater than the protected number is refused. When the working tree already has a different unestablished version record of this change, the operation renames it. The rename deletes that record; it is the only deletion of a version record that the writer allows, and only for an unestablished record of the same change. A computed number that is not greater than a version record of another change in the working tree is also refused. |

The writer, digests, journal and channel rules of knowledge-editing.md stay unchanged.

## PR description

The review service gains the operation `description`. It accepts the request fields of change-review.md and returns the existing envelope. `data` holds `markdown` (string), `tier` (the tier object) and `revision`.

| Interface | Form |
| --- | --- |
| HTTP | `POST /api/review/query` with `operation: description` |
| MCP | Read tool `get_change_description` with path, worktree, artifact and change; read-only annotations |
| Packet | `data.description` in the packet operation, additive to schema `artifact-plane.change-context.v1` |
| Browser | A "PR description" section on the change page with the tier, the criteria results and a Copy button |

The Markdown has these sections in this order: Summary (first paragraph of the change README); Tier (declared, allowed, each criterion with result and detail); Plan (task titles with their covers; for a small change the README plan paragraph); Changed knowledge (paths with New, Changed or Removed and added and removed line counts); Requirement coverage (each added or changed ID and the tasks that cover it); DoD and evidence (per task: checked items of all items, evidence results); Validator (ok, error and warning counts, first ten diagnostics); Impact (the coverage statement of the change brief); Compatibility (the plan level and the computed number); Open claims (from the change brief). The last line states that approval is not recorded by this description. The text has at most 60,000 characters; longer sections are cut with an omission line that names the cut section.

The Plane never pushes, opens a PR or merges. The agent or the person passes the Markdown to the PR tool.

## Errors and limits

Requests with unknown fields, unknown changes or unsafe paths return the errors of change-review.md. A tier check without Git history returns `unresolved` for the Git criteria. The impact criterion inherits the limits of the impact service: JS, JSX and Go imports, no runtime or process boundaries.

## Validation plan

- Node tests: reader fields and defaults; each check of record-checks.md with one seeded fixture defect and one clean fixture (PA1); the built validator on the same fixtures gives the same JSON as the entry point (PA1); change.scaffold for small and medium (PA2); version.prepare with a parallel minor version on the protected branch (PA3); tier check on fixtures copied from #34, #36 and #37 (PA4); description parity across HTTP, MCP and packet, and the 60,000-character cut (PA5).
- Existing route, tool, packet and page tests pass without edits (PA6, PI8).
- Browser tests and screenshots at 1440 and 390 pixels of the change page with the PR description section (PA6).
- `npm run validate` on this repository reports no error.

## Specification self-check

PI1 maps to Readers, PI2 to Shared checks and the validator entry point, PI3 to change.scaffold, PI4 to version.prepare, PI5 to Tier check, PI6 to PR description, PI7 to the configuration row of Readers, PI8 to the unchanged writer and the additive fields. Each PA has a test in the validation plan. Claims: one open decision with its check. KISS: the scaffold composes existing operations; the description renders data that the review and brief services already compute; the validator reuses the readers. STE: one rule per row or sentence. Representations: the reader, criterion, operation and interface tables were checked against PI1 to PI7 and the ADD contracts. Impact: the knowledge-authoring, change-review and context-handoff flows change; change-impact keeps its steps. No blocker prevents Plan.

change-merged-change-status: PI5 maps to the merged-change rule after the criterion table and to the Markdown exclusion of code-limit. A branch that continues a merged change with knowledge edits keeps the difference criteria. Markdown is documentation, not code or test lines, so the count follows the ADD criterion. No blocker prevents Plan.
