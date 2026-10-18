---
self_check:
  result: passed
  source: docs/artifacts/artifact-driven/specifications/visual-knowledge.md#specification-self-check
---

# Visual knowledge contract

Governs V1–V10 and AV1–AV6 in [visual knowledge requirements](../requirements/visual-knowledge.md). It extends the [knowledge and execution contract](knowledge.md) with representation rules that apply inside the existing phases. It changes no record, identity, dependency, task or flow rule. [Decision 013](../decisions/013-text-defined-representations.md) records the representation choice.

Terms used below: a *representation* is any non-prose form of knowledge (table, listing, diagram, interactive view). A *semantic diagram* shows verifiable relationships of the source knowledge. An *explanatory illustration* helps a reader form a concept without encoding authoritative facts. An *interactive knowledge view* is a view that a reader derives from structured records. A *text alternative* is body text that carries the same facts as a diagram. A *source line* names the elements a diagram is derived from.

## Research basis

The table separates established findings, design hypotheses and engineering recommendations. The sources are listed at the end of this section; the bundle foundation page carries the same list for consumers.

| # | Finding | Status | Sources | Limit for ADD |
| --- | --- | --- | --- | --- |
| 1 | Two representations can hold the same information and still differ in the work a reader needs. A diagram indexes facts by location, so related facts sit together and search is shorter; the benefit depends on the inferences the reader can make from the picture. | Established theory with worked analyses | Larkin and Simon 1987 | A diagram can also make some inferences harder. The benefit needs the perceptual inference that the task calls for. |
| 2 | Performance improves when the representation fits the task: graphs for spatial tasks (patterns, trends, relationships), tables for symbolic tasks (exact values, comparisons). | Established, information systems experiments | Vessey 1991 | Decision complexity and time pressure moderate the effect. |
| 3 | External representations offload computation, re-represent a problem and constrain interpretation. Cognition is distributed across people and artifacts. | Established theory | Scaife and Rogers 1996; Hollan, Hutchins and Kirsh 2000; Kirsh 2010 | Frameworks, not effect sizes. |
| 4 | Verbal and non-verbal codes are separate systems with referential links; concrete, imageable material is remembered better. | Established theory | Clark and Paivio 1991 | Explains why text and a picture can help together; it does not say which picture. |
| 5 | Multimedia principles: words with pictures beat words alone (multimedia); remove extraneous material (coherence); cue the organization (signaling); do not present the same words in two channels (redundancy); put words next to the picture parts they describe (spatial contiguity); split a lesson into reader-paced parts (segmenting); name and describe the key concepts before the lesson that uses them (pre-training). | Established in controlled instruction experiments | Mayer 2020; Mayer and Moreno 2003 | Mostly novices and short lessons, measured by retention and transfer tests. Technical readers who look up facts can differ. |
| 6 | Working memory is limited; element interactivity sets the intrinsic load; separated sources that the reader must integrate cost extra (split attention); worked examples beat problem solving for novices; guidance that helps novices can hinder experts (expertise reversal). | Established | Sweller 1988; Chandler and Sweller 1992; Sweller and Cooper 1985; Atkinson et al. 2000; Renkl 2014; Kalyuga et al. 2003; Sweller, van Merriënboer and Paas 2019 | Effects are measured with learners. Experts prefer compact representations. Expertise differs per artifact and reader. |
| 7 | A second representation can complement, constrain or help construct understanding; each added representation costs translation effort; benefits are not automatic. | Established framework; mixed outcomes | Ainsworth 2006 | A redundant representation costs without benefit. |
| 8 | Support that fades as skill grows (scaffolding); show the core first and reveal detail on request (progressive disclosure); overview first, zoom and filter, details on demand. | Recommendation with partial evidence | Wood, Bruner and Ross 1976; Nielsen 2006; Carroll and Carrithers 1984; Shneiderman 1996 | The split between overview and detail must match reader tasks. Hidden detail can hide dependencies. |
| 9 | Notation design principles: semiotic clarity, perceptual discriminability, semantic transparency, complexity management, cognitive integration, visual expressiveness, dual coding, graphic economy, cognitive fit. Cognitive dimensions: hidden dependencies, viscosity, visibility, secondary notation. | Design theories, partly validated, criticized as vague | Moody 2009; Green and Petre 1996 | Heuristics, not measurements. |
| 10 | Readers group what is near, similar, connected or enclosed; arrows make readers read function and causality into a picture; readers decode position most accurately, then length, angle, area and color. | Established | Wagemans et al. 2012; Heiser and Tversky 2006; Cleveland and McGill 1984; Hegarty 2011; Tversky 2011 | Layout can imply relations that the source does not state. |
| 11 | Mental models are incomplete, unstable and built by the reader; software comprehension builds such models from code, documents and tools. | Theory | Norman 1983; Johnson-Laird 1983; Storey 2006 | A document cannot transfer a model. It can supply the structure that a reader builds from. |
| 12 | Reading diagrams is a skill; layout carries meaning for experts (secondary notation); developers' sketches are informal, transient and rarely archived; design-phase UML models improved code comprehension across 12 experiments while analysis-phase models did not; reviewers who switch between complementary diagrams find more defects; documentation problems are dominated by content that is wrong, outdated or incomplete. | Empirical, context-bound | Petre 1995; Cherubini et al. 2007; Baltes and Diehl 2014; Scanniello et al. 2018; Hungerford, Hevner and Collins 2004; Aghajani et al. 2019, 2020 | Specific populations, notations and tasks. |
| 13 | Language models produce diagrams with high syntax accuracy and low semantic accuracy: relationships, message order and completeness are often wrong, elements are hallucinated, and results change with the prompt wording. Evaluation practice is immature. | Emerging empirical | Wang et al. 2025; Ferrari, Abualhaija and Arora 2024; Rahmanian, Sami and Yu 2026; Shbita, Ahmed and DeLuca 2025 | Models and benchmarks change quickly. |
| 14 | Non-text content needs a text alternative; complex images need a long description near the content; Mermaid renders `accTitle` and `accDescr` as SVG title and description with ARIA attributes. | Standard and tool documentation | WCAG 2.2 SC 1.1.1; W3C WAI images tutorial; Mermaid documentation | Artifact Plane does not render Mermaid, so the body text alternative is the only alternative there. |

