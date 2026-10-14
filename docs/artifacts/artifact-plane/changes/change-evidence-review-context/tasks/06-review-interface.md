---
id: review-interface
depends_on: [review-adapters]
---

# Add contextual change review and local packet export

## Scope and ownership

Own delivery Review change entry, a small src/ChangeReview.jsx view, main.jsx review-session integration, existing CSS and focused browser checks. Consume the shared packet formatter; do not duplicate service facts. Preserve other workers' corrections and unrelated edits; coordinator owns artifact knowledge.

Governing knowledge: specifications/change-review.md UI/refresh and context-packets.md human export. Consume unit change-review/context-handoff criteria.

## Definition of Done

- [ ] Delivery opens a contextual review with exact baseline/worktree/HEAD, changed/unchanged records, readable before/after, candidate-flow reasons and unresolved evidence; Back restores delivery/history context.
- [ ] Copy Markdown/Download Markdown/Download JSON share the loaded packet and formatter; local success/failure feedback and visible partial warnings preserve retry context.
- [ ] Updating/stale results cannot export as fresh; old project/worktree/change replies are aborted/ignored, refresh preserves valid selection and inactive tabs pause detail reads.
- [ ] Existing top-level and unit view order remains; labels/status/keyboard controls and 1440/700 layouts are usable. Dangerous source HTML/Markdown remains inert.
- [ ] New browser fixtures check all review/export/race cases and relevant project/flow regressions; app build passes; return screenshots and actual evidence to coordinator.

## Evidence

Implementation has not started. No live walkthrough or export behavior is claimed yet.
