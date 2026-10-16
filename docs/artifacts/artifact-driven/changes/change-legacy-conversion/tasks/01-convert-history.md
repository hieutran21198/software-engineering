---
id: convert-history
depends_on: []
evidence_records:
  - id: dod
    method: Script conversion, snapshot byte checks, unit comparison and validation recorded in Evidence.
    result: passed
    source: docs/artifacts/artifact-driven/changes/change-legacy-conversion/tasks/01-convert-history.md#evidence
---

# Convert this repository's retained legacy records

## Scope and ownership

Coordinator owns this knowledge operation and the contract and guidance amendment. Scope: every versions/<version>/ and changes/<change>/ directory under docs/artifacts, the unit briefs that reference them, specifications/knowledge-layout.md, requirements/knowledge-layout.md, the legacy sections of the canonical and embedded bundle, and the ADD paragraph of AGENTS.md. The Plane-owned script support is task history-conversion in the Plane change-legacy-conversion.

## Governing knowledge and prerequisites

Approved by the user on 16 October 2026 ("fix all legacy in docs/artifacts", full conversion). N4, N7, K5; specifications/knowledge-layout.md migration and derived facts. ADD 2.4.0 is established on main.

## Definition of Done

- [x] The contract, requirements, guidance and AGENTS.md allow converting retained legacy records, and define the snapshot of a converted legacy version as versions/<version>/ in the tree of the first-parent commit that introduced its README. Other repositories keep the legacy layout readable.
- [x] No version directory holds knowledge directories, and no change directory holds copied knowledge or dependencies.yaml. delivery_tasks markers are removed. Version-owned tasks that are byte-identical to the originating change's tasks are removed; task sets with no recorded originating change stay as the only exception, with a reason.
- [x] Unit evidence sources and Markdown links that pointed into removed files resolve: tasks to the retained change copies, knowledge links become plain text that names the Git snapshot. Affirmative prose publication reviews accepted by the reader are restated as structured publication_reviews with verified merged PRs.
- [x] Every removed file exists unchanged in HEAD before the conversion; the Plane reads all units with the same completion results when main is set to the converted revision; validate-knowledge reports no errors; links resolve.

## Evidence

Executed on 16 October 2026 after the user approved full conversion. PR #29 merged first, so this change delivers the conversion in a new PR.

- Contract and guidance: requirements N7 and K5 and specifications/knowledge-layout.md (migration step 5, version snapshot row, self-check) allow conversion. They define the knowledge of a converted version as versions/<version>/ in the tree of the commit that introduced its README. artifact-model.md, writing-artifacts.md and units-of-work.md (canonical and embedded) and AGENTS.md say to delete established legacy snapshots only in a conversion, and never to edit them.
- Conversion with `node apps/artifact-plane/scripts/migrate-layout.mjs . --convert-history --write`: 933 files deleted, 20 version records and 18 change records annotated, and 15 delivery_tasks markers removed. The deletions are the knowledge of 20 version directories, copied knowledge of 20 delivered changes, the tasks of 1.2.0, 1.6.0 and 1.7.0 (byte-identical to their changes), and story-driven change-flow-discovery/dependencies.yaml. ADD 1.1.0 and Plane 1.5.0 keep their version-owned tasks, because no originating change is recorded and moving them would invent provenance. The undelivered Plane change-model-explanations keeps its copied knowledge: no version names it, so without the copy it would look like an open change. The first script run removed it too, against the delivered-only rule; it was restored byte-identical from main and the script was corrected.
- References: 5 unit evidence sources and 3 task links now point at the retained change tasks, and 173 knowledge links became plain text. Each converted version README ends with a Knowledge snapshot section that gives the git log command. The affirmative prose reviews accepted by the reader (ADD 2.1.0 via #20, Plane 1.11.0 and story-driven 1.1.0 via #21, ADD 1.2.0 via #10) are restated as publication_reviews; `gh pr view` confirmed that #10, #20 and #21 are merged.
- Verification:
  - All 502 removed version files have the same blob in the first-parent commit on origin/main that introduced their version README.
  - All 431 removed change copies are identical on origin/main.
  - With main set to the converted revision, the Plane reads all 13 historical units with the same completion and member states as the legacy form. Only the two current units differ, because of their new versions.
  - validate-knowledge reports 0 diagnostics, the link script finds 0 broken links, and `npm test` passes.
- Census, after the earlier migration and after this conversion: 1,330 files and 5,903,540 bytes before, 407 files and 1,477,951 bytes after; byte-identical redundant copies went from 71.5 to 21.3 percent. The remaining copies are the undelivered change's knowledge, older task copies inside retained plans and the two kept task sets.
