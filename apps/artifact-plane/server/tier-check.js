// Tier check of one change (artifact-plane specifications/delivery-support.md,
// Tier check): one result for each small-tier criterion of the ADD delivery
// tiers contract, the allowed tier and `tier-mismatch`. It reads scanner
// records and local Git; only the services pass an impact service.
import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {parseArtifact} from '../src/model.js';
import {changeTier, planCompatibility, requirementIds, readConfig, CONFIG_PATH} from '../src/delivery-records.js';
import {frontMatter} from './units-of-work.js';
import {protectedRefs} from './knowledge-baseline.js';

const BASE = 'docs/artifacts/';
const LOCKFILES = new Set(['package-lock.json', 'npm-shrinkwrap.json', 'yarn.lock', 'pnpm-lock.yaml', 'go.sum', 'Cargo.lock', 'poetry.lock', 'Gemfile.lock', 'composer.lock']);
export const CRITERIA = ['one-artifact', 'one-repository', 'patch-level', 'no-contract', 'upstream-established', 'code-limit', 'impact-contained'];
const codePath = path => !path.startsWith(BASE) && !path.startsWith('docs/artifact-driven/') && !LOCKFILES.has(path.split('/').at(-1)) && !path.split('/').includes('dist');
const list = (items, n = 5) => items.slice(0, n).join(', ') + (items.length > n ? ` and ${items.length - n} more` : '');
// The artifact that owns an impact entity, or null for code paths.
const owner = id => typeof id !== 'string' ? null : id.match(/^(?:flow|step|model):([^:]+):/)?.[1] ?? id.match(/^docs\/artifacts\/([^/]+)\//)?.[1] ?? null;
// Objects with `artifact` and `element` anywhere in a front-matter value.
function referencedElements(value, artifact, out = new Set()) {
  if (Array.isArray(value)) for (const v of value) referencedElements(v, artifact, out);
  else if (value && typeof value === 'object') {
    if (value.artifact === artifact && typeof value.element === 'string') out.add(value.element);
    for (const v of Object.values(value)) referencedElements(v, artifact, out);
  }
  return out;
}

// The difference of the working tree against the merge base with the
// protected branch: [{status, path}] and numstat rows, untracked files included.
async function difference(root, git) {
  const refs = await protectedRefs(root, git).catch(() => []);
  if (!refs.length) return null;
  const head = await git(root, ['rev-parse', '--verify', '-q', 'HEAD']).catch(() => null);
  const base = head ? await git(root, ['merge-base', refs[0].oid, head]).catch(() => null) : null;
  if (!base) return null;
  const status = (await git(root, ['diff', '--name-status', '--no-renames', base]).catch(() => '')).split('\n').filter(Boolean).map(row => {const [code, path] = row.split('\t');return {status: code[0], path};});
  const numstat = (await git(root, ['diff', '--numstat', '--no-renames', base]).catch(() => '')).split('\n').filter(Boolean).map(row => {const [added, deleted, path] = row.split('\t');return {path, lines: (Number(added) || 0) + (Number(deleted) || 0)};});
  for (const path of (await git(root, ['ls-files', '--others', '--exclude-standard']).catch(() => '')).split('\n').filter(Boolean)) {
    status.push({status: 'A', path});
    const text = await readFile(resolve(root, path), 'utf8').catch(() => '');
    numstat.push({path, lines: text ? text.split('\n').length - (text.endsWith('\n') ? 1 : 0) : 0});
  }
  return {base, protectedOid: refs[0].oid, status, numstat};
}

export async function tierCheck({root, scan, git, artifact, change, impactService = null, standalone = false}) {
  const {files, snapshot, baselines = {}} = scan;
  const prefix = `${BASE}${artifact}/`, readmePath = `${prefix}changes/${change}/README.md`;
  const declared = changeTier(files.get(readmePath) || '', readmePath);
  const {config} = readConfig(files.get(CONFIG_PATH));
  const results = new Map();
  const set = (id, result, detail) => results.set(id, {id, result, detail});
  const diff = await difference(root, git);
  const gitCriteria = ['one-artifact', 'no-contract', 'code-limit'];
  if (!diff) for (const id of gitCriteria) set(id, 'unresolved', 'No protected branch or merge base is available in local Git.');
  else {
    // one-artifact
    const briefs = path => /^docs\/artifacts\/units-of-work\/[^/]+\/README\.md$/.test(path);
    const outside = diff.status.map(s => s.path).filter(p => p.startsWith(BASE) && !p.startsWith(prefix) && p !== CONFIG_PATH && !briefs(p));
    const members = [...files].filter(([p]) => briefs(p)).map(([p, body]) => [p, frontMatter(body).value?.changes]).filter(([, m]) => Array.isArray(m) && m.some(x => x?.artifact === artifact && x?.change === change));
    const second = members.filter(([, m]) => m.some(x => !(x?.artifact === artifact && x?.change === change))).map(([p]) => p);
    if (outside.length) set('one-artifact', 'fail', `Knowledge of other artifacts changes: ${list(outside)}.`);
    else if (second.length) set('one-artifact', 'fail', `A unit brief names a second member: ${list(second)}.`);
    else set('one-artifact', 'pass', `All ${diff.status.filter(s => s.path.startsWith(BASE)).length} changed knowledge files are under ${prefix}.`);
    // no-contract
    const mine = diff.status.filter(s => s.path.startsWith(prefix));
    const problems = [], referenced = [];
    for (const s of mine) {
      const rest = s.path.slice(prefix.length);
      if (/^specifications\/flows\/.+\.md$/.test(rest) && ['A', 'D'].includes(s.status)) problems.push(`flow ${s.status === 'A' ? 'added' : 'removed'}: ${rest}`);
      if (/^decisions\/.+\.md$/.test(rest) && s.status === 'A') problems.push(`decision added: ${rest}`);
    }
    const others = new Set();
    for (const [path, body] of files) if (path.startsWith(BASE) && !path.startsWith(prefix) && path.endsWith('.md') && /^---\r?\n/.test(body)) for (const element of referencedElements(frontMatter(body).value, artifact)) others.add(element);
    for (const s of mine) if (others.has(s.path.slice(prefix.length))) referenced.push(s.path.slice(prefix.length));
    for (const s of mine.filter(s => /^requirements\/.+\.md$/.test(s.path.slice(prefix.length)) && s.status !== 'D')) {
      const before = new Set(s.status === 'A' ? [] : requirementIds(await git(root, ['show', `${diff.base}:${s.path}`]).catch(() => '')).map(r => r.id));
      const added = requirementIds(files.get(s.path) ?? await readFile(resolve(root, s.path), 'utf8').catch(() => '')).map(r => r.id).filter(id => !before.has(id));
      if (added.length) problems.push(`requirement IDs added in ${s.path.slice(prefix.length)}: ${list(added)}`);
    }
    if (referenced.length) problems.push(`changed elements that another artifact references: ${list(referenced)}`);
    set('no-contract', problems.length ? 'fail' : 'pass', problems.length ? `${problems.join('; ')}.` : 'No flow added or removed, no decision added, no requirement ID added and no referenced element changed.');
    results.get('no-contract').referenced = referenced.length > 0;
    // code-limit
    const lines = diff.numstat.filter(r => codePath(r.path)).reduce((n, r) => n + r.lines, 0), max = config.tiers.small.max_code_lines;
    set('code-limit', lines < max ? 'pass' : 'fail', `${lines} changed code and test lines; the limit is fewer than ${max}.`);
  }
  set('one-repository', 'coordinator', 'The coordinator decides whether a companion change in another repository is needed.');
  const compatibility = planCompatibility(files.get(`${prefix}changes/${change}/tasks/README.md`) || '').compatibility;
  set('patch-level', compatibility === 'patch' ? 'pass' : 'fail', compatibility ? `The plan declares compatibility: ${compatibility}.` : 'The plan declares no compatibility.');
  // upstream-established
  const working = parseArtifact(artifact, files.get(`${prefix}README.md`) || '', [], snapshot.artifacts.find(a => a.id === artifact)?.layout || 'in-place');
  const protectedOid = diff?.protectedOid ?? (await protectedRefs(root, git).catch(() => []))[0]?.oid;
  const missing = [];
  for (const dependency of working.dependsOn || []) {
    const version = baselines[dependency]?.state === 'available' ? baselines[dependency].currentVersion : protectedOid ? await git(root, ['show', `${protectedOid}:${BASE}${dependency}/README.md`]).then(text => parseArtifact(dependency, text, [], 'legacy').currentVersion, () => null) : null;
    if (!version) missing.push(dependency);
  }
  set('upstream-established', missing.length ? 'fail' : 'pass', missing.length ? `No established version on the protected branch: ${list(missing)}.` : `${(working.dependsOn || []).length} upstream artifacts have an established version.`);
  // impact-contained
  if (standalone) set('impact-contained', 'coordinator', 'The standalone validator builds no impact index; the coordinator records the impact assessment in the change README.');
  else if (!impactService) set('impact-contained', 'unresolved', 'No impact index is available.');
  else {
    try {
      const answer = await impactService.query({path: root, diff: {base: 'protected'}, depth: 2, limit: 200});
      const reached = [...(answer.data?.direct || []), ...(answer.data?.transitive || [])].map(e => e.entity ?? e.id);
      const foreign = [...new Set(reached.filter(id => {const o = owner(id);return o && o !== artifact && o !== 'units-of-work';}))];
      const unresolved = answer.data?.unresolved || [];
      if (foreign.length) set('impact-contained', 'fail', `The impact reaches entities of other artifacts: ${list(foreign)}.`);
      else if (unresolved.length) set('impact-contained', 'unresolved', `${unresolved.length} reached items are unresolved in the coverage statement.`);
      else set('impact-contained', 'pass', `${reached.length} reached entities, none outside ${artifact}; completeness ${answer.completeness}.`);
    } catch (error) {set('impact-contained', 'unresolved', `The impact index is not available: ${error.message}`);}
  }
  const criteria = CRITERIA.map(id => results.get(id));
  const large = results.get('one-artifact').result === 'fail' || (results.get('no-contract').result === 'fail' && results.get('no-contract').referenced);
  const allowed = criteria.every(c => ['pass', 'coordinator'].includes(c.result)) ? 'small' : large ? 'large' : 'medium';
  for (const c of criteria) delete c.referenced;
  const diagnostics = declared.declared && declared.tier === 'small' && allowed !== 'small'
    ? [{code: 'tier-mismatch', severity: 'error', path: readmePath, message: `The change declares tier small, but ${criteria.filter(c => ['fail', 'unresolved'].includes(c.result)).map(c => `${c.id} is ${c.result}`).join(', ')}.`}]
    : [];
  return {tier: {declared: declared.tier, allowed, criteria}, diagnostics};
}
