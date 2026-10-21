---
self_check:
  result: passed
  source: docs/artifacts/artifact-driven/specifications/antigravity-support.md#specification-self-check
---

# Antigravity harness contract

Governs AGY1–AGY5 and AGYA1–AGYA3 in [requirements/antigravity-support.md](../requirements/antigravity-support.md). It extends the harness registration and consumer instruction rules in [knowledge.md](knowledge.md), [agent-efficiency.md](agent-efficiency.md) and [adoption-guidance.md](adoption-guidance.md). `se-adopt` CLI inputs, output and copy behavior do not change.

## Harness discovery and project instructions

| Surface | Path | Contract |
| --- | --- | --- |
| Workspace skills | `.agents/skills/<name>/SKILL.md` or `.agents/skills.json` | Antigravity and Codex discover the four ADD role skills and two required skills through `.agents/skills` at the workspace root. When a consumer stores skills outside `.agents/skills`, Antigravity can load them from `.agents/skills.json` entries that point to the canonical bundle directories. Skill-relative references resolve from the canonical bundle. |
| Project instructions | `AGENTS.md`, `CLAUDE.md`, `GEMINI.md` | Consumer setup adds concise ADD instructions to the applicable existing `AGENTS.md`, `CLAUDE.md` or `GEMINI.md` without overwriting unrelated rules. Antigravity loads hierarchical `AGENTS.md` and `GEMINI.md` rules automatically. |
| Repository `AGENTS.md` | `AGENTS.md` | States that Antigravity and Codex discover the six bundled skills through `.agents/skills`, project role profiles for Codex live in `.codex/agents`, and Claude Code discovers the same skills through `.claude/skills`. |

## Bundle page updates

- `06-guidelines/working-with-ai.md`:
  - `Human with AI` names Command Code, Codex, Claude Code and Antigravity.
  - `Required Capabilities` states that Antigravity and Codex read `.agents/skills` (and Antigravity also reads `.agents/skills.json`), Codex reads role profiles in `.codex/agents`, and Claude Code reads `.claude/skills`.
  - `Required Capabilities` states that concise ADD instructions go in the applicable existing `AGENTS.md`, `CLAUDE.md` or `GEMINI.md`.
- `05-adoption/README.md`:
  - `Result` states that `se-adopt` does not modify consumer `AGENTS.md`, `CLAUDE.md` or `GEMINI.md` files.
  - `After Adoption` step 3 refers to the applicable existing `AGENTS.md`, `CLAUDE.md` or `GEMINI.md`.
- `06-guidelines/adopting-from-git.md`:
  - The agent adoption request refers to the applicable existing `AGENTS.md`, `CLAUDE.md` or `GEMINI.md`.

## Affected flows and dependencies

No ADD flow changes its steps, transitions or supports. No artifact dependency changes.

## Specification self-check

`node apps/artifact-plane/scripts/validate-knowledge.mjs --change artifact-driven/change-antigravity-support` reports `ok: true`. AGY1 and AGY2 map to the harness discovery table and `06-guidelines/working-with-ai.md`. AGY3 maps to `05-adoption/README.md` and `06-guidelines/adopting-from-git.md`. AGY4 maps to repository `AGENTS.md`. AGY5 maps to embedded bundle and link checks. KISS: reuses existing `.agents/skills` symlinks and existing bundle pages without new files in the bundle. STE: one rule per table row and list item in active voice. No blocker prevents Plan.