Hypothesis assessment. The hypothesis that complex artifacts become easier to understand when the system selects effective representations holds with conditions: the representation must fit the task and the structure (2, 1), sit next to the text it explains (5, 6), show only stated relationships (10), and be chosen by the reader's expertise (6, 8). It fails when a picture repeats the text (5, 7), when a picture adds elements the source does not state (10, 13), and when a decorated page replaces exact detail (5). Therefore this contract requires selection by structure, not a diagram per document.

Research limits. Most experiments measure learning by students, not fact retrieval by engineers; the software studies cover UML and whiteboard sketches, not ADD records; the language-model studies predate the current models. The principles below are therefore stated as rules where the evidence is consistent and as recommendations where it is partial.

### Sources

Verified through Crossref, the publisher page or the official site on 18 October 2026.

- Aghajani E., Nagy C., Vega-Márquez O., Linares-Vásquez M., Moreno L., Bavota G., Lanza M. (2019). Software documentation issues unveiled. ICSE 2019, 1199–1210. doi:10.1109/ICSE.2019.00122
- Aghajani E., Nagy C., Linares-Vásquez M., Moreno L., Bavota G., Lanza M., Shepherd D. (2020). Software documentation: the practitioners' perspective. ICSE 2020, 590–601. doi:10.1145/3377811.3380405
- Ainsworth S. (2006). DeFT: a conceptual framework for considering learning with multiple representations. Learning and Instruction 16(3), 183–198. doi:10.1016/j.learninstruc.2006.03.001
- Atkinson R. K., Derry S. J., Renkl A., Wortham D. (2000). Learning from examples: instructional principles from the worked examples research. Review of Educational Research 70(2), 181–214. doi:10.3102/00346543070002181
- Baltes S., Diehl S. (2014). Sketches and diagrams in practice. FSE 2014, 530–541. doi:10.1145/2635868.2635891
- Carroll J. M., Carrithers C. (1984). Training wheels in a user interface. Communications of the ACM 27(8), 800–806. doi:10.1145/358198.358218
- Chandler P., Sweller J. (1992). The split-attention effect as a factor in the design of instruction. British Journal of Educational Psychology 62(2), 233–246. doi:10.1111/j.2044-8279.1992.tb01017.x
- Cherubini M., Venolia G., DeLine R., Ko A. J. (2007). Let's go to the whiteboard: how and why software developers use drawings. CHI 2007, 557–566. doi:10.1145/1240624.1240714
- Clark J. M., Paivio A. (1991). Dual coding theory and education. Educational Psychology Review 3(3), 149–210. doi:10.1007/BF01320076
- Cleveland W. S., McGill R. (1984). Graphical perception: theory, experimentation, and application to the development of graphical methods. Journal of the American Statistical Association 79(387), 531–554. doi:10.1080/01621459.1984.10478080
- Ferrari A., Abualhaija S., Arora C. (2024). Model generation with LLMs: from requirements to UML sequence diagrams. arXiv:2404.06371. https://arxiv.org/abs/2404.06371
- Green T. R. G., Petre M. (1996). Usability analysis of visual programming environments: a 'cognitive dimensions' framework. Journal of Visual Languages and Computing 7(2), 131–174. doi:10.1006/jvlc.1996.0009
- Hegarty M. (2011). The cognitive science of visual-spatial displays: implications for design. Topics in Cognitive Science 3(3), 446–474. doi:10.1111/j.1756-8765.2011.01150.x
- Heiser J., Tversky B. (2006). Arrows in comprehending and producing mechanical diagrams. Cognitive Science 30(3), 581–592. doi:10.1207/s15516709cog0000_70
- Hollan J., Hutchins E., Kirsh D. (2000). Distributed cognition: toward a new foundation for human-computer interaction research. ACM Transactions on Computer-Human Interaction 7(2), 174–196. doi:10.1145/353485.353487
- Hungerford B. C., Hevner A. R., Collins R. W. (2004). Reviewing software diagrams: a cognitive study. IEEE Transactions on Software Engineering 30(2), 82–96. doi:10.1109/TSE.2004.1265814
- Johnson-Laird P. N. (1983). Mental Models: Towards a Cognitive Science of Language, Inference, and Consciousness. Harvard University Press. Library record: https://ci.nii.ac.jp/ncid/BA00391149
- Kalyuga S., Ayres P., Chandler P., Sweller J. (2003). The expertise reversal effect. Educational Psychologist 38(1), 23–31. doi:10.1207/S15326985EP3801_4
- Kirsh D. (2010). Thinking with external representations. AI and Society 25(4), 441–454. doi:10.1007/s00146-010-0272-8
- Larkin J. H., Simon H. A. (1987). Why a diagram is (sometimes) worth ten thousand words. Cognitive Science 11(1), 65–100. doi:10.1111/j.1551-6708.1987.tb00863.x
- Mayer R. E. (2020). Multimedia Learning, third edition. Cambridge University Press. doi:10.1017/9781316941355
- Mayer R. E., Moreno R. (2003). Nine ways to reduce cognitive load in multimedia learning. Educational Psychologist 38(1), 43–52. doi:10.1207/S15326985EP3801_6
- Moody D. L. (2009). The "physics" of notations: toward a scientific basis for constructing visual notations in software engineering. IEEE Transactions on Software Engineering 35(6), 756–779. doi:10.1109/TSE.2009.67
- Nielsen J. (2006). Progressive disclosure. Nielsen Norman Group. https://www.nngroup.com/articles/progressive-disclosure/
- Norman D. A. (1983). Some observations on mental models. In Gentner D., Stevens A. L. (eds.), Mental Models. Erlbaum; reissued by Psychology Press 2014. doi:10.4324/9781315802725
- Petre M. (1995). Why looking isn't always seeing: readership skills and graphical programming. Communications of the ACM 38(6), 33–44. doi:10.1145/203241.203251
- Rahmanian M., Sami A., Yu Y. (2026). Large language models for software engineering diagrams: a systematic review of UML and ER modelling. arXiv:2607.26100. https://arxiv.org/abs/2607.26100
- Renkl A. (2014). Toward an instructionally oriented theory of example-based learning. Cognitive Science 38(1), 1–37. doi:10.1111/cogs.12086
- Scaife M., Rogers Y. (1996). External cognition: how do graphical representations work? International Journal of Human-Computer Studies 45(2), 185–213. doi:10.1006/ijhc.1996.0048
- Scanniello G., Gravino C., Genero M., Cruz-Lemus J. A., Tortora G., Risi M., Dodero G. (2018). Do software models based on the UML aid in source-code comprehensibility? Aggregating evidence from 12 controlled experiments. Empirical Software Engineering 23(5), 2695–2733. doi:10.1007/s10664-017-9591-4
- Shbita B., Ahmed F., DeLuca C. (2025). MermaidSeqBench: an evaluation benchmark for NL-to-Mermaid sequence diagram generation. arXiv:2511.14967. https://arxiv.org/abs/2511.14967
- Shneiderman B. (1996). The eyes have it: a task by data type taxonomy for information visualizations. IEEE Symposium on Visual Languages, 336–343. doi:10.1109/VL.1996.545307
- Storey M.-A. (2006). Theories, tools and research methods in program comprehension: past, present and future. Software Quality Journal 14(3), 187–208. doi:10.1007/s11219-006-9216-4
- Sweller J. (1988). Cognitive load during problem solving: effects on learning. Cognitive Science 12(2), 257–285. doi:10.1207/s15516709cog1202_4
- Sweller J., Cooper G. A. (1985). The use of worked examples as a substitute for problem solving in learning algebra. Cognition and Instruction 2(1), 59–89. doi:10.1207/s1532690xci0201_3
- Sweller J., van Merriënboer J. J. G., Paas F. (2019). Cognitive architecture and instructional design: 20 years later. Educational Psychology Review 31(2), 261–292. doi:10.1007/s10648-019-09465-5
- Tversky B. (2011). Visualizing thought. Topics in Cognitive Science 3(3), 499–535. doi:10.1111/j.1756-8765.2010.01113.x
- Vessey I. (1991). Cognitive fit: a theory-based analysis of the graphs versus tables literature. Decision Sciences 22(2), 219–240. doi:10.1111/j.1540-5915.1991.tb00344.x
- Wagemans J., Elder J. H., Kubovy M., Palmer S. E., Peterson M. A., Singh M., von der Heydt R. (2012). A century of Gestalt psychology in visual perception: I. Perceptual grouping and figure–ground organization. Psychological Bulletin 138(6), 1172–1217. doi:10.1037/a0029333
- Wang Y., Ge N., Liu J., Cao Z., Chen Z., Hu C. (2025). Generating SysML behavior models via large language models: an empirical study. Internetware 2025. doi:10.1145/3755881.3755926
- Wood D., Bruner J. S., Ross G. (1976). The role of tutoring in problem solving. Journal of Child Psychology and Psychiatry 17(2), 89–100. doi:10.1111/j.1469-7610.1976.tb00381.x
- W3C. Web Content Accessibility Guidelines 2.2, Success Criterion 1.1.1 Non-text Content. https://www.w3.org/TR/WCAG22/#non-text-content
- W3C WAI. Images Tutorial: Complex Images. https://www.w3.org/WAI/tutorials/images/complex/
- Mermaid. Accessibility Options. https://mermaid.js.org/config/accessibility.html
- GitHub Docs. Creating diagrams. https://docs.github.com/en/get-started/writing-on-github/working-with-advanced-formatting/creating-diagrams
- Docusaurus. Diagrams. https://docusaurus.io/docs/markdown-features/diagrams

