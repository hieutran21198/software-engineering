// Domain operations over ADD knowledge. Each operation derives paths and
// identifiers, plans file edits, validates the post-image with the readers and
// writes through knowledge-writer.js. The repository stays the only state.
import {readFile, realpath} from 'node:fs/promises';
import {resolve, relative, isAbsolute, sep} from 'node:path';
import {scanRepository, git as runGit, ExploreError} from './reader.js';
import {buildSnapshot, safeElementPath} from '../src/model.js';
import {buildTaskGraph} from './task-graph.js';
import {checklist, declaredChange} from './workflow.js';
import {unitBriefs, safeKnowledgePath, evidenceDetail, publicationReviews} from './units-of-work.js';
import {buildFlowGraph, safeFlowID, safeFlowSource} from './flow-model.js';
import {planMigration, MigrationError} from '../scripts/migrate-layout.mjs';
import {EditError, editFrontMatter, setFrontMatterText, replaceBody, replaceSection, readSection, sectionAnchors, setCheckbox, checklistItems, splitDocument, frontValue, writePlan, readPlan, undoPlan, createJournal, serialize, requireEditableBranch, digestOf, anchorOf} from './knowledge-writer.js';
import {resolveWorktree, gitStatus} from './knowledge-git.js';

const BASE = 'docs/artifacts/';
const VERSION = /^\d+\.\d+\.\d+$/;
const RESULTS = ['passed', 'failed', 'incomplete'];
const KINDS = {requirement: 'requirements', specification: 'specifications', decision: 'decisions'};
const fail = (field, message, status = 422) => {throw new EditError(status, message, {code: 'invalid-input', field});};
const missing = message => {throw new EditError(404, message, {code: 'missing'});};

// --- Identifiers and inputs ---------------------------------------------------
export function slug(text) {
  return String(text ?? '').normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}
export function uniqueId(base, taken) {
  const used = new Set(taken);
  if (!used.has(base)) return base;
  for (let n = 2; ; n++) if (!used.has(`${base}-${n}`)) return `${base}-${n}`;
}
function identifier(input, field, from, taken, {prefix = '', max = 60} = {}) {
  if (input[field] !== undefined) {
    const value = input[field];
    if (typeof value !== 'string' || !/^[a-z0-9][a-z0-9-]*$/.test(value) || slug(value) !== value || !value.startsWith(prefix)) fail(field, `${field} must use lowercase letters, digits and single hyphens${prefix ? ` and start with ${prefix}` : ''}.`);
    if (new Set(taken).has(value)) fail(field, `${value} already exists.`, 409);
    return value;
  }
  let base = slug(from).slice(0, max).replace(/-+$/, '');
  if (prefix && base.startsWith(prefix)) base = base.slice(prefix.length);
  if (!/^[a-z0-9]/.test(base)) fail('title', 'The title must contain letters or digits.');
  return uniqueId(prefix + base, taken);
}
function text(input, field, {required = true, max = 20000} = {}) {
  const value = input[field];
  if (value === undefined || value === null || value === '') {if (required) fail(field, `${field} is required.`);return '';}
  if (typeof value !== 'string' || value.length > max || value.includes('\0')) fail(field, `${field} must be text of at most ${max} characters.`);
  if (required && !value.trim()) fail(field, `${field} is required.`);
  return value.trim();
}
function oneLine(input, field, options) {
  const value = text(input, field, {max: 500, ...options});
  if (/[\r\n]/.test(value)) fail(field, `${field} must be one line.`);
  return value;
}
function list(input, field, check = () => true, {required = false, max = 200} = {}) {
  const value = input[field];
  if (value === undefined) {if (required) fail(field, `${field} is required.`);return [];}
  if (!Array.isArray(value) || value.length > max || !value.every(check)) fail(field, `${field} has an invalid entry.`);
  return value;
}
const ids = value => typeof value === 'string' && /^[a-z0-9][a-z0-9-]*$/.test(value);
const nonempty = value => typeof value === 'string' && value.trim().length > 0 && value.length <= 20000;
function result(input) {const value = input.result;if (!RESULTS.includes(value)) fail('result', 'result must be passed, failed or incomplete.');return value;}
const httpsURL = value => {try {const url = new URL(value);return url.protocol === 'https:' && !url.username && !url.password && !url.search && !url.hash ? url : null;} catch {return null;}};

// --- Templates -----------------------------------------------------------------
// Headings and short placeholders only; never a passed self-check or a checked item.
const TEMPLATES = {
  requirement: title => `# ${title}\n\n## Need and constraints\n\nDescribe the need, its scope and its constraints. Replace this text.\n\n## Acceptance criteria\n\n1. State one observable criterion. Replace this item.\n\n## Self-check\n\nNot recorded.\n`,
  specification: title => `# ${title}\n\n## Governing requirement\n\nName the requirement that this specification governs. Replace this text.\n\n## Behavior and interfaces\n\nDescribe the behavior, interfaces and limits. Replace this text.\n\n## Self-check\n\nNot recorded.\n`,
  decision: title => `# ${title}\n\n## Context\n\nDescribe the problem and the forces. Replace this text.\n\n## Alternatives\n\nList the options that you evaluated. Replace this text.\n\n## Decision\n\nState the selected option. Replace this text.\n\n## Consequences\n\nDescribe the results of the decision. Replace this text.\n`,
};
const changeReadme = (title, reason, scope, baseline) => `# ${title}\n\n## Reason and scope\n\n${reason}\n${scope ? `\n${scope}\n` : ''}\n## Baseline and ownership\n\n${baseline}\n`;
const planReadme = title => `---\ntasks: []\n---\n\n# ${title} plan\n\n## Approval and prerequisites\n\nPresent this plan for explicit approval before implementation. Name the prerequisites here.\n\n## Plan self-check\n\nNot recorded.\n`;
const prerequisiteText = deps => deps.length ? `Tasks ${deps.join(', ')}.` : 'No internal prerequisite.';
const dodText = (items, checked = new Map()) => (items.length ? items : ['Describe one observable result. Replace this item.']).map(item => `- [${checked.get(item) ? 'x' : ' '}] ${item}`).join('\n');
function taskFile(id, deps, title, scope, dod) {
  return editFrontMatter('', [{op: 'set', path: ['id'], value: id}, {op: 'set', path: ['depends_on'], value: deps}]) +
    `\n# ${title}\n\n## Scope and ownership\n\n${scope || 'Name the files and modules that this task owns. Replace this text.'}\n\n## Governing knowledge\n\nName the requirements and specifications that govern this task. Replace this text.\n\n## Prerequisites\n\n${prerequisiteText(deps)}\n\n## Definition of Done\n\n${dodText(dod)}\n\n## Evidence\n\nImplementation has not started.\n`;
}

