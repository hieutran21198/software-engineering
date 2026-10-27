// Names of the diagram records of the overview (specifications/diagram-scopes.md, Artifact page).
const TYPES = new Map([['flowchart', 'Flowchart'], ['graph', 'Flowchart'], ['sequenceDiagram', 'Sequence'], ['stateDiagram', 'State'], ['stateDiagram-v2', 'State'],
  ['erDiagram', 'Data model'], ['classDiagram', 'Class'], ['architecture-beta', 'Architecture'], ['architecture', 'Architecture']]);
// The type label; another type as written; "Diagram" for a block without a type.
export const diagramType = type => type ? TYPES.get(type) || type : 'Diagram';
// The accTitle of the block, or "<type label> diagram".
export const diagramName = d => d.title || (d.type ? `${diagramType(d.type)} diagram` : 'Diagram');