Not cited because they could not be verified: effect sizes per multimedia principle, and element-level accuracy percentages reported in secondary summaries of the language-model studies.

## Principles

| ID | Principle | Rule | Basis |
| --- | --- | --- | --- |
| P1 | Knowledge first | The authoritative knowledge is the YAML front matter and the Markdown body of the owning element. A representation presents that knowledge and adds no fact. Structural facts stay in front matter; a diagram of them is derived. | KISS one-source rule; the [in-place layout](knowledge-layout.md); findings 3, 12 |
| P2 | Cognitive efficiency | Choose the form that lets the reader find and relate the needed items with the least search, scrolling and reconstruction. Group related items, keep the explanation next to the picture, cue the structure, split a large picture into parts, and introduce named concepts before the diagram that uses them. Keep necessary technical detail in text. | Findings 1, 5, 6, 8 |
| P3 | Visual-semantic alignment | Select the form from the structure of the information. Each visual element has one meaning. Arrows have one declared meaning per diagram. Draw no relationship that the source does not state. Do not mix graphs with different edge meanings in one picture. | Findings 2, 9, 10 |
| P4 | Traceability | A semantic diagram names its sources by logical identity and states its derivation. Node labels use the identifiers or titles of the elements they stand for, so a reader can navigate to them. | Findings 3, 12; the [identity rules](knowledge-layout.md) |
| P5 | Maintainability | Prefer views that readers derive from records. When a diagram is embedded, state how to regenerate it, check it in the phase self-check that owns its source, and mark it stale when the source changed and the check has not run. | Findings 12, 13; KISS derived views |
| P6 | Accessibility and portability | Use a text-defined notation in a fenced Markdown block, with an accessible title and description, and a text alternative in the body. No image files, no HTML, no external resources, no executable content. A reader that cannot render the notation shows the source text and the text alternative. | Finding 14; the Plane sanitizer |

