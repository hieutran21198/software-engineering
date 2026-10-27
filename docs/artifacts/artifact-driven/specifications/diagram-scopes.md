---
self_check:
  result: passed
  source: docs/artifacts/artifact-driven/specifications/diagram-scopes.md#specification-self-check
claims:
  - id: github-renders-notations
    kind: assumption
    statement: GitHub Markdown renders flowchart icon shapes, sequence, state
      and ER diagrams, and draws Mermaid's unknown-icon mark with the label for
      every icon of a registered pack.
    status: supported
    basis: static
    evidence:
      - docs/artifacts/artifact-driven/specifications/diagram-scopes.md#reader-probe
    check: Push the branch and capture the rendered example page on github.com.
    risk_if_wrong: The GitHub column of the reader support table and ADS5 are wrong.
  - id: website-shows-unknown-icon
    kind: assumption
    statement: The documentation website renders the example with Mermaid 11.17.2
      and draws the unknown-icon mark with the label for every icon of a
      registered pack.
    status: supported
    basis: static
    evidence:
      - docs/artifacts/artifact-driven/specifications/diagram-scopes.md#reader-probe
    check: Build the website and capture the rendered example page.
    risk_if_wrong: The website column of the reader support table is wrong.
---

# Diagram scopes contract

Governs DS1 to DS18 in [requirements/diagram-scopes.md](../requirements/diagram-scopes.md). It extends the [visual knowledge contract](visual-knowledge.md). Decision [018](../decisions/018-system-view-ownership.md) records the ownership and discovery choice, and decision [019](../decisions/019-bundled-diagram-icons.md) records the icon choice. Paths in the Bundle changes table are relative to docs/artifact-driven.

## Terms

| Term | Meaning |
| --- | --- |
| System scope | The whole system: its boundary, its applications and data stores, its deployment and the behavior that crosses artifacts. |
| Artifact scope | The contracts and the behavior that one artifact owns. |
| System view | A diagram at system scope. |
| Artifact view | A diagram at artifact scope. |
| System owner | The ordinary artifact that owns a system view. |
| System view document | A working knowledge document whose front matter declares `system_view: true`. |
| Owner table | The table after a system view that names, for each element of the view, its owning artifact and its governing knowledge. |
| Icon | A small picture on a diagram node, from a named icon pack. |

## Ownership and discovery

1. A system view has one system owner. The project chooses an ordinary artifact for it, for example `platform`. The README of that artifact says in its purpose that it owns the system views. A project can give a view to a second artifact, for example a trust boundary view to a security artifact. Each view still has one owner.
2. A system view document declares `system_view: true` in its YAML front matter. The key is valid in requirement, specification and decision documents of the working knowledge. A flow record does not declare it. Readers ignore the key with any other value.
3. Readers find the system views of a repository from these declarations. No registry, index file or list in another document exists.
4. Other artifacts link to a system view document. They do not copy its diagrams or its facts.
5. Each system view is followed by its owner table. Each row names an element as the view labels it, its owning artifact, and a link to the governing knowledge of the element. An external actor or system has no owning artifact; its row says `external`.
6. A document with artifact views links once, in its introduction, to the system view document that shows the artifact. A reader goes from the system view to the artifact through the owner table, and back through this link.
7. Diagrams contain no links and no click directives. Links stay in the text.

## Edge meanings

Each view declares the meaning of its arrows in its introduction. The views at both scopes use these meanings:

| View | Arrow or grouping | Meaning |
| --- | --- | --- |
| System context, logical architecture, critical end-to-end flow, component, sequence, security or data flow | Arrow | Runtime interaction: the source calls, sends to or uses the target. |
| Deployment overview, deployment detail, resilience | Subgraph | Placement: the element runs or is stored in the subgraph. |
| Deployment overview, deployment detail, resilience | Arrow | Network traffic from the caller to the callee, with an optional protocol or path label. |
| Network and trust boundaries | Subgraph | A trust zone. |
| State | Arrow | A transition with its event. |
| Flowchart or activity | Arrow | The next step, with its condition. |
| Data model | Line | A relationship with its cardinality. |

