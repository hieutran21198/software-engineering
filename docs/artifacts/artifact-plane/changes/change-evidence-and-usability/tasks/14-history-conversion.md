---
id: history-conversion
depends_on: [knowledge-scripts]
evidence_records: []
---

# Convert retained legacy records with migrate-layout

## Scope and ownership

Own scripts/migrate-layout.mjs, test/knowledge-scripts.test.js and the scripts section of README.md.

## Governing knowledge

Plan amendment approved by the user on 16 October 2026 ("fix all legacy in docs/artifacts", full conversion, in PR #29). The amended ADD migration step 5 in docs/artifacts/artifact-driven/specifications/knowledge-layout.md.

## Prerequisites

The knowledge-scripts DoD.

## Definition of Done

- [ ] `migrate-layout --convert-history` plans, for in-place artifacts, the removal of copied knowledge in version and change directories, of version-owned tasks that are byte-identical to the originating change's tasks, of dependencies.yaml in changes, and of delivery_tasks markers. It keeps task sets that have no identical originating copy and reports them.
- [ ] It is a dry run by default, writes only inside docs/artifacts, refuses legacy artifacts, and verifies that each removed file is tracked in HEAD with the same bytes.
- [ ] Tests cover the dry run, the exact written set, a retained exception and a refusal for an untracked or modified file.

## Evidence

Not executed. Record methods, results, source references and limitations here.