Design hypotheses, stated as recommendations: a diagram of more than about 15 nodes or 25 edges is split into an overview and detail diagrams; one representation per relationship; experts are served by the compact table or the derived view, novices by the worked example.

## Representation categories

| Category | Represents | Generation | Validation | Examples |
| --- | --- | --- | --- | --- |
| Semantic diagram | Precise relationships stated in the source: prerequisites, transitions, interactions, containment, consumption, lifecycle. | From a fact list taken from front matter or body sentences; every node and edge maps to one fact. | Count check of nodes and edges against the fact list; no extra or missing element; direction and labels equal to the source; renders without error; text alternative agrees. Recorded in the owning self-check or task evidence. | Task graph, flow diagram, write-path sequence, lifecycle state diagram |
| Explanatory illustration | A concept, analogy or comparison that helps a reader form a mental model. | From the concept, labelled "Illustrative". | Review that it contradicts no source fact and that its text says what it does not encode. | Before-and-after layout comparison, a labelled example scenario |
| Interactive knowledge view | Navigation, exploration and editing over structured records. | Derived by the reader from records; never authored. | The reader's own validation and diagnostics. | The Plane's dependency, task, unit and flow graphs |

Tables and listings are representations of the first or second category according to their content; the same rules apply.

## Selection guide

