# Source evidence inventory

Paths are repository-relative. These identify source files, not pinned old artifact versions. Source statements were inspected during preparation; current validation results belong in tasks after plan approval.

| Responsibility | Primary evidence | Baseline and limits |
| --- | --- | --- |
| Artifact identity and version model | docs/artifact-driven/01-foundation/artifact-model.md; principles.md; definitions.md in that directory | Documented model and conventions, not an executable schema validator. |
| Five-phase flow and completion | docs/artifact-driven/02-methodology/workflow.md; validation.md | Human/agent procedure with plan and merge gates. No automated approval or phase engine. |
| Artifact/element dependencies | docs/artifact-driven/02-methodology/dependencies.md | Documented root/DAG/proposal formats and upstream establishment gate. No coordinator runtime. |
| Role execution | docs/artifact-driven/03-execution/README.md and skills/*/SKILL.md | Four supplied role skills. Local .codex/agents/*.toml and .agents/skills registrations expose roles; successful loading still requires harness evidence. |
| Reusable patterns | docs/artifact-driven/04-patterns/*.md | Nine guidance documents: strategic/tactical DDD, contracts, behavior, events, testing, ports/adapters, policy, CI. Guidance does not implement those systems. |
| Required skills | docs/artifact-driven/required-skills/*/SKILL.md; src/utils/agents/skills/bundle.go and skill sources | KISS and STE-based writing supplied. No certified ASD-STE100 checker. |
| Packaged ADD | src/archs/artifact-driven/bundle.go; bundle_test.go; src/archs/catalog.go | Go embeds six sections and mounts utility skills; the catalog contains artifact-driven and story-driven. Local docs bundle is the workflow reference; packaged src and utility files are implementation inputs. Parity must be checked. |
| Adoption command | cmd/se-adopt/main.go; main_test.go; internal/adopt/adopt.go; adopt_test.go; docs/artifact-driven/05-adoption/README.md | Implemented copy, preview, selection, containment, conflict preflight. No forced overwrite, automatic upgrade, network adoption, project artifact generation, or harness registration. |
| Consumer setup guidance | docs/artifact-driven/06-guidelines/*.md; AGENTS.md; .codex/agents/*.toml | Documented agent-led download, checksum verification, native setup, and phase flow. No download/setup subcommand. |
| Documentation delivery | README.md; website/scripts/prepare-docs.mjs; docusaurus.config.js; package.json; sidebars.js | Implemented generation from repository README and src Markdown. docs/artifacts is not currently published by that generator. No live deployment claim from inspecting configuration. |
| Build and release delivery | .github/workflows/ci.yml; go.mod | Configured Go checks, six binary targets/checksums, docs build, Pages deployment, tag releases; execution success and published assets need evidence. This delivery does not trigger deployment or a tag release. |
| Existing separate capability | docs/artifacts/artifact-plane/README.md and current snapshot; apps/artifact-plane | Existing explorer artifact. Its six displayed evidence labels include Validation separately; they do not redefine ADD's five phases. The separately owned Plane member consumes the new evidence contract after upstream establishment. |

## Incomplete or unavailable capability

No ADD state database, workflow engine, artifact-generation CLI, automated gate enforcement, semantic artifact validator, forced upgrade, or universal harness installer was found in the inspected sources. The catalog also supplies the separately owned Story-Driven bundle. No new architecture is introduced here. No evidence establishes those capabilities, and this change does not promise them.

## Evidence discipline

Recovered ADRs report present choices and observable consequences. Alternatives are a current reconstruction, not proof of historical evaluation. Tests named in the plan identify existing coverage; only actual task results can satisfy DoD. Repository paths avoid copied commit hashes or approval registries. Existing release tags do not establish this artifact version.
