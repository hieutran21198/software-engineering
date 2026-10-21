---
id: guidance-and-profiles
depends_on: []
covers:
  - element: requirements/opencode-support.md
    ids: [OC1, OC2, OC3, OC4, OCA1, OCA2]
---

# ADD guidance and native profiles

## Scope and ownership

Implementer. Update `docs/artifact-driven/06-guidelines/working-with-ai.md`, `05-adoption/README.md`, `06-guidelines/adopting-from-git.md`, repository `AGENTS.md` and four `.opencode/agents/add-*.md` profiles. The coordinator updates the current `requirements/evidence.md`, `specifications/knowledge.md` and applicable `specifications/agent-efficiency.md` harness inventory.

Governing contract: `specifications/opencode-support.md`. Preserve unrelated registrations and instructions. Do not touch the Plane plugin or MCP configuration in this task.

## Definition of Done

- [x] Guidance identifies OpenCode V2 discovery, native profiles, canonical path resolution and unchanged adoption behavior.
- [x] All six existing skill registrations resolve to their canonical directories without duplicate OpenCode registrations.
- [x] Four profiles have a description and `mode: all`, no pinned model and no permission override.
- [x] Profile instructions retain role skill loading, KISS/STE checks, plan approval, upstream establishment and team review.
- [x] Documentation links resolve and none link to an ancestor page.
- [x] Current harness contracts and inventory agree with the implemented setup; delivered historical evidence stays unchanged.

## Evidence

The implementer inspected native definitions against the official OpenCode V2 agents, skills and instructions documentation. A static registration/profile check resolved all six skill symlinks, inspected the four profile front-matter blocks and checked canonical role/utility paths. No duplicate `.opencode/skills` directory was added. This is static setup evidence, not live activation.

The coordinator reviewed all four profiles and the OpenCode setup section, then updated `requirements/evidence.md`, `specifications/knowledge.md` and `specifications/agent-efficiency.md`. The definitions use `mode: all` and omit model and permission overrides. They retain the canonical role-loading, KISS/STE and ADD boundaries.

`go test ./docs/artifact-driven ./internal/adopt ./cmd/se-adopt ./src/archs/story-driven` passed. The implementer's link/anchor check passed for all changed guidance pages and found no ancestor references. `git diff --check` passed. The knowledge validator reported `ok: true`, no errors or warnings, and one informational `requirement-ids-missing` notice for the existing source inventory table. Historical task evidence was not edited.
