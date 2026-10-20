---
tier: large
---

# Support Antigravity in ADD guidance and repository instructions

## Reason and scope

On 20 October 2026 the owner asked to support Google Antigravity alongside Codex and Claude Code. Antigravity discovers workspace skills in `.agents/skills` (or through `.agents/skills.json`) and loads hierarchical rules from `AGENTS.md` and `GEMINI.md`, while the ADD bundle, adoption guides and repository `AGENTS.md` currently name only Command Code, Codex and Claude Code (`AGENTS.md` and `CLAUDE.md`).

The tier is large because this outcome coordinates changes across `artifact-driven` and `artifact-plane` in one unit of work.

Included:

- Antigravity harness registration and rule-file guidance in `05-adoption/README.md`, `06-guidelines/working-with-ai.md` and `06-guidelines/adopting-from-git.md`;
- repository harness documentation in `AGENTS.md`;
- updated ADD knowledge contracts and source inventory for Antigravity support.

Excluded: changes to `se-adopt` flags or copy behavior, changes to role skill cores or checklists, and Story-Driven bundle edits.

Knowledge is edited in place on this branch. The unit brief is [Antigravity support](../../../units-of-work/antigravity-support/README.md).

- [Requirements: Antigravity support](../../requirements/antigravity-support.md)
- [Specification: Antigravity support](../../specifications/antigravity-support.md)
