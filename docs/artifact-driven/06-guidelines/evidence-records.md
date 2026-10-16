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