No view draws artifact prerequisites, task prerequisites or element references. Readers derive these graphs from records ([four graphs](../../../artifact-driven/06-guidelines/visual-representations.md#four-graphs-four-meanings)). The owner table, not an arrow, maps an element to its owning artifact.

## One flow authority

A behavior that crosses artifacts has one flow record in one owning artifact ([system flows](../../../artifact-driven/06-guidelines/system-flows.md)). A critical end-to-end flow view is derived from that record. Its source line names the flow identity, for example `ordering:place-order`. An artifact view of part of the behavior links to the flow record and shows only the detail that its artifact owns. When a reader shows the flow from its record, a document links to that view and does not draw the flow again.

## Selection matrix

Choose the scope first, then the view. The scores guide selection; they set no count. Suitability says how well the view shows its information, from 1 to 5. Necessity says how much a reader needs the view when its condition holds, from 1 to 5. Prefer the one or two views that solve the main comprehension problem. A simple system or a simple artifact uses prose or a table.

### System scope

| View | Purpose | Owner | Suitability | Necessity | Select when | Omit when |
| --- | --- | --- | --- | --- | --- | --- |
| System context | Actors, the system boundary and external systems | System owner | 5 | 4 | People or other systems use the system | One user and no external system; one sentence says it |
| Logical architecture (C4 container level) | Applications, data stores, their responsibilities and communication | System owner | 5 | 4 | The system has more than one application or data store | One application with one store |
| Deployment overview | Software placed on infrastructure for one named environment | System owner | 5 | 4, conditional | Placement, managed services or the environment affect a contract | The platform hides placement, or one process runs on one host |
| Network and trust boundaries | Trust zones, entry points and the traffic that crosses them | System owner or a security artifact | 5 | 3, conditional | Sensitive data or more than one trust zone | One trust zone and no sensitive data |
| Critical end-to-end flow | One behavior across artifacts | Owner of the flow record | 4 | 3 | Readers must follow a behavior across artifacts | A reader shows the flow from its record; link to it |
| Resilience and disaster recovery | Redundancy, backups, failover and recovery objectives | System owner | 4 | 2, conditional | The knowledge states recovery objectives or more than one region | No recovery objective is stated |
| Delivery pipeline | Build, test, release and deployment stages | Artifact that owns delivery | 3 | 2, conditional | More than one stage or environment | The pipeline configuration is short and readable |

### Artifact scope

| View | Purpose | Owner | Suitability | Necessity | Select when | Omit when |
| --- | --- | --- | --- | --- | --- | --- |
| Sequence | Ordered interaction among participants | The artifact | 5 | 4 | Multiple participants, asynchronous work, errors, timeout or retry | Two participants with one request and one response |
| State | A lifecycle with states and transitions | The artifact | 5 | 4, conditional | The artifact owns a nontrivial lifecycle | Two states, or transitions without conditions |
| Data model | Entities, relationships and constraints | The artifact | 5 | 4, conditional | The artifact owns data relationships and constraints | One entity, or a table lists the fields |
| Flowchart or activity | Steps with branches, loops or compensation | The artifact | 4 | 3 | Branching rules, loops or compensation | Five steps or fewer and no branch |
| Component | Internal responsibilities and their interaction | The artifact | 4 | 3 | Internal responsibilities need explanation | One responsibility |
| Deployment detail | Placement, scaling or runtime topology of the artifact | The artifact | 5 | 4, conditional | Placement, scaling or runtime topology affects the contract | The deployment overview shows enough |
| Security or data flow | Sensitive data, permissions and trust boundaries of the artifact | The artifact | 5 | 4, conditional | Sensitive data, permissions or trust boundaries need explanation | No sensitive data and one trust zone |

## Notation

| View | Notation |
| --- | --- |
| System context, logical architecture, network and trust boundaries, critical end-to-end flow, delivery pipeline, flowchart or activity, component, security or data flow | `flowchart`, with `subgraph` for boundaries and optional icon shapes |
| Deployment overview, deployment detail, resilience | `flowchart`, with nested `subgraph` blocks for placement (account, region, network) and icon shapes |
| Sequence | `sequenceDiagram` |
| State | `stateDiagram-v2` |
| Data model | `erDiagram` |

Do not use `architecture-beta` for these views. Its automatic layout overlaps or stretches nodes above about eight services, it draws no edge labels, and it breaks hyphenated labels inside words. Do not use the Mermaid C4 diagram types; their syntax is experimental and their layout is fixed. A `flowchart` shows each C4 level and each deployment.

An icon shape in a `flowchart` has this form: `api@{ icon: "logos:aws-api-gateway", form: "square", label: "Orders API", pos: "b" }`.

## Icons

| Source | Prefix | Names | License | Packaging |
| --- | --- | --- | --- | --- |
| Iconify `logos` 1.2.18 | `logos` | The 65 names that start with `aws` | CC0-1.0. The logos are trademarks of their owners. | A reader bundles the subset. |
| Iconify `lucide` 1.2.147 | `lucide` | `user`, `users`, `globe`, `cloud`, `smartphone`, `monitor`, `server`, `database`, `hard-drive`, `mail`, `lock`, `shield`, `key-round`, `inbox`, `network`, `container`, `box`, `git-branch`, `workflow`, `layers`, `credit-card`, `bell`, `file-text`, `cog` | ISC. A reader that bundles the icons keeps the license notice. | A reader bundles the subset. |

The 65 `logos` names are: `aws`, `aws-amplify`, `aws-api-gateway`, `aws-app-mesh`, `aws-appflow`, `aws-appsync`, `aws-athena`, `aws-aurora`, `aws-backup`, `aws-batch`, `aws-certificate-manager`, `aws-cloudformation`, `aws-cloudfront`, `aws-cloudsearch`, `aws-cloudtrail`, `aws-cloudwatch`, `aws-codebuild`, `aws-codecommit`, `aws-codedeploy`, `aws-codepipeline`, `aws-codestar`, `aws-cognito`, `aws-config`, `aws-documentdb`, `aws-dynamodb`, `aws-ec2`, `aws-ecs`, `aws-eks`, `aws-elastic-beanstalk`, `aws-elastic-cache`, `aws-elasticache`, `aws-elb`, `aws-eventbridge`, `aws-fargate`, `aws-glacier`, `aws-glue`, `aws-iam`, `aws-keyspaces`, `aws-kinesis`, `aws-kms`, `aws-lake-formation`, `aws-lambda`, `aws-lightsail`, `aws-mobilehub`, `aws-mq`, `aws-msk`, `aws-neptune`, `aws-open-search`, `aws-opsworks`, `aws-quicksight`, `aws-rds`, `aws-redshift`, `aws-route53`, `aws-s3`, `aws-secrets-manager`, `aws-ses`, `aws-shield`, `aws-sns`, `aws-sqs`, `aws-step-functions`, `aws-systems-manager`, `aws-timestream`, `aws-vpc`, `aws-waf`, `aws-xray`.

Icon rules:

1. Use only icons of this set. A name outside the set renders as Mermaid's unknown-icon mark.
2. Give every node with an icon a text label. The icon never carries the only meaning.
3. Use a vendor logo only for that product. Use a `lucide` icon for a generic role, such as a person, a browser or a queue that no product names.
4. Do not use the `img` form of a node or any other image reference. A diagram loads no remote resource.
5. Mermaid's built-in architecture icons (`cloud`, `database`, `disk`, `internet`, `server`) resolve only in `architecture-beta`. The `lucide` names `cloud`, `database`, `hard-drive`, `globe` and `server` replace them in a `flowchart`.

## Reader support

This table states what each reader shows. The facts were observed on 27 October 2026; the [reader probe](#reader-probe) records them.

| Content | Artifact Plane | GitHub Markdown | Documentation website |
| --- | --- | --- | --- |
| `flowchart`, `sequenceDiagram`, `stateDiagram-v2`, `erDiagram` | Renders | Renders | Renders |
| Icon of the `logos` or `lucide` subset | Renders the icon | Unknown-icon mark and the label | Unknown-icon mark and the label |
| Icon name outside the set | Unknown-icon mark and the label | Unknown-icon mark and the label | Unknown-icon mark and the label |
| Block that does not parse | Source text and a note | The reader's error message; the file keeps the source | The reader's error message; the file keeps the source |

The Plane column is the target of the Plane member change of the diagram-scopes unit. Until that change establishes, the Plane renders icons of the subset as the unknown-icon mark. The text of the document, the owner table and the source line keep every fact readable in each case.

## Layout

1. A view has about 15 nodes or 25 edges at most. Split a larger view into an overview and detail views.
2. An overview names its detail views in its text. The source line of a detail view names its overview.
3. A `flowchart` with icon shapes and more than about six nodes on its longest path uses `flowchart TB`, so that it fits the text column. Split the view when it is still wider than the column.
4. Keep a label to about 40 characters. Put more detail in the owner table or in the text.

## Sources and maintenance

1. A view at either scope comes from records or from stated contract facts. The existing [authoring rules](../../../artifact-driven/06-guidelines/visual-representations.md#authoring-rules) and [agent procedure](../../../artifact-driven/06-guidelines/visual-representations.md#agent-procedure) apply without change.
2. The source line of a system view names the system owner document and the documents of the artifacts that supply its facts.
3. When a change alters a fact that a system view of another artifact shows, the unit of that change includes a change of the system owner. That change regenerates the view or adds the stale line. The existing stale rule applies.
4. A dotted edge shows a proposed relationship, and a solid edge shows an established relationship, as rule 4 of the authoring rules states.
5. No diagram quota, approval gate, phase or registry exists. A document without diagrams stays valid.

## Bundle changes

| File | Change |
| --- | --- |
| 06-guidelines/visual-representations.md | Add the sections Scopes, Selection Matrix, Icons and Reader Fallback with the content of this contract. Amend rule 1 (notation: icon shapes; no `architecture-beta` or C4 types), rule 5 (size, overview and detail, icon rows, labels), procedure step 4 (scope first) and the reader support section. Link the example page. |
| 06-guidelines/diagram-scopes-example.md | New page with the AWS example. |
| 06-guidelines/README.md | Add the example page to the index. |
| 01-foundation/artifact-model.md | In Records, add one sentence for `system_view` with a link to the Scopes section. |
| 03-execution/skills/add-product-owner/reference.md | Representations: Requirement names the system and artifact views that a need requires and draws none. |
| 03-execution/skills/add-technical-lead/reference.md | Representations: choose the scope and the view from the matrix, keep system views with the system owner, add owner tables and links. |
| 03-execution/skills/add-implementer/reference.md | Representations: recheck the system views that name a changed element and report a stale view of another artifact to the coordinator. |
| 03-execution/skills/add-coordinator/reference.md | Representations: when a unit changes a fact that a system view shows, include a change of the system owner. |

Child pages do not link to ancestor pages. The 03-execution skill files keep their existing link targets.

## AWS example

The example page describes an invented online bookshop on AWS. It is self-contained: it names no file of this repository and no real account. Its facts are stated on the page; every view comes from them.

| Invented artifact | Owns |
| --- | --- |
| `platform` | The system views in `specifications/system-overview.md`, which declares `system_view: true` |
| `storefront` | The storefront web application |
| `ordering` | The Orders API, the order handler, the orders table, the order lifecycle and the flow `ordering:place-order` |
| `payments` | The payment queue, the payment worker and the integration with the payment provider |

The page contains these views, each with an introduction, `accTitle`, `accDescr`, a source line and a fact list or an owner table:

| View | Scope | Notation | Content |
| --- | --- | --- | --- |
| System context | System, overview | `flowchart` with icons | Customer, the bookshop, the payment provider and the email service |
| Logical architecture | System, detail of the bookshop | `flowchart TB` with icons | Storefront web app, Orders API, order handler, orders table, payment queue, payment worker; their runtime interaction |
| Deployment overview, environment `production` | System | `flowchart TB` with nested subgraphs and icons | AWS account, region `eu-west-1`, CloudFront, S3, API Gateway, two Lambda functions, DynamoDB, SQS, SES, the internet and the payment provider |
| Place an order | Artifact `ordering` | `sequenceDiagram` | Idempotent order creation, the asynchronous payment request and the retry of a failed send, linked to the flow record |
| Order lifecycle | Artifact `ordering` | `stateDiagram-v2` | Pending, paid, payment failed, cancelled and shipped, with events |
| Order data model | Artifact `ordering` | `erDiagram` | Order and order line with keys and cardinality |
| Fallback sample | Illustrative | `flowchart` | One node with an icon outside the set and one node with a long label |

The page states the reader fallback for its icons: on GitHub and the website, the subset icons show the unknown-icon mark beside their labels. The page explains that the Plane renders them.

## Flow supports

Add the support `diagram-scope-contract` (kind element, artifact-driven, element specifications/diagram-scopes.md, basis documented) to the specification and implement steps of change-delivery: "Select system and artifact views, keep system views with their owner, and link instead of copying." Steps and transitions do not change.

## Validation

Implementation records these checks in task evidence:

- The node and edge counts of each example view against its fact list or owner table.
- Every relative link of the changed bundle pages resolves; no child page links to an ancestor.
- `go test ./...`, `go vet ./...` and the website build pass; the built website page renders every example diagram, with screenshots.
- The pushed branch renders the example page on GitHub, with screenshots; the claim `github-renders-notations` is updated with the result.
- validate-knowledge reports no error, and no new diagnostic for an existing artifact.
- A review of the changed pages finds no new phase, gate, quota or registry.

## Reader probe

On 27 October 2026 an agent rendered candidate notations with Mermaid 11.17.2 in Chromium. The probe used the Plane configuration (`securityLevel: 'strict'`, `htmlLabels: false`), the Plane SVG sanitizer and the Plane Content-Security-Policy. The notations were a `flowchart` with icon shapes, `architecture-beta` with groups, `erDiagram`, `C4Container`, `classDiagram`, `sequenceDiagram` and `stateDiagram-v2`.

- With the `logos` AWS subset and the `lucide` subset registered, every notation rendered. No SVG contained `foreignObject` or `image`, the sanitizer removed no text, and no request went to another origin. An icon name outside the set rendered as a blue square with a question mark, with its label.
- With no icon pack registered, the icons of the subsets rendered as the same mark with their labels.
- A `flowchart` with seven icon nodes in one row was 1,535 pixels wide. The same deployment of ten services was 1,521 pixels wide as `flowchart LR` and 718 pixels wide as `flowchart TB`. This is the reason for layout rule 3.
- As `architecture-beta`, the deployment of ten services overlapped one node with another in the first layout, and put a 1,300-pixel edge before the account group in the second. Hyphenated labels broke inside words. This is the reason to prefer a `flowchart`.
- The `C4Container` diagram rendered at 932 by 1,033 pixels, with small technology labels and fixed colors.
- GitHub's Mermaid viewer bundle, fetched from viewscreen.githubusercontent.com on the same day, reports Mermaid 12.2.0. It contains no call of `registerIconPacks`. This is static evidence; the claim `github-renders-notations` waits for a rendered page.
- The website uses @docusaurus/theme-mermaid 3.10.2 with Mermaid 11.17.2 and registers no icon pack, so it draws as the second case above.

## Specification self-check

DS1 maps to Terms; DS2 to DS5 to Selection matrix; DS6 and DS7 to Ownership and discovery and decision 018; DS8 to Ownership and discovery, items 5 to 7; DS9 to Edge meanings; DS10 to One flow authority; DS11 and DS12 to Icons and decision 019; DS13 to Reader support; DS14 to Layout; DS15 to Sources and maintenance; DS16 to AWS example; DS17 to Bundle changes; DS18 to Sources and maintenance, item 5. Impact: the bundle pages and four skill references change; the change-delivery flow gains one support; the Plane member consumes `system_view`, the icon set and the reader support table; story-driven depends on artifact-driven and needs no change, because every rule is additive. Representations: this document adds tables only; the example page holds the diagrams, and Implementation validates them. KISS: one optional front matter key, no tool, no registry, no validator rule. STE: each table row states one rule. Two claims stay open for a rendered check; their failure changes only the reader support table. No Specification blocker prevents Plan.
