---
self_check:
  result: passed
  source: docs/artifacts/artifact-driven/requirements/antigravity-support.md#requirement-self-check
---

# Antigravity harness support

## Outcome

A consumer or maintainer using Google Antigravity finds clear instructions in the ADD bundle and repository guidance to load the four ADD role skills, the two required utility skills, and the project ADD rules without duplicating the canonical bundle.

## Need

Facts observed on this repository on 20 October 2026:

- `AGENTS.md` states how Codex (`.agents/skills`, `.codex/agents`) and Claude Code (`.claude/skills`) discover the six bundled skills, and does not mention Antigravity.
- `docs/artifact-driven/06-guidelines/working-with-ai.md`, `05-adoption/README.md` and `06-guidelines/adopting-from-git.md` name Command Code, Codex and Claude Code, and refer only to `AGENTS.md` or `CLAUDE.md` for project instructions.
- Antigravity discovers workspace skills in `.agents/skills/<name>/SKILL.md` (already present in this repository) or from paths declared in `.agents/skills.json`, and loads workspace rules from `AGENTS.md` and `GEMINI.md`.

## Requirements

- AGY1: The ADD working-with-AI and adoption guidance names Antigravity alongside Codex and Claude Code as a supported harness.
- AGY2: The ADD harness guidance explains how Antigravity discovers the four role skills and the two required skills through `.agents/skills` or `.agents/skills.json` while keeping the canonical bundle intact.
- AGY3: The ADD adoption and working-with-AI guidance includes `GEMINI.md` alongside `AGENTS.md` and `CLAUDE.md` when describing where to add concise project ADD instructions, and states that `se-adopt` does not modify those files.
- AGY4: This repository's `AGENTS.md` states how Antigravity discovers the six bundled skills alongside Codex and Claude Code.
- AGY5: The embedded ADD bundle in `docs/artifact-driven` passes its filesystem and link tests, relative links resolve without parent links, and `se-adopt` copy behavior does not change.

## Acceptance criteria

- AGYA1: `06-guidelines/working-with-ai.md`, `05-adoption/README.md` and `06-guidelines/adopting-from-git.md` describe Antigravity skill discovery and `AGENTS.md`, `CLAUDE.md` or `GEMINI.md` instruction updates without duplicating full setup rules across pages.
- AGYA2: Repository `AGENTS.md` documents Antigravity skill discovery through `.agents/skills` alongside Codex and Claude Code.
- AGYA3: `go test ./...`, `go vet ./...`, the website build, relative link checks and the knowledge validator pass with no new errors.

## Affected artifacts and flows

`artifact-driven` and `artifact-plane` participate in the `antigravity-support` unit of work. No ADD system flow changes its steps or transitions because `se-adopt` and the five ADD phases are unchanged.

## Requirement self-check

`node apps/artifact-plane/scripts/validate-knowledge.mjs --change artifact-driven/change-antigravity-support` reports `ok: true`. Each requirement states one need and maps to AGYA1–AGYA3. KISS reuses `.agents/skills` and existing bundle pages without new tooling. STE uses one obligation per list item in active voice. No blocker prevents Specification.
