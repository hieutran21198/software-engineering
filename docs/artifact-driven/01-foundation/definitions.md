# Definitions

| Term | Meaning in ADD |
| --- | --- |
| Artifact-Driven Development (ADD) | An artifact-centered approach to software engineering where explicit knowledge, dependencies, and validation govern implementation and coordination. |
| Artifact | A structured, versioned unit of knowledge managed through explicit changes. It represents a cohesive unit of knowledge, responsibility, and change. |
| Working knowledge | The requirements, specifications, and decisions directly under an artifact directory. On `main` or `master` it is established knowledge; on a change branch it contains the proposal. |
| Identity record | The YAML front matter of an artifact root README: `current_version`, `depends_on`, and optional `publication_reviews`. |
| Actor | A human developer or AI agent that investigates, defines, implements, or validates work. |
| Established version | The complete knowledge state after a change satisfies its DoD and all required knowledge and implementation changes land on `main` or `master`. Git holds its snapshot. Dependencies use the current established version. |
| Change | An artifact-local revision of knowledge on a dedicated branch. It edits working knowledge in place, copies nothing, and creates its own delivery plan. Its change record states the reason and scope; its tasks hold the plan and evidence. An artifact has at most one active change. |
| Version record | `versions/<version>/README.md`. It names its originating change in `source_change` and contains no knowledge or tasks. |
| Unit of work | A documented deliverable outcome that groups changes to one or more artifacts. Each participating change belongs to exactly one unit of work; membership creates no dependency. |
| Element | An addressable piece of artifact knowledge, such as a requirement, specification, ADR, or task document. Its logical identity is `<artifact>:<path>`, relative to the artifact directory. |
| System flow | A named behavior journey owned by one artifact and defined as a specification element. It is separate from a unit of work or delivery schedule. |
| Flow step | An identified part of a system flow, connected to other steps through behavior transitions. |
| Flow support | A relationship from a step to a knowledge element, named subjourney, implementation, or test, with its evidence basis. |
| Flow graph | A derived view of flows, steps, supporting sources, and typed relationships. It permits branches, joins, and loops; it is not an execution DAG. |
| Version provenance | The originating artifact-local change named by `source_change` in a version record. Its retained delivery record is `changes/<source_change>/tasks/`. |
| Requirement | A business or technical need, rule, or constraint that motivates and governs the work. |
| Specification | Detailed behavior, domain knowledge, and technical contracts that define how requirements will be satisfied. |
| Architectural Decision Record (ADR) | A record of a necessary architectural decision that required evaluation of multiple options. ADRs belong to Specification. |
| Implementation plan | Change-owned tasks that describe implementation work and the checks needed to establish its completion. The delivered plan remains with that change. |
| Definition of Done (DoD) | A checklist inside each implementation task. All applicable criteria must be satisfied before the change becomes an established version. |
| Validation evidence | Results recorded with implementation tasks that show how their DoD criteria were checked. |
| Domain language | The defined business terms used consistently within a domain context. |
| Domain model | The concepts, relationships, and rules used to describe a domain. Requirements, specifications, and decisions record the model; implementation expresses it in software. |
| Bounded context | A boundary within which a domain model and its language have consistent meanings. Strategic Domain-Driven Design helps identify these boundaries. |
| Contract | An explicit specification of an interface, including the behavior and constraints that its participants must satisfy. |
| Artifact dependency | A relationship in which an artifact requires an upstream artifact's established knowledge or completed change to proceed. Detailed contracts belong in specifications. |
| Dependency DAG | The artifact-level directed acyclic graph, derived from `depends_on` in identity records. Its nodes are artifacts and its edges identify dependencies and execution order. Changes, versions, and tasks are not nodes in this graph. |
| Implementation task DAG | A directed acyclic graph within one change. The plan lists current tasks; each task declares its ID and prerequisite task IDs. Edges point from prerequisite to dependent task. |
| Impact analysis | Assessment of which knowledge, artifacts, contracts, and tasks a proposed change affects. It occurs throughout Requirement and Specification, including applicable ADRs. |

Artifacts can represent business capabilities, such as tenant management, or technical capabilities, such as deployment infrastructure, observability, and CI/CD. Both follow the same workflow.
