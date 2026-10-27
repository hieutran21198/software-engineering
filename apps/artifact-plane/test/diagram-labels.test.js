import test from 'node:test';
import assert from 'node:assert/strict';
import {diagramName, diagramType} from '../src/diagram-labels.js';
// The type label table of specifications/diagram-scopes.md, Artifact page.

test('diagram types have the labels of the contract; another type keeps its name', () => {
  const labels = Object.fromEntries(['flowchart', 'graph', 'sequenceDiagram', 'stateDiagram', 'stateDiagram-v2', 'erDiagram', 'classDiagram', 'architecture-beta', 'architecture', 'gantt', 'toString', null].map(t => [t, diagramType(t)]));
  assert.deepEqual(labels, {flowchart: 'Flowchart', graph: 'Flowchart', sequenceDiagram: 'Sequence', stateDiagram: 'State', 'stateDiagram-v2': 'State', erDiagram: 'Data model',
    classDiagram: 'Class', 'architecture-beta': 'Architecture', architecture: 'Architecture', gantt: 'gantt', toString: 'toString', null: 'Diagram'});
});

test('a diagram is named by its title, or by its type label and "diagram"', () => {
  assert.equal(diagramName({type: 'sequenceDiagram', title: 'Place an order'}), 'Place an order');
  assert.equal(diagramName({type: 'erDiagram', title: null}), 'Data model diagram');
  assert.equal(diagramName({type: 'gantt', title: null}), 'gantt diagram');
  assert.equal(diagramName({type: null, title: null}), 'Diagram');
});
