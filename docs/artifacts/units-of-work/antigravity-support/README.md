---
unit_of_work: antigravity-support
changes:
  - artifact: artifact-driven
    change: change-antigravity-support
  - artifact: artifact-plane
    change: change-antigravity-support
affected_flows:
  - artifact: artifact-plane
    flow: agent-session-guidance
    effect: modify
  - artifact: artifact-plane
    flow: execution-observation
    effect: modify
flow_assessment: Discovery on 20 October 2026 inspected the five ADD flows and
  the eleven Artifact Plane flows, the ADD adoption and AI guidelines, the
  repository harness instructions and registrations, the Plane hook and runtime
  store modules, and the Antigravity customization documentation. ADD flows
  (adoption, change-delivery, dependency-gates, version-publication and
  unit-validation) keep their steps and supports because se-adopt behavior and
  phase rules do not change. Plane flows agent-session-guidance and
  execution-observation change to accept Antigravity camelCase hook inputs,
  infer task bindings from Antigravity tool calls and emit Antigravity hook
  outputs alongside Claude Code and Codex. Other Plane flows are unchanged.
acceptance:
  - id: add-harness-guidance
    criterion: The ADD bundle, adoption guidance and repository instructions
      document Antigravity skill discovery, rule files and role execution
      alongside Claude Code and Codex.
  - id: plane-antigravity-hooks
    criterion: Recorded Antigravity hook inputs for SessionStart, PreInvocation,
      PreToolUse, PostToolUse and Stop produce the session context, workbench
      line, reserved-action refusal, inferred task binding and single-pass stop
      check using Antigravity output shapes.
  - id: workspace-configuration
    criterion: This repository commits the Antigravity hook and workspace MCP
      plugin configuration, and the Plane documentation and examples cover
      Antigravity setup alongside Claude Code and Codex.
  - id: integration
    criterion: Go, Node, bundle parity, link and knowledge-validator checks pass
      for the combined change.
    integration: true
evidence:
  - criterion: add-harness-guidance
    method: Inspected docs/artifact-driven/06-guidelines/working-with-ai.md, docs/artifact-driven/05-adoption/README.md, docs/artifact-driven/06-guidelines/adopting-from-git.md and AGENTS.md against AGY1–AGY5.
    result: passed
    source: docs/artifacts/artifact-driven/changes/change-antigravity-support/tasks/01-bundle-and-repo-guidance.md#evidence
  - criterion: plane-antigravity-hooks
    method: Ran test/agent-hook.test.js and test/runtime-binding.test.js with recorded Antigravity inputs across SessionStart, PreInvocation, PreToolUse, PostToolUse and Stop, and verified live PreToolUse hook execution in Antigravity.
    result: passed
    source: docs/artifacts/artifact-plane/changes/change-antigravity-support/tasks/01-antigravity-hook-adapter.md#evidence
  - criterion: workspace-configuration
    method: Ran test/agent-config.test.js verifying .agents/hooks.json, .agents/plugins/artifact-plane/{plugin.json,mcp_config.json} and integration/antigravity-hooks.example.json, and inspected integration/README.md and apps/artifact-plane/README.md.
    result: passed
    source: docs/artifacts/artifact-plane/changes/change-antigravity-support/tasks/02-configuration-and-guides.md#evidence
  - criterion: integration
    method: Ran go test ./..., go vet ./..., npm --prefix apps/artifact-plane test, npm --prefix apps/artifact-plane run build, npm --prefix website run build and validate-knowledge.mjs.
    result: passed
    source: docs/artifacts/artifact-plane/changes/change-antigravity-support/tasks/03-validation.md#evidence
---

# Support Google Antigravity across ADD and Artifact Plane

## Purpose

Enable agents in Google Antigravity to adopt and execute Artifact-Driven Development and connect to Artifact Plane through its MCP server and lifecycle hooks alongside Claude Code and Codex.

## Included scope

- ADD bundle and adoption guidance for Antigravity skill discovery (`.agents/skills`, `.agents/skills.json`), rule files (`AGENTS.md`, `GEMINI.md`) and role execution in [change-antigravity-support](../../artifact-driven/changes/change-antigravity-support/README.md).
- Artifact Plane hook protocol adapter for Antigravity camelCase payloads and output shapes, example hook configuration, documentation and committed workspace configuration (`.agents/hooks.json` and `.agents/plugins/artifact-plane/`) in [change-antigravity-support](../../artifact-plane/changes/change-antigravity-support/README.md).

## Excluded scope

- Changes to `se-adopt` CLI flags or copy behavior, Story-Driven bundle changes, automatic global configuration edits in `~/.gemini/config/`, or new database tables.
