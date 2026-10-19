---
id: visual-system
depends_on: []
covers:
  - element: requirements/human-guidance.md
    ids: [HG7, HG8, HG9, HG10, HG11]
---

# Visual system

## Scope and ownership

Implementer, own worktree. `src/ui.jsx` (`StatusBadge`, `DiffBadge`, `KindTag`, `Term`, narrow stepper text), `src/glossary.js`, `src/styles.css` (control grammar, families, section and card rules) and Node tests of the glossary.

## Governing knowledge

specifications/human-guidance.md: Status vocabulary, Visual grammar of controls, Sections and cards, Glossary, Narrow screens.

## Definition of Done

- [ ] Each family component renders an icon and a text for every member of its table row; a test fails for an unknown status name.
- [ ] The glossary holds every listed term with a definition of at most 30 words; a Node test checks this.
- [ ] `Term` opens and closes its popover with Enter, Space, Escape and a pointer, and returns focus to the term.
- [ ] The styles of `a`, `button.link`, `button.quiet`, `button.primary` and `button.danger` follow the grammar table.
- [ ] At 390 pixels the stepper shows "Phase n of 5: name".
- [ ] `npm test` and `npm run build` pass.

## Evidence

Not recorded.
