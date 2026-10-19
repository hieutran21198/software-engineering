---
tier: medium
---

# Install the Plane like se-adopt, and show people what to do next

## Reason and scope

Two independent assessments of ADD on 19 October 2026 (Claude Fable 5.1 and Codex GPT-6, `.review/` in the owner's checkout, not committed) scored the human interface of ADD at 1 or 2 of 5 without the Plane, because the Plane runs only from a source checkout. A review of the Plane as a user on the same day found that the pages show the records but do not tell a person what to do next, show contradicting states on one page, and draw actions, links, destructive controls and states alike.

The owner approved on 19 October 2026: one medium change of artifact-plane, one plan approval, release as one executable file for each operating system and processor, and a separate release tag `plane-v<version>`.

Included:

- a release of the Plane as executable files with checksums, built and tested by CI, and published by a `plane-v` tag;
- a status and next step for each change on the work page and the change page, with changes that wait for merge kept in Current work;
- version labels that tell a version prepared on a branch from a version established on the protected branch;
- one source for each count and state that a page shows twice;
- one visual grammar for navigation, actions, destructive controls and states, and an explanation for each status term.

Excluded, for later changes: a coverage view of requirement IDs on the document page, a branch-difference default on the Impact page, grouping of History, a dark theme, code signing by a paid certificate, an installer or package manager entry, auto-update, and any change of the ADD bundle or of `se-adopt`.

Knowledge is edited in place on this branch. The unit brief is [Plane human guidance](../../../units-of-work/plane-human-guidance/README.md).

- [Requirements: human guidance](../../requirements/human-guidance.md)
- [Requirements: application release](../../requirements/app-release.md)
