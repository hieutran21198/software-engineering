---
id: convert-history
depends_on: [migrate-repository]
evidence_records: []
---

# Convert this repository's retained legacy records

## Scope and ownership

Coordinator owns this knowledge operation and the contract and guidance amendment. Scope: every versions/<version>/ and changes/<change>/ directory under docs/artifacts, the unit briefs that reference them, specifications/knowledge-layout.md, requirements/knowledge-layout.md, the legacy sections of the canonical and embedded bundle, and the ADD paragraph of AGENTS.md. The Plane-owned script support is task history-conversion in the Plane plan.

## Governing knowledge and prerequisites

Plan amendment approved by the user on 16 October 2026 ("fix all legacy in docs/artifacts", full conversion, in PR #29). N4, N7, K5; specifications/knowledge-layout.md migration and derived facts. The migrate-repository DoD is required.

## Definition of Done

- [ ] The contract, requirements, guidance and AGENTS.md allow converting retained legacy records, and define the snapshot of a converted legacy version as versions/<version>/ in the tree of the first-parent commit that introduced its README. Other repositories keep the legacy layout readable.
- [ ] No version directory holds knowledge directories, and no change directory holds copied knowledge or dependencies.yaml. delivery_tasks markers are removed. Version-owned tasks that are byte-identical to the originating change's tasks are removed; task sets with no recorded originating change stay as the only exception, with a reason.
- [ ] Unit evidence sources and Markdown links that pointed into removed files resolve: tasks to the retained change copies, knowledge links become plain text that names the Git snapshot. Affirmative prose publication reviews accepted by the reader are restated as structured publication_reviews with verified merged PRs.
- [ ] Every removed file exists unchanged in HEAD before the conversion; the Plane reads all units with the same completion results when main is set to the converted revision; validate-knowledge reports no errors; links resolve.

## Evidence

Not executed. Record methods, results, source references and limitations here.
