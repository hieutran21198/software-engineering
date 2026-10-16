# Efficient adoption and role context

## Need and observed behavior

Humans need to resolve adoption conflicts in one review. Agents need to reuse verified context across phase work and recover safely after interruption. Existing artifacts, context packets, configured MCP, source files and Git supply the facts; the workflow must not require a second state store.

The adoption implementation currently checks destinations before copying but stops at the first conflicting file or parent. A workspace with several conflicts therefore needs repeated attempts to discover them. Existing adoption already preserves identical and unrelated files, rejects unsafe paths, supports previews and protects exclusive writes.

The foundation guidance currently says that a version contains its implementation plan and that old changes can be removed. The delivery contract retains new delivery tasks in their originating change. Consumers need one consistent instruction for knowledge snapshots and retained evidence.

## Requirements

- R1: One adoption preflight reports all safely discoverable destination conflicts for the selected bundle and destination in deterministic order. Each diagnostic identifies the affected destination, reason and a useful resolution. Unsafe or unreadable paths remain explicit failures; diagnostic collection must not weaken containment or follow unsafe paths.
- R2: Human-readable output remains the default. A consumer can request machine-readable JSON diagnostics and summary information for successful previews, successful adoption and failure. Existing commands, architecture selection, exit success/failure meaning and safe copying behavior remain compatible. No conflict report permits partial adoption or replacement of consumer edits.
- R3: ADD role guidance supports progressive context loading in the same capable session. A role starts from the selected outcome/change, current task or phase, applicable contracts and existing evidence. It loads additional sources when a decision or gap requires them. Retain the complete canonical bundle and required KISS and STE self-checks; reduced initial reading must not hide a governing contract.
- R4: Reuse current source-backed context instead of repeating completed exploration. Use existing context packets or configured MCP when available and direct artifact/Git inspection when unavailable. A packet is an entry point, not proof of exhaustive discovery or authority to act. Do not require Artifact Plane or a new service to perform ADD.
- R5: Recovery identifies the selected repository/worktree/change, relevant source revision, completed work and evidence, unresolved facts, next action and applicable gates from existing sources. Recheck facts affected by source changes. Missing or stale evidence stays explicit; conversation summaries and old checks must not silently become current approval or successful verification.
- R6: Canonical and embedded guidance consistently distinguish complete requirement/specification/decision snapshots from change-owned delivery tasks. Retain originating changes and evidence while referenced, and preserve legacy version-owned task compatibility. Correct current guidance and new proposed knowledge; preserve established snapshots and historical evidence. No new retention mechanism is required.
- R7: Preserve five phases, artifact ownership, artifact/task dependency semantics, phase self-checks and commits, explicit plan approval, upstream establishment gates and review/merge requirements. Existing authorization can be reused when applicable; material plan changes require renewed approval. Do not infer authorization or establishment from derived views.

## Acceptance criteria

- A1: A fixture with two independent differing destination files returns both conflicts in one deterministic preflight. A repeated run returns the same ordered diagnostics. No new bundle file is written and existing file bytes remain unchanged.
- A2: File-type conflicts, blocked parent directories, unsafe paths and identical files retain their applicable safety behavior. JSON success and failure are parseable, contain the same decision-relevant facts as human output, and retain compatible exit status behavior. Existing adoption regression checks pass.
- A3: An agent can carry Requirement into Specification and Plan in the same capable session without an unnecessary full reload or mandatory role-session handoff. Each phase still applies its role responsibilities and required self-check. The plan is presented for explicit approval before implementation.
- A4: A recovery example names the existing context sources, shows an unavailable-packet fallback and a stale-source recheck, and stops at an unresolved required approval or upstream gate. It does not add a persistent workflow status file or duplicate evidence ledger.
- A5: Current canonical and embedded foundation/role guidance has no instruction to delete referenced originating delivery evidence or copy new delivery tasks into version snapshots. Required bundle consistency checks pass. Established snapshots remain unchanged.
- A6: Validation records a reproducible comparison of first-conflict versus aggregate discovery attempts and representative initial/recovery context loading. Measure actual bytes or source reads where practical. Label these measurements as context/load proxies; do not claim model token counts or runtime gains without measurement.

## Impact and self-check

ADD owns adoption and role guidance. Artifact Plane owns its optional compact retrieval contract; packet availability is not an ADD prerequisite. Existing artifact dependencies remain unchanged. Candidate flows are adoption, change-delivery, dependency-gates and version-publication. Specification must assess their support and describe recovery branches where needed.

The scope excludes harness registration, a scaffold runner, automatic approvals, autonomous scheduling and historical cleanup. KISS reuses existing sources and self-checks. STE keeps conditions, obligations and safety limits explicit. Baseline knowledge is retained; this file adds current needs without selecting an exact output schema or implementation architecture. No unresolved Requirement blocker prevents Specification.
