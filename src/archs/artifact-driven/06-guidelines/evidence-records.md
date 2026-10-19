# Record checks and publication evidence

Use optional structured fields in existing Markdown files when readers need stable evidence interpretation. Keep the check details in the task or phase document that owns them. Use the existing unit `evidence` list to reference shared checks; do not copy their details into another record.

These fields record assertions and their sources. They do not grant approval, run commands, or independently prove execution or publication. Prose-only legacy records remain readable. When an explicit field is malformed, report the error instead of using a favorable prose fallback for that evidence category.

## Check records

A task or phase document may add `evidence_records` to its YAML front matter:

| Field | Rule |
| --- | --- |
| `id` | Unique within the file; matches `[a-z0-9][a-z0-9-]*`. |
| `method` | Nonempty description of the check performed. Commands remain inert text. |
| `result` | `passed`, `failed`, or `incomplete`. |
| `source` | Safe repository-relative Markdown path, optionally followed by one heading fragment, resolving to nonempty check details. |

The source may be the same task's Evidence section. Record the method, observed result, relevant implementation or test references, and limitations there. A bare result marker or front matter alone is insufficient detail. An empty `evidence_records` list supplies no positive evidence.

A phase document may also declare `self_check` with `result` and `source` under the same rules. A passed self-check records completion of that document's check only. It does not complete other phase documents, validate task DoD, grant approval, or establish a version. A task still needs all applicable DoD criteria: a passed record cannot override an unchecked criterion or another relevant failed or incomplete record.

Reject duplicate YAML keys or record IDs, wrong types, missing fields, unsafe paths, escaping symlinks, absent source files, missing headings, and empty detail sections. Paths must not be absolute or contain traversal, backslashes, or NUL. Conflicting structured and prose results produce a diagnostic and cannot support positive aggregate completion. Readers identify exact sources and distinguish recorded checks from independently executed checks.

### Illustrative recorded check

This is an invented example of a completed check, separate from a fresh scaffold. It does not assert that a project check passed. A real author adds a record only after performing the check and writing its source details.

~~~yaml
{
  "evidence_records": [
    {
      "id": "behavior",
      "method": "Run the task's specified behavior checks.",
      "result": "passed",
      "source": "docs/artifacts/sample/changes/change-small-update/tasks/01-deliver.md#evidence"
    }
  ]
}
~~~

Changing the illustrative result to `failed` or `incomplete` retains that outcome. Do not change it to `passed` because a file exists or a PR merged.

### Interpretation examples

| Input | Required interpretation |
| --- | --- |
| `passed` with resolvable, nonempty check detail and satisfied relevant DoD | Recorded passing evidence; execution is not independently verified by parsing it. |
| `failed` with the failed assertion in its source | Recorded failure; no positive completion from this check. |
| `incomplete` with the remaining work in its source | Recorded incomplete check. |
| A result such as `successful`, a duplicate ID, or a non-list `evidence_records` | Invalid explicit evidence; do not use a positive prose fallback. |
| A source file or heading that does not exist | Unavailable evidence with the missing target identified. |
| A passed structured record beside prose saying that the same check failed | Conflicting evidence; no positive aggregate completion. |
| No structured field | Preserve legacy prose interpretation and its existing limits. |

## Claims

A requirement, specification, decision, plan, task or unit brief may add an optional `claims` list to its YAML front matter. A claim records one consequential assertion and the evidence for it. It records no approval and no workflow state. Change READMEs, version records, identity records and flow records do not declare claims.

| Field | Presence | Rule |
| --- | --- | --- |
| `id` | required | Unique within the file; matches `[a-z0-9][a-z0-9-]*`. |
| `kind` | required | `decision`, `assumption`, `hypothesis`, `root_cause`, `unknown` or `risk`. |
| `statement` | required | One nonempty assertion. Not a DoD item, a requirement or a summary. |
| `status` | required | `open`, `supported`, `verified`, `refuted` or `superseded`. |
| `basis` | required | `documented`, `static`, `observed` or `inferred`, as in [flow supports](system-flows.md). |
| `evidence` | by status | Nonempty list of sources. Each source follows the `source` rule of check records. |
| `check` | by status | Inert text: the cheapest check that a reader can perform. |
| `verified_by` | by status | `person` or `agent`. |
| `rejected` | optional, `decision` only | List of `option` and `reason`, both nonempty text. |
| `risk_if_wrong` | optional | One line of text. |
| `about` | optional | Entity identities of the [change impact](change-impact.md) reader, or tracked repository paths. |
| `superseded_by` | by status | The `id` of another claim in the same file. |

| Status | Meaning | Required | Forbidden |
| --- | --- | --- | --- |
| `open` | Asserted; no supporting evidence is recorded. | — | `verified_by`, `superseded_by` |
| `supported` | Rests on the author's own recorded evidence. | `evidence` | `verified_by`, `superseded_by` |
| `verified` | Checked again with its own recorded detail. | `evidence`, `verified_by` | `superseded_by` |
| `refuted` | Recorded evidence shows that it is wrong. | `evidence` | `verified_by`, `superseded_by` |
| `superseded` | Replaced by another claim of the same file. | `superseded_by` | `verified_by` |

`basis: observed` requires `evidence`. A `decision`, `root_cause` or `assumption` claim with status `open`, `supported` or `verified` should state `check`. Keep refuted and superseded claims in the file: they record what was ruled out. Unknown keys are an error. A status never means approval.

### Record only consequential claims

Record a claim only when at least one condition is true:

1. It selects between options that change a contract, a flow, a dependency or files outside the task scope.
2. If it is wrong, a DoD item, an acceptance criterion or a declared flow is wrong.
3. It dismisses a computed impact item or a tested hypothesis.
4. It names a limit that the version ships with.

