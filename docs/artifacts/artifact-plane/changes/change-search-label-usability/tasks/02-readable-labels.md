---
id: readable-labels
depends_on: []
---

# Keep graph relationship text readable

## Scope and ownership

Own labelled flow/dependency edge presentation, layout helpers and focused browser/geometry checks. Governing U5–U7 and the label contract/ADR 010. Preserve unrelated graph builders and controls. Preserve other workers’ changes. The coordinator owns all shared knowledge.

## Definition of Done

- [ ] Reproduce label/node intersections with actual rendered flow and dependency graph fixtures; record screenshot evidence.
- [ ] Long, parallel, reverse and loop labels stay readable and associated; node/card/header controls are unobstructed at 700/1440 and representative zoom/expansion.
- [ ] Measured geometry or safe wrapping/spacing/clear-space fallback meets visibility; a blanket z-index change alone is insufficient.
- [ ] Graph IDs, directions, semantics, pointer pass-through and task/unit graph behavior remain unchanged.

## Evidence

Implementation has not started. No executable behavior is claimed by this plan.
