---
self_check:
  result: passed
  source: docs/artifacts/artifact-driven/requirements/diagram-scopes.md#requirement-self-check
---

# System and artifact diagram scopes

## Need and observed facts

[Issue 60](https://github.com/hieutran21198/software-engineering/issues/60) asks for diagrams at two scopes. Readers must understand the system boundary, the deployment and the behavior that crosses artifacts. Then they must inspect the contracts and the behavior that one artifact owns. The shared outcome and its acceptance criteria are in the [diagram-scopes unit](../../units-of-work/diagram-scopes/README.md).

On 27 October 2026 the owner made these decisions:

- An ordinary artifact that the project chooses owns the system views.
- The bundle shows one invented, self-contained AWS example. This repository gets no system overview in this change.
- The supported icons are Mermaid's built-in icons and a curated set that the Plane bundles.
- The documentation website gets no icon registration, and the record validator gets no diagram check.

Observed facts at revision b67824e (main, ADD 3.3.0, Artifact Plane 1.27.1):

- The [visual representation guide](../../../artifact-driven/06-guidelines/visual-representations.md) has three categories, a selection guide with twelve rows, eight authoring rules, a ten-step agent procedure, a phase table and a table of graph meanings. No rule names a scope. No rule names an owner for a view that crosses artifacts. The guide has no row for a system context, container, deployment, data model, security or delivery view, and no rule for icons.
- The [artifact model](../../../artifact-driven/01-foundation/artifact-model.md) puts every element in one artifact. A unit brief describes an outcome and owns no knowledge. No scope covers the whole system.
- The [system-flow guide](../../../artifact-driven/06-guidelines/system-flows.md) gives each flow, including a flow that crosses artifacts, one owning artifact and one logical identity.
- The repository knowledge has 17 Mermaid blocks: 9 flowcharts, 5 sequence diagrams and 3 state diagrams. No block uses an icon, an architecture diagram, a C4 diagram, an ER diagram or a class diagram.
- Artifact Plane, the documentation website and GitHub render Mermaid fences. The Plane and the website use Mermaid 11.17.2. Neither registers an icon pack. Mermaid draws an unknown-icon mark for an icon name that no registered pack supplies. Mermaid's built-in pack has five icons: cloud, database, disk, internet and server. The Mermaid version and the icon support of GitHub are not verified.
- Iconify `logos` 1.2.18 has the CC0-1.0 license and 65 icon names that start with `aws`. The complete pack is 7.96 MB (2.9 MB compressed with gzip). Its AWS icons are 135 KB (47 KB compressed).
- The record validator does not check Mermaid blocks, source lines or stale lines. These rules run inside the phase and task self-checks.

## Requirements

- DS1 Scopes. The guidance defines two diagram scopes. The system scope shows the whole system across artifacts. The artifact scope shows the contracts and the behavior of one artifact.
- DS2 Selection matrix. One matrix covers both scopes. For each view, it gives the scope, the purpose, the knowledge owner, a suitability score from 1 to 5, a necessity score from 1 to 5 with its condition, the selection condition and the condition to omit the view.
- DS3 System views. The matrix covers the system context, the logical architecture (C4 container level) and the deployment overview of one named environment. It also covers the optional network and trust boundary, critical end-to-end flow, resilience and disaster recovery, and delivery pipeline views.
- DS4 Artifact views. The matrix covers the sequence, state, data model, flowchart or activity, component, deployment detail, and security or data flow views. The scores and the conditions of issue 60 are the starting values.
- DS5 Few views. The guidance states that the scores guide selection and set no diagram count. It prefers the one or two views that solve the main comprehension problem, and it lets a simple artifact use prose or a table.
- DS6 System owner. Each system view has one owning artifact. The project chooses an ordinary artifact for this. Other artifacts link to the system view and do not copy its source.
- DS7 Discovery. A reader can find the system views of a repository without a registry, an index file or a second copy of knowledge.
- DS8 Navigation. A system view lets the reader go to the knowledge of each artifact that owns one of its elements. An artifact view lets the reader go back to the system views and to related artifacts. The navigation does not need click directives.
- DS9 Edge meanings. Runtime interaction, artifact prerequisites, task prerequisites and element references stay in separate views at both scopes. Each view declares the meaning of its arrows.
- DS10 One flow authority. A behavior that crosses artifacts has one authoritative flow record. A system view or an artifact view of that behavior links to the record and does not become a second authority.
- DS11 Icons. The guidance names the supported icon sources, their licenses, their packaging and the supported icon names. It prefers bundled assets and allows no remote resource.
- DS12 Icon meaning. Every node with an icon also has a text label, and every view declares its arrow meaning. An icon never carries the only meaning.
- DS13 Reader fallback. For each recommended notation and icon use, the guidance states what Artifact Plane, GitHub and the documentation website show. When a reader does not support an icon or a diagram type, the reader still shows a readable label, a plain node or the source text.
- DS14 Readable layout. The guidance tells authors to split a large view into an overview and detail views at both scopes, and to keep long labels readable.
- DS15 Sources and maintenance. Each view at both scopes comes from records or from stated contract facts. Its source line names its owning artifact and its source knowledge. The existing validation, stale-marking and maintenance rules apply in the phase and task self-checks. Proposed and established knowledge stay distinct.
- DS16 AWS example. One invented, self-contained AWS example shows a system logical view, a deployment view of one named environment, and a sequence, a state and a data model view of one artifact. Each view has stated facts, an introduction, an accessible title and description, and a source line. The example includes icons, a missing icon, a long label and one view split into an overview and a detail.
- DS17 Roles. The role skills and the guides that apply representations tell each role how to use the scopes and the matrix in its existing self-check.
- DS18 Preservation. Artifacts without diagrams stay valid and usable. The change adds no diagram quota, no approval gate, no phase and no knowledge registry. Rules that the guide already has keep their meaning.

## Scope

Included: the bundle guidance in docs/artifact-driven (foundation, guidelines and role skills) for scopes, the selection matrix, system ownership and discovery, icons, reader fallback and the AWS example; the change-delivery flow supports when the Specification changes them; this artifact's requirement, specification, decision, plan, change and version records; the unit brief.

Excluded: Artifact Plane code and knowledge, which the Plane member owns; icon registration on the documentation website; diagram checks in the record validator; a system overview for this repository; diagrams for existing artifacts; architecture inferred from code; AWS infrastructure; a diagram editor; image files; the story-driven bundle.

## Acceptance criteria

- ADS1: The guide has the selection matrix with all views of DS3 and DS4, and every row has the columns of DS2.
- ADS2: The guide states the system ownership rule and the discovery rule. A reader who follows them finds the system views of the AWS example and goes from them to the owning artifacts.
- ADS3: The guide lists the icon sources with their licenses, their packaging and their names, and the fallback of each reader. No rule needs a remote resource.
- ADS4: The AWS example is present. A recorded check compares the nodes and edges of each view with its fact list and finds no extra, missing or reversed element.
- ADS5: The AWS example renders on the built website and on GitHub. Where a reader does not support an icon or a diagram type, the recorded check shows the fallback that DS13 states.
- ADS6: Every relative link in the changed bundle pages resolves, and no child page links to an ancestor. `go test ./...` and `go vet ./...` pass, the website build passes, and validate-knowledge reports no error.
- ADS7: A review of the changed pages finds no new phase, gate, quota or registry. It finds no changed meaning of an existing rule. The validator reports no new diagnostic for the existing artifacts.

## Affected artifacts and flows

artifact-driven changes, and artifact-plane consumes the new contract through its member change. The change-delivery flow of artifact-driven is a candidate for modification, because the representation checks run in its requirement, specification, plan and implement steps. Specification confirms the support records. No artifact dependency changes.

## Requirement self-check

The need comes from issue 60 and the owner's decisions of 27 October 2026. The facts come from the bundle, the project knowledge, the Plane and website sources and the Iconify package at b67824e. The GitHub support for icons and diagram types is an open question for Specification. DS1 to DS18 each state one need, and ADS1 to ADS7 are observable. KISS: the requirements ask for guidance, one example and no tool, schema or registry. STE: the terms system scope, artifact scope, system view, artifact view and icon have one meaning each. Suggested compatibility: minor, because the guidance adds rules and keeps every existing rule valid. No Requirement blocker prevents Specification.
