---
id: guidance-and-profile
depends_on: []
covers:
  - element: requirements/commandcode-support.md
    ids: [CC1, CC2, CC3, CC4, CC5, CC6, CC7, CCA1]
---

# Command Code guidance and implementer profile

## Scope and ownership

Implementer. Update `docs/artifact-driven/06-guidelines/working-with-ai.md`,
`05-adoption/README.md`, `06-guidelines/adopting-from-git.md` and repository
`AGENTS.md`. Add `.commandcode/agents/add-implementer.md` and
`docs/artifact-driven/commandcode_test.go`.

Governing contract: `specifications/commandcode-support.md`. Preserve unrelated
registrations and instructions. Do not touch the Plane hook configuration or
MCP file in this task.

## Definition of Done

- [ ] Guidance has a Command Code setup section with skill discovery,
      `AGENTS.md`, the implementer profile, project `.mcp.json`, project
      `.commandcode/settings.json` and the observed limits.
- [ ] The adoption pages link to that section and state that `se-adopt` does
      not configure Command Code.
- [ ] Repository `AGENTS.md` names Command Code discovery and profile paths
      without displacing the other harnesses.
- [ ] The implementer profile has `name`, `description` and `tools: "*"`, has
      no model or permission field, and keeps skill loading, KISS/STE checks,
      approval, upstream establishment, protected branches and team review.
- [ ] The profile body states that the implementer cannot ask the person a
      question.
- [ ] No `.commandcode/skills` directory exists.
- [ ] The Go test checks the six skill targets, the profile fields and
      boundaries, and the changed guidance links.
- [ ] All changed links resolve and `go test ./docs/artifact-driven` passes.

## Evidence

Filled during implementation.
