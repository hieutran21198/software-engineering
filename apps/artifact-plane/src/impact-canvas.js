import dagre from '@dagrejs/dagre';
import {entityLabel, groupOf, parseEntity} from './impact-model.js';

export const MAX_NODES = 60;
// A step is drawn as its flow: the graph shows entities, the detail panel shows steps.
const canonical = id => {const parsed = parseEntity(id);return parsed.type === 'step' ? `flow:${parsed.flow}` : id;};

// A focused impact subgraph: the origins, the direct entities and every path to
// the selected entity. Above MAX_NODES nodes it groups both sides by artifact or
// folder. It never draws the whole repository graph.
export function impactCanvas(data, {selection = null, snapshot = null} = {}) {
  if (!data) return {nodes: [], edges: [], grouped: false};
  const origins = (data.changed || []).map(c => c.path);
  const direct = (data.direct || []).filter(i => i.kind !== 'step');
  const selected = [...(data.direct || []), ...(data.transitive || []), ...(data.potential || [])].find(i => i.entity === selection) || null;
  const nodes = new Map(), edges = new Map();
  const node = (id, tier, item) => {
    const key = canonical(id);
    if (!nodes.has(key)) nodes.set(key, {id: key, tier, label: entityLabel(key, snapshot, item?.title), kind: item?.kind || (origins.includes(key) ? 'changed' : parseEntity(key).type), hops: item?.hops ?? null});
    return key;
  };
  const link = (from, to, via, emphasis) => {
    const source = canonical(from), target = canonical(to);
    if (source === target || !nodes.has(source) || !nodes.has(target)) return;
    const key = `${source}->${target}`;
    if (!edges.has(key)) edges.set(key, {id: key, source, target, label: via, emphasis});
    else if (emphasis) edges.get(key).emphasis = true;
  };
  for (const o of origins) node(o, 'changed');
  for (const item of direct) node(item.entity, 'direct', item);
  const walk = (item, all) => {
    for (const path of (all ? item.paths || [] : (item.paths || []).slice(0, 1))) for (const edge of path) {
      if (edge.from && !nodes.has(canonical(edge.from))) node(edge.from, 'transitive');
      if (!nodes.has(canonical(edge.to))) node(edge.to, item.tier === 'potential' ? 'potential' : 'transitive', canonical(edge.to) === item.entity ? item : null);
      link(edge.from, edge.to, edge.via, all);
    }
  };
  for (const item of direct) walk(item, false);
  if (selected) walk(selected, true);
  if (nodes.size > MAX_NODES) return grouped(origins, direct, snapshot);
  return layout([...nodes.values()].map(n => ({...n, selected: n.id === selection})), [...edges.values()], false);
}

function grouped(origins, direct, snapshot) {
  const name = key => snapshot?.artifacts?.find(a => a.id === key)?.title || key;
  const originGroups = new Map(), itemGroups = new Map(), edges = new Map();
  for (const o of origins) {const g = groupOf({entity: o});originGroups.set(g, (originGroups.get(g) || 0) + 1);}
  for (const item of direct) {
    const g = groupOf(item);
    const entry = itemGroups.get(g) || {count: 0, kinds: {}};
    entry.count++;entry.kinds[item.kind] = (entry.kinds[item.kind] || 0) + 1;itemGroups.set(g, entry);
    for (const origin of item.origins || []) {
      const key = `changed:${groupOf({entity: origin})}->direct:${g}`;
      edges.set(key, {id: key, source: `changed:${groupOf({entity: origin})}`, target: `direct:${g}`, label: `${(edges.get(key)?.count || 0) + 1}`, count: (edges.get(key)?.count || 0) + 1});
    }
  }
  const nodes = [
    ...[...originGroups].map(([g, n]) => ({id: `changed:${g}`, tier: 'changed', label: name(g), kind: `${n} changed ${n === 1 ? 'file' : 'files'}`, group: true})),
    ...[...itemGroups].map(([g, e]) => ({id: `direct:${g}`, tier: 'direct', label: name(g), kind: Object.entries(e.kinds).map(([k, n]) => `${n} ${k}`).join(' · '), group: true})),
  ];
  return layout(nodes, [...edges.values()].map(e => ({...e, label: `${e.count} ${e.count === 1 ? 'relationship' : 'relationships'}`})), true);
}

function layout(nodes, edges, isGrouped) {
  const graph = new dagre.graphlib.Graph().setGraph({rankdir: 'LR', ranksep: 90, nodesep: 24}).setDefaultEdgeLabel(() => ({}));
  for (const n of nodes) graph.setNode(n.id, {width: 240, height: 64});
  for (const e of edges) graph.setEdge(e.source, e.target);
  dagre.layout(graph);
  return {
    grouped: isGrouped,
    nodes: nodes.map(n => {const p = graph.node(n.id);return {id: n.id, type: 'impact', data: n, position: {x: p.x - 120, y: p.y - 32}, style: {width: 240, height: 64}, selected: Boolean(n.selected)};}),
    edges: edges.map(e => ({id: e.id, source: e.source, target: e.target, type: 'readable', label: e.label, markerEnd: {type: 'arrowclosed', color: e.emphasis ? '#1f5bd8' : '#8a8f96'}, style: {stroke: e.emphasis ? '#1f5bd8' : '#8a8f96', strokeWidth: e.emphasis ? 2 : 1.5}})),
  };
}