// --- Context -------------------------------------------------------------------
async function context(target, git) {
  const scan = await scanRepository(target, {git});
  const files = scan.files, snapshot = scan.snapshot;
  const artifacts = new Map(snapshot.artifacts.map(a => [a.id, a]));
  const layouts = Object.fromEntries(snapshot.artifacts.map(a => [a.id, a.layout]));
  const delivered = new Set(snapshot.artifacts.flatMap(a => a.changes.filter(c => c.version).map(c => `${a.id}/${c.name}`)));
  // A change named by any version record is delivered, also in legacy records.
  for (const path of files.keys()) {
    const m = path.match(/^docs\/artifacts\/([^/]+)\/versions\/\d+\.\d+\.\d+\/README\.md$/);
    if (!m) continue;
    try {const source = frontValue(files.get(path)).source_change;if (typeof source === 'string') delivered.add(`${m[1]}/${source}`);} catch { /* Invalid records are diagnosed by the readers. */ }
  }
  const ctx = {root: target, git, scan, files, snapshot, artifacts, layouts, delivered};
  ctx.read = async path => {
    if (files.has(path) && files.get(path) !== '') return files.get(path);
    if (!safeKnowledgePath(path)) missing(`Knowledge file does not exist: ${path}`);
    const real = await realpath(resolve(target, path)).catch(() => null), rel = real && relative(target, real);
    if (!real || rel === '..' || rel.startsWith('..' + sep) || isAbsolute(rel)) missing(`Knowledge file does not exist: ${path}`);
    return readFile(real, 'utf8');
  };
  ctx.exists = path => files.has(path) && (files.get(path) !== '' || !path.endsWith('/README.md'));
  return ctx;
}
function artifactOf(ctx, id, field = 'artifact') {
  if (!ids(id)) fail(field, `${field} must be an artifact ID.`);
  const artifact = ctx.artifacts.get(id);
  if (!artifact) missing(`Artifact ${id} does not exist.`);
  if (artifact.layout !== 'in-place') throw new EditError(422, `${id} uses the legacy layout. Migrate it to the in-place layout before you edit it.`, {code: 'protected-record', field});
  return artifact;
}
function changeOf(ctx, artifact, name, {open = true} = {}) {
  if (typeof name !== 'string' || !/^change-[a-z0-9][a-z0-9-]*$/.test(name)) fail('change', 'change must be a change name.');
  const change = artifact.changes.find(c => c.name === name);
  if (!change) missing(`Change ${name} does not exist in ${artifact.id}.`);
  if (open && (change.version || ctx.delivered.has(`${artifact.id}/${name}`))) throw new EditError(422, `${name} is delivered in version ${change.version}; its plan cannot change.`, {code: 'protected-record', field: 'change'});
  return change;
}
const changePrefix = (artifact, change) => `${BASE}${artifact}/changes/${change}/`;
function unitOf(ctx, id) {
  if (!ids(id)) fail('unit', 'unit must be a unit ID.');
  const path = `${BASE}units-of-work/${id}/README.md`;
  if (!ctx.files.has(path)) missing(`Unit of work ${id} does not exist.`);
  return {id, path, text: ctx.files.get(path), value: frontValue(ctx.files.get(path))};
}
function flowsOf(ctx, artifact) {
  const prefix = `${BASE}${artifact}/specifications/flows/`, result = [];
  for (const [path, body] of ctx.files) if (path.startsWith(prefix) && path.endsWith('.md')) {
    let value = null;try {value = frontValue(body).flow;} catch { /* Diagnosed by the readers. */ }
    result.push({path, id: value?.id, value});
  }
  return result;
}
function flowOf(ctx, artifactId, id) {
  artifactOf(ctx, artifactId);
  if (!ids(id)) fail('flow', 'flow must be a flow ID.');
  const flow = flowsOf(ctx, artifactId).find(f => f.id === id);
  if (!flow) missing(`Flow ${id} does not exist in ${artifactId}.`);
  if (!flow.value || typeof flow.value !== 'object' || Array.isArray(flow.value)) throw new EditError(422, 'The flow front matter is not a flow object. Use the advanced front-matter editor.', {code: 'invalid-flow'});
  const value = flow.value;
  for (const key of ['steps', 'transitions', 'support', 'entry_steps']) if (value[key] !== undefined && !Array.isArray(value[key])) throw new EditError(422, `Flow ${key} is not a list. Use the advanced front-matter editor.`, {code: 'invalid-flow'});
  return {...flow, text: ctx.files.get(flow.path), steps: value.steps || [], transitions: value.transitions || [], support: value.support || [], entry: value.entry_steps || []};
}
function documentPath(ctx, path, {working = false, field = 'path'} = {}) {
  if (!safeKnowledgePath(path)) fail(field, `${field} must be a Markdown path inside docs/artifacts.`);
  if (!ctx.files.has(path)) missing(`Knowledge file does not exist: ${path}`);
  if (working) {
    const [, artifact, ...rest] = path.slice(BASE.length - 1).split('/');
    const owner = ctx.artifacts.get(artifact);
    if (!owner || owner.layout !== 'in-place' || !safeElementPath(rest.join('/')) || rest[0] === 'tasks') fail(field, 'Select a requirement, specification or decision of an in-place artifact.');
  }
  return path;
}

// --- Operations ----------------------------------------------------------------
const create = (path, after) => ({path, action: 'create', after});
const replace = (path, after) => ({path, action: 'replace', after});
const remove = path => ({path, action: 'delete'});
function flowPlan(flow, edits) {return [replace(flow.path, editFrontMatter(flow.text, edits))];}
function selfCheckAnchor(text, fallback) {
  const anchors = sectionAnchors(text).map(h => h.anchor).filter(a => a === fallback || a === 'self-check' || a.endsWith('-self-check'));
  return anchors.includes(fallback) ? fallback : anchors.at(-1) || fallback;
}
function headingFor(fragment) {return fragment.charAt(0).toUpperCase() + fragment.slice(1).replace(/-/g, ' ');}
function recordSelfCheck(path, text, value, detail, fallback) {
  const fragment = selfCheckAnchor(text, fallback);
  const withSection = replaceSection(text, fragment, detail, {heading: headingFor(fragment)});
  return editFrontMatter(withSection, [{op: 'set', path: ['self_check'], value: {result: value, source: `${path}#${fragment}`}}]);
}
function upsertSubsection(text, parent, parentHeading, child, detail) {
  if (sectionAnchors(text).some(h => h.anchor === child && h.depth > 2)) return replaceSection(text, child, detail);
  const current = readSection(text, parent);
  const kept = !current || /^Implementation has not started\.?$/i.test(current) || /^No evidence is recorded yet\.?$/i.test(current) ? '' : current + '\n\n';
  return replaceSection(text, parent, `${kept}### ${child}\n\n${detail.trim()}`, {heading: parentHeading});
}
function nextVersion(current, level) {
  if (!current) return '1.0.0';
  const [major, minor, patch] = current.split('.').map(Number);
  return level === 'major' ? `${major + 1}.0.0` : level === 'minor' ? `${major}.${minor + 1}.0` : `${major}.${minor}.${patch + 1}`;
}
function remoteRepository(url) {
  const ssh = url.match(/^(?:ssh:\/\/)?git@([^:/]+)[:/](.+?)(?:\.git)?\/?$/);
  if (ssh) return `https://${ssh[1]}/${ssh[2]}`;
  const https = httpsURL(url.replace(/\.git$/, ''));
  return https ? https.href.replace(/\/$/, '') : null;
}
async function trackedFile(ctx, path) {
  return ctx.git(ctx.root, ['ls-files', '--error-unmatch', '--', path]).then(() => true, () => false);
}
function supportTarget(ctx, input, field = 'kind') {
  const kind = input.kind;
  if (!['element', 'flow', 'implementation', 'test'].includes(kind)) fail(field, 'kind must be element, flow, implementation or test.');
  if (kind === 'element') {
    const owner = ctx.artifacts.get(input.target?.artifact);
    if (!owner) fail('target', 'Select a target artifact.');
    if (!safeElementPath(input.target.element)) fail('target', 'Select a target document.');
    const source = owner.layout === 'in-place' ? `${BASE}${owner.id}/${input.target.element}` : `${BASE}${owner.id}/versions/${owner.currentVersion}/${input.target.element}`;
    if (!ctx.files.has(source)) fail('target', `${owner.id}/${input.target.element} does not exist.`);
    return {kind, artifact: owner.id, element: input.target.element};
  }
  if (kind === 'flow') {
    if (!ctx.artifacts.has(input.target?.artifact) || !flowsOf(ctx, input.target.artifact).some(f => f.id === input.target.flow)) fail('target', 'Select an existing flow.');
    return {kind, artifact: input.target.artifact, flow: input.target.flow};
  }
  if (!safeFlowSource(input.target?.path)) fail('target', 'Select a safe tracked source file.');
  return {kind, path: input.target.path, ...(input.target.symbol ? {symbol: oneLine(input.target, 'symbol')} : {})};
}
async function checkTracked(ctx, support, evidence) {
  if (['implementation', 'test'].includes(support.kind) && !await trackedFile(ctx, support.path)) fail('target', `${support.path} is not a tracked file.`);
  for (const path of evidence) if (!safeFlowSource(path) || !await trackedFile(ctx, path)) fail('evidence', `${path} is not a tracked file.`);
}
function supportBasis(input, current = {}) {
  const basis = input.basis ?? current.basis ?? 'documented';
  if (!['documented', 'static', 'observed', 'inferred'].includes(basis)) fail('basis', 'basis must be documented, static, observed or inferred.');
  const evidence = input.evidence === undefined ? current.evidence || [] : list(input, 'evidence', p => typeof p === 'string', {max: 50});
  if (basis === 'observed' && !evidence.length) fail('evidence', 'Observed support needs at least one evidence file.');
  return {basis, evidence};
}

