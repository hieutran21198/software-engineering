import {createHash} from 'node:crypto';
import {parseArtifact, KNOWLEDGE_KINDS} from '../src/model.js';

// Protected-ref facts for in-place artifacts. Git is the version store: the
// artifact tree on main or master is established; differing bytes are proposed.
export const PROTECTED_REFS = ['refs/heads/main', 'refs/heads/master'];
export function blobId(bytes, length = 40) {
  return createHash(length === 64 ? 'sha256' : 'sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex');
}
export async function protectedRefs(root, git) {
  const refs = [];
  for (const ref of PROTECTED_REFS) {
    const oid = await git(root, ['rev-parse', '--verify', '-q', ref]).catch(() => null);
    if (oid) refs.push({ref, oid});
  }
  return refs;
}
export async function protectedTree(root, git, oid, paths) {
  const raw = await git(root, ['ls-tree', '-r', '-z', '--format=%(objectname)%x09%(path)', oid, '--', ...paths], true);
  return new Map(raw.split('\0').filter(Boolean).map(row => {const i = row.indexOf('\t');return [row.slice(i + 1), row.slice(0, i)];}));
}
const knowledgePath = rest => KNOWLEDGE_KINDS.includes(rest.split('/')[0]) && rest.endsWith('.md');
// Read one artifact's established view from a protected tree. The ref may hold
// the in-place layout or, during a transition, the legacy snapshot layout.
async function establishedView(root, git, id, ref, tree) {
  const base = `docs/artifacts/${id}/`;
  if (!tree.has(`${base}README.md`)) return {state: 'available', ref: ref.ref, oid: ref.oid, layout: null, currentVersion: null, dependsOn: [], knowledgePrefix: base, entries: new Map(), versionRecords: []};
  const entries = [...tree].filter(([path]) => path.startsWith(base));
  const layout = entries.some(([path]) => knowledgePath(path.slice(base.length))) ? 'in-place' : 'legacy';
  const readme = await git(root, ['show', `${ref.oid}:${base}README.md`], true).catch(() => null);
  if (readme === null) return {state: 'unknown', ref: ref.ref, reason: 'The protected identity record cannot be read.'};
  const ds = [], parsed = parseArtifact(id, readme, ds, layout);
  if (ds.length) return {state: 'unknown', ref: ref.ref, reason: `The protected identity record is ambiguous or invalid (${ds.map(d => d.code).join(', ')}).`};
  const knowledgePrefix = layout === 'in-place' ? base : parsed.currentVersion ? `${base}versions/${parsed.currentVersion}/` : null;
  if (layout === 'in-place' && parsed.currentVersion && !tree.has(`${base}versions/${parsed.currentVersion}/README.md`))
    return {state: 'unknown', ref: ref.ref, reason: `Protected version ${parsed.currentVersion} has no version record.`};
  if (layout === 'legacy' && knowledgePrefix && !entries.some(([path]) => path.startsWith(knowledgePrefix)))
    return {state: 'unknown', ref: ref.ref, reason: `Protected snapshot ${parsed.currentVersion} is missing.`};
  const knowledge = new Map();
  if (knowledgePrefix) for (const [path, oid] of entries) {
    if (!path.startsWith(knowledgePrefix)) continue;
    const rest = path.slice(knowledgePrefix.length);
    if (knowledgePath(rest)) knowledge.set(rest, oid);
  }
  const versionRecords = entries.map(([path]) => path.slice(base.length).match(/^versions\/(\d+\.\d+\.\d+)\/README\.md$/)?.[1]).filter(Boolean);
  return {state: 'available', ref: ref.ref, oid: ref.oid, layout, currentVersion: parsed.currentVersion, dependsOn: parsed.dependsOn, publicationReviews: parsed.publicationReviews, knowledgePrefix, entries: knowledge, versionRecords};
}
// Compare working knowledge with the established view: added, modified,
// unchanged, and removed paths. Both protected refs must agree when present.
export async function readBaselines(root, git, ids, workingBytes, diagnostics = []) {
  const result = {};
  if (!ids.length) return result;
  const refs = await protectedRefs(root, git);
  if (!refs.length) {
    diagnostics.push({code: 'missing-protected-ref', path: 'docs/artifacts', message: 'No readable local main or master ref; established in-place knowledge is unknown.'});
    for (const id of ids) result[id] = {state: 'unknown', ref: null, reason: 'No readable local main or master ref.'};
    return result;
  }
  let trees;
  try {trees = await Promise.all(refs.map(ref => protectedTree(root, git, ref.oid, ids.map(id => `docs/artifacts/${id}`))));}
  catch {
    for (const id of ids) result[id] = {state: 'unknown', ref: null, reason: 'Protected-ref trees cannot be read.'};
    diagnostics.push({code: 'unavailable-baseline', path: 'docs/artifacts', message: 'Protected-ref trees cannot be read.'});
    return result;
  }
  for (const id of ids) {
    const base = `docs/artifacts/${id}/`;
    const signature = tree => JSON.stringify([...tree].filter(([p]) => p.startsWith(base)));
    if (trees.length > 1 && signature(trees[0]) !== signature(trees[1])) {
      result[id] = {state: 'unknown', ref: null, reason: 'Protected refs disagree about this artifact.'};
      diagnostics.push({code: 'baseline-disagreement', path: base, message: 'main and master disagree about this artifact; established knowledge is unknown.'});
      continue;
    }
    const view = await establishedView(root, git, id, refs[0], trees[0]);
    if (view.state !== 'available') {
      diagnostics.push({code: 'unavailable-baseline', path: `${base}README.md`, message: view.reason});
      result[id] = view;
      continue;
    }
    const status = new Map(), seen = new Set(), length = refs[0].oid.length;
    for (const [path, bytes] of workingBytes) {
      if (!path.startsWith(base)) continue;
      const rest = path.slice(base.length), oid = view.entries.get(rest);
      seen.add(rest);
      status.set(path, !oid ? 'added' : oid === blobId(bytes, length) ? 'unchanged' : 'modified');
    }
    view.status = status;
    view.removed = [...view.entries.keys()].filter(rest => !seen.has(rest)).sort().map(rest => view.knowledgePrefix + rest);
    result[id] = view;
  }
  return result;
}
