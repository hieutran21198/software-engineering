---
tasks:
  - 01-guidance-and-profile.md
  - 02-validation.md
compatibility: minor
self_check:
  result: passed
  source: docs/artifacts/artifact-driven/changes/change-commandcode-support/tasks/README.md#plan-self-check
---

# Command Code ADD plan

Implement the [Command Code harness contract](../../../specifications/commandcode-support.md)
in this repository. The compatibility level is minor because the change adds
supported harness setup without changing existing ADD contracts or adoption
behavior.

The task list defines the graph. Validate the bundle and setup, prepare the
proposed ADD version, then publish for team review. Do not start the Plane
member implementation until the required ADD knowledge establishes. Do not
merge or enable auto-merge.

## Plan self-check

KISS reuses automatic skill discovery and adds one profile. STE keeps setup and
verification separate. Every new requirement and acceptance ID has task
coverage. The validation task depends on the setup task. No browser UI change
requires screenshots.

Ran `node apps/artifact-plane/scripts/validate-knowledge.mjs --change
artifact-driven/change-commandcode-support`: `ok: true`.
