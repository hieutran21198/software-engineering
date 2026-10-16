# ADD baseline requirements

## Need and constraints

Maintain the existing ADD capability as complete project knowledge. Existing documentation and implementation are primary evidence. These requirements preserve the baseline; requirements/evidence-and-usability.md defines the current evidence and authoring extension.

R1. Preserve the five phases: Requirement, Specification, Plan, Implementation, Version. ADR work is part of Specification. The PO owns Requirement; one TL session owns Specification and Plan; implementers and the coordinator validate implementation; team review and merge establish versions.

R2. Keep a cohesive artifact identity, one active change, and complete knowledge snapshots. Root READMEs own current established identity and dependencies. Git records history. Initial versions start at 1.0.0 and require satisfied DoD, version confirmation, and required merges.

R3. Keep artifact dependencies separate from element references and runtime interactions. Resolve established element references through the owning artifact's current version. Clearly label proposed contracts. Required upstream changes must establish before dependent Implementation.

R4. Supply the full reusable ADD bundle: foundation, methodology, four role skills, nine pattern guides, adoption and end-user guidelines, and required KISS and ASD-STE100 principles skills. Keep relative bundle links usable. Patterns are guidance, not additional phases or implemented domain capabilities.

R5. Supply local adoption through se-adopt. Select the available architecture, preview copying, accept a workspace-relative destination, preserve identical and unrelated files, and reject conflicts and unsafe destinations. Adoption must not invent domain artifacts, register a harness, or publish changes.

R6. Support documented human and AI-assisted execution using the same method. Require explicit user plan approval and team review/merge. Native harness configuration can expose supplied roles and skills; those files do not prove every agent tool can run them. Do not claim mechanical enforcement of prose gates.

R7. Publish documentation from maintained Markdown sources and supply portable adoption binaries through existing CI. Preserve source/generated-output boundaries. Separate ADD artifact versions from binary release tags and Artifact Plane versions.

R8. Recover applicable decisions, acceptance checks, concrete source evidence, and limits. Do not fabricate historical rationale, commit provenance, approvals, owners' names, or completed checks. Preserve valid reusable knowledge instead of duplicating its complete text into the artifact.

R9. Future ADD changes start from complete current artifact knowledge without historical tasks or delivered provenance and create fresh plans. Keep the existing workflow. No new workflow state, database, agent framework, CLI command, auto-upgrade, or automatic version establishment is introduced.

## Acceptance criteria

A1. The knowledge identifies one ADD artifact boundary and responsibilities, distinguishes Artifact Plane, and explains why no new inter-artifact prerequisite exists.

A2. Each recovered requirement and contract has identifiable repository evidence; documented procedures are distinct from executable behavior. Missing behavior is explicitly excluded from the baseline rather than marked complete.

A3. The specification covers knowledge structure, phase/role gates, dependency formats, bundle packaging, CLI input/output/error behavior, and documentation/CI delivery.

A4. Applicable ADRs state observed choices, alternatives and consequences, distinguishing recovered choices from proposals. They do not invent the original authors' reasoning.

A5. The plan contains executable or explicit-review DoD checks for source fidelity, role/bundle links, existing adoption behavior, documentation build, dependencies, and release consistency. Checks are rerun before version preparation; historical tests are not current evidence.

A6. Update project knowledge, canonical bundle guidance, matching packaged delivery, and applicable project instructions for the approved contract. Preserve established snapshots, utility skills, CLI behavior, and unrelated work.

A7. No new established version is claimed before satisfied checks and merge. The prepared snapshot is complete without replaying earlier changes. Future changes need not copy the complete reusable guidance into their requirements.

## Potential impact

ADD maintainers and consumers use the recovered contracts to scope future changes. Artifact Plane consumes the evidence extension after its required ADD contract establishes. Historical task and snapshot resolution remain compatible. Its existing artifact dependency remains unchanged. Reusable utility skills and website tooling remain implementation inputs within ADD's boundary, not independently versioned project artifacts.

## Requirement self-check

The requirements follow the supplied scope and existing method. Evidence gaps are reserved for validation rather than filled with assumptions. KISS keeps one cohesive artifact and existing tooling. STE principles keep obligations and limitations explicit. No unresolved requirement blocker prevents Specification.
