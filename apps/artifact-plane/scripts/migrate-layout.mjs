// Migrate legacy ADD artifacts to the in-place layout with the six-step ADD
// procedure. Dry-run by default; --write applies the plan. Writes only inside
// docs/artifacts of the selected worktree. Optional tool: the same steps work by hand.
// Usage: node scripts/migrate-layout.mjs <repository> [--artifact <id>] [--version <v>] [--write]
import {readFile, writeFile, mkdir, rm, lstat, realpath} from 'node:fs/promises';
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
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2), flag = name => {const i = args.indexOf(name);return i < 0 ? false : args.splice(i, 1) && true;}, option = name => {const i = args.indexOf(name);return i < 0 ? null : args.splice(i, 2)[1];};
  const write = flag('--write'), artifact = option('--artifact'), version = option('--version'), [path] = args;
  if (!path) {console.error('Usage: migrate-layout.mjs <repository> [--artifact <id>] [--version <v>] [--write]');process.exit(2);}
  try {
    const result = await planMigration(path, {artifact, version});
    if (write && !result.diagnostics.length) await applyMigration(result);
    console.log(JSON.stringify({mode: write ? 'write' : 'dry-run', written: write && !result.diagnostics.length, ...result, plans: result.plans.map(({readme, ...plan}) => plan)}, null, 1));
    process.exit(result.diagnostics.length ? 1 : 0);
  } catch (error) {console.log(JSON.stringify({error: error.message}));process.exit(error instanceof MigrationError ? 3 : 2);}
}
