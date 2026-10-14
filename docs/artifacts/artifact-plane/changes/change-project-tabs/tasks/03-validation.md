---
id: validation
depends_on: [workspace-tabs]
---

# Integrated validation and delivery

## Scope and location

Own apps/artifact-plane/test/browser project-tab acceptance checks and apps/artifact-plane/README.md documentation. The coordinator owns task evidence, unit evidence, snapshot preparation, and root metadata. Run current integrated checks and document concrete results.

## Governing references

Artifact Plane requirements/project-tabs.md and specifications/project-tabs.md in this change. Existing live-reload and lazy-loading specifications remain applicable. Shared acceptance is owned by the project-tabs unit brief.

## Prerequisites

Explicit approval of this plan and the listed internal prerequisites with their DoD satisfied. No new upstream establishment gate.

## Definition of Done

- [x] Browser cases use two repositories with equal artifact/task IDs to verify project isolation, navigation/viewport retention, close during reads, rapid switching, runtime scope, and automatic refresh on return.
- [x] Verify refresh/restoration, persisted browser restart context, unavailable project recovery, and accessible tab controls.
- [x] Verify closed/inactive tabs release streams and stop polling; delayed responses stay with their owner.
- [x] Run npm test, npm run test:browser, and npm run build in apps/artifact-plane; investigate failures before claiming completion.
- [x] Verify inspected fixture bytes and Git state remain unchanged.
- [x] Validate documentation hierarchy, safe unit membership, task DAG, and resulting snapshot references.
- [x] Record actual commands/results in task evidence and reference shared evidence from the unit brief.
- [x] Document browser-origin persistence and memory growth with retained tabs; prepare the proposed version and review PR after version confirmation.

## Evidence

Commands ran in apps/artifact-plane with Node 24.21.0:

- `npm test`: 136 checks passed, zero failures.
- `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/nix/store/0fxasn1rwqc65s8y14ip1ym4hk2rxjwx-playwright-chromium/chrome-linux64/chrome npm run test:browser`: 26 cases passed.
- The same command with `-- --grep 'switching retains viewport'`: the added final case passed; 27 browser cases are covered across these runs.
- `npm run build`: passed. Existing bundle-size and React Flow directive warnings remain.
- `git diff --check`: passed.
- YAML unique-key parsing and explicit task traversal: three unique task IDs, resolved prerequisites, no cycles. Unit membership scan: no duplicate or missing members.
- Local Markdown link review resolved destinations and checked ancestor restrictions: passed.
- Project-tab fixture fingerprints and existing reader/browser fingerprint checks: inspected file bytes and Git state unchanged.
- Rendered screenshot inspection: tab controls, selected tab, path form, explorer canvas, sidebar, inspector, and footer display correctly at 1440 by 1000.

Initial restricted test runs could not listen on localhost; checks passed with test server access. Cached Chromium lacked libnspr4.so, so checks used installed Nix Chromium. The extra browser case first raced a build directory replacement, then used a disabled zoom-in control in the small fixture. Repeating it after the build with Zoom Out passed. These harness failures do not support acceptance; the passing reruns do.

Documentation describes browser-profile/origin restoration, session-only navigation, and retained memory growth. Implementation and validation are complete. The user confirmed version 1.10.0 and its complete proposed snapshot is prepared. [Review PR #19](https://github.com/hieutran21198/software-engineering/pull/19) is open after explicit destination authorization. No merge or establishment is asserted. KISS and STE self-checks passed.
