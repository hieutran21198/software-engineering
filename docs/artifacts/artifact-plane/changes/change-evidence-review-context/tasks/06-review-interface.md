---
id: review-interface
depends_on: [review-adapters]
---

# Add contextual change review and local packet export

## Scope and ownership

Own delivery Review change entry, a small src/ChangeReview.jsx view, main.jsx review-session integration, existing CSS and focused browser checks. Consume the shared packet formatter; do not duplicate service facts. Preserve other workers' corrections and unrelated edits; coordinator owns artifact knowledge.

Governing knowledge: specifications/change-review.md UI/refresh and context-packets.md human export. Consume unit change-review/context-handoff criteria.

## Definition of Done

- [x] Delivery opens a contextual review with exact baseline/worktree/HEAD, changed/unchanged records, readable before/after, candidate-flow reasons and unresolved evidence; Back restores delivery/history context.
- [x] Copy Markdown/Download Markdown/Download JSON share the loaded packet and formatter; local success/failure feedback and visible partial warnings preserve retry context.
- [x] Updating/stale results cannot export as fresh; old project/worktree/change replies are aborted/ignored, refresh preserves valid selection and inactive tabs pause detail reads.
- [x] Existing top-level and unit view order remains; labels/status/keyboard controls and 1440/700 layouts are usable. Dangerous source HTML/Markdown remains inert.
- [x] New browser fixtures check all review/export/race cases and relevant project/flow regressions; app build passes; return screenshots and actual evidence to coordinator.

## Evidence

Implemented in dea2337. Eight new Chromium review cases passed, followed by 24 combined review, flow, project-tab and delivery-history cases. Production build passed. Actual HTTP fixtures cover before/after, absent and unchanged sides, source and record paging, export parity, clipboard/download failures, invalid baselines, delayed context replies, source revision errors and refresh selection. Wide and narrow screenshots were inspected. The existing flow startup test was stabilized in f2d28b3 after the same race reproduced on pre-change UI (nine passes and one failure in ten runs); its request-count assertions remain unchanged. No historical source or top-level navigation was removed.
