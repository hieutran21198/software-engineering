import dagre from '@dagrejs/dagre';
import {prerequisiteView} from './prerequisite-view.js';
export const taskNodeKey = (worktree, change, task) => JSON.stringify([worktree.path, change.artifact, change.name, 'task', task.path]);
export function taskSelection(workflow, changeKey, selection) {
  let key;
  try { key = JSON.parse(changeKey); } catch { return null; }
  if (!Array.isArray(key) || key.length !== 3) return null;
  const worktree = workflow?.worktrees.find(w => w.path === key[0]);
  const change = worktree?.changes.find(c => c.artifact === key[1] && c.name === key[2]);
  if (!change) return null;
  const task = change.taskGraph?.tasks.find(t => taskNodeKey(worktree, change, t) === selection);
  return {worktree, change, task};
}
export function taskCanvas(worktree, change, selection, showAll = false) {
  const graph = change.taskGraph;
  const nodes = (graph?.tasks || []).map(task => ({
    id: taskNodeKey(worktree, change, task), type: 'task', selected: taskNodeKey(worktree, change, task) === selection,
    data: {task,artifact:change.artifact,change:change.name}, position: {x: 0, y: 0}, style: {width: 300, height: 220},
  }));
  const byId = new Map(nodes.filter(n => n.data.task.id).map(n => [n.data.task.id, n.id]));
  const edges = graph?.state === 'available' ? prerequisiteView(graph.edges,showAll).map(edge => ({
    id: JSON.stringify([worktree.path, change.artifact, change.name, edge.source, edge.target]),
    source: byId.get(edge.source), target: byId.get(edge.target), type: 'smoothstep',
    markerEnd: {type: 'arrowclosed', color: '#a99bea'}, style: {stroke: '#a99bea', strokeWidth: 2},
  })) : [];
  const layout = new dagre.graphlib.Graph().setGraph({rankdir: 'LR', ranksep: 80, nodesep: 40}).setDefaultEdgeLabel(() => ({}));
  nodes.forEach(node => layout.setNode(node.id, {width: 300, height: 220}));
  edges.forEach(edge => layout.setEdge(edge.source, edge.target));
  dagre.layout(layout);
  nodes.forEach(node => {const p = layout.node(node.id); node.position = {x: p.x - 150, y: p.y - 110};});
  return {nodes, edges};
}
