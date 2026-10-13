---
id: visualization-clarity
depends_on: [execution-validation]
---

# Clarify runtime absence and simplify prerequisite display

## Scope and contracts

Apply requirements R11/R12 and the visualization correction contract in specifications/codex-execution.md. Own runtime labels, documented checklist labels, shared prerequisite display projection, individual/unit/recorded graph controls, and focused tests in apps/artifact-plane. This is a user-approved correction to the existing proposed 1.7.0 delivery.

## Prerequisites

execution-validation has recorded DoD evidence. The user approved both concrete corrections with do the fix, then retry. Artifact dependencies remain unchanged.

## Definition of Done

- [x] Unobserved tasks show No recorded execution and completed documented checklists remain visibly distinct from runtime Done.
- [x] Pure graph checks cover transitive paths, fork/join, disconnected graphs, unchanged input, all-edge restoration, cycles, and preserved establishment gates.
- [x] Browser acceptance verifies simplified/all prerequisites toggling in individual and unit views, exact inspector prerequisites, and unobserved completed checklists.
- [x] Applicable Node/browser checks and build pass; proposed snapshot and shared evidence are updated in PR #12 without changing established versions.

## Evidence

npm test passed 105 Node tests and npm run build passed. The 15 existing Chromium acceptance cases passed; the new screenshot-specific browser case passed after correcting its ambiguous test navigation selector. Checks confirm No recorded execution, separate documented checklist completion, default transitive reduction, restoration of all declared edges in both individual and unit canvases, unchanged inspector prerequisites, preserved gates, input immutability, cyclic fallback, and unchanged repository fingerprints. The acceptance screenshot was inspected. KISS uses one shared display projection; STE keeps runtime absence and documented completion distinct. The user approved this correction explicitly.
