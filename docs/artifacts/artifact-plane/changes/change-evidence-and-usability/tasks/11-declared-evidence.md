---
id: declared-evidence
depends_on: [git-baseline]
evidence_records: []
---

# Derive declared evidence and version snapshots

## Scope and ownership

Own server/workflow.js (evidenceFor in-place path), server/units-of-work.js (snapshot resolution, completion), server/repository-query.js (in-place section prefixes), test/workflow.test.js, test/units-of-work.test.js, test/histories.test.js and test/repository-query.test.js.

## Governing knowledge

L3, L4, M2; specifications/knowledge-layout-reading.md declared evidence and snapshot sections; the established ADD evidence-records contract.

## Prerequisites

Explicit approval and the git-baseline DoD.

## Definition of Done

- [x] For in-place changes the six steps derive only from self_check, evidence_records, checklists and the version record; undeclared steps read "not declared"; no `git log` is issued for in-place changes, asserted through the git command counter.
- [x] Version snapshots resolve from the first-parent introducing commit of the version record or an agreeing tag; shallow or missing history yields a diagnostic and unknown completion.
- [x] Unit completion for in-place members uses that snapshot, retained tasks and existing evidence rules; legacy members keep their results on the existing fixtures.
- [x] Scoped query sections return in-place prefixes without reading legacy version directories; stale-response detection covers the protected ref.

## Evidence

Executed on 16 October 2026 after the git-baseline DoD.

- server/workflow.js: in-place changes take the declared path. Requirement and Specification come from self_check in working documents that the open change adds or modifies. Plan comes from self_check in tasks/README.md. Implementation comes from DoD checklists of the listed tasks. Validation comes from evidence_records with resolvable, nonempty sources. Version preparation comes from a version record that names the change.
- Step states are documented-complete, declared-incomplete or not-declared. Malformed records give invalid-evidence-record, and missing sources give missing-evidence; neither supplies positive evidence. Delivered changes are recognized from version records on the protected tree, which knowledge-baseline.js now lists, so no extra command is needed. The history `git log`, the shallow check and the status read run only when a legacy artifact has changes. Approval stays outside file facts.
- server/units-of-work.js: in-place unit members resolve their snapshot from the first-parent introducing commit of the version record (`git log --first-parent --diff-filter=A <ref> -- <record>`). Shallow history, a missing commit or several introducing commits give unknown completion with a reason. Optional tags are not read. Agreement with a tag therefore cannot be checked, and the commit is the only snapshot source. This is a recorded deviation.
- server/repository-query.js: scoped sections of in-place members load root knowledge prefixes and do not read versions/<current_version>/. The Markdown endpoint accepts root knowledge sources and rejects version records outside the unit's scope. The existing stale-response check compares protected refs, and the scan revision includes baseline commit IDs.
- Tests: test/workflow.test.js has two in-place cases. One shows phases from declarations with a spy git that records no `log` command; the other shows malformed and unresolvable declarations as diagnostics. test/repository-query.test.js shows scoped in-place sections that match full evidence and contained root sources. In-place unit completion with the snapshot commit and the shallow-clone diagnostic is covered in test/publication-review.test.js. Legacy workflow, histories and unit tests pass unchanged.
- `npm test`: all pass except the unrelated test/code-highlight.test.js failure.
