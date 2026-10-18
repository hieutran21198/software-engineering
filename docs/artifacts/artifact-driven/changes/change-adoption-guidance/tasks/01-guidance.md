---
id: guidance
depends_on: []
evidence_records:
  - id: dod
    method: Review of the six edited pages against the contract, and byte comparison of both bundle copies.
    result: passed
    source: docs/artifacts/artifact-driven/changes/change-adoption-guidance/tasks/01-guidance.md#evidence
---

# Rewrite the adoption guidance in both bundle copies

## Scope and ownership

Coordinator, as implementer. Repository: this repository. Files, each in docs/artifact-driven and then copied to src/archs/artifact-driven:

- 05-adoption/README.md
- 06-guidelines/adopting-from-git.md
- 06-guidelines/getting-started.md
- 06-guidelines/working-with-ai.md
- 06-guidelines/README.md
- README.md (bundle overview)

No Go, website or Artifact Plane file changes.

## Governing knowledge

G1–G3 in requirements/adoption-guidance.md; specifications/adoption-guidance.md (page ownership, release selection, After Adoption, agent-ready request).

## Prerequisites

Explicit user approval of this plan. No upstream artifact is required.

## Definition of Done

- [x] 05-adoption/README.md has the release paragraph and both scripts of the release-selection contract, keeps the headings Download the Binary and Adopt, and adds After Adoption with the five ordered steps, their links and the authorization statement. The Result paragraphs about the coordinator skill and AI-assisted setup are removed.
- [x] adopting-from-git.md has no command block, links to the Download the Binary, Adopt and After Adoption sections, and contains the request with the two contract edits. Its blocker and authorization rules stay.
- [x] getting-started.md has no se-adopt command and links to the adoption guide; working-with-ai.md links to the agent-ready request; the guide index and the bundle overview rows match the contract.
- [x] No bundle page uses a fixed past release tag as an example default.
- [x] Each changed file in src/archs/artifact-driven is byte-identical to its docs/artifact-driven source.

## Evidence

Executed on 18 October 2026 after the user approved the plan.

- 05-adoption/README.md: the release paragraph says that a release bundle can be older than main or the website, and that readers set a tag or leave it empty for the latest release. Both scripts start with an empty tag, resolve the latest tag from the final URL of releases/latest, stop unless the tag starts with v, and print `Using release <tag>`. The headings Download the Binary and Adopt are unchanged. After Adoption has the five ordered steps and the authorization statement. The two Result paragraphs about the coordinator skill and AI-assisted setup are removed; the Result paragraph keeps the statement that skills are files and that the command does not edit AGENTS.md or CLAUDE.md.
- adopting-from-git.md: the Preview and Adopt section with its command block is replaced by Adopt by Hand, three links into the adoption guide. The request asks the agent to resolve and report the latest tag, to follow After Adoption steps 1-3 and to report the setup for step 4. The blocker and authorization paragraphs are unchanged.
- getting-started.md links to the adoption guide instead of giving a se-adopt command. working-with-ai.md links to the adoption request. The guide index row and the bundle overview rows for 05 and 06 follow the contract.
- Correction during validation: the first Windows script read tag_name from the GitHub REST API. The API returned "API rate limit exceeded" for this machine's shared address, so the script now reads the releases/latest redirect, as the Linux script does. The specification records this correction. The behavior for the reader stays the same.
- `diff -rq docs/artifact-driven src/archs/artifact-driven` lists only bundle.go, bundle_test.go and required-skills.
