---
self_check:
  result: passed
  source: docs/artifacts/artifact-driven/specifications/commandcode-support.md#specification-self-check
---

# Command Code harness contract

Governs CC1–CC7 and CCA1–CCA3 in
[Command Code requirements](../requirements/commandcode-support.md).

## Skill and instruction discovery

Command Code reads the six existing `.agents/skills/<id>/SKILL.md` entries. Do
not add `.commandcode/skills` copies. A project `.commandcode/skills` entry would
win a name conflict, so a duplicate would split the registration. Keep canonical
role directories in `docs/artifact-driven/03-execution/skills` and utility
directories in `docs/artifact-driven/required-skills`.

Command Code reads repository `AGENTS.md` as project memory and does not read
`CLAUDE.md`. This repository keeps its existing `AGENTS.md` and adds Command Code
to its harness paragraph.

The coordinator, product owner and technical lead run as skills in the current
session. A Command Code subagent runs without follow-up questions, so these roles
cannot delegate their interview or plan approval to one.

## Implementer profile

Add `.commandcode/agents/add-implementer.md` with these front-matter fields:

```text
name: add-implementer
description: Execute an assigned approved ADD task and return commits and Definition of Done evidence.
tools: "*"
```

Omit `model`, `reasoningEffort`, `permissionMode`, `background` and `maxTurns` so
the profile inherits the session model and permissions. The body directs the
implementer to read
`docs/artifact-driven/03-execution/skills/add-implementer/SKILL.md` before
acting, resolve its references from that directory, keep the full bundle
available, apply the KISS and STE checklists, and preserve plan approval,
upstream establishment, protected-branch restrictions and the team-review
boundary. The body states that the implementer cannot ask the person a question
and reports a blocker instead of guessing.

No profile is added for the other roles. Their skills require a conversation
with the person, and the current session supplies it.

## Consumer guidance

Add a `Command Code setup` section to `06-guidelines/working-with-ai.md`. It
names the skill discovery in `.agents/skills`, the `AGENTS.md` memory file, the
implementer profile, the project MCP file and the hook file. Link the adoption
pages to that section rather than repeating it.

The project MCP registration is `.mcp.json`; Command Code already reads it. The
lifecycle hooks are `.commandcode/settings.json`; the Plane contract owns their
content. Setup adds no global configuration and changes no other harness
registration.

State these observed limits in the guidance:

- Command Code 1.85.1 did not fire `SessionStart` in headless mode, so session
  context needs an interactive session.
- Command Code skips hooks in plan mode.
- Hook inputs carry no `agent_id` and there are no subagent hook events;
  independent implementers use linked worktrees so inferred binding is
  unambiguous.

`se-adopt` does not install profiles, configure MCP or modify instructions.

## Impact and verification

The embedded bundle and adoption consumers receive additive guidance. No record
schema, CLI flag, copy behavior or ADD phase changes. Artifact Plane consumes
this contract in its own specification; its dependent implementation waits until
this supplier change establishes.

Add `docs/artifact-driven/commandcode_test.go` to check the six canonical skill
targets, the implementer profile fields and boundaries, no duplicate
`.commandcode/skills` directory and the changed guidance links. Record live
discovery with `cmd skills list` and `cmd mcp list`, including the Command Code
version.

## Specification self-check

KISS reuses automatic skill discovery, `AGENTS.md` and one native profile. STE
states one rule in each sentence and separates observed limits from the
contract. No ADR, diagram or state registry is needed. The live payload capture
supports the stated limits. No blocker prevents Plan.

Ran `node apps/artifact-plane/scripts/validate-knowledge.mjs --change
artifact-driven/change-commandcode-support`: `ok: true`.
