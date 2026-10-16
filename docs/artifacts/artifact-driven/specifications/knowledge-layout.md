---
self_check:
  result: passed
  source: docs/artifacts/artifact-driven/specifications/knowledge-layout.md#specification-self-check
---

# In-place knowledge layout contract

Governs N1 to N10 and K1 to K8 in requirements/knowledge-layout.md. ADD owns this contract, its guidance and the migration procedure. Readers that consume it belong to Artifact Plane. The snapshot-copy layout defined in knowledge.md and task-retention.md remains valid for existing artifacts and is called the legacy layout below.

## Layout

```text
docs/artifacts/<artifact>/
  README.md                       identity record and purpose, scope and ownership prose
  requirements/                   working knowledge: established on the protected branch,
  specifications/                 proposed on a change branch
  decisions/
  changes/<change>/README.md      change record: reason and scope
  changes/<change>/tasks/         plan, tasks, DoD and evidence (unchanged format)
  versions/<version>/README.md    version record; no knowledge directories
docs/artifacts/units-of-work/<unit>/README.md   unchanged
```

An artifact uses the in-place layout when at least one of requirements, specifications or decisions exists directly under the artifact directory. Otherwise it uses the legacy layout. Readers detect the layout per artifact. A repository can contain both layouts.

Nested directories under the three knowledge directories are allowed. System flows stay under specifications/flows. Tasks keep the existing plan and task format: tasks/README.md lists task paths; each task declares id, depends_on and optional evidence_records.

## Records

The identity record is the front matter of the artifact README:

```yaml
---
current_version: 2.3.0
depends_on: [artifact-driven]
---
```

current_version is a semantic version string or null before the first established version. depends_on is a list of artifact IDs and can be empty. publication_reviews stays optional as defined in evidence-records.md. The body records purpose, scope, boundaries and ownership. In the in-place layout, readers do not interpret Markdown sections such as Current established version, Established dependencies or Active change; do not write them.

The version record is versions/<version>/README.md:

```yaml
---
source_change: change-agent-efficiency
---
```

The body states the compatibility level with its reason and summarizes the resulting knowledge. The directory name is the version. One version names one change; one change produces at most one version. delivery_tasks is not written: a version record never contains tasks, so delivery always resolves to changes/<source_change>/tasks/.

The change record is changes/<change>/README.md. It states the reason and scope in prose and needs no front matter. Its tasks directory holds the plan and evidence and is retained while any version or unit references it.

## Structural facts and identity

Readers interpret structural facts only from YAML front matter: identity records, version records, unit briefs, plan task lists, task declarations, evidence_records, self_check, publication_reviews, references, models and flow documents. Prose, headings, links, fenced code blocks and commit messages carry no interpreted facts for in-place artifacts. Unknown front matter keys are ignored and create no relationship.

Logical identities are stable across versions, branches and file renames of other elements:

| Entity | Logical identity | Example |
| --- | --- | --- |
| Artifact | directory name | artifact-plane |
| Element | `<artifact>:<path>` relative to the artifact directory | artifact-driven:specifications/knowledge.md |
| Flow and step | `<artifact>:<flow id>` and `:<step id>` | artifact-driven:change-delivery:plan |
| Model | `<artifact>:<model id>` | artifact-driven:version |
| Change | `<artifact>/<change>` | artifact-driven/change-agent-efficiency |
| Task | `<artifact>/<change>/<task id>` | artifact-driven/change-agent-efficiency/json-cli |
| Version | `<artifact>@<version>` | artifact-driven@2.3.0 |
| Unit | directory name | add-agent-efficiency |

Concrete reader identity adds repository, worktree and Git revision. Legacy elements keep their snapshot selector as part of concrete identity; their logical identity is the same `<artifact>:<path>` form.

Element references declare `references` in front matter only. The example uses a text fence because the current legacy reader interprets fenced YAML blocks that contain references, which is one of the behaviors this contract retires:

```text
references:
  - artifact: tenant
    element: specifications/identity.md
    requires: tenant identifier format
```

A reference resolves in the same checked-out tree. Readers label the target proposed when its bytes differ from the protected branch, and established otherwise. A reference to a supplier's proposal on another branch is unresolved until that proposal merges; dependent Implementation waits in any case. The status and change selectors of the legacy contract are unnecessary for in-place artifacts; readers tolerate them without effect. Flow support of kind element and kind flow follows the same rule. Fenced-block references are legacy-only.

## Derived facts

Readers derive the following facts; none is stored:

