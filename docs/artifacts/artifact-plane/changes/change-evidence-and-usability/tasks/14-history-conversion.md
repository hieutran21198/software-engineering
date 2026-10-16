---
id: history-conversion
depends_on: [knowledge-scripts]
evidence_records:
  - id: dod
    method: Script tests and the repository conversion recorded in Evidence.
    result: passed
    source: docs/artifacts/artifact-plane/changes/change-evidence-and-usability/tasks/14-history-conversion.md#evidence
---

# Convert retained legacy records with migrate-layout

## Scope and ownership

Own scripts/migrate-layout.mjs, test/knowledge-scripts.test.js and the scripts section of README.md.

## Governing knowledge

Plan amendment approved by the user on 16 October 2026 ("fix all legacy in docs/artifacts", full conversion, in PR #29). The amended ADD migration step 5 in docs/artifacts/artifact-driven/specifications/knowledge-layout.md.

## Prerequisites

The knowledge-scripts DoD.

## Definition of Done

- [x] `migrate-layout --convert-history` plans, for in-place artifacts, the removal of copied knowledge in version and change directories, of version-owned tasks that are byte-identical to the originating change's tasks, of dependencies.yaml in changes, and of delivery_tasks markers. It keeps task sets that have no identical originating copy and reports them.
- [x] It is a dry run by default, writes only inside docs/artifacts, refuses legacy artifacts, and verifies that each removed file is tracked in HEAD with the same bytes.
- [x] Tests cover the dry run, the exact written set, a retained exception and a refusal for an untracked or modified file.

## Evidence

Executed on 16 October 2026 after the knowledge-scripts DoD.

- scripts/migrate-layout.mjs `--convert-history` plans and, with `--write`, applies the amended step 5 for in-place artifacts: copied knowledge in version and change directories, version-owned tasks byte-identical to the originating change's tasks, dependencies.yaml of non-open changes, and delivery_tasks markers. Task sets without an identical copy, and an open change's dependencies.yaml, are reported as retained. Each deleted file must match its HEAD blob; a mismatch is conversion-unsafe and blocks writing. Files already deleted count as converted, so a rerun plans nothing. Legacy artifacts are refused with exit 3. References into removed files are reported, writes stay inside docs/artifacts, and empty directories are removed.
- The scripts now set process.exitCode instead of calling process.exit, so large JSON reports reach a pipe completely; the first run truncated its report at 64 KB.
- test/knowledge-scripts.test.js adds one case. It covers a dry run with unchanged bytes, the exact deletion and change set, a retained version-owned task set, marker removal, an empty rerun, a refusal for a modified file, and a refusal for a legacy artifact. `npm test`: 308 tests, 307 pass, 1 skipped.
- Used for this repository's conversion: see the convert-history task of the ADD plan.
