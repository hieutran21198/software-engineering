---
tasks:
  - 09-layout-records.md
  - 10-git-baseline.md
  - 13-knowledge-scripts.md
  - 11-declared-evidence.md
  - 12-layout-navigation.md
  - 04-model-explanations.md
  - 05-incremental-refresh.md
  - 06-responsive-repair.md
  - 07-integration-publication.md
---

# artifact-plane evidence, usability and in-place reading plan

## Revision awaiting approval

The 16 October 2026 investigation selected the ADD in-place knowledge layout. This plan replaces the publication-evidence, comparison-service, comparison-interface and compact-context tasks with in-place reading tasks, and retains model explanations, incremental refresh and responsive repair unchanged. The revised plan and join require explicit approval. Suggested Plane version remains 1.14.0, prepared as an in-place version record after the ADD migration.

## Gates and sequence

Explicit approval of this plan and establishment of the ADD in-place layout contract (proposed ADD 2.4.0) are required before the reader tasks start; recheck the contract on protected refs first. These external gates are not cross-artifact task IDs. The ADD plan offers one coordinated repository PR or strict two-PR gating; the choice is made at approval.

1. [Detect the layout and read records](09-layout-records.md)
2. [Resolve the baseline and compare through Git](10-git-baseline.md)
3. [Add validate and migrate scripts](13-knowledge-scripts.md), after records
4. [Derive declared evidence and version snapshots](11-declared-evidence.md)
5. [Present working and established knowledge](12-layout-navigation.md)
6. [Explain dependencies and model interactions](04-model-explanations.md)
7. [Reduce idle full reads with bounded recovery](05-incremental-refresh.md)
8. [Resolve the merged browser regressions](06-responsive-repair.md)
9. [Validate the combined outcome and prepare Plane review](07-integration-publication.md)

Tasks 05 and 06 have no internal prerequisite and can run in separate worktrees; task 04 follows navigation because it shares the inspector. Reader tasks run sequentially because they share server modules.

## Plan self-check

L1 to L7 map to tasks 09 to 13; earlier requirements keep their retained tasks. Membership, unique IDs, prerequisite resolution and acyclicity are checked before handoff. KISS extends existing modules and adds two scripts. STE keeps legacy and in-place paths distinct. Results remain task-owned.
