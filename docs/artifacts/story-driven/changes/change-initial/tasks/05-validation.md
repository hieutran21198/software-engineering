---
id: validation
depends_on: [delivery]
---

# Integrated validation and release evidence

## Scope and location

Repository: software-engineering. Run integrated checks, record evidence, and prepare proposed version and PR.

## Governing knowledge

- [Requirements](../requirements/framework.md)
- [Specification](../specifications/framework.md)
- [Decision](../decisions/001-shared-knowledge.md)

## Prerequisites

The declared internal prerequisites must satisfy their DoD. The user has approved this scope. No external establishment gate applies.

## Definition of Done

- [x] Go tests, vet, CLI build and documentation production build pass; independent creative exercise findings are resolved; proposed snapshot excludes tasks and links retained delivery evidence; PR is prepared for review without merge.

## Evidence

### Integrated commands

- `GOCACHE=/tmp/story-driven-go-cache go test ./...` — passed all packages, including actual adoption, filesystem fidelity, links/hierarchy and supporting-resource tests.
- `GOCACHE=/tmp/story-driven-go-cache go vet ./...` — passed.
- `GOCACHE=/tmp/story-driven-go-cache go build -o /tmp/se-adopt-story ./cmd/se-adopt` — passed; the binary listed both architectures and adopted all 58 bundle files into two fresh isolated workspaces.
- `npm run build` in website — passed against the final source documentation. Docusaurus could not update its user-level update-check cache; static generation succeeded.
- Skill YAML/name/description/scaffold checks using the installed js-yaml parser — passed for all three roles. The Python skill validator could not start without PyYAML; the YAML-based alternative and automated bundled-resource tests cover the required discovery/resource checks.
- `git diff --check` — passed.

The initial Go invocation failed because its default cache was read-only. The checks above use a writable task-specific cache and passed. No implementation failure remains.

### Independent novel exercise

An independent agent used only an adopted bundle and the coordinator skill, with permission to create draft knowledge in an isolated temporary workspace. The request supplied a coastal town and a bell that sounds only when its keeper truthfully names a living person; the keeper falsely believes her living estranged brother dead; whether the father deliberately hid his survival is an intentional mystery. The requested output was a novel skeleton in close third-person past tense, with no manuscript and autonomous draft proposals.

Observed output: a brief/index, five shared Core contracts, authoritative World records, an eight-chapter Narrative outline, a slice review and a handoff. Brother survival stayed objective truth, the keeper's belief stayed false, and the father's intention remained unresolved. Bell behavior retained a necessary condition without inventing guaranteed ringing or guilt detection. Added outcomes and creative choices remained proposed and unapproved. No gameplay, art or level prerequisite was imposed. All role and utility resources resolved. Parent inspection confirmed these findings; 17 local links/anchors and downward navigation checks passed.

### Independent revision exercise

Another independent agent used only an adopted bundle and the architect skill. The request proposed permitting uncertified copies of sealed originals for court submission while retaining certification for public release; it requested impact review without application or approval.

Observed output: a proposal locating the owner in Setting Rules, reviewing dependent Game/Narrative contracts and World/Narrative/Gameplay/Encounter consumers, separating copying permission from certification and court findings, and proposing branch-specific guards. Historical facts and unknown motives stayed unchanged. The proposal identified reduced moral pressure and historical-capability questions rather than inventing answers. Every adopted example file remained byte-identical to the shipped source. All resources resolved. The agent's natural search saw the shipped review page; this is disclosed rather than claimed as a blind exercise. Parent review verified the owning-record reasoning and proposed changes.

### Version and review handoff

Prepared proposed 1.0.0 with source_change and delivery_tasks markers, complete Requirement/Specification/Decision knowledge, and a link to originating tasks. There are no task copies in the snapshot and no changes to established snapshots. The proposed artifact index agrees with root dependency declarations; no new dependency edge exists. A YAML/Markdown audit passed 34 artifact/version links, evidence anchors, provenance markers, exact snapshot fidelity and exclusion of task copies. The PR title/body is prepared for the dedicated feature branch. Publication is recorded below after handoff; no merge or establishment is claimed.

KISS and clear technical writing checked throughout. Structural and authoring evidence does not claim implemented gameplay, manuscript quality or creator approval of generated fictional examples.
