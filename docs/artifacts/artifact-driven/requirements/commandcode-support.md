---
self_check:
  result: passed
  source: docs/artifacts/artifact-driven/requirements/commandcode-support.md#requirement-self-check
---

# Command Code support

## Outcome and facts

Command Code users can adopt ADD and run its roles without duplicating the
canonical bundle. The owner selected full ADD and Plane integration.

Facts observed on this repository and Command Code 1.85.1 on 28 October 2026:

- `cmd skills list` reports the six project skills from the existing
  `.agents/skills` symlinks.
- `cmd mcp list` reports `artifact-plane` as a project stdio server from the
  existing `.mcp.json`.
- Command Code reads `AGENTS.md` as project memory and does not read
  `CLAUDE.md`. A project subagent is a Markdown file in
  `.commandcode/agents/`, and a subagent cannot ask the person a question.
- A project hook file at `.commandcode/settings.json` supports `SessionStart`,
  `PreToolUse`, `PostToolUse` and `Stop` only.

## Requirements

- CC1: Command Code discovers the six canonical ADD skills from the existing
  `.agents/skills` entries and needs no duplicate registration.
- CC2: A consumer adds focused ADD instructions to its existing `AGENTS.md`;
  guidance does not copy the methodology into that file.
- CC3: The coordinator, product owner and technical lead roles run as skills in
  one session, because a Command Code subagent cannot interview the person.
- CC4: An approved implementer task can run in a project subagent profile at
  `.commandcode/agents/add-implementer.md` that loads the canonical skill,
  inherits the model and permissions, and keeps the ADD boundaries.
- CC5: Setup guidance names the skill location, memory file, implementer
  profile, project MCP file and hook file, and states the Command Code limits.
- CC6: Adoption guidance keeps the existing harness instructions, and
  `se-adopt` still copies only the bundle.
- CC7: Existing harness setup, ADD phases, gates and records remain unchanged.

## Acceptance criteria

- CCA1: Static checks verify the six skill registrations, the implementer
  profile fields and the guidance links.
- CCA2: The bundle and adoption Go suites pass, and the knowledge validator
  reports `ok: true` for this change.
- CCA3: Live discovery records the Command Code version and shows the six
  project skills and the Plane MCP server.

## Impact

Artifact Plane consumes the harness contract in its own member change. ADD flow
steps, adoption copy behavior and publication gates do not change. Existing
Antigravity, Codex, Claude Code and OpenCode V2 guidance stays valid.

## Requirement self-check

KISS reuses automatic skill discovery, `AGENTS.md` and one native profile. STE
states one need for each item and separates observed facts from limits. Each
acceptance criterion is observable. No blocker prevents Specification.
