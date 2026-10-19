---
id: repository-setup
depends_on: [role-skills]
---

# Repository setup

## Scope and ownership

Coordinator, as implementer. `AGENTS.md`: phase commits and explicit plan approval for medium and large changes; the small-tier path; a unit of work for medium and large outcomes; the KISS and STE checklists in self-checks with the full skills read when the checklist is not enough. `.claude/skills/`: one entry for each of the six bundled skills that points to its canonical directory under `docs/artifact-driven`, as `.agents/skills` does for Codex.

## Governing knowledge

specifications/delivery-tiers.md (Repository instructions); specifications/agent-efficiency.md (Harness profiles); requirements/delivery-improvements.md, DI12 and DI14.

## Prerequisites

Task role-skills.

## Definition of Done

- [x] `AGENTS.md` states the four rules of the Repository instructions section and keeps every unrelated instruction; the git diff shows no other change.
- [x] `.claude/skills/<name>/SKILL.md` resolves for the six skills and points to the same files as `.agents/skills`.
- [x] No link of `AGENTS.md` is broken.

## Evidence

| DoD item | Check | Result | Source |
| --- | --- | --- | --- |
| Four rules | `git diff AGENTS.md` changes 4 lines and nothing else: Claude Code discovers the skills through `.claude/skills`; roles apply the KISS and STE checklist and read the full skills when it is not enough; tiers, with phase commits and explicit approval for medium and large and the small-tier path; a unit of work for medium and large outcomes, none for a small single-change outcome | Passed | `AGENTS.md` |
| Claude Code entries | `.claude/skills/` holds six relative symbolic links with the same targets as `.agents/skills/`; for each, `SKILL.md` exists and `realpath` equals that of the Codex entry | Passed | `.claude/skills/` |
| Links | The link script resolved the 3 relative links of `AGENTS.md` with 0 findings | Passed | Command in this row |
