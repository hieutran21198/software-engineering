---
self_check:
  result: passed
  source: docs/artifacts/artifact-driven/specifications/opencode-support.md#specification-self-check
---

# OpenCode V2 harness contract

Governs OC1–OC5 and OCA1–OCA3 in [OpenCode requirements](../requirements/opencode-support.md).

## Skill and instruction discovery

OpenCode V2 reads the existing six `.agents/skills/<id>/SKILL.md` entries. Do not add duplicate `.opencode/skills` entries. Keep canonical role directories in `docs/artifact-driven/03-execution/skills` and utility directories in `docs/artifact-driven/required-skills`. Resolve skill-relative references from those canonical directories.

OpenCode reads repository `AGENTS.md`. Add its discovery and profile locations to the existing harness paragraph without replacing other instructions. Keep unrelated edits out of this change.

## Native profiles

Create `.opencode/agents/add-coordinator.md`, `add-product-owner.md`, `add-technical-lead.md` and `add-implementer.md`. Each file has a description and `mode: all`. Its body directs the role to read the corresponding canonical skill before acting. It preserves KISS and STE checks, plan approval, upstream establishment, protected-branch restrictions and the team-review boundary.

Omit model and permission fields. A profile does not select a provider, elevate access or require a separate session. Roles may share the current session. The coordinator may dispatch independent approved implementers into separate worktrees when supported.

## Consumer guidance

Update `06-guidelines/working-with-ai.md`, `05-adoption/README.md` and `06-guidelines/adopting-from-git.md`. Keep detailed native discovery in the working-with-AI page and link there from the adoption pages. Identify the official V2 [skills](https://opencode.ai/v2/docs/skills), [agents](https://opencode.ai/v2/docs/agents) and [instructions](https://opencode.ai/v2/docs/instructions) guides as setup references.

Consumers can use their existing `.agents/skills` registrations or native `.opencode/skills` entries. They need only one registration per skill. Keep the full adopted bundle available. `se-adopt` does not install profiles, configure MCP or modify user instructions.

Update the current project harness inventory and knowledge contract to include OpenCode. Historical Antigravity requirements and delivered task evidence stay unchanged.

## Impact and verification

The embedded bundle and adoption consumers receive additive guidance. No record schema, CLI flag, copy behavior or ADD flow step changes. Plane consumes this contract through its OpenCode specification; its dependent implementation waits until this supplier change establishes. Story-Driven and Nix packaging have no new runtime dependency or changed package input in this member.

Verify six canonical skill targets, four native profiles, no pinned model or permission expansion, bundle/adoption Go tests, documentation links and knowledge records. The implementation task records actual results.

## Specification self-check

KISS reuses automatic discovery and thin native profiles. STE keeps each instruction explicit and avoids copying full role procedures. No new architecture decision, diagram or state registry is needed. The source contract is the official OpenCode V2 documentation inspected during discovery. No blocker prevents Plan.

Ran `validateKnowledge(process.cwd(), {change: "artifact-driven/change-opencode-support"})` from the unchanged validator in the original checkout: `ok: true`, no errors. Requirement coverage warnings remain until Plan. The working directory was `/tmp/opencode/software-engineering-opencode`.
