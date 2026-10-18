// Pure helpers of the Impact page: names, groups, links and filters for the
// entities of an impact answer. The server owns the tiers and the paths.
const KNOWLEDGE = /^docs\/artifacts\/([^/]+)\/(requirements|specifications|decisions)\/(.+)\.md$/;

export const TIERS = [
  ['direct', 'Direct', 'One relationship away from a change.'],
  ['transitive', 'Transitive', 'More than one relationship away.'],
  ['potential', 'Potential', 'Evidence without a relationship. Confirm before you act.'],
  ['verify', 'Verify', 'Tests that support affected steps. Run them.'],
  ['investigate', 'Investigate', 'Code that supports affected steps but was not reached. Read it.'],
  ['unresolved', 'Unresolved', 'Relationships that could not be resolved. Unknown, not absent.'],
];
export const KINDS = [['all', 'All kinds'], ['flow', 'Flows'], ['knowledge', 'Knowledge'], ['code', 'Code'], ['test', 'Tests']];
export const STRENGTH_LABELS = {
  'declared+observed': 'declared, observed', 'declared+documented': 'declared', 'declared+static': 'declared, static', 'static+symbol': 'import of a changed symbol',
  static: 'static', 'declared+inferred': 'declared, inferred', declared: 'declared', historical: 'changed together', lexical: 'shared terms',
};
export const VIA_LABELS = {
  references: 'is referenced by', supports: 'supports step', contains: 'is a step of', defines: 'defines', imports: 'is imported by', 'go-imports': 'is imported by package',
  embeds: 'is embedded by', mirror: 'is copied to', copies: 'is published by', 'package-of': 'belongs to package', 'same-package-test': 'is tested by',
  participates: 'takes part in', describes: 'describes model', declares: 'declares model',
};

// Kind group of an entity, for the kind filter.
export function kindGroup(item) {
  const kind = item.kind;
  if (kind === 'flow' || kind === 'step') return 'flow';
  if (kind === 'test') return 'test';
  if (kind === 'document' || kind === 'element' || kind === 'model' || /\.md$/.test(item.entity || '')) return 'knowledge';
  return 'code';
}

// Entity identities: flow:<artifact>:<flow>, step:<artifact>:<flow>:<step>, model:<artifact>:<model>,
// artifact:<id>, or a repository path.
export function parseEntity(id) {
  const value = String(id || '');
  if (value.startsWith('flow:')) {const [artifact, ...rest] = value.slice(5).split(':');return {type: 'flow', artifact, flow: `${artifact}:${rest.join(':')}`};}
  if (value.startsWith('step:')) {const parts = value.slice(5).split(':');return {type: 'step', artifact: parts[0], flow: `${parts[0]}:${parts[1]}`, step: parts.slice(2).join(':')};}
  if (value.startsWith('model:')) {const [artifact, ...rest] = value.slice(6).split(':');return {type: 'model', artifact, model: rest.join(':')};}
  if (value.startsWith('artifact:')) return {type: 'artifact', artifact: value.slice(9)};
  const knowledge = value.match(KNOWLEDGE);
  if (knowledge) return {type: 'knowledge', artifact: knowledge[1], path: value, flowDocument: knowledge[2] === 'specifications' && knowledge[3].startsWith('flows/')};
  return {type: 'path', path: value};
}

// The group heading of an entity: its artifact, else the top folders of its path.
export function groupOf(item) {
  if (item.artifact) return item.artifact;
  const parsed = parseEntity(item.entity);
  if (parsed.artifact) return parsed.artifact;
  const parts = String(item.entity || '').split('/');
  return parts.length > 1 ? parts.slice(0, -1).join('/') : 'repository';
}

// A readable name for an entity, with the snapshot titles when known.
export function entityLabel(id, snapshot, title) {
  const parsed = parseEntity(id);
  const artifact = snapshot?.artifacts?.find(a => a.id === parsed.artifact);
  if (parsed.type === 'flow') return title || flowTitle(snapshot, parsed.flow) || parsed.flow;
  if (parsed.type === 'step') return `${flowTitle(snapshot, parsed.flow) || parsed.flow} · step ${parsed.step}`;
  if (parsed.type === 'model') return `Model ${parsed.model}`;
  if (parsed.type === 'artifact') return artifact?.title || parsed.artifact;
  if (parsed.type === 'knowledge') return artifact?.elements?.find(e => e.file === parsed.path)?.title || parsed.path.split('/').at(-1).replace(/\.md$/, '');
  return parsed.path.split('/').at(-1);
}
function flowTitle(snapshot, logical) {
  const [artifactId, flow] = logical.split(':');
  const artifact = snapshot?.artifacts?.find(a => a.id === artifactId);
  return artifact?.elements?.find(e => e.path === `specifications/flows/${flow}.md`)?.title || null;
}

