// Migrate legacy ADD artifacts to the in-place layout with the six-step ADD
// procedure. Dry-run by default; --write applies the plan. Writes only inside
// docs/artifacts of the selected worktree. Optional tool: the same steps work by hand.
// Usage: node scripts/migrate-layout.mjs <repository> [--artifact <id>] [--version <v>] [--write]
//        node scripts/migrate-layout.mjs <repository> --convert-history [--artifact <id>] [--write]
import {readFile, writeFile, mkdir, rm, rmdir, readdir, lstat, realpath} from 'node:fs/promises';
import {blobId} from '../server/knowledge-baseline.js';
import {resolve, relative, dirname, isAbsolute, sep} from 'node:path';
import {parseDocument} from 'yaml';
import {marked} from 'marked';
import {scanRepository, git} from '../server/reader.js';
import {buildSnapshot, effectiveEdges, KNOWLEDGE_KINDS} from '../src/model.js';
import {versionClaims} from '../server/units-of-work.js';

const BASE = 'docs/artifacts/';
const DECLARATIONS = ['current established version', 'current version', 'established dependencies', 'dependencies', 'active change'];
const semver = v => v.split('.').map(Number);
const newer = (a, b) => {const [x, y] = [semver(a), semver(b)];for (let i = 0; i < 3; i++) if (x[i] !== y[i]) return x[i] > y[i];return false;};
export class MigrationError extends Error {}
// Remove Markdown declaration sections; readers derive these facts in place.
function identityReadme(markdown, version, dependsOn) {
  const match = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  const doc = parseDocument(match ? match[1] : '');
  if (doc.errors.length) throw new MigrationError('The README front matter is invalid YAML.');
  if (!doc.contents) doc.contents = doc.createNode({});
  doc.set('current_version', version);
  doc.set('depends_on', doc.createNode(dependsOn, {flow: true}));
  const body = match ? markdown.slice(match[0].length) : markdown, tokens = marked.lexer(body), kept = [];
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (t.type === 'heading' && DECLARATIONS.includes(t.text.trim().toLowerCase())) {
      while (i + 1 < tokens.length && !(tokens[i + 1].type === 'heading' && tokens[i + 1].depth <= t.depth)) i++;
      continue;
    }
    kept.push(t.raw);
  }
  const front = doc.toString().trimEnd().replace(/^depends_on: \[ (.*) \]$/m, 'depends_on: [$1]');
  return `---\n${front}\n---\n\n${kept.join('').replace(/\n{3,}/g, '\n\n').trim()}\n`;
}
export async function planMigration(path, {artifact = null, version = null} = {}) {
  const {snapshot, files} = await scanRepository(resolve(path), {historicalKnowledge: true});
  const root = snapshot.repository.path, plans = [], diagnostics = [];
  const legacy = snapshot.artifacts.filter(a => a.layout === 'legacy');
  const selected = artifact ? legacy.filter(a => a.id === artifact) : legacy;
  if (artifact && !selected.length) throw new MigrationError(`${artifact} is not a legacy artifact in this repository.`);
  if (version && !artifact) throw new MigrationError('--version needs --artifact.');
  const declarationErrors = new Set(snapshot.diagnostics.filter(d => ['ambiguous-version', 'ambiguous-dependencies', 'invalid-active-change', 'multiple-changes'].includes(d.code)).map(d => d.path.split('/')[2]));
  for (const a of selected) {
    const prefix = `${BASE}${a.id}/`;
    if (declarationErrors.has(a.id)) throw new MigrationError(`${a.id}: identity declarations are ambiguous; resolve them before migration.`);
    // Step 1: the declared version must be the newest complete snapshot, or confirmed.
    const versions = [...new Set([...files.keys()].map(p => p.slice(prefix.length).match(/^versions\/(\d+\.\d+\.\d+)\//)?.[1]).filter(Boolean))];
    const current = version ?? a.currentVersion;
    if (current && !versions.includes(current)) throw new MigrationError(`${a.id}: version ${current} has no snapshot.`);
    const later = versions.filter(v => !current || newer(v, current));
    if (later.length && !version) throw new MigrationError(`${a.id}: declared version ${current ?? 'none'} is older than ${later.join(', ')}; reconcile the declaration and rerun with --version.`);
    // Step 2: copy from the open change when it carries copied knowledge, else from the version.
    const open = a.activeChange && !versionClaims(files, a.id, a.activeChange).length ? a.activeChange : null;
    const source = open && [...files.keys()].some(p => KNOWLEDGE_KINDS.some(k => p.startsWith(`${prefix}changes/${open}/${k}/`))) ? `${prefix}changes/${open}/` : current ? `${prefix}versions/${current}/` : null;
    if (!source) throw new MigrationError(`${a.id}: no snapshot or open change holds knowledge to migrate.`);
    const copies = [...files.keys()].filter(p => p.startsWith(source) && KNOWLEDGE_KINDS.includes(p.slice(source.length).split('/')[0])).sort();
    const create = copies.map(p => [prefix + p.slice(source.length), p]);
    const remove = source.includes('/changes/') ? [...copies] : [];
    // Step 4: apply an open change's dependency proposal.
    let dependsOn = [...a.dependsOn];
    const proposal = open && `${prefix}changes/${open}/dependencies.yaml`;
    if (proposal && files.has(proposal)) {
      const value = parseDocument(files.get(proposal)).toJS();
      dependsOn = [...new Set([...dependsOn.filter(d => !(value?.remove || []).includes(d)), ...(value?.add || [])])].sort();
      remove.push(proposal);
    }
    // Step 3: replace declarations with the identity record.
    const readme = identityReadme(files.get(`${prefix}README.md`), current ?? null, dependsOn);
    const review = marked.lexer(readme.replace(/^---\n[\s\S]*?\n---\n/, '')).filter(t => t.type === 'heading' && t.depth > 1).map(t => t.text);
    plans.push({artifact: a.id, version: current ?? null, source, openChange: open, dependsOn, create: create.map(([to, from]) => ({path: to, from})), change: [`${prefix}README.md`], delete: remove.sort(), review, readme});
  }
  // Step 4: delete the index when no legacy artifact remains.
  const remaining = legacy.filter(a => !selected.includes(a));
  const index = files.has(`${BASE}dag.yaml`) && !remaining.length ? `${BASE}dag.yaml` : null;
  // Step 6: verify the planned tree before any write.
  const after = new Map(files);
  for (const plan of plans) {
    for (const {path: to, from} of plan.create) after.set(to, files.get(from));
    for (const path of plan.delete) after.delete(path);
    after.set(`${BASE}${plan.artifact}/README.md`, plan.readme);
  }
  if (index) after.delete(index);
  const view = buildSnapshot(after, snapshot.repository, []);
  for (const plan of plans) {
    const migrated = view.artifacts.find(a => a.id === plan.artifact);
    plan.layout = migrated?.layout ?? null;
    plan.equivalent = plan.create.every(({path: to, from}) => after.get(to) === files.get(from));
    if (plan.layout !== 'in-place' || !plan.equivalent) diagnostics.push({code: 'migration-verification', path: `${BASE}${plan.artifact}/`, message: 'The planned tree is not an equivalent in-place artifact.'});
  }
  const edges = s => [...new Set(effectiveEdges(s.edges, true).map(e => e.source + '>' + e.target))].sort();
  diagnostics.push(...view.diagnostics.filter(d => d.severity !== 'info' && !snapshot.diagnostics.some(x => x.code === d.code && x.path === d.path)).map(d => ({...d, code: `after-${d.code}`})));
  return {root, plans, index, graph: {before: edges(snapshot), after: edges(view)}, diagnostics};
}
async function contained(root, path) {
  const target = resolve(root, path), base = await realpath(resolve(root, 'docs/artifacts'));
  const r = relative(base, target);
  if (!path.startsWith(BASE) || r === '..' || r.startsWith('..' + sep) || isAbsolute(r)) throw new MigrationError(`Refusing to write outside docs/artifacts: ${path}`);
  for (let dir = dirname(target); dir.length > base.length; dir = dirname(dir)) {const info = await lstat(dir).catch(() => null);if (info?.isSymbolicLink()) throw new MigrationError(`Refusing to write through a symlink: ${path}`);}
  return target;
}
export async function applyMigration(result) {
  const {root} = result;
  for (const plan of result.plans) {
    for (const {path, from} of plan.create) {const target = await contained(root, path);if (await lstat(target).catch(() => null)) throw new MigrationError(`Refusing to overwrite ${path}`);}
  }
  for (const plan of result.plans) {
    for (const {path, from} of plan.create) {const target = await contained(root, path);await mkdir(dirname(target), {recursive: true});await writeFile(target, await readFile(await contained(root, from)), {flag: 'wx'});}
    await writeFile(await contained(root, `${BASE}${plan.artifact}/README.md`), plan.readme);
    for (const path of plan.delete) await rm(await contained(root, path));
  }
  if (result.index) await rm(await contained(root, result.index));
}
// Step 5 (optional): convert retained legacy records of in-place artifacts.
// Every deleted file must be tracked in HEAD with the same bytes, so Git keeps it.
const LINK = /\]\(([^)\s]+)\)|^\s*source:\s*(\S+)\s*$/gm;
export async function planConversion(path, {artifact = null} = {}) {
  const {snapshot} = await scanRepository(resolve(path));
  const root = snapshot.repository.path, plans = [], diagnostics = [];
  const tracked = new Map((await git(root, ['ls-tree', '-r', '-z', '--format=%(objectname)%x09%(path)', 'HEAD', '--', 'docs/artifacts'], true)).split('\0').filter(Boolean).map(row => {const i = row.indexOf('\t');return [row.slice(i + 1), row.slice(0, i)];}));
  const selected = snapshot.artifacts.filter(a => !artifact || a.id === artifact);
  if (artifact && !selected.length) throw new MigrationError(`${artifact} does not exist.`);
  for (const a of selected) if (a.layout !== 'in-place') throw new MigrationError(`${a.id}: migrate it to the in-place layout before converting its history.`);
  const files = [...tracked.keys()];
  for (const a of selected) {
    const prefix = `${BASE}${a.id}/`, remove = new Set(), change = [], retained = [];
    for (const v of a.versions || []) {
      const dir = `${prefix}versions/${v.version}/`;
      for (const p of files) if (p.startsWith(dir) && KNOWLEDGE_KINDS.includes(p.slice(dir.length).split('/')[0])) remove.add(p);
      const tasks = files.filter(p => p.startsWith(`${dir}tasks/`));
      if (tasks.length) {
        const origin = v.sourceChange ? `${prefix}changes/${v.sourceChange}/tasks/` : null;
        const copies = origin && files.filter(p => p.startsWith(origin));
        const identical = copies && copies.length === tasks.length && tasks.every(p => tracked.get(origin + p.slice(`${dir}tasks/`.length)) === tracked.get(p));
        if (identical) tasks.forEach(p => remove.add(p));
        else retained.push({path: `${dir}tasks/`, reason: origin ? 'The originating change has no byte-identical task copy.' : 'No originating change is recorded; moving the tasks would invent provenance.'});
      }
      const readme = await readFile(resolve(root, v.path), 'utf8');
      if (/^---\r?\n[\s\S]*?^delivery_tasks:.*$/m.test(readme)) change.push({path: v.path, text: readme.replace(/^delivery_tasks:.*\r?\n/m, '')});
    }
    for (const c of a.changes) {
      const dir = `${prefix}changes/${c.name}/`;
      // Only delivered changes lose their copies; an undelivered legacy change
      // keeps them, so it stays a retained record and never looks open.
      const copies = files.filter(p => p.startsWith(dir) && KNOWLEDGE_KINDS.includes(p.slice(dir.length).split('/')[0]));
      if (copies.length && !c.version) retained.push({path: dir, reason: 'No version record names this change; its copied knowledge is its only proposal record.'});
      else copies.forEach(p => remove.add(p));
      if (files.includes(`${dir}dependencies.yaml`)) {
        if (c.name === a.activeChange) retained.push({path: `${dir}dependencies.yaml`, reason: 'The open change still proposes these edges; apply them to depends_on first.'});
        else remove.add(`${dir}dependencies.yaml`);
      }
    }
    for (const p of [...remove]) {
      const bytes = await readFile(resolve(root, p)).catch(() => null);
      // A file already deleted from the working tree is converted; Git keeps it in HEAD.
      if (!bytes) {remove.delete(p);continue;}
      if (blobId(bytes, tracked.get(p).length) !== tracked.get(p)) diagnostics.push({code: 'conversion-unsafe', path: p, message: 'The file differs from HEAD; commit or restore it before conversion.'});
    }
    plans.push({artifact: a.id, delete: [...remove].sort(), change, retained});
  }
  // Report references into removed files; links need an author's decision.
  const removed = new Set(plans.flatMap(p => p.delete)), references = [];
  for (const p of files.filter(p => p.endsWith('.md') && !removed.has(p))) {
    const text = await readFile(resolve(root, p), 'utf8').catch(() => '');
    for (const m of text.matchAll(LINK)) {
      const href = (m[1] || m[2]).split('#')[0];
      if (!href || /^[a-z]+:/i.test(href)) continue;
      const target = href.startsWith('docs/') ? href : relative(root, resolve(root, dirname(p), href)).split(sep).join('/');
      if (removed.has(target) || [...removed].some(r => r.startsWith(target.replace(/\/?$/, '/')))) references.push({file: p, target: href});
    }
  }
  return {root, plans, references, diagnostics};
}
export async function applyConversion(result) {
  const {root} = result, dirs = new Set();
  for (const plan of result.plans) {
    for (const p of plan.delete) {const target = await contained(root, p);await rm(target);dirs.add(dirname(target));}
    for (const {path, text} of plan.change) await writeFile(await contained(root, path), text);
  }
  // Remove directories that the deletion left empty.
  for (const dir of [...dirs].sort((a, b) => b.length - a.length)) for (let d = dir; d.startsWith(resolve(root, 'docs/artifacts') + sep); d = dirname(d)) {
    const entries = await readdir(d).catch(() => null);
    if (!entries || entries.length) break;
    await rmdir(d);
  }
}
// Set exitCode instead of exiting so large JSON reports flush to pipes.
async function main() {
  const args = process.argv.slice(2), flag = name => {const i = args.indexOf(name);return i < 0 ? false : args.splice(i, 1) && true;}, option = name => {const i = args.indexOf(name);return i < 0 ? null : args.splice(i, 2)[1];};
  const write = flag('--write'), history = flag('--convert-history'), artifact = option('--artifact'), version = option('--version'), [path] = args;
  if (history) {
    try {
      const result = await planConversion(path, {artifact});
      if (write && !result.diagnostics.length) await applyConversion(result);
      console.log(JSON.stringify({mode: write ? 'write' : 'dry-run', written: write && !result.diagnostics.length, ...result, plans: result.plans.map(({change, ...plan}) => ({...plan, change: change.map(c => c.path)}))}, null, 1));
      return result.diagnostics.length ? 1 : 0;
    } catch (error) {console.log(JSON.stringify({error: error.message}));return error instanceof MigrationError ? 3 : 2;}
  }
  if (!path) {console.error('Usage: migrate-layout.mjs <repository> [--artifact <id>] [--version <v>] [--write]');return 2;}
  try {
    const result = await planMigration(path, {artifact, version});
    if (write && !result.diagnostics.length) await applyMigration(result);
    console.log(JSON.stringify({mode: write ? 'write' : 'dry-run', written: write && !result.diagnostics.length, ...result, plans: result.plans.map(({readme, ...plan}) => plan)}, null, 1));
    return result.diagnostics.length ? 1 : 0;
  } catch (error) {console.log(JSON.stringify({error: error.message}));return error instanceof MigrationError ? 3 : 2;}
}
// Match the file name: in a server bundle this module shares import.meta.url with the entry.
if (process.argv[1]?.endsWith('migrate-layout.mjs')) process.exitCode = await main();
