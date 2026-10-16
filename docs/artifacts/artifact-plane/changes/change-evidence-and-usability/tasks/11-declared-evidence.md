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

- [ ] For in-place changes the six steps derive only from self_check, evidence_records, checklists and the version record; undeclared steps read "not declared"; no `git log` is issued for in-place changes, asserted through the git command counter.
- [ ] Version snapshots resolve from the first-parent introducing commit of the version record or an agreeing tag; shallow or missing history yields a diagnostic and unknown completion.
- [ ] Unit completion for in-place members uses that snapshot, retained tasks and existing evidence rules; legacy members keep their results on the existing fixtures.
- [ ] Scoped query sections return in-place prefixes without reading legacy version directories; stale-response detection covers the protected ref.

## Evidence

Implementation has not started. Record executed commands, outcomes, sources and limitations here after approval.
