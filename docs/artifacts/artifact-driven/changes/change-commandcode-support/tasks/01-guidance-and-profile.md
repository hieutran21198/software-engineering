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

- [x] Guidance has a Command Code setup section with skill discovery,
      `AGENTS.md`, the implementer profile, project `.mcp.json`, project
      `.commandcode/settings.json` and the observed limits.
- [x] The adoption pages link to that section and state that `se-adopt` does
      not configure Command Code.
- [x] Repository `AGENTS.md` names Command Code discovery and profile paths
      without displacing the other harnesses.
- [x] The implementer profile has `name`, `description` and `tools: "*"`, has
      no model or permission field, and keeps skill loading, KISS/STE checks,
      approval, upstream establishment, protected branches and team review.
- [x] The profile body states that the implementer cannot ask the person a
      question.
- [x] No `.commandcode/skills` directory exists.
- [x] The Go test checks the six skill targets, the profile fields and
      boundaries, and the changed guidance links.
- [x] All changed links resolve and `go test ./docs/artifact-driven` passes.

## Evidence

Added the setup section to `06-guidelines/working-with-ai.md`, a Command Code
paragraph to the adoption guide and the from-Git guide, the harness paragraph in
repository `AGENTS.md`, `.commandcode/agents/add-implementer.md` and
`docs/artifact-driven/commandcode_test.go`.

`go test ./docs/artifact-driven` passed. The new tests resolve the six
`.agents/skills` symlinks to their canonical directories, reject a duplicate
`.commandcode/skills` directory, inspect the profile front matter and body, and
reject a pinned model, a permission override, a wrong name, a missing tools
field and removed gate instructions. The link and anchor check passed for the
three changed guidance pages and found no ancestor reference.

These are static setup checks. The live discovery and the headless limits are
recorded in [validation](02-validation.md#evidence).
