---
self_check:
  result: passed
  source: docs/artifacts/artifact-driven/requirements/delivery-improvements.md#requirement-self-check
claims:
  - id: small-threshold
    kind: assumption
    statement: A limit of fewer than 100 changed code and test lines, with the
      other small-tier criteria, admits the small fixes of this repository and
      excludes its feature changes.
    status: supported
    basis: observed
    evidence:
      - docs/artifacts/artifact-driven/requirements/delivery-improvements.md#need
    check: Count the changed code and test lines of every change delivered
      after this version; a change that the owner calls small but that has 100
      or more lines refutes the limit.
    risk_if_wrong: Small fixes take the medium path, or feature work takes the
      small path without plan approval.
  - id: fresh-implementers
    kind: assumption
    statement: An implementer agent that starts from the task path, its
      governing paths and the DoD uses fewer input tokens than a forked agent
      that inherits the coordinator context, for the same task.
    status: supported
    basis: observed
    evidence:
      - docs/artifacts/artifact-driven/requirements/delivery-improvements.md#need
    check: Compare the mean input tokens per call of fresh and forked
      implementer agents in the sessions that deliver the next medium change.
---

# Delivery improvement requirements

## Outcome

The delivery cost of a change scales with the size and risk of the change. A small change needs few records, one knowledge commit and one human gate. A medium or large change keeps its phases and plan approval, with less restated text and less mandatory reading. The five owner-fixed guarantees hold for every size.

## Need

Facts measured on this repository on 19 October 2026 (`docs/artifacts/units-of-work/framework-comparison/measurements/git-cost.md` and `session-cost.md`):

| Measure | Value |
| --- | --- |
| Knowledge share of added lines per PR, #29 to #39 without #30 | median 61%, p90 86% |
| Knowledge for small fixes | #37: 312 lines for 50 code and test lines; #34: 247 lines for 42 |
| Commits and human gates per change | at least 5 commits, 3 gates (plan approval, semver confirmation, PR merge) |
| Task lines that restate or point to other records | about 39% |
| Unit-brief lines that are front matter | 75% |
| Requirement to Plan, median | about 8 min |
| Plan commit to owner approval, median | 2 min |
| Owner prompts that are gate actions | 96 of 372 (63 approvals, 14 version confirmations, 19 merge notices) |
| Reads of `kiss` and `asd-ste-100` SKILL.md | 104, each again in 25 extra agent contexts |
| Guidance reads in Codex tool-result tokens | 23.5% |
| Forked agent input per call, against other subagents | 509k against 168k to 234k tokens |
| Bundle copies in Git | 2, byte-identical; 1,152 duplicated lines per copy in #29 to #39 |
| Validator in the default install | none ("No standalone runner or CLI validator is required", `06-guidelines/writing-artifacts.md`) |

The capability scores of the investigation (`docs/artifacts/units-of-work/framework-comparison/scores.md`) put ADD at 1 of 5 for low overhead, 2 for extensibility, 3 for validation and review and 3 for traceability. The optimization record (`optimization.md` in the same directory) gives the options and the expected savings.

## Requirements

### Size tiers and gates

- DI1: ADD defines three change tiers: small, medium and large. The coordinator assigns the tier at Requirement and records it as a structural fact of the change. A change is small only when all of these are true: one artifact; one repository; patch compatibility level; no change to a declared reference consumer, a flow, a route, an API or another contract; no new requirement ID, flow or ADR; every upstream version it needs is established; fewer than 100 changed code and test lines; the change impact over the difference reaches nothing outside the artifact. A change that touches more than one artifact or changes a contract is large. Other changes are medium. When the validator or the impact answer leaves a criterion unresolved, the change is not small. The owner can raise the tier of any change.
- DI2: A small change has one change record with its reason, scope, tier and a short plan; the requirement and specification edits in place; one task; the version record and the identity record. It needs no unit brief. Requirement, Specification and Plan are committed together in one knowledge commit. The request of the owner counts as plan approval, and the plan appears in the PR description. The owner confirms the patch level at merge.
- DI3: A medium or large change keeps its phase commits and the explicit plan approval. The plan states the proposed compatibility level, and the owner confirms the level together with the plan approval. The coordinator asks again only when the level changes. When a unit has several members, one approval covers all member plans that are presented together. The coordinator reads merges from Git and does not ask the owner to report them.
- DI4: The plan states only the compatibility level. The version number is computed at Version from `current_version` on the protected branch, so a parallel change cannot take the same number.
- DI5: A medium or large change that changes a user interface records, before Version, that the owner looked at screenshots or the running interface.

### Knowledge records

- DI6: Each fact is written once. A task does not restate `depends_on` or the plan approval. An evidence record without a source points to the Evidence section of its own task. A unit brief references task evidence and requirement acceptance IDs and does not copy their text; an evidence entry keeps one line of method and the result that the completion rule needs. A numeric result is stated in the task that produced it; other records link to it. A version record states the compatibility level, its reason and a short summary, without boilerplate.
- DI7: A requirement file that a change creates or edits gives each requirement an ID in a form that a reader can parse. A task declares the requirement IDs it covers as a structural fact, instead of a prose list of governing knowledge. Requirement files without parseable IDs stay valid; readers report them as information, not as an error.

### Validation

