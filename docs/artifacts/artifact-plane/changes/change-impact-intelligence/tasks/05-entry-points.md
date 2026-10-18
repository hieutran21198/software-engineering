---
id: entry-points
depends_on:
  - impact-page
---

# Entry points

## Scope and ownership

Own the actions in src/pages/ChangePage.jsx, DocumentPage.jsx and FlowPage.jsx, the More menu entry in src/Sidebar.jsx or src/TopBar.jsx, and the affected-step highlight in src/flow-canvas.js and FlowPage.jsx with its Node test.

## Governing knowledge

specifications/change-impact.md, section Impact view, paragraphs Entry points and A flow page opened from the impact view. requirements/change-impact.md, I8.

## Prerequisites

Task impact-page satisfies its DoD.

## Definition of Done

- [ ] The change page action "What does this change affect?" opens the Impact page for the branch difference against the protected ref.
- [ ] The document page action "Where is this used?" and the flow page action on a step's sources open the Impact page for that origin.
- [ ] The More menu entry Impact accepts a path or a commit and opens the page.
- [ ] A flow page opened from the Impact page highlights the affected steps, dims the others, and lists the affected supports of a selected step.

## Evidence

No checks have run.
