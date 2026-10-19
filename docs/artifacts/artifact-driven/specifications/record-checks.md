---
self_check:
  result: passed
  source: docs/artifacts/artifact-driven/specifications/record-checks.md#specification-self-check
claims:
  - id: list-item-ids
    kind: decision
    statement: A requirement ID is the label of a Markdown list item, written as
      `- DI1:` at the start of a line, because most requirement files of this
      repository already use this form.
    status: supported
    basis: static
    evidence:
      - docs/artifacts/artifact-driven/specifications/record-checks.md#requirement-ids
    check: Run the validator on this repository; at most 13 of the 44
      requirement files report requirement-ids-missing.
    rejected:
      - option: A `### R11` heading for each requirement.
        reason: Existing files would need new headings to gain IDs.
      - option: A front-matter list of requirements with id and text.
        reason: The requirement text would move out of the Markdown body.
---

# Record checks contract

Governs DI6 to DI8 and A2, A5 and A7 in requirements/delivery-improvements.md. The [delivery tiers contract](delivery-tiers.md) defines the tier fields. The [validator decision](../decisions/016-validator-delivery.md) records where the rules are implemented.

## Requirement IDs

A requirement ID is the label of a list item in a file under `requirements/`. The line starts with `- `, then the ID, then `:` and a space. The ID matches `[A-Z][A-Z0-9]*[0-9]+`, for example `C1`, `DI12`, `UX13` or `A3`. An ID is unique in its file. Acceptance criteria use the same form and are IDs too.

On 19 October 2026, 31 of the 44 requirement files of this repository already use this form, and no file has a duplicate ID (counted with `grep -E '^- [A-Z][A-Z0-9]*[0-9]+: '`). The other 13 files stay valid without edits.

A requirement file that a change creates or edits should have at least one ID. A file without IDs is valid; the validator reports `requirement-ids-missing` as information. A duplicate ID in one file is the error `requirement-id-duplicate`.

## Covers

A task file may declare `covers` in its front matter. It replaces a prose list of governing requirements.

```yaml
covers:
  - element: requirements/delivery-improvements.md
    ids: [DI1, DI2]
  - artifact: artifact-driven
    element: requirements/delivery-improvements.md
    ids: [DI8]
```

| Field | Presence | Rule |
| --- | --- | --- |
| `artifact` | optional | An artifact ID. Default: the artifact of the task. |
| `element` | required | A path under `requirements/` of that artifact. |
| `ids` | required | Nonempty list of IDs of that file. |

An ID that the element does not define is the error `covers-unknown-id`. An ID that the change adds or changes in its requirement files, and that no task of the change's plan covers, is the warning `requirement-uncovered`. The validator computes the added and changed IDs from the difference against the protected branch. A plan needs no prose coverage paragraph.

## Single-source records

- A task does not restate its `depends_on` or the plan approval. The Prerequisites section is removed from the scaffold.
- An `evidence_records` entry of a task may omit `source`. Its source is then the `#evidence` heading of the same task file. A phase document still declares the `source` of its `self_check`.
- A unit brief evidence entry keeps `criterion`, a one-line `method`, `result` and `source`. The brief does not copy task evidence text, test counts or acceptance text of requirement files.
- A numeric result, such as a test count, is written in the task that produced it. Other records link to it.
- A version record states the compatibility level, its reason and a summary of at most three sentences. It does not repeat that it holds no knowledge or tasks.

## Validator

The default install contains a validator that runs with Node.js 24 or later.

```text
node <bundle>/tools/add-validate.mjs [--repository <path>] [--change <artifact>/<change>]
```

`<bundle>` is the adopted bundle directory. `--repository` defaults to the current directory. `--change` limits the checks to the files of one change, its artifact identity record and the records that it references. The validator writes one JSON object to stdout and nothing else. Exit status 0 means no error, 1 means at least one error, 2 means invalid arguments or a failure to read the repository.

| Field | Type | Rule |
| --- | --- | --- |
| `schema` | string | `add-validate.result.v1` |
| `ok` | boolean | True when no diagnostic has severity `error`. |
| `repository` | string | Absolute path. |
| `scope` | string or null | The `--change` value. |
| `diagnostics` | array | Objects with `code`, `severity` (`error`, `warning` or `info`), `path`, `message`. Sorted by path, then code. |
| `tier` | object or null | With `--change` only: `declared`, `allowed` (`small`, `medium`, `large`) and `criteria`, a list of `id`, `result` and `detail` from the [criteria table](delivery-tiers.md#small-tier-criteria). |

The validator never writes files, runs commands found in records, fetches or pushes. It reads local Git refs only.

## Checks

| Code | Severity | Rule | Seeded example |
| --- | --- | --- | --- |
| existing reader codes | as defined | The structural rules of records, task graphs, unit briefs, flows and claims that readers report today. | a task that depends on an unknown ID |
| `source-unresolved` | error | A `self_check`, `evidence_records` or unit evidence source does not resolve to a nonempty section. | `source: ...#no-such-heading` |
| `link-broken` | error | A relative Markdown link in `docs/artifacts/**` does not resolve to a file. External links, the fragment, and links inside code spans and fenced code are not checked. | `[x](../missing.md)` |
| `placeholder-text` | error | A record contains placeholder text of the scaffold, such as "Replace this text." | an unedited scaffold requirement |
| `version-identity-mismatch` | error | The identity `current_version` has no version record, or a version record has no `source_change` directory. | `current_version: 9.9.9` without a record |
| `version-number-invalid` | error | A version record that is not on the protected branch is not the number computed from the plan level and the protected `current_version`. | a minor record that skips a number |
| `upstream-unestablished` | warning | A `depends_on` target has no established version on the protected branch. | a dependency on an artifact with `current_version: null` |
| `requirement-id-duplicate` | error | An ID occurs twice in one requirement file. | two `- R1:` items |
| `requirement-ids-missing` | info | A requirement file that the change edits has no ID. | a prose-only requirement file |
| `covers-unknown-id` | error | See Covers. | `ids: [R99]` |
| `requirement-uncovered` | warning | See Covers. | a new ID with no task |
| `tier-mismatch` | error | The declared tier is `small` and a criterion fails or is unresolved. | `tier: small` with 400 code lines |
| `open-change-conflict` | warning | Another local or remote-tracking branch has an open change on the same artifact, or edits the same knowledge file. | two branches with changes on one artifact |
| `config-invalid` | error | See the configuration file. | `tiers.small.max_code_lines: -1` |

An open change is a change directory without a version record that names it.

## Self-check with the validator

When the validator is available, a phase self-check runs it with `--change` and records the result in the `self_check` source section as one line: the command and `ok: true`. The section then states only the checks that need judgment: meaning, KISS, STE, claims and representations. Without the validator, the author applies the rules of this contract by hand, as before.

## Install

The adoption tool copies `tools/` with the bundle. `tools/README.md` is always present and states how to run the validator. `tools/add-validate.mjs` is present only when the release build supplies it. Adoption succeeds without it. The tool does not run the validator.

## Specification self-check

DI6 maps to Single-source records, DI7 to Requirement IDs and Covers, DI8 to Validator, Checks and Self-check with the validator. A2 is met by the Checks table, which names each check, its code and a seeded example, and by Install. A5 holds because every new field is optional and missing IDs are information. A7 is met through `config-invalid` and the code-limit criterion. Claims: one supported decision with its check. KISS: the ID form reuses the existing convention; the validator reuses the reader rules. STE: one rule per sentence or row. Representations: the field and check tables were checked against DI6 to DI8; each row has a source. No blocker prevents Plan.
