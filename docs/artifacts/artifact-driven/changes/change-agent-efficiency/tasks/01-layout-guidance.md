---
id: layout-guidance
depends_on: []
evidence_records:
  - id: dod
    method: Bundle tests, mirror diff, link script, word counts and walkthrough recorded in Evidence.
    result: passed
    source: docs/artifacts/artifact-driven/changes/change-agent-efficiency/tasks/01-layout-guidance.md#evidence
---

# Rewrite method and role guidance for the in-place layout

## Scope and ownership

Implementer owns the canonical bundle under docs/artifact-driven and its byte-identical mirror under src/archs/artifact-driven: 01-foundation/artifact-model.md, definitions.md and principles.md; 02-methodology/dependencies.md, workflow.md and validation.md; 03-execution/README.md and the four skills/*/SKILL.md; 06-guidelines/writing-artifacts.md, getting-started.md, minimal-change.md, units-of-work.md, system-flows.md, working-with-ai.md and evidence-records.md; 05-adoption/README.md where it describes the project layout. Also owns src/archs/artifact-driven/bundle_test.go and the ADD paragraphs of AGENTS.md. Coordinator owns project knowledge. Preserve utility skills, pattern guides and unrelated instructions.

## Governing knowledge and prerequisites

N1 to N9, K1 to K3, K8; R3 to R7, A3 to A5; specifications/knowledge-layout.md; specifications/agent-efficiency.md; decisions/011-in-place-knowledge-layout.md; decisions/010-progressive-context.md. Explicit plan approval is required. No upstream artifact contract is required.

## Definition of Done

- [x] Foundation describes the in-place layout as the default for new and migrated artifacts, with records, identities and derived facts as in the contract, and keeps the legacy layout in one compatibility section. The principle on complete snapshots states that Git holds every snapshot, current knowledge is readable in place, and referenced changes are retained. Definitions of change, version, element and provenance match the contract.
- [x] Methodology replaces dag.yaml and dependencies.yaml with identity records and the branch-versus-protected-branch derivation, describes version records and the establishment rule, and keeps legacy rules in compatibility sections only.
- [x] Guidelines: writing-artifacts gives the identity record, version record, change record and reference examples and the front-matter-only rule; getting-started starts a change without copying; minimal-change presents the in-place scaffold with zero baseline copies; units-of-work describes in-place provenance; system-flows notes the selector rule; working-with-ai adds same-session context reuse and recovery per the efficiency contract; evidence-records drops the dependency-index correction step.
- [x] Role skills and 03-execution describe editing in place, identity and version records, and same-session reuse with reload after context loss or source change; they keep KISS and STE checks, plan approval, upstream gates and merge rules.
- [x] AGENTS.md ADD paragraphs describe the in-place layout and no longer instruct writing delivery_tasks; unrelated instructions are unchanged.
- [x] bundle_test.go validates the in-place scaffold, the mirror is byte-identical, `go test ./...` and `go vet ./...` pass, every relative link resolves under the waterfall rule, and the word count of layout, version and provenance guidance is recorded before and after.
- [x] Walk through same-session PO to TL to Plan, missing-packet fallback, stale-source recovery and unavailable approval or upstream proof; record the expected decisions and a read-count and UTF-8-byte comparison for shared utilities loaded once rather than four times. Label results as proxies.

## Evidence

Executed on 16 October 2026 on branch claude/add-in-place-layout after explicit user approval ("approve & implement"; ADD 2.4.0, one coordinated PR, adoption tasks kept).

- Foundation and methodology: artifact-model.md has Structure, Records, Identities, Git as the Version Store, Changes and Versions, Dependency Graph and one Legacy Layout and Migration section with the six migration steps. definitions.md and principles.md match the contract; the snapshot principle is now "Keep Complete, Recoverable Snapshots" and no longer allows deleting referenced changes. dependencies.md derives edges from identity records and keeps legacy rules in its Legacy Layout section; workflow.md has the five-step Change Lifecycle; validation.md describes version records and establishment.
- Guidelines: writing-artifacts.md (layout and identity record, version record, front-matter references in a text fence, short legacy note), getting-started.md, minimal-change.md (in-place scaffold, zero baseline copies), units-of-work.md (source_change provenance; delivery_tasks legacy-only), system-flows.md (selector rule), working-with-ai.md (Reuse Context in One Session; recovery in Resume Work), evidence-records.md (reconciliation without the index step).
- Role skills and 03-execution/README.md: edit in place, identity and version records, same-session reuse with reload after context loss or source change; gates, approval and merge rules kept. 05-adoption/README.md needed no layout change.
- AGENTS.md: the provenance paragraph describes the in-place layout and no longer instructs writing delivery_tasks.
- Checks: `go test ./...` and `go vet ./...` passed. TestMinimalChangeScaffold validates the in-place scaffold and rejects knowledge under the change; it failed as expected against the previous copy scaffold. `diff -r docs/artifact-driven src/archs/artifact-driven` shows only bundle.go, bundle_test.go and the mounted required-skills. A link script resolved every relative link and anchor in the bundle and found no link to an ancestor page (0 findings).
- Word counts (`wc -w`, bundle Markdown without required-skills): 23,360 before, 25,565 after. Section-level count of the two main layout pages: the in-place explanation in artifact-model.md and writing-artifacts.md is 1,233 words against 1,188 words of the old snapshot, copy and provenance sections (+4 percent), excluding the new identities table (112) and the legacy compatibility text (385). N9 is therefore not met on this proxy; the additions are the identity and derived-facts tables, legacy compatibility and the R3 to R5 reuse sections.
- Same-session walkthrough (review method, proxies): same-session PO to TL to Plan loads the role skill per role and the two utilities once; with no packet, read files and `git diff` against main; after context loss or a source change, reload only the affected sources; without approval, implementation does not start; without upstream proof, dependent implementation waits and names the missing proof. Utility reads (kiss 2,235 and asd-ste-100 5,982 bytes): 8 reads and 32,868 bytes for four roles before, 2 reads and 8,217 bytes in one session (75 percent fewer), 4 reads and 16,434 bytes when the implementer runs separately (50 percent fewer). Counts come from the guidance, not instrumented runs.