export const OPERATIONS = {
  async 'artifact.create'(ctx, input) {
    const title = oneLine(input, 'title'), purpose = text(input, 'purpose', {required: false});
    const taken = [...ctx.artifacts.keys(), 'units-of-work', ...[...ctx.files.keys()].map(p => p.split('/')[2])];
    const id = identifier(input, 'id', title, taken);
    const dependsOn = [...new Set(list(input, 'dependsOn', ids))].sort();
    for (const dep of dependsOn) if (!ctx.artifacts.has(dep)) fail('dependsOn', `Artifact ${dep} does not exist.`);
    const prefix = `${BASE}${id}/`;
    const readme = editFrontMatter('', [{op: 'set', path: ['current_version'], value: null}, {op: 'set', path: ['depends_on'], value: dependsOn}]) + `\n# ${title}\n\n${purpose || 'Describe the purpose and scope of this artifact. Replace this text.'}\n`;
    return {edits: [
      create(`${prefix}README.md`, readme),
      create(`${prefix}requirements/${id}.md`, TEMPLATES.requirement(`${title} requirements`)),
      create(`${prefix}changes/change-initial/README.md`, changeReadme('Initial change', `Create the first version of ${title}.`, purpose, `${id} has no established version. The ${id} owner owns this change.`)),
      create(`${prefix}changes/change-initial/tasks/README.md`, planReadme('Initial change')),
    ], layouts: {[id]: 'in-place'}, result: {artifact: id, change: 'change-initial', path: `${prefix}requirements/${id}.md`}};
  },
  async 'artifact.dependencies.set'(ctx, input) {
    const artifact = artifactOf(ctx, input.artifact);
    const dependsOn = [...new Set(list(input, 'dependsOn', ids, {required: true}))].sort();
    for (const dep of dependsOn) {if (dep === artifact.id) fail('dependsOn', 'An artifact cannot depend on itself.');if (!ctx.artifacts.has(dep)) fail('dependsOn', `Artifact ${dep} does not exist.`);}
    const path = `${BASE}${artifact.id}/README.md`;
    return {edits: [replace(path, editFrontMatter(await ctx.read(path), [{op: 'set', path: ['depends_on'], value: dependsOn}]))], result: {artifact: artifact.id, dependsOn}};
  },
  async 'change.start'(ctx, input) {
    const artifact = artifactOf(ctx, input.artifact);
    const open = artifact.changes.filter(c => c.layout === 'in-place' && !c.version);
    if (open.length) throw new EditError(422, `${artifact.id} already has the open change ${open.map(c => c.name).join(', ')}. Finish it or prepare its version first.`, {code: 'open-change', field: 'artifact'});
    const title = oneLine(input, 'title'), reason = text(input, 'reason'), scope = text(input, 'scope', {required: false});
    const name = identifier(input, 'name', title, artifact.changes.map(c => c.name), {prefix: 'change-'});
    const prefix = changePrefix(artifact.id, name), working = frontValue(await ctx.read(`${BASE}${artifact.id}/README.md`)).current_version;
    const edits = [
      create(`${prefix}README.md`, changeReadme(title, reason, scope, `Starts from ${artifact.id} ${working || 'with no established version'}. The ${artifact.id} owner owns this change.`)),
      create(`${prefix}tasks/README.md`, planReadme(title)),
    ];
    const result = {artifact: artifact.id, change: name};
    if (input.unit !== undefined) {
      const unit = input.unit;
      if (!unit || typeof unit !== 'object' || Array.isArray(unit)) fail('unit', 'unit needs an id or a title.');
      if (unit.id !== undefined) {
        const brief = unitOf(ctx, unit.id);
        if ((brief.value.changes || []).some(m => m?.artifact === artifact.id)) fail('unit', `${unit.id} already has a change of ${artifact.id}.`);
        edits.push(replace(brief.path, editFrontMatter(brief.text, [{op: 'insert', path: ['changes'], value: {artifact: artifact.id, change: name}}])));
        result.unit = unit.id;
      } else {
        const unitTitle = oneLine(unit, 'title');
        const taken = [...ctx.files.keys()].filter(p => p.startsWith(`${BASE}units-of-work/`)).map(p => p.split('/')[3]);
        const id = identifier(unit, 'id', unitTitle, taken);
        edits.push(create(`${BASE}units-of-work/${id}/README.md`, unitBrief(id, unitTitle, {purpose: unit.purpose || reason, changes: [{artifact: artifact.id, change: name}], acceptance: [{id: 'outcome', criterion: `Describe the observable outcome of ${unitTitle}. Replace this text.`}]})));
        result.unit = id;
      }
    }
    return {edits, result};
  },
  async 'document.add'(ctx, input) {
    const artifact = artifactOf(ctx, input.artifact);
    if (!KINDS[input.kind]) fail('kind', 'kind must be requirement, specification or decision.');
    const title = oneLine(input, 'title'), body = text(input, 'body', {required: false});
    const directory = `${BASE}${artifact.id}/${KINDS[input.kind]}/`;
    const existing = [...ctx.files.keys()].filter(p => p.startsWith(directory) && !p.slice(directory.length).includes('/')).map(p => p.slice(directory.length, -3));
    let name = slug(title).slice(0, 60).replace(/-+$/, '');
    if (!name) fail('title', 'The title must contain letters or digits.');
    if (input.kind === 'decision') {const numbers = existing.map(n => Number(n.match(/^(\d{3})-/)?.[1] || 0));name = `${String(Math.max(0, ...numbers) + 1).padStart(3, '0')}-${name}`;}
    name = uniqueId(name, existing);
    const path = `${directory}${name}.md`;
    const content = body ? (/^#\s/m.test(body.split('\n')[0]) ? body : `# ${title}\n\n${body}`) + '\n' : TEMPLATES[input.kind](title);
    return {edits: [create(path, content)], result: {path}};
  },
  async 'document.save'(ctx, input) {
    const path = documentPath(ctx, input.path);
    if (typeof input.body !== 'string' || input.body.length > 1024 * 1024 || input.body.includes('\0')) fail('body', 'body must be text of at most 1 MiB.');
    const current = await ctx.read(path);
    if (splitDocument(current).front === null && /^---\r?\n/.test(input.body)) fail('body', 'Use the advanced front-matter editor to add front matter.');
    return {edits: [replace(path, replaceBody(current, input.body))], result: {path}};
  },
  async 'document.delete'(ctx, input) {
    const path = documentPath(ctx, input.path, {working: true});
    return {edits: [remove(path)], tolerate: ['unresolved-reference', 'unresolved-flow-support', 'missing-model-source'], result: {path}};
  },
  async 'document.properties.set'(ctx, input) {
    const path = documentPath(ctx, input.path);
    if (typeof input.frontMatter !== 'string' || input.frontMatter.length > 256 * 1024) fail('frontMatter', 'frontMatter must be YAML text.');
    return {edits: [replace(path, setFrontMatterText(await ctx.read(path), input.frontMatter))], result: {path}};
  },
  async 'reference.add'(ctx, input) {
    const path = documentPath(ctx, input.path, {working: true});
    const target = supportTarget(ctx, {kind: 'element', target: {artifact: input.artifact, element: input.element}}, 'artifact');
    const requires = oneLine(input, 'requires');
    const current = await ctx.read(path), references = frontValue(current).references;
    if (references !== undefined && !Array.isArray(references)) throw new EditError(422, 'references is not a list. Use the advanced front-matter editor.', {code: 'invalid-reference'});
    if ((references || []).some(r => r?.artifact === target.artifact && r?.element === target.element)) fail('element', 'This reference already exists.', 409);
    const owner = ctx.artifacts.get(target.artifact), state = owner.elements.find(e => e.path === target.element && e.source === 'working')?.state;
    return {edits: [replace(path, editFrontMatter(current, [{op: 'insert', path: ['references'], value: {artifact: target.artifact, element: target.element, requires}}]))],
      result: {path, label: ['added', 'modified'].includes(state) ? 'proposed' : state === 'unchanged' ? 'established' : 'unknown'}};
  },
  async 'reference.remove'(ctx, input) {
    const path = documentPath(ctx, input.path);
    const current = await ctx.read(path), references = frontValue(current).references;
    const indexes = (Array.isArray(references) ? references : []).map((r, i) => r?.artifact === input.artifact && r?.element === input.element ? i : -1).filter(i => i >= 0);
    if (!indexes.length) missing('This reference does not exist.');
    return {edits: [replace(path, editFrontMatter(current, indexes.reverse().map(i => ({op: 'delete', path: ['references', i]}))))], result: {path}};
  },
  async 'selfcheck.record'(ctx, input) {
    const path = documentPath(ctx, input.path);
    return {edits: [replace(path, recordSelfCheck(path, await ctx.read(path), result(input), text(input, 'detail'), 'self-check'))], result: {path}};
  },
  async 'task.add'(ctx, input) {
    const artifact = artifactOf(ctx, input.artifact), change = changeOf(ctx, artifact, input.change);
    const prefix = changePrefix(artifact.id, change.name), planPath = `${prefix}tasks/README.md`;
    const planText = ctx.exists(planPath) ? await ctx.read(planPath) : null, plan = planText ? frontValue(planText) : {tasks: []};
    if (plan.tasks !== undefined && !Array.isArray(plan.tasks)) throw new EditError(422, 'The plan tasks list is invalid. Use the advanced front-matter editor.', {code: 'malformed-plan'});
    const listed = plan.tasks || [], tasks = listed.map(file => ({file, id: (() => {try {return frontValue(ctx.files.get(`${prefix}tasks/${file}`) || '').id;} catch {return null;}})()}));
    const title = oneLine(input, 'title'), id = identifier(input, 'id', title, tasks.map(t => t.id).filter(Boolean));
    const deps = [...new Set(list(input, 'prerequisites', ids))];
    for (const dep of deps) if (!tasks.some(t => t.id === dep)) fail('prerequisites', `Task ${dep} does not exist.`);
    const dod = list(input, 'dod', nonempty, {max: 50}).map(item => item.trim().replace(/\s*\n\s*/g, ' '));
    const width = Math.max(2, ...listed.map(f => f.match(/^(\d+)-/)?.[1].length || 0));
    const sequence = Math.max(0, ...listed.map(f => Number(f.match(/^(\d+)-/)?.[1] || 0))) + 1;
    const file = `${String(sequence).padStart(width, '0')}-${id}.md`;
    const edits = [create(`${prefix}tasks/${file}`, taskFile(id, deps, title, text(input, 'scope', {required: false}), dod))];
    edits.push(planText ? replace(planPath, editFrontMatter(planText, [{op: 'insert', path: ['tasks'], value: file}])) : create(planPath, editFrontMatter(planReadme(`${change.name}`), [{op: 'set', path: ['tasks'], value: [file]}])));
    return {edits, result: {task: id, path: `${prefix}tasks/${file}`}};
  },
  async 'task.update'(ctx, input) {
    const {path, value, current, tasks} = await taskOf(ctx, input);
    const edits = [];let next = current;
    if (input.title !== undefined) {const title = oneLine(input, 'title');next = next.replace(/^#\s+.*$/m, `# ${title}`);}
    if (input.prerequisites !== undefined) {
      const deps = [...new Set(list(input, 'prerequisites', ids))];
      for (const dep of deps) if (dep === value.id || !tasks.some(t => t.id === dep)) fail('prerequisites', `Task ${dep} cannot be a prerequisite.`);
      next = editFrontMatter(next, [{op: 'set', path: ['depends_on'], value: deps}]);
      if (readSection(next, 'prerequisites') !== null) next = replaceSection(next, 'prerequisites', prerequisiteText(deps));
    }
    if (input.scope !== undefined) next = replaceSection(next, 'scope-and-ownership', text(input, 'scope'), {heading: 'Scope and ownership'});
    if (input.dod !== undefined) {
      const items = list(input, 'dod', nonempty, {required: true, max: 50}).map(item => item.trim().replace(/\s*\n\s*/g, ' '));
      const checked = new Map(checklistItems(readSection(next, 'definition-of-done') || '').map(item => [item.text, item.checked]));
      next = replaceSection(next, 'definition-of-done', dodText(items, checked), {heading: 'Definition of Done'});
    }
    if (next !== current) edits.push(replace(path, next));
    return {edits, result: {task: value.id, path}};
  },
  async 'task.remove'(ctx, input) {
    const {path, value, tasks, planPath, planText, file} = await taskOf(ctx, input);
    const dependents = tasks.filter(t => t.dependsOn.includes(value.id)).map(t => t.id);
    if (dependents.length) fail('id', `Tasks ${dependents.join(', ')} depend on ${value.id}. Remove those prerequisites first.`);
    const index = frontValue(planText).tasks.indexOf(file);
    return {edits: [remove(path), replace(planPath, editFrontMatter(planText, [{op: 'delete', path: ['tasks', index]}]))], result: {task: value.id}};
  },
  async 'task.checklist.set'(ctx, input) {
    const path = documentPath(ctx, input.path);
    if (!/\/changes\/change-[^/]+\/tasks\/.+\.md$/.test(path) || path.endsWith('/tasks/README.md')) fail('path', 'Select a task file.');
    if (!Number.isInteger(input.index) || input.index < 0) fail('index', 'index must be a checklist position.');
    if (typeof input.checked !== 'boolean') fail('checked', 'checked must be true or false.');
    return {edits: [replace(path, setCheckbox(await ctx.read(path), input.index, input.checked))], result: {path}};
  },
  async 'evidence.record'(ctx, input) {
    const path = documentPath(ctx, input.path);
    const current = await ctx.read(path), records = frontValue(current).evidence_records;
    if (records !== undefined && !Array.isArray(records)) throw new EditError(422, 'evidence_records is not a list. Use the advanced front-matter editor.', {code: 'invalid-evidence-record'});
    const method = oneLine(input, 'method'), value = result(input), detail = text(input, 'detail');
    const existing = (records || []).map(r => r?.id);
    let id;
    if (input.id !== undefined && existing.includes(input.id)) id = input.id;
    else id = identifier(input, 'id', method, [...existing, ...sectionAnchors(current).map(h => h.anchor)], {max: 40});
    const record = {id, method, result: value, source: `${path}#${id}`};
    const withSection = upsertSubsection(current, 'evidence', 'Evidence', id, detail);
    const index = existing.indexOf(id);
    return {edits: [replace(path, editFrontMatter(withSection, [index >= 0 ? {op: 'set', path: ['evidence_records', index], value: record} : {op: 'insert', path: ['evidence_records'], value: record}]))], result: {path, id}};
  },
  async 'plan.selfcheck.record'(ctx, input) {
    const artifact = artifactOf(ctx, input.artifact), change = changeOf(ctx, artifact, input.change);
    const path = `${changePrefix(artifact.id, change.name)}tasks/README.md`;
    return {edits: [replace(path, recordSelfCheck(path, await ctx.read(path), result(input), text(input, 'detail'), 'plan-self-check'))], result: {path}};
  },
  async 'unit.create'(ctx, input) {
    const title = oneLine(input, 'title');
    const taken = [...ctx.files.keys()].filter(p => p.startsWith(`${BASE}units-of-work/`)).map(p => p.split('/')[3]);
    const id = identifier(input, 'id', title, taken);
    const changes = members(ctx, list(input, 'changes', m => m && typeof m === 'object', {required: true, max: 50}), null);
    const acceptance = criteria(list(input, 'acceptance', c => c && typeof c === 'object', {required: true, max: 50}));
    if (changes.length > 1 && !acceptance.some(c => c.integration)) fail('acceptance', 'A unit with several changes needs an integration criterion.');
    const flows = affectedFlows(ctx, input);
    return {edits: [create(`${BASE}units-of-work/${id}/README.md`, unitBrief(id, title, {purpose: text(input, 'purpose', {required: false}), included: text(input, 'included', {required: false}), excluded: text(input, 'excluded', {required: false}), changes, acceptance, ...flows}))], result: {unit: id}};
  },
  async 'unit.member.add'(ctx, input) {
    const brief = unitOf(ctx, input.unit), [member] = members(ctx, [{artifact: input.artifact, change: input.change}], brief.id);
    if ((brief.value.changes || []).some(m => m?.artifact === member.artifact)) fail('artifact', `${brief.id} already has a change of ${member.artifact}.`);
    return {edits: [replace(brief.path, editFrontMatter(brief.text, [{op: 'insert', path: ['changes'], value: member}]))], result: {unit: brief.id}};
  },
  async 'unit.member.remove'(ctx, input) {
    const brief = unitOf(ctx, input.unit), list = Array.isArray(brief.value.changes) ? brief.value.changes : [];
    const index = list.findIndex(m => m?.artifact === input.artifact && m?.change === input.change);
    if (index < 0) missing('This member does not exist.');
    if (list.length === 1) fail('change', 'A unit needs at least one member change.');
    return {edits: [replace(brief.path, editFrontMatter(brief.text, [{op: 'delete', path: ['changes', index]}]))], result: {unit: brief.id}};
  },
  async 'unit.acceptance.set'(ctx, input) {
    const brief = unitOf(ctx, input.unit), next = criteria(list(input, 'criteria', c => c && typeof c === 'object', {required: true, max: 50}));
    const used = (brief.value.evidence || []).map(e => e?.criterion).filter(id => !next.some(c => c.id === id));
    if (used.length) fail('criteria', `Evidence exists for ${[...new Set(used)].join(', ')}. Keep those criteria.`);
    return {edits: [replace(brief.path, editFrontMatter(brief.text, [{op: 'set', path: ['acceptance'], value: next}]))], result: {unit: brief.id, criteria: next.map(c => c.id)}};
  },
  async 'unit.evidence.record'(ctx, input) {
    const brief = unitOf(ctx, input.unit);
    const criterion = input.criterion;
    if (!(brief.value.acceptance || []).some(c => c?.id === criterion)) fail('criterion', 'Select an acceptance criterion of this unit.');
    const method = oneLine(input, 'method'), value = result(input);
    let next = brief.text, source;
    if (input.source !== undefined) {
      const [file, fragment, extra] = typeof input.source === 'string' ? input.source.split('#') : [];
      if (!safeKnowledgePath(file) || extra !== undefined || fragment === '') fail('source', 'source must be a Markdown path with an optional section.');
      const body = file === brief.path ? brief.text : ctx.files.get(file);
      if (body === undefined || !evidenceDetail(body, fragment)) fail('source', 'The source section is missing or empty.');
      source = input.source;
    } else {
      const detail = text(input, 'detail').replace(/\s*\n\s*/g, ' ');
      const current = readSection(next, 'combined-checks') || '';
      const line = `- ${criterion}: ${detail}`;
      next = replaceSection(next, 'combined-checks', current ? `${current}\n${line}` : line, {heading: 'Combined checks'});
      source = `${brief.path}#combined-checks`;
    }
    next = editFrontMatter(next, [{op: 'insert', path: ['evidence'], value: {criterion, method, result: value, source}}]);
    return {edits: [replace(brief.path, next)], result: {unit: brief.id, source}};
  },
  async 'unit.flows.set'(ctx, input) {
    const brief = unitOf(ctx, input.unit), flows = affectedFlows(ctx, input, true);
    return {edits: [replace(brief.path, editFrontMatter(brief.text, [{op: 'set', path: ['affected_flows'], value: flows.affectedFlows}, {op: 'set', path: ['flow_assessment'], value: flows.flowAssessment}]))], result: {unit: brief.id}};
  },
  async 'flow.create'(ctx, input) {
    const artifact = artifactOf(ctx, input.artifact);
    const title = oneLine(input, 'title'), trigger = text(input, 'trigger', {max: 2000}), outcome = text(input, 'outcome', {max: 2000}), first = oneLine(input, 'firstStep');
    const flows = flowsOf(ctx, artifact.id), id = identifier(input, 'id', title, [...flows.map(f => f.id), ...flows.map(f => f.path.split('/').at(-1).slice(0, -3))]);
    const step = slug(first).slice(0, 40).replace(/-+$/, '') || 'start';
    const path = `${BASE}${artifact.id}/specifications/flows/${id}.md`;
    const body = editFrontMatter('', [{op: 'set', path: ['flow'], value: {id, artifact: artifact.id, title, trigger, outcome, entry_steps: [step], steps: [{id: step, title: first, supports: []}], transitions: [], support: []}}]) + `\n# ${title}\n\n${trigger}\n\n${outcome}\n`;
    return {edits: [create(path, body)], result: {flow: id, path, step}};
  },
  async 'flow.step.add'(ctx, input) {
    const flow = flowOf(ctx, input.artifact, input.flow), title = oneLine(input, 'title');
    const id = identifier(input, 'id', title, flow.steps.map(s => s?.id), {max: 40});
    const supports = [...new Set(list(input, 'supports', ids))];
    for (const s of supports) if (!flow.support.some(x => x?.id === s)) fail('supports', `Support ${s} does not exist.`);
    const position = input.position === undefined ? flow.steps.length : input.position;
    if (!Number.isInteger(position) || position < 0 || position > flow.steps.length) fail('position', 'position is out of range.');
    const edits = [{op: 'insert', path: ['flow', 'steps'], index: position, value: {id, title, supports}}];
    if (input.after !== undefined) {if (!flow.steps.some(s => s?.id === input.after)) fail('after', `Step ${input.after} does not exist.`);edits.push({op: 'insert', path: ['flow', 'transitions'], value: {from: input.after, to: id}});}
    return {edits: flowPlan(flow, edits), result: {flow: flow.id, step: id}};
  },
  async 'flow.step.update'(ctx, input) {
    const flow = flowOf(ctx, input.artifact, input.flow), index = stepIndex(flow, input.step), edits = [];
    if (input.title !== undefined) edits.push({op: 'set', path: ['flow', 'steps', index, 'title'], value: oneLine(input, 'title')});
    if (input.supports !== undefined) {
      const supports = [...new Set(list(input, 'supports', ids))];
      for (const s of supports) if (!flow.support.some(x => x?.id === s)) fail('supports', `Support ${s} does not exist.`);
      edits.push({op: 'set', path: ['flow', 'steps', index, 'supports'], value: supports});
    }
    return {edits: edits.length ? flowPlan(flow, edits) : [], result: {flow: flow.id, step: input.step}};
  },
  async 'flow.step.move'(ctx, input) {
    const flow = flowOf(ctx, input.artifact, input.flow), index = stepIndex(flow, input.step);
    if (!Number.isInteger(input.to) || input.to < 0 || input.to >= flow.steps.length) fail('to', 'to is out of range.');
    return {edits: input.to === index ? [] : flowPlan(flow, [{op: 'move', path: ['flow', 'steps'], from: index, to: input.to}]), result: {flow: flow.id, step: input.step}};
  },
  async 'flow.step.remove'(ctx, input) {
    const flow = flowOf(ctx, input.artifact, input.flow), index = stepIndex(flow, input.step);
    if (flow.steps.length === 1) fail('step', 'A flow needs at least one step.');
    const edits = [];
    flow.transitions.map((t, i) => t?.from === input.step || t?.to === input.step ? i : -1).filter(i => i >= 0).reverse().forEach(i => edits.push({op: 'delete', path: ['flow', 'transitions', i]}));
    const entry = flow.entry.filter(id => id !== input.step);
    if (entry.length !== flow.entry.length) edits.push({op: 'set', path: ['flow', 'entry_steps'], value: entry.length ? entry : [flow.steps.find(s => s?.id !== input.step).id]});
    edits.push({op: 'delete', path: ['flow', 'steps', index]});
    return {edits: flowPlan(flow, edits), result: {flow: flow.id}};
  },
  async 'flow.transition.set'(ctx, input) {
    const flow = flowOf(ctx, input.artifact, input.flow);
    for (const field of ['from', 'to']) if (!flow.steps.some(s => s?.id === input[field])) fail(field, `Step ${input[field]} does not exist.`);
    const condition = text(input, 'condition', {required: false, max: 2000});
    const index = flow.transitions.findIndex(t => t?.from === input.from && t?.to === input.to);
    const value = {from: input.from, to: input.to, ...(condition ? {condition} : {})};
    return {edits: flowPlan(flow, [index >= 0 ? {op: 'set', path: ['flow', 'transitions', index], value} : {op: 'insert', path: ['flow', 'transitions'], value}]), result: {flow: flow.id}};
  },
  async 'flow.transition.remove'(ctx, input) {
    const flow = flowOf(ctx, input.artifact, input.flow);
    const index = flow.transitions.findIndex(t => t?.from === input.from && t?.to === input.to);
    if (index < 0) missing('This transition does not exist.');
    return {edits: flowPlan(flow, [{op: 'delete', path: ['flow', 'transitions', index]}]), result: {flow: flow.id}};
  },
  async 'flow.support.add'(ctx, input) {
    const flow = flowOf(ctx, input.artifact, input.flow), target = supportTarget(ctx, input);
    const base = target.kind === 'element' ? target.element.split('/').at(-1).slice(0, -3) : target.kind === 'flow' ? `${target.flow}-flow` : target.path.split('/').at(-1).replace(/\.[^.]+$/, '');
    const id = identifier(input, 'id', base, flow.support.map(s => s?.id), {max: 40});
    const requires = text(input, 'requires', {max: 2000}), {basis, evidence} = supportBasis(input);
    await checkTracked(ctx, target, evidence);
    const record = {id, ...target, requires, basis, ...(evidence.length ? {evidence} : {})};
    const steps = [...new Set(list(input, 'steps', ids))], edits = [{op: 'insert', path: ['flow', 'support'], value: record}];
    for (const step of steps) {const i = stepIndex(flow, step);edits.push({op: 'insert', path: ['flow', 'steps', i, 'supports'], value: id});}
    return {edits: flowPlan(flow, edits), result: {flow: flow.id, support: id}};
  },
  async 'flow.support.update'(ctx, input) {
    const flow = flowOf(ctx, input.artifact, input.flow), index = flow.support.findIndex(s => s?.id === input.support);
    if (index < 0) missing(`Support ${input.support} does not exist.`);
    const current = flow.support[index], edits = [];
    if (input.kind !== undefined || input.target !== undefined) {
      const target = supportTarget(ctx, {kind: input.kind ?? current.kind, target: input.target});
      for (const key of ['kind', 'artifact', 'element', 'flow', 'path', 'symbol', 'status', 'change']) if (current[key] !== undefined && target[key] === undefined) edits.push({op: 'delete', path: ['flow', 'support', index, key]});
      for (const [key, value] of Object.entries(target)) if (current[key] !== value) edits.push({op: 'set', path: ['flow', 'support', index, key], value});
      await checkTracked(ctx, target, []);
    }
    if (input.requires !== undefined) edits.push({op: 'set', path: ['flow', 'support', index, 'requires'], value: text(input, 'requires', {max: 2000})});
    if (input.basis !== undefined || input.evidence !== undefined) {
      const {basis, evidence} = supportBasis(input, current);
      await checkTracked(ctx, {kind: 'element'}, evidence);
      if (basis !== current.basis) edits.push({op: 'set', path: ['flow', 'support', index, 'basis'], value: basis});
      if (JSON.stringify(evidence) !== JSON.stringify(current.evidence || [])) edits.push(evidence.length ? {op: 'set', path: ['flow', 'support', index, 'evidence'], value: evidence} : {op: 'delete', path: ['flow', 'support', index, 'evidence']});
    }
    return {edits: edits.length ? flowPlan(flow, edits) : [], result: {flow: flow.id, support: input.support}};
  },
  async 'flow.support.remove'(ctx, input) {
    const flow = flowOf(ctx, input.artifact, input.flow), index = flow.support.findIndex(s => s?.id === input.support);
    if (index < 0) missing(`Support ${input.support} does not exist.`);
    const edits = [];
    flow.steps.forEach((step, i) => {
      (step?.supports || []).map((s, j) => s === input.support ? j : -1).filter(j => j >= 0).reverse().forEach(j => edits.push({op: 'delete', path: ['flow', 'steps', i, 'supports', j]}));
      (Array.isArray(step?.interactions) ? step.interactions : []).forEach((interaction, k) => {
        if (!Array.isArray(interaction?.supports) || !interaction.supports.includes(input.support)) return;
        if (interaction.supports.length === 1) fail('support', `Interaction ${k + 1} of step ${step.id} has no other support. Change the interaction first.`);
        edits.push({op: 'set', path: ['flow', 'steps', i, 'interactions', k, 'supports'], value: interaction.supports.filter(s => s !== input.support)});
      });
    });
    edits.push({op: 'delete', path: ['flow', 'support', index]});
    return {edits: flowPlan(flow, edits), result: {flow: flow.id}};
  },
  async 'flow.meta.set'(ctx, input) {
    const flow = flowOf(ctx, input.artifact, input.flow), edits = [];
    for (const key of ['title', 'trigger', 'outcome']) if (input[key] !== undefined) edits.push({op: 'set', path: ['flow', key], value: key === 'title' ? oneLine(input, key) : text(input, key, {max: 2000})});
    for (const key of ['gaps', 'exclusions']) if (input[key] !== undefined) {
      const items = list(input, key, nonempty, {max: 100}).map(item => item.trim());
      edits.push(items.length ? {op: 'set', path: ['flow', key], value: items} : {op: 'delete', path: ['flow', key]});
    }
    return {edits: edits.length ? flowPlan(flow, edits) : [], result: {flow: flow.id}};
  },
  async 'version.prepare'(ctx, input) {
    const artifact = artifactOf(ctx, input.artifact), change = changeOf(ctx, artifact, input.change);
    if (!['major', 'minor', 'patch'].includes(input.level)) fail('level', 'level must be major, minor or patch.');
    const reason = text(input, 'reason', {max: 2000}), summary = text(input, 'summary', {max: 4000});
    const prefix = changePrefix(artifact.id, change.name), graph = buildTaskGraph(ctx.files, prefix, checklist, ctx.scan.unsafeTaskPaths);
    if (graph.state !== 'available') throw new EditError(422, `The plan of ${change.name} is ${graph.state}. Fix the plan before you prepare a version.`, {code: 'invalid-plan', diagnostics: graph.diagnostics});
    const unchecked = graph.tasks.flatMap(t => checklistItems(t.body).filter(i => !i.checked).map(i => ({task: t.id, path: t.path, item: i.text})));
    if (unchecked.length && input.acknowledgeUnchecked !== true) throw new EditError(422, `${unchecked.length} Definition of Done items are not checked. Check them or acknowledge them.`, {code: 'unchecked-dod', field: 'acknowledgeUnchecked', unchecked});
    const readmePath = `${BASE}${artifact.id}/README.md`, readme = await ctx.read(readmePath), working = frontValue(readme).current_version ?? null;
    if (working !== null && !VERSION.test(String(working))) throw new EditError(422, 'current_version is not a semantic version.', {code: 'invalid-identity'});
    const version = nextVersion(working, input.level), path = `${BASE}${artifact.id}/versions/${version}/README.md`;
    if (ctx.files.has(path)) fail('level', `Version ${version} already has a record.`, 409);
    const heading = (ctx.files.get(`${prefix}README.md`) || '').match(/^#\s+(.+)$/m)?.[1] || change.name;
    const compatibility = {major: 'Incompatible major version.', minor: 'Compatible minor version.', patch: 'Compatible patch version.'}[input.level];
    const record = editFrontMatter('', [{op: 'set', path: ['source_change'], value: change.name}]) +
      `\n# ${artifact.id} ${version} — ${heading}\n\n${compatibility} ${reason}\n\n${summary}\n\nThis record holds no knowledge directories and no tasks. The originating plan and its evidence are in the [retained change](../../changes/${change.name}/tasks/README.md).\n`;
    return {edits: [create(path, record), replace(readmePath, editFrontMatter(readme, [{op: 'set', path: ['current_version'], value: version}]))], result: {version, path, unchecked}};
  },
  async 'publication.record'(ctx, input) {
    const artifact = artifactOf(ctx, input.artifact);
    if (!VERSION.test(input.version ?? '')) fail('version', 'version must be a semantic version.');
    const versionPath = `${BASE}${artifact.id}/versions/${input.version}/README.md`;
    if (!ctx.files.has(versionPath)) missing(`Version ${input.version} has no record.`);
    let repository = input.repository;
    if (repository === undefined) repository = remoteRepository(await ctx.git(ctx.root, ['remote', 'get-url', 'origin']).catch(() => '')) ?? fail('repository', 'The origin remote has no HTTPS identity. Enter the repository URL.');
    const repo = httpsURL(repository), pr = httpsURL(input.pullRequest);
    if (!repo) fail('repository', 'repository must be an HTTPS URL without credentials.');
    if (!pr || pr.host !== repo.host || !pr.pathname.startsWith(repo.pathname.replace(/\.git$/, '').replace(/\/$/, '') + '/')) fail('pullRequest', 'pullRequest must be an HTTPS pull request URL in the repository.');
    const scope = text(input, 'scope', {max: 2000}), detail = text(input, 'detail', {max: 4000});
    const readmePath = `${BASE}${artifact.id}/README.md`, readme = await ctx.read(readmePath), reviews = frontValue(readme).publication_reviews;
    if (reviews !== undefined && !Array.isArray(reviews)) throw new EditError(422, 'publication_reviews is not a list. Use the advanced front-matter editor.', {code: 'invalid-publication-review'});
    if ((reviews || []).some(r => (r?.required_changes || []).some(c => c?.repository === repository && c?.pull_request === input.pullRequest))) fail('pullRequest', 'This repository and pull request pair is already recorded.', 409);
    const established = ctx.scan.baselines?.[artifact.id]?.versionRecords?.includes(input.version);
    const edits = [];let source, policy = {};
    if (!established) {
      edits.push(replace(versionPath, replaceSection(await ctx.read(versionPath), 'publication-review', detail, {heading: 'Publication review'})));
      source = `${versionPath}#publication-review`;policy = {allowVersionRecord: true};
    } else {
      const change = frontValue(ctx.files.get(versionPath)).source_change;
      const owners = unitBriefs(ctx.files).filter(u => u.members.some(m => m.artifact === artifact.id && m.change === change));
      if (owners.length !== 1) throw new EditError(422, 'The version is established and no single unit of work owns its change. Record the review by hand.', {code: 'missing-owner'});
      const brief = ctx.files.get(owners[0].path), current = readSection(brief, 'publication-review');
      const line = `${artifact.id} ${input.version}: ${detail.replace(/\s*\n\s*/g, ' ')}`;
      edits.push(replace(owners[0].path, replaceSection(brief, 'publication-review', current ? `${current}\n\n${line}` : line, {heading: 'Publication review'})));
      source = `${owners[0].path}#publication-review`;
    }
    edits.push(replace(readmePath, editFrontMatter(readme, [{op: 'insert', path: ['publication_reviews'], value: {artifact: artifact.id, version: input.version, source, required_changes: [{repository, scope, pull_request: input.pullRequest}]}}])));
    return {edits, policy, result: {source}};
  },
  async 'artifact.migrate'(ctx, input) {
    if (!ids(input.artifact)) fail('artifact', 'artifact must be an artifact ID.');
    if (input.version !== undefined && !VERSION.test(input.version)) fail('version', 'version must be a semantic version.');
    let plan;
    try {plan = await planMigration(ctx.root, {artifact: input.artifact, version: input.version ?? null});}
    catch (error) {if (error instanceof MigrationError) throw new EditError(422, error.message, {code: 'migration'});throw error;}
    if (plan.diagnostics.length) throw new EditError(422, 'The migration plan does not verify.', {code: 'migration', diagnostics: plan.diagnostics});
    const edits = [];
    for (const p of plan.plans) {
      for (const {path, from} of p.create) edits.push(create(path, await readFile(resolve(ctx.root, from))));
      edits.push(replace(`${BASE}${p.artifact}/README.md`, p.readme));
      for (const path of p.delete) edits.push(remove(path));
    }
    if (plan.index) edits.push(remove(plan.index));
    return {edits, policy: {allowLegacy: true}, layouts: {[input.artifact]: 'in-place'}, result: {artifact: input.artifact, review: plan.plans[0]?.review || [], graph: plan.graph}};
  },
};
async function taskOf(ctx, input) {
  const artifact = artifactOf(ctx, input.artifact), change = changeOf(ctx, artifact, input.change);
  const prefix = changePrefix(artifact.id, change.name), planPath = `${prefix}tasks/README.md`;
  const graph = buildTaskGraph(ctx.files, prefix, checklist, ctx.scan.unsafeTaskPaths);
  const task = graph.tasks.find(t => t.id === input.id);
  if (!ids(input.id)) fail('id', 'id must be a task ID.');
  if (!task) missing(`Task ${input.id} does not exist in ${change.name}.`);
  return {path: task.path, value: {id: task.id}, current: await ctx.read(task.path), tasks: graph.tasks.filter(t => t.id), planPath, planText: await ctx.read(planPath), file: task.path.slice(`${prefix}tasks/`.length)};
}
function stepIndex(flow, id) {
  const index = flow.steps.findIndex(s => s?.id === id);
  if (index < 0) missing(`Step ${id} does not exist.`);
  return index;
}
function members(ctx, entries, unit) {
  const claimed = new Map();
  for (const brief of unitBriefs(ctx.files)) if (brief.id !== unit) for (const m of brief.members) claimed.set(`${m.artifact}/${m.change}`, brief.id);
  const seen = new Set();
  return entries.map(entry => {
    const artifact = ctx.artifacts.get(entry.artifact);
    if (!artifact || !artifact.changes.some(c => c.name === entry.change)) fail('changes', `${entry.artifact}/${entry.change} does not exist.`);
    if (claimed.has(`${entry.artifact}/${entry.change}`)) fail('changes', `${entry.artifact}/${entry.change} belongs to ${claimed.get(`${entry.artifact}/${entry.change}`)}.`);
    if (seen.has(entry.artifact)) fail('changes', 'A unit has one change per artifact.');
    seen.add(entry.artifact);
    return {artifact: entry.artifact, change: entry.change};
  });
}
function criteria(entries) {
  const used = [];
  return entries.map(entry => {
    const criterion = typeof entry.criterion === 'string' ? entry.criterion.trim() : '';
    if (!criterion) fail('acceptance', 'Each criterion needs text.');
    const id = entry.id !== undefined ? entry.id : uniqueId(slug(criterion.split(/\s+/).slice(0, 3).join(' ')) || 'criterion', used);
    if (!ids(id) || used.includes(id)) fail('acceptance', `Criterion ID ${id} is not unique or safe.`);
    if (entry.integration !== undefined && typeof entry.integration !== 'boolean') fail('acceptance', 'integration must be true or false.');
    used.push(id);
    return {id, criterion, ...(entry.integration ? {integration: true} : {})};
  });
}
function affectedFlows(ctx, input, required = false) {
  const flows = list(input, 'affectedFlows', f => f && typeof f === 'object', {required, max: 100});
  const seen = new Set(), affected = flows.map(f => {
    if (!ctx.artifacts.has(f.artifact) || !ids(f.flow)) fail('affectedFlows', 'Each affected flow needs an existing artifact and a flow ID.');
    if (!['create', 'modify', 'remove'].includes(f.effect)) fail('affectedFlows', 'effect must be create, modify or remove.');
    const key = `${f.artifact}/${f.flow}`;if (seen.has(key)) fail('affectedFlows', `${key} is listed twice.`);seen.add(key);
    return {artifact: f.artifact, flow: f.flow, effect: f.effect};
  });
  const assessment = text(input, 'flowAssessment', {required: false, max: 4000}).replace(/\s*\n\s*/g, ' ');
  if (!assessment) fail('flowAssessment', affected.length ? 'Explain the flow assessment.' : 'Explain why no flow is affected.');
  return {affectedFlows: affected, flowAssessment: assessment};
}
function unitBrief(id, title, {purpose = '', included = '', excluded = '', changes, acceptance, affectedFlows = [], flowAssessment = 'Not assessed yet. Name the affected flows or explain why none is affected.'}) {
  const front = editFrontMatter('', [
    {op: 'set', path: ['unit_of_work'], value: id},
    {op: 'set', path: ['changes'], value: changes},
    {op: 'set', path: ['affected_flows'], value: affectedFlows},
    {op: 'set', path: ['flow_assessment'], value: flowAssessment},
    {op: 'set', path: ['acceptance'], value: acceptance},
    {op: 'set', path: ['evidence'], value: []},
  ]);
  const section = (heading, value, placeholder) => `## ${heading}\n\n${value || placeholder}\n`;
  return `${front}\n# ${title}\n\n${section('Purpose', purpose, 'Describe the one deliverable outcome. Replace this text.')}\n${section('Included scope', included, 'List the included work. Replace this text.')}\n${section('Excluded scope', excluded, 'List the excluded work. Replace this text.')}\n${section('Validation evidence', '', 'No evidence is recorded yet.')}`;
}

// --- Validation ------------------------------------------------------------------
const NOT_ERRORS = new Set(['flow-evidence-gap']);
export function diagnose(files, ctx, layouts = ctx.layouts) {
  const snapshot = buildSnapshot(files, ctx.snapshot.repository, [], {layouts, baselines: ctx.scan.baselines});
  const result = snapshot.diagnostics.map(d => ({...d, source: 'snapshot'}));
  const add = (list, source) => result.push(...list.map(d => ({...d, source})));
  for (const artifact of snapshot.artifacts) for (const change of artifact.changes) {
    const graph = buildTaskGraph(files, changePrefix(artifact.id, change.name), checklist, ctx.scan.unsafeTaskPaths);
    if (graph.state !== 'unavailable') add(graph.diagnostics, 'task-graph');
  }
  for (const artifact of snapshot.artifacts.filter(a => a.layout === 'in-place')) {
    const evidence = [];
    for (const change of artifact.changes.filter(c => c.layout === 'in-place')) declaredChange(artifact, change.name, files, {unsafeTaskPaths: ctx.scan.unsafeTaskPaths, baselines: ctx.scan.baselines}, evidence);
    for (const v of artifact.versions || []) evidence.push(...publicationReviews(files, artifact.id, v.version).diagnostics);
    add(evidence, 'evidence');
  }
  const units = unitBriefs(files), owners = new Map();
  for (const unit of units) {
    add(unit.diagnostics, 'unit');
    for (const m of unit.members) {
      if (!snapshot.artifacts.find(a => a.id === m.artifact)?.changes.some(c => c.name === m.change)) result.push({code: 'missing-member', path: unit.path, message: `${m.artifact}/${m.change} has no change record.`, source: 'unit'});
      const key = `${m.artifact}/${m.change}`;owners.set(key, [...(owners.get(key) || []), unit.path]);
    }
  }
  for (const [key, paths] of owners) if (paths.length > 1) for (const path of paths) result.push({code: 'duplicate-membership', path, message: `${key} is claimed by several units of work.`, source: 'unit'});
  add(buildFlowGraph(snapshot, {context: ctx.root, knowledge: 'planning'}).diagnostics, 'flow');
  const seen = new Set();
  return result.filter(d => d.severity !== 'info').map(d => ({...d, severity: NOT_ERRORS.has(d.code) ? 'warning' : 'error'})).filter(d => {const key = JSON.stringify([d.code, d.path, d.message]);return !seen.has(key) && seen.add(key);});
}
const keyOf = d => JSON.stringify([d.code, d.path, d.message]);

// --- Service ---------------------------------------------------------------------
const REQUEST_KEYS = ['path', 'worktree', 'operation', 'input', 'expected', 'dryRun'];
export const OPERATION_NAMES = [...Object.keys(OPERATIONS), 'undo'];
export function createKnowledgeService({journal = createJournal(), git = runGit, roots = null} = {}) {
  async function plan(ctx, request) {
    if (request.operation === 'undo') {
      if (typeof request.input.operationId !== 'string') fail('operationId', 'operationId is required.');
      const {entry, edits, expected} = await undoPlan(ctx.root, journal, request.input.operationId);
      return {edits, expected, policy: {allowLegacy: true, allowVersionRecord: true, undo: true}, skipValidation: true, result: {undone: entry.id, operation: entry.operation}};
    }
    return OPERATIONS[request.operation](ctx, request.input);
  }
  async function apply(request) {
    if (!request || typeof request !== 'object' || Array.isArray(request) || Object.keys(request).some(k => !REQUEST_KEYS.includes(k))) throw new EditError(400, `Supply ${REQUEST_KEYS.join(', ')}.`);
    if (!OPERATION_NAMES.includes(request.operation)) throw new EditError(400, `Unknown operation. Use one of ${OPERATION_NAMES.join(', ')}.`);
    if (request.input !== undefined && (!request.input || typeof request.input !== 'object' || Array.isArray(request.input))) throw new EditError(400, 'input must be an object.');
    if (request.expected !== undefined && (!request.expected || typeof request.expected !== 'object' || Array.isArray(request.expected) || !Object.values(request.expected).every(v => v === null || typeof v === 'string' && /^[a-f0-9]{64}$/.test(v)))) throw new EditError(400, 'expected maps paths to SHA-256 hex digests.');
    if (request.dryRun !== undefined && typeof request.dryRun !== 'boolean') throw new EditError(400, 'dryRun must be true or false.');
    if (roots) {const real = await realpath(request.path).catch(() => null);if (!real || !roots.includes(real)) throw new EditError(403, 'Repository is not configured for this server.');}
    const {root, target} = await resolveWorktree(request.path, request.worktree, git);
    return serialize(target, async () => {
      const branch = await requireEditableBranch(target, git);
      const ctx = await context(target, git);
      const input = request.input || {};
      const planned = await plan(ctx, {...request, input});
      const edits = planned.edits;
      if (!edits.length) throw new EditError(422, 'The operation changes nothing.', {code: 'no-change'});
      // The scanned text must match the bytes the caller read.
      const expected = {...(request.expected || {}), ...(planned.expected || {})};
      for (const edit of edits) if (edit.action !== 'create' && request.expected?.[edit.path] && ctx.files.has(edit.path) && digestOf(Buffer.from(ctx.files.get(edit.path))) !== request.expected[edit.path]) {
        throw new EditError(409, 'Files changed after you read them. Reload or overwrite.', {code: 'digest-mismatch', current: {[edit.path]: ctx.files.get(edit.path)}});
      }
      let diagnostics = [];
      if (!planned.skipValidation) {
        const after = new Map(ctx.files);
        for (const edit of edits) if (edit.action === 'delete') after.delete(edit.path);else after.set(edit.path, Buffer.isBuffer(edit.after) ? edit.after.toString('utf8') : edit.after);
        const layouts = {...ctx.layouts, ...(planned.layouts || {})};
        const before = new Set(diagnose(ctx.files, ctx).map(keyOf)), post = diagnose(after, ctx, layouts);
        const touched = new Set(edits.map(e => e.path));
        diagnostics = post.filter(d => !before.has(keyOf(d)) || touched.has(d.path)).map(d => ({...d, state: before.has(keyOf(d)) ? 'existing' : 'new'}));
        const blocking = diagnostics.filter(d => d.state === 'new' && d.severity === 'error' && !(planned.tolerate || []).includes(d.code));
        for (const d of diagnostics) if (d.state === 'new' && (planned.tolerate || []).includes(d.code)) d.severity = 'warning';
        if (blocking.length) throw new EditError(422, blocking.map(d => d.message).slice(0, 3).join(' '), {code: 'validation-failed', diagnostics});
      }
      const policy = {layouts: ctx.layouts, delivered: ctx.delivered, ...(planned.policy || {})};
      const files = await readPlan(target, edits);
      const response = files.map(f => ({path: f.path, action: f.action, before: f.before ? f.before.toString('utf8') : null, after: f.after ? f.after.toString('utf8') : null, digest: f.beforeDigest}));
      const base = {repository: root, worktree: target, branch: branch.branch, operation: request.operation, result: planned.result || {}, files: response, diagnostics};
      if (request.dryRun) return {...base, applied: false, expected: Object.fromEntries(files.filter(f => f.action !== 'create').map(f => [f.path, f.beforeDigest]))};
      const written = await writePlan(target, edits, {expected, policy, git, journal, operation: request.operation});
      if (planned.policy?.undo) journal.remove(target, request.input.operationId);
      const after = await scanRepository(target, {metadata: true, indexOnly: true, git}).catch(() => null);
      return {...base, applied: true, operationId: written.operationId, files: response.map(f => ({...f, digest: written.files.find(w => w.path === f.path)?.digest ?? null})), revision: after?.revision ?? null, status: await gitStatus(target, git)};
    });
  }
  return {apply, journal, operations: OPERATION_NAMES};
}
export {ExploreError};
