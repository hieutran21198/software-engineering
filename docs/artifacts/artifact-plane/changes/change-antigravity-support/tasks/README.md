---
tasks:
  - 01-antigravity-hook-adapter.md
  - 02-configuration-and-guides.md
  - 03-validation.md
compatibility: minor
self_check:
  result: passed
  source: docs/artifacts/artifact-plane/changes/change-antigravity-support/tasks/README.md#plan-self-check
---

# Antigravity support plan (Artifact Plane)

Three tasks deliver the Antigravity extensions in [specifications/agent-integration.md](../../../specifications/agent-integration.md), [specifications/codex-execution.md](../../../specifications/codex-execution.md) and [specifications/ui-discovery.md](../../../specifications/ui-discovery.md):

1. [Antigravity hook adapter](01-antigravity-hook-adapter.md): `--event <name>` option, Antigravity camelCase input normalization, Antigravity `SessionStart`, `PreToolUse` and `Stop` output formatting, and Node tests for recorded Antigravity hook inputs and inferred task bindings.
2. [Configuration and guides](02-configuration-and-guides.md): commit `.agents/hooks.json` and `.agents/plugins/artifact-plane/{plugin.json,mcp_config.json}`, add `integration/antigravity-hooks.example.json`, and update `integration/README.md` and `README.md`.
3. [Validation](03-validation.md): verify claim `antigravity-hook-adapter`, run Node and build checks, and record combined unit evidence.

## Sequence and compatibility

Tasks run sequentially (`antigravity-hook-adapter` -> `configuration-and-guides` -> `validation`) because the configuration files call `artifact-plane hook --event <Event>` and validation checks both code and configuration.

Compatibility: minor. The hook command adds `--event <name>` and Antigravity input/output support while preserving all existing Claude Code and Codex behavior, MCP tools and HTTP endpoints.

## Plan self-check

`node apps/artifact-plane/scripts/validate-knowledge.mjs --change artifact-plane/change-antigravity-support` reports `ok: true` with no `requirement-uncovered` warnings for `change-antigravity-support`. Every added or changed requirement and acceptance ID in `requirements/agent-integration.md` is covered. Claim `antigravity-hook-adapter` is open for plan approval and checked in Task 01 and Task 03. KISS: reuses the single `hookOutput` pipeline without adding a new command or database table. STE: imperative DoD checks with one verification per item. No blocker prevents implementation after plan approval.
