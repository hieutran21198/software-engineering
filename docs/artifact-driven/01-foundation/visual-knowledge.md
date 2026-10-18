# Visual Knowledge

ADD knowledge is text: YAML front matter and Markdown. Tables, listings, diagrams and derived views present that knowledge in other forms. This page states the principles for these representations and the research that supports them. The [representation guideline](../06-guidelines/visual-representations.md) gives the selection guide, the authoring rules and the agent procedure. The [worked examples](../06-guidelines/visual-examples.md) apply them to real artifacts.

Terms: a *representation* is any form of knowledge other than prose: a table, a listing, a diagram or an interactive view. A *semantic diagram* shows relationships that the source knowledge states and that a reader can verify. An *explanatory illustration* helps a reader form a concept and encodes no authoritative fact. An *interactive knowledge view* is a view that a reader tool derives from structured records. A *text alternative* is body text that carries the same facts as a diagram. A *source line* names the elements that a diagram is derived from.

## Principles

| ID | Principle | Rule | Basis |
| --- | --- | --- | --- |
| P1 | Knowledge first | The authoritative knowledge is the YAML front matter and the Markdown body of the owning element. A representation presents that knowledge and adds no fact. Structural facts stay in front matter; a diagram of them is derived. | The [records rule](artifact-model.md#records); findings 3 and 12 |
| P2 | Cognitive efficiency | Choose the form that lets the reader find and relate the necessary items with the least search, scrolling and reconstruction. Group related items, keep the explanation next to the picture, cue the structure, split a large picture into parts, and introduce named concepts before the diagram that uses them. Keep necessary technical detail in text. | Findings 1, 5, 6 and 8 |
| P3 | Visual-semantic alignment | Select the form from the structure of the information. Each visual element has one meaning. Each diagram declares one meaning per arrow style. Draw no relationship that the source does not state. Do not mix graphs with different edge meanings in one picture. | Findings 2, 9 and 10 |
| P4 | Traceability | A semantic diagram names its sources by [logical identity](artifact-model.md#identities) and states its derivation. Node labels use the identifiers or titles of the elements they show, so that a reader can find them. | Findings 3 and 12 |
| P5 | Maintainability | Prefer views that readers derive from records. When a document embeds a diagram, state how to regenerate it, check it in the phase self-check that owns its source, and mark it stale when the source changed and the check has not run. | Findings 12 and 13 |
| P6 | Accessibility and portability | Use a text-defined notation in a fenced Markdown block, with an accessible title and description, and a text alternative in the body. Do not use image files, HTML, external resources or executable content. A reader that cannot render the notation shows the source text and the text alternative. | Finding 14 |

These are recommendations, because they are design hypotheses with partial evidence: split a diagram of more than about 15 nodes or 25 edges into an overview and detail diagrams; use one representation per relationship; serve experts with the compact table or the derived view and novices with the worked example.

## Research Basis

The table separates established findings, design theories and emerging results. The status column gives the strength of the evidence; the last column gives the limit for ADD.

| # | Finding | Status | Sources | Limit for ADD |
| --- | --- | --- | --- | --- |
| 1 | Two representations can hold the same information and still need different work from the reader. A diagram indexes facts by location, so related facts are near each other and search is shorter. The benefit depends on the inferences that the reader can make from the picture. | Established theory with worked analyses | Larkin and Simon 1987 | A diagram can also make some inferences harder. The benefit needs the perceptual inference that the task calls for. |
| 2 | Performance improves when the representation fits the task: graphs for spatial tasks (patterns, trends, relationships), tables for symbolic tasks (exact values, comparisons). | Established, information systems experiments | Vessey 1991 | Decision complexity and time pressure moderate the effect. |
| 3 | External representations offload computation, re-represent a problem and constrain interpretation. Cognition is distributed across people and artifacts. | Established theory | Scaife and Rogers 1996; Hollan, Hutchins and Kirsh 2000; Kirsh 2010 | Frameworks, not effect sizes. |
| 4 | Verbal and non-verbal codes are separate systems with referential links. Concrete material that a reader can picture is remembered better. | Established theory | Clark and Paivio 1991 | Explains why text and a picture can help together. It does not say which picture. |
| 5 | Words with pictures are better than words alone (multimedia). Remove extraneous material (coherence). Cue the organization (signaling). Do not give the same words in two channels (redundancy). Put words next to the parts of the picture that they describe (spatial contiguity). Split a lesson into parts that the reader controls (segmenting). Name and describe the key concepts before the lesson that uses them (pre-training). | Established in controlled instruction experiments | Mayer 2020; Mayer and Moreno 2003 | Mostly novices and short lessons, measured by retention and transfer tests. Technical readers who look up facts can differ. |
| 6 | Working memory is limited. Element interactivity sets the intrinsic load. Separate sources that the reader must integrate cost more (split attention). Worked examples are better than problem solving for novices. Guidance that helps novices can hinder experts (expertise reversal). | Established | Sweller 1988; Chandler and Sweller 1992; Sweller and Cooper 1985; Atkinson et al. 2000; Renkl 2014; Kalyuga et al. 2003; Sweller, van Merriënboer and Paas 2019 | Measured with learners. Experts prefer compact representations. Expertise differs per artifact and reader. |
| 7 | A second representation can complement, constrain or help construct understanding. Each added representation costs translation effort. The benefits are not automatic. | Established framework; mixed outcomes | Ainsworth 2006 | A redundant representation costs effort and gives no benefit. |
| 8 | Support that fades as skill grows (scaffolding). Show the core first and reveal detail on request (progressive disclosure). Overview first, zoom and filter, then details on demand. | Recommendation with partial evidence | Wood, Bruner and Ross 1976; Nielsen 2006; Carroll and Carrithers 1984; Shneiderman 1996 | The split between overview and detail must match reader tasks. Hidden detail can hide dependencies. |
| 9 | Notation design principles: semiotic clarity, perceptual discriminability, semantic transparency, complexity management, cognitive integration, visual expressiveness, dual coding, graphic economy and cognitive fit. Cognitive dimensions: hidden dependencies, viscosity, visibility and secondary notation. | Design theories, partly validated, criticized as vague | Moody 2009; Green and Petre 1996 | Heuristics, not measurements. |
| 10 | Readers group what is near, similar, connected or enclosed. Arrows make readers see function and causality in a picture. Readers decode position most accurately, then length, angle, area and color. | Established | Wagemans et al. 2012; Heiser and Tversky 2006; Cleveland and McGill 1984; Hegarty 2011; Tversky 2011 | Layout can imply relationships that the source does not state. |
| 11 | Mental models are incomplete, unstable and built by the reader. Software comprehension builds such models from code, documents and tools. | Theory | Norman 1983; Johnson-Laird 1983; Storey 2006 | A document cannot transfer a model. It can supply the structure that a reader builds from. |
| 12 | Reading diagrams is a skill, and layout carries meaning for experts (secondary notation). Developers' sketches are informal, transient and rarely archived. Design-phase UML models improved code comprehension across 12 experiments; analysis-phase models did not. Reviewers who switch between complementary diagrams find more defects. Most documentation problems are content that is wrong, outdated or incomplete. | Empirical, context-bound | Petre 1995; Cherubini et al. 2007; Baltes and Diehl 2014; Scanniello et al. 2018; Hungerford, Hevner and Collins 2004; Aghajani et al. 2019, 2020 | Specific populations, notations and tasks. |
| 13 | Language models produce diagrams with high syntax accuracy and low semantic accuracy. Relationships, message order and completeness are often wrong, elements are invented, and results change with the prompt wording. Evaluation practice is immature. | Emerging empirical | Wang et al. 2025; Ferrari, Abualhaija and Arora 2024; Rahmanian, Sami and Yu 2026; Shbita, Ahmed and DeLuca 2025 | Models and benchmarks change quickly. |
| 14 | Non-text content needs a text alternative. Complex images need a long description near the content. Mermaid renders `accTitle` and `accDescr` as an SVG title and description with ARIA attributes. | Standard and tool documentation | WCAG 2.2 SC 1.1.1; W3C WAI images tutorial; Mermaid documentation | A reader that does not render Mermaid shows only the source text, so the body text alternative is the only alternative there. |

Hypothesis assessment. Complex artifacts become easier to understand when the author selects effective representations, but only under conditions. The representation must fit the task and the structure (findings 1 and 2). It must be next to the text that it explains (findings 5 and 6). It must show only stated relationships (finding 10). It must suit the expertise of the reader (findings 6 and 8). The hypothesis fails when a picture repeats the text (findings 5 and 7), when a picture adds elements that the source does not state (findings 10 and 13), and when a decorated page replaces exact detail (finding 5). Therefore ADD selects a representation from the structure of the information. It does not require a diagram in every document.

Research limits. Most experiments measure learning by students, not fact retrieval by engineers. The software studies cover UML and whiteboard sketches, not ADD records. The language-model studies are older than the current models. The principles are therefore rules where the evidence is consistent and recommendations where it is partial.

## Sources

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

Not cited, because they could not be verified: effect sizes per multimedia principle, and element-level accuracy percentages that secondary summaries report for the language-model studies.
