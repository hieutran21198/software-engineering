// Shared record checks of the ADD record-checks contract (artifact-driven
// specifications/record-checks.md, Checks). Readers, the validator entry point
// and the review service call this module; no second implementation exists.
// It reads scanner records, the filesystem below the repository root for link
// targets, and local Git refs. It never writes, fetches or runs record text.
import {stat, readFile} from 'node:fs/promises';
import {posix, resolve, relative, isAbsolute, sep} from 'node:path';
import {marked} from 'marked';
import {parseArtifact} from '../src/model.js';
import {planCompatibility, taskCovers, requirementIds, evidenceSource} from '../src/delivery-records.js';
import {frontMatter, evidenceDetail, safeKnowledgePath} from './units-of-work.js';
import {protectedRefs} from './knowledge-baseline.js';

const BASE = 'docs/artifacts/';
const mapping = v => v !== null && typeof v === 'object' && !Array.isArray(v);
const KNOWLEDGE = /^docs\/artifacts\/([^/]+)\/(requirements|specifications|decisions)\/.+\.md$/;
const CHANGE_FILE = /^docs\/artifacts\/([^/]+)\/changes\/(change-[^/]+)\//;
const stripFront = text => text.replace(/^---\r?\n[\s\S]*?\r?\n---(?:\r?\n|$)/, '');
const withoutCode = text => text.replace(/^ {0,3}(`{3,}|~{3,})[^\n]*\n[\s\S]*?^ {0,3}\1[`~]*[ \t]*$/gm, '').replace(/`+[^`\n]*`+/g, '');

// The number that a level gives from the protected version; a first version is 1.0.0.
export function nextVersion(current, level) {
  if (!current) return '1.0.0';
  const [major, minor, patch] = current.split('.').map(Number);
  if (level === 'major') return `${major + 1}.0.0`;
  if (level === 'minor') return `${major}.${minor + 1}.0`;
  if (level === 'patch') return `${major}.${minor}.${patch + 1}`;
  return null;
}
const later = (a, b) => {const x = a.split('.').map(Number), y = b.split('.').map(Number);for (let i = 0; i < 3; i++) if (x[i] !== y[i]) return x[i] > y[i];return false;};
export {later as versionGreater};

// One check run. `scope` ({artifact, change}) keeps the diagnostics of one
// change, its identity record and the records that it touches.
export async function recordChecks({root, scan, git, scope = null}) {
  const {files, snapshot, baselines = {}} = scan;
  const diagnostics = [];
  const add = (code, severity, path, message) => diagnostics.push({code, severity, path, message});
  const refs = await protectedRefs(root, git).catch(() => []);
  const protectedOid = refs[0]?.oid ?? null;
  const showProtected = path => protectedOid ? git(root, ['show', `${protectedOid}:${path}`]).catch(() => null) : Promise.resolve(null);
  const onDisk = async path => {
    const target = resolve(root, path), rel = relative(root, target);
    if (rel === '' ? false : rel.startsWith(`..${sep}`) || rel === '..' || isAbsolute(rel)) return false;
    return stat(target).then(() => true, () => false);
  };
  const markdownOf = async path => files.get(path) ?? (safeKnowledgePath(path) ? await readFile(resolve(root, path), 'utf8').catch(() => undefined) : undefined);
  const resolves = async source => {
    if (typeof source !== 'string') return false;
    const [path, fragment, extra] = source.split('#');
    if (!safeKnowledgePath(path) || extra !== undefined || fragment === '') return false;
    const body = await markdownOf(path);
    return body !== undefined && Boolean(evidenceDetail(body, fragment));
  };
  const markdownFiles = [...files].filter(([path, body]) => path.startsWith(BASE) && path.endsWith('.md') && typeof body === 'string');

  // source-unresolved
  for (const [path, body] of markdownFiles) {
    if (!/^---\r?\n/.test(body)) continue;
    const value = frontMatter(body).value;
    if (!value) continue;
    const isTask = /\/changes\/change-[^/]+\/tasks\/.+\.md$/.test(path) && !path.endsWith('/tasks/README.md');
    if (mapping(value.self_check) && !(await resolves(value.self_check.source))) add('source-unresolved', 'error', path, `self_check source ${value.self_check.source ?? '(missing)'} does not resolve to a nonempty section.`);
    if (Array.isArray(value.evidence_records)) for (const record of value.evidence_records) {
      if (!mapping(record)) continue;
      const source = isTask ? evidenceSource(record, path) : record.source;
      if (!(await resolves(source))) add('source-unresolved', 'error', path, `Evidence record ${record.id ?? ''} source ${source ?? '(missing)'} does not resolve to a nonempty section.`);
    }
    if (/^docs\/artifacts\/units-of-work\/[^/]+\/README\.md$/.test(path) && Array.isArray(value.evidence))
      for (const entry of value.evidence) if (mapping(entry) && !(await resolves(entry.source))) add('source-unresolved', 'error', path, `Unit evidence for ${entry.criterion ?? '?'} source ${entry.source ?? '(missing)'} does not resolve to a nonempty section.`);
  }

  // link-broken and placeholder-text
  for (const [path, body] of markdownFiles) {
    const links = [];
    marked.walkTokens(marked.lexer(stripFront(body)), token => {if (token.type === 'link' || token.type === 'image') links.push(token.href);});
    for (const href of new Set(links)) {
      if (!href || href.startsWith('#') || /^[a-z][a-z0-9+.-]*:/i.test(href) || href.startsWith('//')) continue;
      let target = href.split('#')[0].split('?')[0];
      try {target = decodeURI(target);} catch {}
      const joined = target.startsWith('/') ? target.slice(1) : posix.join(posix.dirname(path), target);
      if (!(await onDisk(joined))) add('link-broken', 'error', path, `Link ${href} does not resolve to a file.`);
    }
    if (/\bREPLACE\b/.test(withoutCode(body))) add('placeholder-text', 'error', path, 'The record contains scaffold placeholder text.');
  }

  // Identity, versions and upstream establishment
  const protectedIdentity = new Map();
  const identityOn = async id => {
    if (!protectedIdentity.has(id)) protectedIdentity.set(id, baselines[id]?.state === 'available' ? {currentVersion: baselines[id].currentVersion} : await showProtected(`${BASE}${id}/README.md`).then(text => text === null ? null : parseArtifact(id, text, [], 'legacy')));
    return protectedIdentity.get(id);
  };
  for (const artifact of snapshot.artifacts) {
    const prefix = `${BASE}${artifact.id}/`;
    const working = parseArtifact(artifact.id, files.get(`${prefix}README.md`) || '', [], artifact.layout);
    if (artifact.layout === 'in-place') {
      if (working.currentVersion && !files.has(`${prefix}versions/${working.currentVersion}/README.md`))
        add('version-identity-mismatch', 'error', `${prefix}README.md`, `current_version ${working.currentVersion} has no version record.`);
      const established = baselines[artifact.id];
      for (const path of files.keys()) {
        const version = path.slice(prefix.length).match(/^versions\/(\d+\.\d+\.\d+)\/README\.md$/)?.[1];
        if (!path.startsWith(prefix) || !version) continue;
        const change = frontMatter(files.get(path)).value?.source_change;
        if (typeof change !== 'string') continue;
        if (![...files.keys()].some(p => p.startsWith(`${prefix}changes/${change}/`))) add('version-identity-mismatch', 'error', path, `source_change ${change} has no change directory.`);
        if (established?.state !== 'available' || established.versionRecords.includes(version)) continue;
        const level = planCompatibility(files.get(`${prefix}changes/${change}/tasks/README.md`) || '').compatibility;
        const expected = established.currentVersion ? nextVersion(established.currentVersion, level) : '1.0.0';
        if (expected && expected !== version) add('version-number-invalid', 'error', path, `Version ${version} is not ${expected}, the number that ${level ?? 'a first version'} gives from ${established.currentVersion ?? 'no protected version'}.`);
      }
    }
    for (const dependency of new Set([...(working.dependsOn || [])])) {
      const upstream = await identityOn(dependency);
      if (!upstream?.currentVersion) add('upstream-unestablished', 'warning', `${prefix}README.md`, `Upstream ${dependency} has no established version on the protected branch.`);
    }
  }

  // Requirement IDs and covers
  const idsOf = new Map();
  const idsIn = async (artifactId, element) => {
    const key = `${artifactId}/${element}`;
    if (!idsOf.has(key)) {
      const artifact = snapshot.artifacts.find(a => a.id === artifactId);
      const path = artifact?.layout === 'legacy' && artifact.currentVersion ? `${BASE}${artifactId}/versions/${artifact.currentVersion}/${element}` : `${BASE}${artifactId}/${element}`;
      const body = await markdownOf(path);
      idsOf.set(key, body === undefined ? null : new Set(requirementIds(body).map(r => r.id)));
    }
    return idsOf.get(key);
  };
  const coversByChange = new Map();
  for (const [path, body] of markdownFiles) {
    const match = path.match(/^docs\/artifacts\/([^/]+)\/changes\/(change-[^/]+)\/tasks\/.+\.md$/);
    if (!match || path.endsWith('/tasks/README.md')) continue;
    const {covers} = taskCovers(body, path);
    const key = `${match[1]}/${match[2]}`;
    coversByChange.set(key, [...(coversByChange.get(key) || []), ...covers]);
    for (const entry of covers) {
      const known = await idsIn(entry.artifact, entry.element);
      if (!known) {add('covers-unknown-id', 'error', path, `covers names ${entry.artifact}/${entry.element}, which does not exist.`);continue;}
      for (const id of entry.ids) if (!known.has(id)) add('covers-unknown-id', 'error', path, `${id} is not an ID of ${entry.artifact}/${entry.element}.`);
    }
  }
  for (const artifact of snapshot.artifacts.filter(a => a.layout === 'in-place')) {
    const status = baselines[artifact.id]?.status;
    if (!status) continue;
    // The undelivered changes: no version record on the protected branch names them.
    const prefix = `${BASE}${artifact.id}/`, delivered = new Set(baselines[artifact.id].versionRecords || []);
    const deliveredChanges = new Set([...files.keys()].map(p => p.slice(prefix.length).match(/^versions\/(\d+\.\d+\.\d+)\/README\.md$/)?.[1]).filter(v => v && delivered.has(v)).map(v => frontMatter(files.get(`${prefix}versions/${v}/README.md`)).value?.source_change));
    const open = artifact.changes.map(c => c.name).filter(name => !deliveredChanges.has(name));
    const covered = new Set(open.flatMap(name => coversByChange.get(`${artifact.id}/${name}`) || []).filter(c => c.artifact === artifact.id).flatMap(c => c.ids.map(id => `${c.element}#${id}`)));
    for (const [path, state] of status) {
      if (!['added', 'modified'].includes(state) || !/\/requirements\/.+\.md$/.test(path)) continue;
      const element = path.slice(`${BASE}${artifact.id}/`.length);
      const ids = requirementIds(files.get(path) || '');
      if (!ids.some(r => r.form === 'list')) add('requirement-ids-missing', 'info', path, 'This edited requirement file has no ID in the list form.');
      if (!open.length) continue;
      const before = new Map(state === 'modified' ? requirementIds(await showProtected(path) || '').map(r => [r.id, r.text]) : []);
      for (const r of ids) if ((!before.has(r.id) || before.get(r.id) !== r.text) && !covered.has(`${element}#${r.id}`))
        add('requirement-uncovered', 'warning', path, `${r.id} is ${before.has(r.id) ? 'changed' : 'added'} and no task of ${open.join(', ')} covers it.`);
    }
  }

  // open-change-conflict
  diagnostics.push(...await openChangeConflicts(root, git, protectedOid, scope));

  diagnostics.sort((a, b) => a.path.localeCompare(b.path) || a.code.localeCompare(b.code) || a.message.localeCompare(b.message));
  return scope ? diagnostics.filter(d => inScope(d.path, scope, files, baselines)) : diagnostics;
}

