# Simpler knowledge layout for humans and agents

## Need and observed behavior

All measurements below were taken on this repository at revision aee8de4 on 16 October 2026 with the scripts recorded in the unit brief. They are byte, file and command counts, not model token counts.

| Observation | Measured value |
| --- | --- |
| Files and bytes under docs/artifacts | 1,311 files, 5,796,168 bytes |
| Byte-identical redundant copies | 920 copies in 202 groups, 4,187,390 bytes (72.2 percent) |
| Knowledge files per change that are identical to a version file | 20 of 21 changes: 100 percent; active ADD change: 27 of 35 |
| Flow definition files for 15 distinct flows | 145 files |
| Files changed in the last ten merged PRs | 60 to 254 per PR; PR #28 added 139 files, 106 of them byte-identical to another file |
| Front matter use | 343 of 1,308 Markdown files; 35 distinct top-level keys |
| Element references declared | 3 files |
| Root README identity syntax | 3 of 3 artifacts use Markdown sections, none use the supported front matter |
| Plane phase inference | 19 of 21 changes report "current step is unknown" |
| Plane unit completion | 11 of 15 units report "unknown" because the publication sentence pattern did not match |
| Plane explore of this repository | 14.1 s, 800 git commands, 9,400 files across 10 worktrees |
| Zero-excerpt context packet | 116,052 JSON characters for the active ADD change; 156,422 for the Plane change |

The copies exist because the method stores every snapshot as a directory. Readers therefore compare directory copies by hash, parse prose for identity and publication facts, and replay commit history to find a phase. Humans see the same facts in three places (version copy, change copy, root prose) and must keep them consistent by hand. Agents search ten copies of each flow and load packets that enumerate every copy.

## Requirements

- N1: An artifact stores its current requirements, specifications and decisions once, directly under the artifact directory. A change edits them in place on a dedicated branch. Starting a change copies no knowledge files.
- N2: A version is recorded by one file that names its originating change and summarizes compatibility. A change is recorded by its README and its retained plan and tasks. Neither record contains copied knowledge.
- N3: Readers interpret identity, lifecycle, dependency, membership, task, flow, model, reference and evidence facts only from YAML front matter. For in-place artifacts, readers do not derive facts from prose, headings, links, fenced code blocks or commit history.
- N4: Git is the version store. Established knowledge is the protected branch's tree. Proposed knowledge is the branch's difference from that tree. A historical version resolves through Git from its version record. No committed index, state file or generated copy is required.
- N5: Logical identities stay stable across versions and renames: artifact ID; `<artifact>:<element path>`; `<artifact>:<flow>`; `<artifact>:<model>`; `<artifact>/<change>/<task id>`; `<artifact>@<version>`; unit name. Readers add repository, worktree and revision for concrete identity.
- N6: The change preserves the five phases, one active change per artifact, phase self-checks and commits, explicit plan approval, upstream establishment gates, team review and merge, retained delivery evidence, complete readable current knowledge, the proposed/established distinction, and acyclic artifact and task graphs.
- N7: Existing snapshot-copy artifacts, versions, changes, units, flows and evidence remain readable and unchanged. Readers detect each artifact's layout. A repository can contain both layouts. Established legacy snapshots are never rewritten.
- N8: A documented, repeatable migration moves an artifact to the in-place layout without changing knowledge bytes or the dependency graph. A migration that changes no knowledge keeps the version number.
- N9: Bundle guidance explains the layout, records and lifecycle in fewer words than the current snapshot, copy and provenance rules. Role guidance reuses loaded context as required by R3 to R5 in requirements/agent-efficiency.md.
- N10: The change records baseline and result measurements for copied bytes, files per change and version, PR size, reader cost and packet size. Results are labeled as byte, file and command proxies.

## Acceptance criteria

- K1: Starting a change on a migrated artifact creates at most two files and copies zero knowledge files. The proposed knowledge is visible as the branch difference from main.
- K2: Preparing a version adds one record file and edits the identity record. No knowledge directory is created under versions/.
- K3: After migration, every structural fact of this repository's artifacts is declared in front matter, and the in-place reader path contains no prose-derived fact extraction. The retired legacy-only functions are listed in task evidence.
- K4: For a migrated artifact, established knowledge resolves from local main or master, proposed knowledge from the branch, and the version snapshot from the version record's introducing commit. A shallow clone or missing ref produces an explicit diagnostic, never a guess.
- K5: Legacy fixtures and this repository's historical versions, changes and units keep their current reader results; diagnostics can only decrease. Established snapshots are byte-identical before and after.
- K6: Migration of artifact-driven, artifact-plane and story-driven produces root knowledge byte-identical to the verified current snapshot, plus the open change's proposed edits where an open change exists. The dependency graph is unchanged, flows and units resolve, and no dag.yaml or dependencies.yaml is read on the in-place path.
- K7: Measured results: zero copied knowledge files in current knowledge; the PR for this change contains no knowledge copies; the zero-excerpt packet for the ADD change is at least 80 percent smaller than the baseline; exploring this repository issues at least 50 percent fewer git commands. Methods are recorded with results.
- K8: Canonical and embedded guidance agree, the AGENTS.md ADD paragraph and the minimal scaffold use the in-place layout with zero baseline copies, and all links resolve under the waterfall rule.

## Impact and self-check

ADD owns the layout, records, identity rules, migration procedure and guidance. Artifact Plane owns layout detection, Git-based comparison, declared-evidence derivation and the validation and migration scripts; that work is specified in its existing active change and waits for this contract to establish. Story-Driven knowledge is migrated without content change. No artifact dependency changes. Candidate flows are change-delivery, version-publication, dependency-gates, unit-validation and adoption.

Facts are measured on this repository; the Plane's behavior on other repositories is an assumption. KISS removes copies and prose parsing instead of adding a model layer or a database. STE keeps obligations, limits and legacy rules explicit. No unresolved Requirement blocker prevents Specification.
