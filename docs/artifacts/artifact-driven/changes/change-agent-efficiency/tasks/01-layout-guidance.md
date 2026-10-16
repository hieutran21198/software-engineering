---
id: layout-guidance
depends_on: []
evidence_records: []
---

# Rewrite method and role guidance for the in-place layout

## Scope and ownership

Implementer owns the canonical bundle under docs/artifact-driven and its byte-identical mirror under src/archs/artifact-driven: 01-foundation/artifact-model.md, definitions.md and principles.md; 02-methodology/dependencies.md, workflow.md and validation.md; 03-execution/README.md and the four skills/*/SKILL.md; 06-guidelines/writing-artifacts.md, getting-started.md, minimal-change.md, units-of-work.md, system-flows.md, working-with-ai.md and evidence-records.md; 05-adoption/README.md where it describes the project layout. Also owns src/archs/artifact-driven/bundle_test.go and the ADD paragraphs of AGENTS.md. Coordinator owns project knowledge. Preserve utility skills, pattern guides and unrelated instructions.

## Governing knowledge and prerequisites

N1 to N9, K1 to K3, K8; R3 to R7, A3 to A5; specifications/knowledge-layout.md; specifications/agent-efficiency.md; decisions/011-in-place-knowledge-layout.md; decisions/010-progressive-context.md. Explicit plan approval is required. No upstream artifact contract is required.

## Definition of Done

- [ ] Foundation describes the in-place layout as the default for new and migrated artifacts, with records, identities and derived facts as in the contract, and keeps the legacy layout in one compatibility section. The principle on complete snapshots states that Git holds every snapshot, current knowledge is readable in place, and referenced changes are retained. Definitions of change, version, element and provenance match the contract.
- [ ] Methodology replaces dag.yaml and dependencies.yaml with identity records and the branch-versus-protected-branch derivation, describes version records and the establishment rule, and keeps legacy rules in compatibility sections only.
- [ ] Guidelines: writing-artifacts gives the identity record, version record, change record and reference examples and the front-matter-only rule; getting-started starts a change without copying; minimal-change presents the in-place scaffold with zero baseline copies; units-of-work describes in-place provenance; system-flows notes the selector rule; working-with-ai adds same-session context reuse and recovery per the efficiency contract; evidence-records drops the dependency-index correction step.
- [ ] Role skills and 03-execution describe editing in place, identity and version records, and same-session reuse with reload after context loss or source change; they keep KISS and STE checks, plan approval, upstream gates and merge rules.
- [ ] AGENTS.md ADD paragraphs describe the in-place layout and no longer instruct writing delivery_tasks; unrelated instructions are unchanged.
- [ ] bundle_test.go validates the in-place scaffold, the mirror is byte-identical, `go test ./...` and `go vet ./...` pass, every relative link resolves under the waterfall rule, and the word count of layout, version and provenance guidance is recorded before and after.
- [ ] Walk through same-session PO to TL to Plan, missing-packet fallback, stale-source recovery and unavailable approval or upstream proof; record the expected decisions and a read-count and UTF-8-byte comparison for shared utilities loaded once rather than four times. Label results as proxies.

## Evidence

Not executed. Record methods, results, source references and limitations here.
