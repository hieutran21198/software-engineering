---
self_check:
  result: passed
  source: docs/artifacts/artifact-plane/specifications/knowledge-layout-reading.md#self-check
references:
  - artifact: artifact-driven
    element: specifications/knowledge-layout.md
    requires: Detect the in-place layout, read its records and derive established, proposed and historical knowledge as the contract defines.
    status: proposed
    change: change-agent-efficiency
---

# Reading the in-place knowledge layout

Governs L1 to L7 and M1 to M5 in requirements/knowledge-layout.md. Implementation waits for the referenced ADD contract to establish and be rechecked. Extend the existing scanner, model, workflow, units, review, flow and query services; add no service, index authority or cache.

## Layout detection and records

scanRepository and parseArtifact detect the layout per artifact: in-place when requirements, specifications or decisions exists directly under the artifact directory, otherwise legacy. For in-place artifacts, parseArtifact reads current_version, depends_on and publication_reviews from front matter only and ignores Markdown declaration sections; a missing or malformed identity record is an invalid-identity diagnostic, not a prose fallback. Legacy artifacts keep the existing parser, including Markdown sections, dag.yaml checks and dependencies.yaml proposals.

Version records are versions/<version>/README.md with source_change. On the in-place path a version directory with knowledge subdirectories is a diagnostic. Change records are changes/<change>/README.md. An open change is one that no version record names and that has no knowledge directories; a change directory with copied knowledge directories is read as a retained legacy change with an informational diagnostic. The declared active-change link and delivery_tasks marker are not read for in-place artifacts.

## Baseline and comparison through Git

Resolve the established baseline for an artifact from refs/heads/main or refs/heads/master: the artifact directory tree when that ref holds the in-place layout, otherwise versions/<current_version on that ref>/. Keep the existing rule that both refs must agree. Missing refs, shallow history and disagreement produce the existing unknown diagnostics.

Compare working knowledge with the baseline through `git diff --name-status <ref> -- docs/artifacts/<artifact>/{README.md,requirements,specifications,decisions}` and blob reads, and classify each file as added, modified, removed or unchanged. The review service uses this comparison as the record list and the baseline source map; it no longer reads a declared-current version directory for in-place artifacts. The comparison selectors of evidence-and-comparison.md apply to legacy artifacts only; in-place requests reject version and change selectors with 422. Element identity collapses to one source, the working tree, with logical identity `<artifact>:<path>`; the concrete identity adds repository, worktree and revision. References and flow support resolve in the working tree and are labeled proposed when the target differs from the baseline.

## Declared evidence instead of history

For in-place changes, evidenceFor derives the six displayed steps from declared fields: Requirement, Specification and Plan from self_check records in changed requirement, specification or decision documents and in tasks/README.md; Implementation and Validation from evidence_records and checklists in listed tasks; Version preparation from the presence of a version record naming the change. A step without a declaration is "not declared". Git history is not replayed, and no phase is inferred from prose or commit subjects. Legacy changes keep the existing inference. Approval remains "not verified by this reader".

## Version snapshots and unit completion

Resolve an in-place version snapshot as the tree of the first-parent protected-branch commit that introduced its version record (`git log --first-parent --diff-filter=A --format=%H -- <record>`), or the optional tag `<artifact>/<version>` when both agree. Publication for an in-place member compares the record, the identity record and the retained tasks on that ref; prose publication-review parsing applies to legacy members only, and publication_reviews stays available for both. Unit evidence sources, acceptance evaluation and completion derivation are unchanged.

## Navigation and presentation

Group an in-place artifact's elements as Working knowledge, with an Established on main view that reads the baseline through the existing contained source route. Delivery work lists change records with their task graphs and version records with their summaries. Labels for legacy artifacts are unchanged. Diagnostics name the layout they apply to.

## Scripts

Add scripts/validate-knowledge.mjs, which runs the scanner, snapshot, task, unit and flow readers on one repository path, prints diagnostics as JSON and exits nonzero when any diagnostic is an error. Add scripts/migrate-layout.mjs, which performs the ADD migration procedure for one or all artifacts, defaults to dry-run, refuses ambiguous identity declarations, writes only inside docs/artifacts of the selected worktree, and reports byte equivalence between the new working knowledge and its source. Both scripts reuse existing modules and need no server or browser.

With `--convert-history`, migrate-layout performs the optional ADD conversion step for in-place artifacts. It plans the deletion of copied knowledge in version and change directories, of version-owned tasks that are byte-identical to the originating change's tasks, and of delivered dependencies.yaml files, and the removal of delivery_tasks markers. It keeps unmatched task sets and reports them, refuses any file that differs from HEAD, and lists links into removed files. Readers are unchanged. Both scripts set the exit status without truncating large JSON reports.

## Validation and measurement

Add fixtures for in-place, mixed and transition repositories beside the legacy fixture. Test layout detection, identity records, baseline resolution on both refs, name-status comparison, declared evidence, version snapshot resolution including shallow and missing-ref diagnostics, reference labeling, HTTP and MCP parity, source containment and unchanged repository bytes. Add a repeatable benchmark that records packet bytes, explore elapsed time and git command count for the legacy and migrated forms of this repository; targets are at least 80 percent smaller zero-excerpt packets for the ADD change and at least 50 percent fewer git commands per explore. Report results as byte and command proxies.

## Self-check

L1 to L7 map to detection, Git comparison, declared evidence, snapshot resolution, presentation, scripts and compatibility. Legacy behavior is retained on its own path and existing tests remain required. KISS extends existing modules and adds two scripts without a new service; STE separates derived facts from unverifiable approval. Self-check: passed.