The guide maps the information in ADD knowledge to its first-choice representation. "Derived from" names the record that a reader or an agent regenerates the representation from; "no" means the facts exist only in prose.

| Information | First choice | Alternative | Derived from | Limits and cost |
| --- | --- | --- | --- | --- |
| Exact values, attributes of options, trade-offs | Table | List | No | Split a table with more than about seven columns. Tables fit symbolic tasks (finding 2). |
| Ordered interaction among parties: requests, operations, events | Sequence diagram | Numbered steps | Flow step interactions and participants, or body sentences | Segment above about ten messages. Name the parties as the source names them. |
| Lifecycle with states and transitions | State diagram | State-by-event table | Lifecycle sentences and derived-fact tables | Label guards on transitions. States are facts in the source, not phases. |
| Prerequisite order: artifact dependencies, task prerequisites | Directed graph, arrow from prerequisite to dependent | Edge list | Identity records; tasks list and task depends_on | Draw declared edges only, no transitive edges. Dashed means proposed. The reader's derived view is primary. |
| Behavior journey with branches and loops | Flowchart from transitions, conditions on edges | Step list with "to step n when" | Flow record | Loops are valid. It is not a DAG and not an execution order. |
| Containment and hierarchy: layout, components, bounded contexts | Tree listing or nested groups | Indented list | Directory listing or body text | Limit depth to what the reader needs. |
| Change impact and consumers | Graph of element references grouped by artifact, consumer to supplier | Table consumer, supplier, reason | References front matter | Not the dependency graph. Unresolved targets stay visible as unresolved. |
| Evidence traceability: criterion, check, result, source | Table | Graph for navigation | Unit evidence; task evidence_records | Results are recorded claims, not verification. |
| Quantities and measurements | Table | Chart only when a trend matters | Measurement tables | Position encodes best (finding 10). Rarely needed. |
| Responsibility by role or phase | Table | Swimlane diagram | Workflow tables | Phases are not runtime states. |
| Before and after a change | Two-column comparison or paired listings | Prose with the delta | Established and proposed knowledge | Align the compared items. |
| A concept or mental model | Worked example with concrete values | Explanatory illustration | Requirements examples | Label illustrations. Fade examples for expert readers. |

No representation is the right choice when: the relationship covers at most four items with one relation; a table already holds the facts; a linear sequence has at most five steps and no branch; a reader-derived view already shows the structure; or the picture would only decorate.

## Authoring rules

