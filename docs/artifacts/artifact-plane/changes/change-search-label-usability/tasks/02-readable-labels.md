---
id: readable-labels
depends_on: []
---

# Keep graph relationship text readable

## Scope and ownership

Own labelled flow/dependency edge presentation, layout helpers and focused browser/geometry checks. Governing U5–U7 and the label contract/ADR 010. Preserve unrelated graph builders and controls. Preserve other workers’ changes. The coordinator owns all shared knowledge.

## Definition of Done

- [x] Reproduce label/node intersections with actual rendered flow and dependency graph fixtures; record screenshot evidence.
- [x] Long, parallel, reverse and loop labels stay readable and associated; node/card/header controls are unobstructed at 700/1440 and representative zoom/expansion.
- [x] Measured geometry or safe wrapping/spacing/clear-space fallback meets visibility; a blanket z-index change alone is insufficient.
- [x] Graph IDs, directions, semantics, pointer pass-through and task/unit graph behavior remain unchanged.

## Evidence

Baseline rendered fixtures reproduced five flow-label/node intersections and four label/label intersections, plus one expanded dependency-label/parent intersection. The shared measured placement removed all node/label and label/label intersections at 1440 and 700 widths. Browser checks cover long-text keyboard disclosure, parallel/reverse/loop edges, zoom, Fit View and dependency expansion controls. The worker passed 17 relevant browser checks and 11 focused Node checks; integrated geometry/canvas checks passed five checks. The first complete integrated browser run passed both edge-label checks and all prior task/unit graph checks. Screenshot evidence was inspected at wide and narrow widths. Labels have leader lines; ordinary text remains pointer-through and long text has native keyboard disclosure. No graph identity, direction or membership model changed. Large expanded labels can require Fit View or zoom for comfortable reading.
