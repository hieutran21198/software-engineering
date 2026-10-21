---
id: bundle-and-repo-guidance
depends_on: []
covers:
  - element: requirements/antigravity-support.md
    ids: [AGY1, AGY2, AGY3, AGY4, AGYA1, AGYA2]
---

# Bundle and repository guidance

## Scope and ownership

Implementer. `docs/artifact-driven/06-guidelines/working-with-ai.md`, `docs/artifact-driven/05-adoption/README.md`, `docs/artifact-driven/06-guidelines/adopting-from-git.md` and `AGENTS.md`.

## Governing knowledge

`specifications/antigravity-support.md`: Harness discovery and project instructions, Bundle page updates.

## Definition of Done

- [x] `docs/artifact-driven/06-guidelines/working-with-ai.md` names Antigravity alongside Command Code, Codex and Claude Code, explains `.agents/skills` and `.agents/skills.json` skill discovery, and includes `GEMINI.md` alongside `AGENTS.md` and `CLAUDE.md`.
- [x] `docs/artifact-driven/05-adoption/README.md` and `docs/artifact-driven/06-guidelines/adopting-from-git.md` include `GEMINI.md` alongside `AGENTS.md` and `CLAUDE.md` where consumer instruction files are listed.
- [x] Repository `AGENTS.md` states that Antigravity and Codex discover the six bundled skills through `.agents/skills`, Codex role profiles live in `.codex/agents`, and Claude Code discovers the skills through `.claude/skills`.

## Evidence

| DoD item | Check | Result |
| --- | --- | --- |
| Working with AI guide | `docs/artifact-driven/06-guidelines/working-with-ai.md` names Antigravity in the opening paragraph and Harness Setup section, explains `.agents/skills` and `.agents/skills.json` discovery, and lists `AGENTS.md`, `CLAUDE.md` and `GEMINI.md` | Passed |
| Adoption pages | `docs/artifact-driven/05-adoption/README.md` and `docs/artifact-driven/06-guidelines/adopting-from-git.md` include `GEMINI.md` alongside `AGENTS.md` and `CLAUDE.md` | Passed |
| Repository instructions | `AGENTS.md` states that Antigravity and Codex discover the six bundled skills through `.agents/skills`, project role profiles for Codex live in `.codex/agents`, and Claude Code discovers the skills through `.claude/skills` | Passed |