A file with more than ten claims gets a warning. Do not restate requirements, DoD items or summaries as claims.

### Verify a claim

Set `verified` only together with the detail of the check: what was run and what was observed. Put the detail under a heading in the same file and point `evidence` at it. The interface that performs the write sets `verified_by`: `person` for an interface that a person operates, `agent` for an agent interface. The input of the write never sets it. A field written directly with an editor or a script is an unchecked assertion; Git authorship remains the audit.

Readers never show the word verified for `verified_by: agent` without the qualifier that an agent check is not independent. A test that the same change adds is recorded evidence. It checks a root cause only when its detail records a run that fails without the fix.

### Claim diagnostics

| Code | Severity | Rule |
| --- | --- | --- |
| `invalid-claim` | error | A field breaks the field or status rules, or `superseded_by` names no claim of the file. |
| `claim-evidence-missing` | error | An `evidence` source does not resolve or resolves to an empty section. |
| `claim-evidence-conflict` | error | A `supported` or `verified` claim cites a source that is also the source of a `failed` or `incomplete` check record or self-check. |
| `claim-check-missing` | warning | A `decision`, `root_cause` or `assumption` claim with status `open`, `supported` or `verified` has no `check`. |
| `claim-unverified-at-version` | warning | The change has an unmerged version record, and its `decision`, `root_cause` or `assumption` claim is `open` or `supported`. |
| `claim-list-long` | warning | A file declares more than ten claims. |

An error makes the claim unavailable as evidence and never falls back to a favorable prose reading. A warning keeps the claim available.

### Illustrative claims

These invented examples follow a debugging task. They do not assert that the sources exist. A task records the hypothesis that a measurement refuted and the root cause with a check that fails without the fix:

~~~text
claims:
  - id: slow-reads
    kind: hypothesis
    statement: The server reads documents slowly.
    status: refuted
    basis: observed
    evidence: [docs/artifacts/sample/changes/change-tab-streams/tasks/01-streams.md#slow-reads]
  - id: connections
    kind: root_cause
    statement: Each tab keeps two event streams open, so three tabs use all six browser connections to the host and reads wait.
    status: supported
    basis: observed
    evidence: [docs/artifacts/sample/changes/change-tab-streams/tasks/01-streams.md#evidence]
    check: Run the tab test on the previous client (fails) and on the fix (passes).
    about: [sample:repository-refresh:observe]
~~~

A unit brief dismisses reached flows that the impact reader computed but the unit did not declare:

~~~text
claims:
  - id: reached-flows-unchanged
    kind: assumption
    statement: The two reached flows keep their steps; the reply guard changes no successful reply and no route.
    status: open
    basis: inferred
    check: Compare the server diff with the supports of the two flows and run their browser tests.
    about: [sample:knowledge-authoring, sample:context-handoff]
~~~

### Review claims

The plan review reads the open claims first. The reviewer accepts or amends the goal and scope in the conversation; that acceptance stays outside the files. Correctness comes from checks and their recorded results. A reviewer can record a check, add a counter-claim or ask for a change. Version preparation reports `claim-unverified-at-version` warnings. Claims add no phase, role or gate.

## Publication reviews

An artifact identity record (the root README front matter) or its owning unit brief may declare `publication_reviews`. Each record contains:

| Field | Rule |
| --- | --- |
| `artifact` | Safe artifact ID whose delivered version is reviewed. |
| `version` | Existing version directory name for that artifact. |
| `source` | Safe Markdown source and optional heading with nonempty, scoped publication review details. |
| `required_changes` | Nonempty list of required repository changes. Each has `repository`, `scope`, and `pull_request`. |

`repository` is the explicit HTTPS identity of the repository's remote. Normalize a configured SSH remote to its matching HTTPS repository identity when recording it. `scope` describes the required knowledge, implementation, and retained-delivery work. `pull_request` is an HTTPS PR URL on the same host and in that repository. Do not include URL credentials. Reject duplicate repository/PR pairs, invalid types, mismatched ownership, absent or ambiguous provenance, and conflicting assertions.

The source states that the listed required knowledge, implementation, and retained-delivery changes landed on `main` or `master`. Explain the reviewed scope and exclusions. This is a human-reviewed inventory, not an automatically complete dependency map.

Readers must also compare the version record or legacy snapshot, the identity record, and the originating delivery path sets and bytes against local protected refs. Missing or conflicting refs, modified delivery evidence, missing source details, or conflicting reviews prevent verified establishment. An offline reader does not fetch PRs or treat a URL as proof. The coordinator verifies remote merge states and required repository refs, then records the method and remaining limitations in the review source.

Keep the existing scoped prose publication review readable when `publication_reviews` is absent. An empty explicit list provides no publication review. An invalid explicit list cannot fall back to a favorable legacy assertion.

## Reconcile a version declaration

1. Inspect the declared `current_version`, the version records or candidate legacy snapshots, `source_change`, legacy `delivery_tasks`, current implementation, and required repository changes.
2. Verify the exact knowledge and retained-delivery path sets and contents against protected refs. Verify required implementation scopes and remote PR merges in their owning repositories.
3. Inspect validation separately. A failed or incomplete check stays visible after merge; publication does not make the check pass.
4. If evidence is missing, name the missing proof and the smallest action needed to obtain it. Do not choose the largest version number or use the package version as proof.
5. Prepare supported identity record corrections on a dedicated branch. Keep established versions, legacy snapshots, and originating delivery evidence unchanged.
6. Follow the normal team review and merge gate. Recheck publication before releasing dependent implementation.

Apply these checks within existing phase self-checks and integration validation. No extra review phase, approval database, or workflow service is required.