function inScope(path, {artifact, change}, files, baselines) {
  const prefix = `${BASE}${artifact}/`;
  if (path.startsWith(`${prefix}changes/${change}/`) || path === `${prefix}README.md`) return true;
  if (baselines[artifact]?.status?.get(path) && ['added', 'modified'].includes(baselines[artifact].status.get(path))) return true;
  const version = path.slice(prefix.length).match(/^versions\/\d+\.\d+\.\d+\/README\.md$/) && frontMatter(files.get(path)).value?.source_change;
  if (path.startsWith(prefix) && version === change) return true;
  if (/^docs\/artifacts\/units-of-work\//.test(path)) return (frontMatter(files.get(path)).value?.changes || []).some(m => m?.artifact === artifact && m?.change === change);
  return path === 'docs/artifacts/add.config.yaml';
}

// Open changes and knowledge edits of a branch: the files that differ from
// the protected branch since the merge base, which also skips squash-merged branches.
async function branchTouches(root, git, protectedOid, ref) {
  const base = await git(root, ['merge-base', protectedOid, ref]).catch(() => null);
  if (!base) return null;
  const since = (await git(root, ['diff', '--name-only', '--no-renames', base, ref, '--', 'docs/artifacts']).catch(() => '')).split('\n').filter(Boolean);
  if (!since.length) return {changes: new Map(), knowledge: new Set()};
  const differs = new Set((await git(root, ['diff', '--name-only', '--no-renames', protectedOid, ref, '--', ...since]).catch(() => '')).split('\n').filter(Boolean));
  const paths = since.filter(p => differs.has(p)), changes = new Map(), knowledge = new Set(), versioned = new Set();
  for (const path of paths) {
    const change = path.match(CHANGE_FILE);
    if (change) changes.set(`${change[1]}/${change[2]}`, change[1]);
    if (KNOWLEDGE.test(path)) knowledge.add(path);
    const version = path.match(/^docs\/artifacts\/([^/]+)\/versions\/\d+\.\d+\.\d+\/README\.md$/);
    if (version) {const text = await git(root, ['show', `${ref}:${path}`]).catch(() => '');const source = frontMatter(text).value?.source_change;if (source) versioned.add(`${version[1]}/${source}`);}
  }
  for (const key of versioned) changes.delete(key);
  return {changes, knowledge};
}
async function openChangeConflicts(root, git, protectedOid, scope) {
  if (!protectedOid) return [];
  const head = await git(root, ['rev-parse', '--verify', '-q', 'HEAD']).catch(() => null);
  const current = await git(root, ['symbolic-ref', '-q', 'HEAD']).catch(() => '');
  if (!head) return [];
  const ours = await branchTouches(root, git, protectedOid, head);
  if (!ours || (!ours.changes.size && !ours.knowledge.size)) return [];
  const rows = (await git(root, ['for-each-ref', '--format=%(refname)%09%(objectname)', 'refs/heads', 'refs/remotes']).catch(() => '')).split('\n').filter(Boolean);
  const diagnostics = [];
  for (const row of rows) {
    const [ref, oid] = row.split('\t');
    if (ref === current || oid === head || oid === protectedOid || /\/HEAD$/.test(ref) || /^refs\/(heads|remotes\/[^/]+)\/(main|master)$/.test(ref)) continue;
    if (await git(root, ['merge-base', '--is-ancestor', oid, head]).then(() => true, () => false)) continue;
    const theirs = await branchTouches(root, git, protectedOid, oid);
    if (!theirs) continue;
    const name = ref.replace(/^refs\/(heads|remotes)\//, '');
    for (const [key, artifact] of ours.changes) {
      if (scope && artifact !== scope.artifact) continue;
      for (const [other, otherArtifact] of theirs.changes) if (otherArtifact === artifact)
        diagnostics.push({code: 'open-change-conflict', severity: 'warning', path: `${BASE}${artifact}/changes/${key.split("/")[1]}/`, message: `Branch ${name} has the open change ${other.split('/')[1]} on ${artifact}.`});
    }
    for (const path of ours.knowledge) if (theirs.knowledge.has(path) && (!scope || path.startsWith(`${BASE}${scope.artifact}/`)))
      diagnostics.push({code: 'open-change-conflict', severity: 'warning', path, message: `Branch ${name} also edits this knowledge file.`});
  }
  return diagnostics;
}
