---
id: integration
depends_on: [se-adopt, artifact-plane]
covers:
  - element: requirements/packages.md
    ids: [NP1, NP2, NP3, NP4, NP5, NA1, NA2, NA3, NA4, NA5, NA6]
---

# Validate and document the packages

## Scope and location

Own nix/README.md, combined flake checks and the packaging validation record.
The coordinator records shared evidence in the unit brief.

## Definition of Done

- [ ] Run integrated flake evaluation and package checks.
- [ ] Record native builds and smoke results for both packages on all four targets.
- [ ] Keep unavailable platform checks explicitly incomplete.
- [ ] Document named build, run and profile install commands.
- [ ] Document runtime model download requirements and tool behavior.
- [ ] Validate new knowledge, links, task coverage and Git whitespace.
- [ ] Preserve unrelated .commandcode/ and .review/ files.
- [ ] Return combined evidence for version preparation and PR handoff.

## Evidence

No implementation checks have run.