// The page that shows an entity, or null. Code opens its own impact answer.
export function pageFor(id, extra = {}) {
  const parsed = parseEntity(id);
  if (parsed.type === 'flow' || parsed.type === 'step') return {kind: 'flow', artifact: parsed.artifact, flow: parsed.flow, ...(extra.highlight ? {highlight: extra.highlight} : {})};
  if (parsed.type === 'knowledge') return parsed.flowDocument
    ? {kind: 'flow', artifact: parsed.artifact, flow: `${parsed.artifact}:${parsed.path.split('/').at(-1).replace(/\.md$/, '')}`}
    : {kind: 'document', artifact: parsed.artifact, source: parsed.path};
  if (parsed.type === 'artifact') return {kind: 'artifact', artifact: parsed.artifact};
  return null;
}
export const impactPage = query => ({kind: 'impact', context: JSON.stringify(query)});
export function readContext(page) {
  try {const value = JSON.parse(page?.context || 'null');return value && typeof value === 'object' && !Array.isArray(value) ? value : null;}
  catch {return null;}
}

// The highlight a flow page receives: affected step IDs and, per step, the
// supporting sources that carried the change.
export function flowHighlight(flowItem, steps = []) {
  const logical = parseEntity(flowItem.entity).flow;
  const supports = {};
  for (const item of steps) {
    const parsed = parseEntity(item.entity);
    if (parsed.type !== 'step' || parsed.flow !== logical) continue;
    for (const path of item.paths || []) for (const edge of path) if (edge.via === 'supports' && edge.to === item.entity && edge.from)
      (supports[parsed.step] ??= []).includes(edge.from) || supports[parsed.step].push(edge.from);
  }
  return {steps: (flowItem.steps || []).map(s => s.step), supports};
}

// Section rows: the tier lists of the answer, filtered by kind and origin.
export function sectionItems(data, tier, {kind = 'all', origin = null} = {}) {
  if (!data) return [];
  const list = tier === 'verify'
    ? [...(data.verify || []).reduce((tests, v) => {
      const entry = tests.get(v.test) || {entity: v.test, kind: 'test', tier, hops: v.hops, strength: v.basis ? `declared+${v.basis}` : 'declared', origins: [], reason: v.requires, uses: []};
      entry.hops = Math.min(entry.hops, v.hops);entry.uses.push({flow: v.flow, step: v.step});tests.set(v.test, entry);return tests;
    }, new Map()).values()]
    : tier === 'investigate'
      ? (data.investigate || []).map(i => ({entity: i.entity, kind: i.kind || 'module', tier, hops: i.hops, strength: i.basis ? `declared+${i.basis}` : 'declared', origins: [], reason: i.requires, stepRef: i.for_step}))
      : tier === 'unresolved' ? (data.unresolved || []).map(u => ({entity: u.entity, kind: 'unresolved', tier, origins: u.for ? [u.for] : [], reason: u.reason}))
        : (data[tier] || []);
  return list.filter(item => (kind === 'all' || tier === 'unresolved' || kindGroup(item) === kind) && (!origin || !item.origins?.length || item.origins.includes(origin)));
}

// Rows grouped by artifact or folder, in the server's order.
export function groupRows(items) {
  const groups = new Map();
  for (const item of items) {const key = groupOf(item);if (!groups.has(key)) groups.set(key, []);groups.get(key).push(item);}
  return [...groups].map(([group, rows]) => ({group, rows}));
}

// The last relationship of the first path, as one short phrase.
export function lastRelationship(item) {
  const path = item.paths?.[0];
  if (!path?.length) return item.evidence?.co_changed || (item.evidence?.shared_terms ? `shares ${item.evidence.shared_terms.slice(0, 3).join(', ')}` : item.evidence?.note || '');
  const meaningful = [...path].reverse().find(edge => !['contains', 'defines'].includes(edge.via)) || path.at(-1);
  const symbols = meaningful.symbols?.length ? ` ${meaningful.symbols.join(', ')}` : '';
  return `${meaningful.via}${symbols}`;
}
