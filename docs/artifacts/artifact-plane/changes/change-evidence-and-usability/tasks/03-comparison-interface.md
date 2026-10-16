---
id: comparison-interface
depends_on: [comparison-service]
---

# Show comparison context and actionable evidence

## Scope and ownership

Own src/ChangeReview.jsx, src/context-packet.js, affected Delivery/inspector presentation and browser tests.

## Governing knowledge

P1-P3, P7; specifications/evidence-and-comparison.md.

## Prerequisites

Explicit approval of this new combined plan and establishment of the new ADD evidence contract are required before implementation. Recheck ADD 2.2.0 model metadata and the new evidence version on protected refs. These external gates are not cross-artifact task IDs. Listed internal prerequisites must satisfy their DoD.

## Definition of Done

- [ ] The reader selects a labelled target, sees its exact identity/status, filters inherited-only records and reads differences and source evidence.
- [ ] Exported Markdown/JSON includes both baselines, file-level meanings, omissions and freshness; exports do not imply approval.
- [ ] Project/worktree/target switching cancels obsolete requests and clears invalid selections/cursors; keyboard and return navigation work.
- [ ] Browser assertions show baseline, isolated changed work, evidence and the exact remaining gate in the selected-change journey.

## Evidence

Implementation has not started. Record executed commands or review methods, outcomes, relevant sources and limitations here after approval.