- DI8: The default install of ADD includes a deterministic validator that an agent, a person and CI can run. It returns machine-readable output and can be limited to one change. It checks at least: the existing structural rules of records; that evidence and self-check sources resolve; relative links; template placeholder text; the version record against the identity record; that each `depends_on` target has an established version; `covers` against the requirement IDs; the small-tier criteria of DI1 it can decide; and other branches with an open change on the same artifact. When the validator is available, its passing run is the structural part of a self-check, and the self-check records its result instead of restating the rules. Without it, authors apply the rules by hand.

### Reading and context

- DI9: Each role skill has a short core and loads other guidance only when the current phase needs it. The `kiss` and `asd-ste-100` principles are applied through a short checklist in each self-check; their full skills stay in the bundle for reference. Full guidance text that is already in the same agent context counts as loaded.
- DI10: The coordinator dispatches implementer agents with the task path, the governing paths and the DoD instead of a copy of its own context. Agents read code by section or symbol, start a new context at a phase boundary when the harness allows it, and return short summaries.
- DI11: An implementer runs the tests that the change impact lists for verification and the fast unit suites locally. CI runs the full suites.

### Configuration and delivery

- DI12: A project configuration file holds the tier criteria values, whether a one-member outcome needs a unit brief, and the guidance each role reads. The validator and the guidance read it. Without the file, the defaults of DI1 to DI3 apply. The bundle provides role profiles for Claude Code next to the Codex profiles.
- DI13: The repository keeps one source of the bundle. No second copy is committed, and the adoption tool embeds the bundle from that source. A release stays self-contained.
- DI14: The repository instructions in `AGENTS.md` follow DI1 to DI3, DI9 and DI12. A unit of work stays required for medium and large outcomes.

### Limits

- DI15: No change weakens the five guarantees. A small change still edits its requirement and specification in place, still writes a version record that establishes on `main`, and is excluded when an upstream version is not established. Approval stays out of files. No workflow state, registry, phase, role or gate is added.

## Acceptance criteria

- A1: Replayed on the knowledge of Artifact Plane change-hidden-tab-streams (#37), the small-tier path produces at most 9 knowledge files, at most 160 knowledge lines, 2 commits and 1 human gate, and the validator reports no error.
- A2: The validator contract lists each check of DI8 with its diagnostic code and one seeded example. The adoption tool installs the validator when the release contains it, and adoption succeeds without it. The run of the installed validator on seeded defects is a unit criterion, because the Plane supplies the rule implementation.
- A3: Each role skill core has at most 400 words, and the guidance that the coordinator reads unconditionally has at most 3,000 words, counted with `wc -w`.
- A4: Git holds one copy of the bundle; the adoption tool embeds it without a second copy; `go test ./...` passes, the website builds and the release archive contains the full bundle.
- A5: Existing knowledge without tier, `covers` or requirement IDs stays valid; the validator reports no new error on this repository.
- A6: For each guarantee of DI15, a check or a contract statement shows that it holds for small, medium and large changes.
- A7: A configuration file with a changed tier limit changes the tier result of the validator for the same change; without the file the defaults apply.

## Affected artifacts and flows

Artifact Plane reads and writes the new fields, runs the shared checks and renders the PR description; it changes in the same unit through change-delivery-improvements and depends on this version. Story-Driven depends on ADD; its bundle does not use tiers, `covers` or the validator, and its knowledge does not change.

ADD flows: change-delivery changes (tier assignment, the small-tier path, one knowledge commit, approval by request, level confirmed with plan approval); version-publication changes (number computed at Version, validator check, level already confirmed); adoption changes (validator in the install, generated bundle copy); unit-validation changes (brief optional for small outcomes, evidence by reference). Dependency-gates keeps its steps; the validator adds a check of the same rule.

## Facts, assumptions and exclusions

Facts: the numbers above come from Git history and local agent session logs, measured on 19 October 2026. Assumptions: the two claims in the front matter. The owner decided: tiers with the proposed limits and no code-only tier; unit brief optional for small outcomes; approval by request, level with plan approval and one knowledge commit for small changes; a validator in the default install; the generated bundle copy; requirement IDs and `covers` for new and edited files only. Exclusions: a code-only maintenance tier, a required independent review, migration of existing requirement files.

## Requirement self-check

Each requirement states what is needed and is testable through A1 to A7. DI2 and DI3 keep plan approval for medium and large changes, as the owner fixed. DI15 keeps every guarantee, and approval stays out of files as the artifact model requires. The validator implementation language, the ID syntax and the configuration format belong to Specification. KISS: the tiers reuse the existing scaffold, impact service and validator rules; nothing is added that no measured cost justifies. STE: one rule per item, with obligations stated. Claims: two assumptions with checks; no other statement selects between contract options. No blocker prevents Specification.

Amendment during Specification: A2 moves the run of the installed validator to the unit criteria, because the rule implementation is in the Plane and Plane implementation waits for this version. DI13 and A4 keep the owner's goal of one bundle source and leave the mechanism to Specification. DI6 keeps the result field that the unit completion rule needs. The owner decisions are unchanged. On 19 October 2026, after the small-tier replay of task small-replay, the owner approved two amendments: A1 allows at most 9 knowledge files, because every small change writes 5 fixed records and #37 needs 4 knowledge edits; a paragraph label (`R4. …`) counts as a requirement ID, so the 11 files that use it need no migration.
