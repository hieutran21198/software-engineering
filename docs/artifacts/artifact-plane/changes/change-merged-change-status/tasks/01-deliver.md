---
id: deliver
depends_on: []
covers:
  - element: requirements/knowledge-layout.md
    ids: [L3]
  - element: requirements/delivery-improvements.md
    ids: [PI5]
  - element: requirements/authoring-workbench.md
    ids: [W10]
---

# Deliver the merged change status

## Scope and location

apps/artifact-plane/server/knowledge-baseline.js, server/workflow.js, server/tier-check.js, src/pages/ChangePageReview.jsx and their Node tests.

## Definition of Done

- [ ] The protected baseline lists `changeRecords`, the change names whose README is on the protected tree.
- [ ] A change whose README is on the protected branch reads Requirement and Specification from the self_check records of every working requirement, specification and decision document of the artifact, and carries `merged: true`.
- [ ] For such a change without a file of its artifact in the difference, the tier check reports one-artifact, no-contract, code-limit and impact-contained as unresolved with the specified detail; the standalone validator keeps coordinator for impact-contained.
- [ ] code-limit counts no Markdown file.
- [ ] Changed knowledge of a merged change without differing knowledge says "The knowledge of this change is already on main."
- [ ] Node tests show each rule on a fixture where the change is merged to main, and the existing tier cases keep their results.
- [ ] npm test passes, and the validator reports ok true for this change.
- [ ] On this repository, get_change_status for nix-packages/change-initial on main names Implementation, and a screenshot of its change page shows the met self-check item, the unresolved criteria and the new Changed knowledge text.

## Evidence

Record the commands, results and screenshots here.