| Fact | Derivation |
| --- | --- |
| Established knowledge | The artifact directory in the tree of refs/heads/main or refs/heads/master. For a legacy artifact on that ref, versions/<current_version>/. |
| Proposed knowledge | Files in the checked-out tree whose bytes differ from established knowledge, including additions and removals. |
| Open change | A change directory that no version record names in source_change and that contains no knowledge directories. A change directory with copied knowledge directories is a retained legacy record, never an open in-place change. |
| Established version | current_version in the protected branch's identity record, whose version record exists there. |
| Version snapshot | The tree of the first-parent protected-branch commit that introduced versions/<version>/README.md. A tag `<artifact>/<version>` on that commit is optional. For a converted legacy version, the knowledge is versions/<version>/ in that same tree. |
| Dependency graph | depends_on of identity records. Proposed edges are the difference between the checked-out and protected identity records. Cycles are diagnostics in both views. |
| Phase evidence | self_check in requirement, specification and plan documents; evidence_records and checklists in tasks; the version record. |
| Approval | Not a file fact. Authorization comes from the user, as today. |

A shallow clone, a missing protected ref, or a version record without an introducing commit produces an explicit diagnostic. Readers never guess a baseline from directory names, timestamps or the largest version number. docs/artifacts/dag.yaml and changes/<change>/dependencies.yaml are legacy-only: readers ignore them for in-place artifacts and report them as unused.

## Lifecycle

1. Start a change on a dedicated branch. Add changes/<change>/README.md. Copy nothing. Edit working knowledge in place: retain, amend, remove and add.
2. Complete Requirement, Specification and Plan with existing self-checks and commits. Record self_check where readers need it.
3. Present the plan and wait for explicit approval. Implementation records evidence in tasks.
4. Prepare the version: add versions/<version>/README.md with source_change, set current_version and any changed depends_on in the identity record, and open the PR.
5. The version is established when the PR lands on the protected branch. The change directory remains as the retained delivery record.

One active change per artifact remains a rule; two branches that edit the same artifact's knowledge conflict at merge, which makes the rule visible. Units of work, task graphs, flow documents, evidence records and publication reviews are unchanged.

## Migration

Migrate one artifact at a time on a change branch. The procedure is repeatable by hand or by the Plane's migrate-layout script:

1. Verify the declared current version against the protected branch with the reconciliation procedure in evidence-records.md. Stop on ambiguity.
2. Copy versions/<current_version>/requirements, specifications and decisions to the artifact directory. If the artifact has an open change that carries copied knowledge, copy the open change's knowledge instead, because it already contains the proposal, and delete the change's copied knowledge directories; the change keeps README.md and tasks/.
3. Replace the Markdown declarations in the artifact README with the identity record. Remove prose that describes proposed or established state; that state is now derived.
4. Delete dependencies.yaml from the open change after applying its edges to depends_on. Delete docs/artifacts/dag.yaml when no legacy artifact remains.
5. Optionally convert the retained legacy records, in the same or a later change. Delete the knowledge directories of versions/<version>/ and the copied knowledge directories and dependencies.yaml of delivered changes. Delete version-owned tasks that are byte-identical to the originating change's tasks, and keep task sets that have no such copy. Remove delivery_tasks markers. Point unit evidence and links at the retained change tasks, or name the Git snapshot in plain text. Restate affirmative prose publication reviews as publication_reviews after verifying the merged PRs. Every deleted file must exist unchanged in the commit that introduced its version. Without conversion, leave these directories untouched.
6. Verify byte equality between the new working knowledge and its source, an unchanged dependency graph, resolved flows and units, and the layout detection.

A migration that changes no knowledge bytes keeps the current version number and adds no version record. A migration inside a change that also changes knowledge follows the normal version rule.

## Guidance and delivery

Update the canonical bundle and its embedded copy: foundation artifact model, definitions and principles; methodology dependencies, workflow and validation; writing, getting-started, minimal-change, units-of-work, system-flows and working-with-ai guidelines; the four role skills; and the AGENTS.md ADD paragraph of this repository. Describe the in-place layout as the default for new artifacts and migrated artifacts, keep the legacy layout documented in one compatibility section, and remove the instructions to copy knowledge into changes and versions. Correct the foundation principle that allows deleting referenced changes.

## Measurement

Record the following before and after migration of this repository, with the method: files and bytes under docs/artifacts and the byte-identical share; knowledge files copied by the active change; files added by the last version; zero-excerpt packet size for the ADD change; git command count and elapsed time of one explore; the number of changes with an unknown phase and units with unknown completion. Label the results as byte, file and command proxies.

## Specification self-check

N1 to N10 map to layout, records, identity, derived facts, lifecycle, migration, guidance and measurement. Converted legacy snapshots stay recoverable from the commit that introduced them; unconverted snapshots are not rewritten. KISS removes copies, a stored index and prose parsing instead of adding a model file; STE keeps derivations and failure cases explicit. No Specification blocker prevents Plan.