1. Notation. Use Mermaid in a fenced block labelled `mermaid`. Prefer `flowchart`, `sequenceDiagram`, `stateDiagram-v2`, `classDiagram` and `erDiagram`. Do not use click directives, HTML labels, init directives or external resources. Do not put a semicolon in an unquoted label, because Mermaid reads it as the end of a statement. Another text-defined notation is acceptable when the reader set renders it; state the notation in the source line.
2. Order. Place, in this order: one introduction paragraph that says what the picture shows and how to read its arrows; the fenced block with `accTitle` and `accDescr`; a source line. The body text carries the facts; when the surrounding body does not already state them, a list follows the source line.
3. Source line. `Source: <logical identities>; derived <rule>; <revision or "current snapshot">`. Identities use the forms of the [identity table](knowledge-layout.md#structural-facts-and-identity). An explanatory illustration writes `Illustrative:` instead of `Source:`.
4. Labels. Node identifiers use letters, digits and underscores; labels use the element's identifier or title as the source writes it. Every diagram states its arrow meaning once. Solid edges mean established relationships; dotted edges (`-.->`, the dashed style of dependency views) mean proposed relationships. Element references are a separate picture under rule 6, so they need no edge style of their own.
5. Size. At most about 15 nodes or 25 edges per diagram; split larger graphs into an overview and detail diagrams.
6. Facts. Draw only relationships that the source states. Mark gaps and unresolved targets as the source marks them. Do not draw phase order, task prerequisites, artifact prerequisites, flow transitions or element references in one picture.
7. Stale marking. When a source changed and the diagram has not been rechecked, add the line `Stale: <identity> changed; recheck pending.` after the source line. Remove it when the self-check regenerates or confirms the diagram.
8. Generated output. A diagram produced by an agent or a tool is a proposal until the validation in the next section is recorded. Image output of a generative model is never a semantic diagram.

## Agent procedure

Agents apply these steps when they create, review or change a representation. The steps run inside the existing phase self-check or task check; they add no phase.

1. Analyze. Read the element's purpose, its front matter and its body structure. List the relationships that the text states: sequence, states, prerequisites, containment, consumption, comparison, quantities. Note the readers and their expertise.
2. Identify difficulty. Mark passages where a reader must hold more than about four related items at once, follow a sequence across paragraphs, compare more than two options over more than two attributes, or trace a path across documents.
3. Decide. A representation is justified when a relationship from step 1 is the subject of the passage, a reader task needs search or comparison that the prose spreads apart, and no derived view or table already shows it. Otherwise keep prose and record the decision in one sentence.
4. Select. Use the selection guide. Prefer the reader-derived view for structural facts and a table for exact comparison. Use one representation per relationship.
5. Model. Write the fact list the representation will show: nodes, edges, labels, states, each with the identity of its source. Include only stated facts. Mark gaps as gaps.
6. Generate. Produce the notation from the fact list under the authoring rules.
7. Explain. Write the introduction paragraph and check that the body text carries every fact of the picture.
8. Link. Write the source line. Name nodes so that a reader can navigate to the elements. Put links to governing elements in the text, not in the diagram.
9. Validate. Count nodes and edges against the fact list; confirm no extra, missing or reversed element; confirm labels equal the source; render or parse the notation; confirm the text alternative agrees; confirm no implied relationship. Record the check and its result in the self-check or task evidence.
10. Maintain. When a source element changes, regenerate from the derivation or mark the diagram stale. Remove a representation whose subject was removed. Never edit a diagram to show a fact that the source does not state; change the source first.

Self-review criteria, each answered yes before the check is recorded:

- The body states every fact that the diagram shows, and the diagram shows only stated facts.
- Each arrow has one declared meaning, and graphs with different edge meanings are separate pictures.
- A reader without the renderer gets the same facts from the text.
- The source line names identities and the derivation.
- The diagram is within the size limit or split into levels.
- Labels use existing identifiers and titles.
- A table or the reader-derived view would not serve the task better.
- The check is recorded with its result.

Prohibitions: no decorative or redundant visuals; no invented behavior or relationships; no image-generation output treated as verified architecture; no loss of semantic precision for appearance; no mandatory diagramming tool; no replacement of complete technical knowledge by a simplified picture.

## Phase application

| Phase | Use | Derived from | Avoid |
| --- | --- | --- | --- |
| Requirement | Example scenarios with concrete values; before-and-after comparisons; measurement tables; a journey listing of candidate flows. | Confirmed facts and examples | Architecture pictures; invented protocol detail |
| Specification | Contract tables (inputs, outputs, errors); sequence diagrams for interactions; state diagrams for lifecycles; containment diagrams for boundaries; flow diagrams from flow records; model participation from participants and interactions. | Body sentences; flow and model records | A picture that replaces the contract text |
| ADR | Alternatives table with options and criteria. A decision graph only when options branch. | Alternatives section | A diagram of a linear choice |
| Plan | The task graph that the reader derives from the task list and task prerequisites; an embedded derived copy when readers lack a reader. | tasks list and depends_on | Hand-drawn task order; cross-artifact task edges |
| Implementation | Evidence table: DoD item, check, result, source. Behavior diagrams updated when behavior changed. Test and implementation supports attached to flow steps. | Task evidence_records; flow supports | A diagram as proof of execution |
| Version | Change summary table: what changed, compatibility level, affected contracts. | Version record and identity record delta | A new diagram for an unchanged structure |

Cross-artifact views, each derived and each with its own meaning: feature evolution from version records and their source changes; dependency navigation from identity records; runtime interaction from flow records; change impact from references and flow supports in reverse; evidence traceability from unit evidence and task records; lifecycle from the derived-fact rules.

Four graphs, four meanings. ADD knowledge contains graphs that look alike and mean different things. Keep them in separate pictures and name the meaning:

| Graph | Nodes | Edge meaning | Source | Shape |
| --- | --- | --- | --- | --- |
| Phase order | Phases | The next phase consumes the previous output | Workflow | Sequence with returns |
| Task graph | Tasks of one change | Prerequisite task before dependent task | tasks list, task depends_on | Acyclic |
| Artifact graph | Artifacts | Upstream artifact establishes before dependent implementation | Identity records | Acyclic |
| Flow graph | Steps of one flow | Behavior transition, with a condition | Flow record | Branches, joins and loops allowed |
| Element references | Elements | Consumer uses supplier knowledge | References front matter | Any; explains artifact edges |

## Traceability and maintenance

Each semantic diagram has a source line. Each phase self-check lists the representations of the changed documents and records, for each one, that it was regenerated or checked against its sources. A task that changes behavior rechecks the diagrams of the governing specification and reports stale ones to the coordinator. Version preparation confirms that no stale line remains in the working knowledge. A representation in a retained change or an established version is not edited; a correction is a new change.

## Page ownership

Each fact has one owning bundle page. Other pages link to it.

| Page | Owns | Other content |
| --- | --- | --- |
| 01-foundation/visual-knowledge.md (new) | Principles P1–P6 with their basis and limits, the hypothesis assessment, the status of each finding, the source list. | Links to the guideline and the examples. |
| 01-foundation/principles.md | One new principle, "Present Knowledge in the Form That Fits It", in two sentences with a link to the new page. | Unchanged otherwise. |
| 01-foundation/README.md | Contents entry 4 for the new page. | Unchanged otherwise. |
| 06-guidelines/visual-representations.md (new) | The categories, the selection guide, the authoring rules, the agent procedure, the self-review criteria, the prohibitions, the phase application, the four-graphs table, the traceability and maintenance rules, and reader support. | Links to the foundation page and the examples. |
| 06-guidelines/visual-examples.md (new) | The worked examples. | Links to the guideline. |
| 06-guidelines/writing-artifacts.md | A short Representations section: where representations go in requirements, specifications, decisions and tasks, with a link to the guideline. | Unchanged otherwise. |
| 06-guidelines/working-with-ai.md | A short Representations section: agents apply the procedure in their self-checks; what to ask for; what a reader shows without a renderer. | Unchanged otherwise. |
| 06-guidelines/README.md | Two table rows for the new guides. | Unchanged otherwise. |
| 02-methodology/dependencies.md | The existing Diagram Views rules, plus one sentence that links to the guideline for authored diagrams. | Unchanged otherwise. |
| 02-methodology/validation.md | One sentence in Phase Self-Checks: representations of changed documents are checked within the self-check, with a link. | Unchanged otherwise. |
| 03-execution/skills/add-coordinator, add-product-owner, add-technical-lead, add-implementer | A Representations section per role, in the style of the System-flow checks sections: the role's representations, the procedure step it performs, and the check it records. | Unchanged otherwise. |
| README.md (bundle overview) | The three new files in the project structure tree. | Unchanged otherwise. |

Links follow the documentation flow: 01-foundation and 06-guidelines pages link to each other as sibling sections and to pages below them, not to the bundle README. File names do not change. The flow record change-delivery gains a support record `visual-contract` for this contract on its requirement, specification, plan and implement steps; its steps and transitions do not change.

## Reader support

Any reader of ADD knowledge, including Artifact Plane, meets the contract when it:

- renders a fenced Mermaid block from its text without external resources, or shows the block as source text with its label, so that the introduction, the text alternative and the source line remain readable;
- keeps the derived views for structural facts as the primary form, with proposed additions and removals marked;
- never treats an embedded diagram as a structural fact. Front matter remains the only structural source.

## Artifact Plane directions

These are directions for possible future Plane changes. None of them is implemented, required or approved by this change; each would need its own Plane change with its own plan.

| ID | Direction | Existing contract it would extend |
| --- | --- | --- |
| R1 | Render fenced Mermaid in document pages from text, under the current sanitizer policy, with the source panel as the fallback. | [Reading controls](../../artifact-plane/specifications/reading-controls.md) and the Markdown renderer of the explorer contract |
| R2 | Offer a Text and Diagram switch for an embedded diagram, as the flow page offers Steps and Diagram. | [Authoring workbench](../../artifact-plane/specifications/authoring-workbench.md), flow page |
| R3 | Progressive exploration of large graphs: collapse groups, focus on one node and its neighbors, levels from artifact to elements. | Graph panel of the authoring workbench |
| R4 | Navigate from a diagram node to its element when the diagram names identities in its source line. | Knowledge navigation of the document page |
| R5 | Agent-assisted generation stays outside the Plane: an agent generates through the MCP write tools; the Plane validates the written document with its readers. No hosted inference in the Plane. | [Knowledge editing](../../artifact-plane/specifications/knowledge-editing.md); decision 001 |
| R6 | Visual editing happens through operations on records (flow steps, transitions, supports, tasks, dependencies), never through free drawing. | Decision 013 |
| R7 | Stale detection: compare the fingerprints of a diagram's declared sources with the flow index fingerprints; needs a machine-readable source declaration, which decision 013 defers. | [Flows](../../artifact-plane/specifications/flows.md) index and freshness |
| R8 | Change impact presentation: show the affected flows and steps of a change beside its changed knowledge, from reverse references and flow supports. | [Change review](../../artifact-plane/specifications/change-review.md) |

## Worked examples

The examples page shows the principles on this repository's artifacts at revision 126990d (main, 18 October 2026). Each example gives the existing representation, the semantic model, the better representation, the reason, what stays in text, and the consistency rule. Facts come from the named elements; illustrative assumptions are labelled. The example artifacts are not edited.

| ID | Phase | Source elements | Representation | Facts shown |
| --- | --- | --- | --- | --- |
| E1 | Requirement | artifact-driven:requirements/knowledge-layout.md; artifact-driven:specifications/knowledge-layout.md#layout; the legacy layout section of artifact-model.md | Before-and-after comparison of the two layouts as paired tree listings; the existing measurement table kept as the right form | Directory roles in both layouts |
| E2 | Specification | artifact-driven:specifications/knowledge-layout.md (Lifecycle and Derived facts) | State diagram of a change: open change, version prepared (proposed), established; transitions from the lifecycle steps and the derived-fact rules | 3 states, the lifecycle transitions, the new-change rule after establishment |
| E3 | Specification | artifact-plane:specifications/knowledge-editing.md (Operation service, Writer) | Sequence diagram of the write path: request, scan, plan, post-image, validation, dry run or digests, atomic write, journal, response | The processing sentence, the 422 and 409 rules, the dry-run rule |
| E4 | ADR | artifact-driven:decisions/011-in-place-knowledge-layout.md | The alternatives table kept as the right form; a note why a diagram adds nothing | 5 options, assessment |
| E5 | Plan | artifact-driven/change-agent-efficiency tasks README and task files | Task graph derived from the task list and depends_on | 5 tasks, 5 edges |
| E6 | Implementation | units-of-work/add-agent-efficiency evidence; task evidence_records | Evidence table criterion, result, source; the graph form rejected for this task | 7 criteria, 7 entries, 4 sources, 1 failed |
| E7 | Version | artifact-driven and artifact-plane version records and their introducing first-parent commits | Feature evolution table of versions, source changes and dates for the in-place layout outcome | 2.3.0 to 2.5.0 and 1.13.0 to 1.15.0 |
| E8 | Cross-artifact | Identity records; artifact-plane:specifications/knowledge-editing.md references | Dependency graph with the element references grouped by artifact | 3 artifacts, 2 edges, 5 references |
| E9 | Runtime | artifact-plane:specifications/flows/knowledge-authoring.md; artifact-driven:specifications/flows/change-delivery.md | Flow diagrams from the flow records, beside the phase order and the task graph, to show the four meanings | 8 steps and 11 transitions; 7 steps and 7 transitions |

## Consistency and checks

Each changed bundle file is edited in docs/artifact-driven and copied byte for byte to src/archs/artifact-driven. Validation uses existing tools: `diff -rq` of the two bundle copies (expected differences are the Go files and required-skills), a relative-link and hierarchy check over both copies, `go test ./...` and `go vet ./...` (the bundle fidelity test fails when a copy differs), the website build, a render check of every Mermaid block on the built site with the Playwright Chromium that the Plane tests use, a count check of each derived example against its source records, the validate-knowledge script, and a recorded dry run of the agent procedure on artifact-plane:specifications/knowledge-editing.md.

## Affected flows and dependencies

The change-delivery flow gains the support record `visual-contract` (kind element, this document, basis documented) on its requirement, specification, plan and implement steps. No step, transition, artifact dependency or element reference changes.

## Specification self-check

V1 maps to the research basis and the principles; V2 to the categories; V3 to the selection guide; V4 to the authoring rules, the agent procedure, the self-review criteria and the prohibitions; V5 to the phase application and the four-graphs table; V6 to traceability and maintenance; V7 to authoring rules 1 to 3 and reader support; V8 to the worked examples; V9 to the Artifact Plane directions; V10 to page ownership and the checks. AV1 to AV6 map to the checks. Decision 013 records the representation choice and the deferred structured record. KISS: no tool, schema, phase or registry; one notation; checks inside existing self-checks. STE: each rule states one obligation, terms are defined once, and limits are explicit. The research table marks every finding with its status. No Specification blocker prevents Plan.
