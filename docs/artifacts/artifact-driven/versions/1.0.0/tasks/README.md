# Initial recovery plan

## Scope

Validate and complete the recovered ADD project knowledge. This is documentation recovery and validation of existing implementation, not implementation of new behavior. Work only on the dedicated add-self-hosting branch in its isolated worktree. Shared main remains unchanged.

## Execution order

1. [Source and knowledge fidelity](01-source-fidelity.md).
2. [Existing delivery validation](02-delivery-validation.md), after task 01 confirms the recovered contracts.
3. [Integration and publication readiness](03-integration.md), after tasks 01 and 02.

The coordinator performs these tasks sequentially. They share knowledge/evidence files, and parallel agents would not reduce meaningful work. There is no external artifact prerequisite or required pending Artifact Plane release. No initial artifact version exists yet.

## Coverage

Task 01 checks A1–A4 and the documented R1–R4/R6/R8/R9 rules. Task 02 checks executable R4/R5/R7 and A2/A5. Task 03 checks A5–A7, source preservation, graph consistency and complete-snapshot readiness. Governing references are in each task.

Existing code defects or source conflicts are reported; they do not authorize implementation edits. Material contract/plan revisions return to Specification/Plan and require renewed approval. An unmet required DoD blocks initial version preparation. Missing optional capabilities remain explicit exclusions and do not become new requirements.

## Version and publication

After applicable DoD and integrated checks pass, suggest initial 1.0.0 and obtain user confirmation. Prepare the full snapshot, root README and regenerated DAG consistently as proposed state, then push and open one PR for this repository. Preserve the Artifact Plane index entry. Do not tag binaries, deploy, merge, or claim establishment. The team merge to main establishes the artifact.

The canonical reusable bundle and delivered source tree remain authoritative evidence of the method and product behavior. The snapshot owns recovered project contracts and validation evidence; it does not duplicate the entire bundle. Future ADD changes copy that complete snapshot into one active change and follow the existing five phases.

## Plan self-check

Tasks cover scope, contracts, source evidence, concrete checks, dependencies and combined validation. Only project knowledge and a parent navigation link are allowed edits; the generated DAG changes during version preparation. Existing checks are reused. KISS/STE checks pass. Explicit user approval is required before executing these tasks.

## Integrated result

All three recovery tasks passed their local DoD. Source fidelity, existing behavior and delivery checks passed without implementation changes. The baseline is ready for initial version confirmation. No version is established; snapshot publication and final PR CI remain before team handoff.
