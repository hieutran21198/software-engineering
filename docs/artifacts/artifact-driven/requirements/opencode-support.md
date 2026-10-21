---
self_check:
  result: passed
  source: docs/artifacts/artifact-driven/requirements/opencode-support.md#requirement-self-check
---

# OpenCode support

## Outcome and facts

OpenCode V2 users can adopt ADD and run its roles without duplicating the canonical bundle. The owner selected full ADD and Plane integration. Official V2 skills documentation confirms discovery through `.agents/skills`, which this repository already supplies. Native agent profiles use `.opencode/agents/*.md`.

## Requirements

- OC1: Adoption and working-with-AI guidance names OpenCode V2 as a supported harness.
- OC2: Guidance explains discovery of all six canonical skills without requiring duplicate registrations.
- OC3: Repository role profiles expose coordinator, PO, TL and implementer responsibilities without pinning a provider or raising permissions.
- OC4: Setup preserves existing instructions, model selection, other harness registrations and ADD gates.
- OC5: Adoption CLI behavior and the full canonical bundle remain unchanged except for the documented harness guidance.

## Acceptance criteria

- OCA1: The three adoption and AI guidance pages identify OpenCode setup and repository instructions identify its skill and profile locations.
- OCA2: Four native V2 profiles direct each role to its canonical skill and retain KISS, STE, approval and establishment boundaries.
- OCA3: Bundle tests, link checks, adoption regression tests and knowledge checks pass.

## Impact

Artifact Plane consumes the harness contract. ADD flow steps remain unchanged because adoption copy behavior, phase rules and publication gates do not change.

## Requirement self-check

Requirements express observable setup needs and retain the approved full-integration boundary. KISS reuses existing skill entries. STE uses one obligation per item. No diagram or new registry is needed. Specification must state V2 lifecycle limits rather than assume hook parity. Validator results are recorded below when executed.

Ran the existing validator from `/home/cirius/Workspaces/personal/software-engineering/apps/artifact-plane/scripts/validate-knowledge.mjs` with `--repository /tmp/opencode/software-engineering-opencode --change artifact-driven/change-opencode-support`: `ok: true`. Coverage warnings are expected until Plan. Running the worktree-local script first failed because this fresh worktree has no Node dependencies; the original checkout supplies the unchanged validator and its installed dependencies.
