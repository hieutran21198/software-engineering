// The only code that writes inside an inspected repository. Writes stay in
// docs/artifacts of a worktree with a non-protected branch, edit front matter
// by YAML node ranges and bodies by heading ranges, and replace files atomically.
import {createHash, randomBytes} from 'node:crypto';
import {lstat, readFile, realpath, writeFile, rename, link, unlink, mkdir, rmdir, readdir} from 'node:fs/promises';
import {resolve, join, dirname, basename} from 'node:path';
import {parseDocument, Document, isMap, isSeq, isScalar} from 'yaml';
import {marked} from 'marked';
import {anchor} from './units-of-work.js';

export const MAX_BYTES = 1024 * 1024;
export const PROTECTED_BRANCHES = ['main', 'master'];
const BASE = 'docs/artifacts/';
const FRONT = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/;
export class EditError extends Error {
  constructor(status, message, extra = {}) {super(message);this.status = status;Object.assign(this, extra);}
}
// Error bodies of the edit routes carry diagnostics and current file contents.
export function errorBody(error) {
  const status = error.status || 500;
  if (!error.status) return {status, body: {error: 'The operation failed. Git status shows the current state.'}};
  const body = {error: error.message};
  for (const key of ['code', 'field', 'path', 'diagnostics', 'current', 'digests', 'unchecked', 'paths', 'unrestored', 'branch', 'action']) if (error[key] !== undefined) body[key] = error[key];
  return {status, body};
}
export const digestOf = value => createHash('sha256').update(value).digest('hex');
export const anchorOf = anchor;

// Path syntax: repository-relative, inside docs/artifacts, Markdown only.
export function checkPath(path, {yaml = false} = {}) {
  const ok = typeof path === 'string' && path.startsWith(BASE) && !path.includes('\\') && !path.includes('\0') &&
    path.split('/').every(part => part && part !== '.' && part !== '..' && part !== '.git') && (path.endsWith('.md') || yaml && path.endsWith('.yaml'));
  if (!ok) throw new EditError(422, `Unsafe knowledge path: ${String(path).slice(0, 200)}`, {code: 'unsafe-path', path});
  return path;
}

// --- Text helpers -----------------------------------------------------------
const eolOf = text => /\r\n/.test(text) ? '\r\n' : '\n';
const toLF = text => text.replace(/\r\n/g, '\n');
const fromLF = (text, eol) => eol === '\n' ? text : text.replace(/\n/g, eol);
export function splitDocument(text) {
  const match = text.match(FRONT);
  return {front: match ? match[1] : null, block: match ? match[0] : '', body: match ? text.slice(match[0].length) : text, eol: eolOf(text)};
}
export function frontValue(text) {
  const {front} = splitDocument(text);
  if (front === null) return {};
  const doc = parseDocument(front);
  if (doc.errors.length) throw new EditError(422, `Front matter is invalid YAML: ${doc.errors[0].message.split('\n')[0]}`, {code: 'invalid-yaml'});
  const value = doc.toJS() ?? {};
  if (typeof value !== 'object' || Array.isArray(value)) throw new EditError(422, 'Front matter must be a YAML mapping.', {code: 'invalid-yaml'});
  return value;
}

// --- Front-matter edits by node range ---------------------------------------
// Each edit replaces, inserts or removes the source lines of one node. Every
// other byte of the YAML text stays as it was; the result is re-parsed and
// compared with the expected value before it is accepted.
const lineStart = (src, pos) => src.lastIndexOf('\n', pos - 1) + 1;
const lineEnd = (src, pos) => {if (pos > 0 && src[pos - 1] === '\n') return pos;const nl = src.indexOf('\n', pos);return nl < 0 ? src.length : nl + 1;};
// Identifier lists such as depends_on: [tenant] use flow style; record lists stay block style.
const FLOW_KEYS = ['depends_on'];
const shortList = value => Array.isArray(value) && value.length <= 4 && value.every(v => typeof v === 'string' && v.length <= 40 && !/[\n:#,[\]{}]/.test(v));
const indentText = (text, n) => text.split('\n').map(line => line && ' '.repeat(n) + line).join('\n');
function render(value, {pair, top} = {}) {
  const doc = new Document();
  doc.contents = doc.createNode(pair === undefined ? [value] : {[pair]: value});
  const node = pair === undefined ? doc.contents.items[0] : doc.contents.items[0].value;
  if (Array.isArray(value) && (!value.length || top && FLOW_KEYS.includes(pair) && shortList(value)) && isSeq(node)) node.flow = true;
  return doc.toString({flowCollectionPadding: false});
}
function locate(doc, path) {
  let node = doc.contents, parent = null, entry = null;
  for (const key of path) {
    parent = node;
    if (isMap(node)) {entry = node.items.find(p => (isScalar(p.key) ? p.key.value : p.key) === key) || null;node = entry ? entry.value : undefined;}
    else if (isSeq(node) && Number.isInteger(key)) {entry = key >= 0 && key < node.items.length ? {index: key} : null;node = entry ? node.items[key] : undefined;}
    else return {missing: true};
    if (node === undefined) return {parent, entry: null, missing: true};
  }
  return {node, parent, entry};
}
const columnOf = (src, pos) => pos - lineStart(src, pos);
function itemExtent(src, item) {
  const start = lineStart(src, item.range[0]);
  return [start, lineEnd(src, item.range[1])];
}
function pairExtent(src, pair) {
  const end = pair.value?.range ? pair.value.range[1] : pair.key.range[1];
  return [lineStart(src, pair.key.range[0]), lineEnd(src, end)];
}
function dashColumn(src, item) {
  const start = lineStart(src, item.range[0]), prefix = src.slice(start, item.range[0]);
  const dash = prefix.lastIndexOf('-');
  return dash < 0 ? columnOf(src, item.range[0]) : dash;
}
const clone = value => value === undefined ? undefined : JSON.parse(JSON.stringify(value));
function applyToValue(root, edit) {
  const path = edit.path, last = path.at(-1);
  let parent = root;
  for (const key of path.slice(0, -1)) {if (parent[key] === undefined || parent[key] === null) parent[key] = {};parent = parent[key];}
  if (edit.op === 'set') parent[last] = clone(edit.value);
  else if (edit.op === 'delete') {if (Array.isArray(parent)) parent.splice(last, 1);else delete parent[last];}
  else if (edit.op === 'insert') {const list = parent[last] ?? (parent[last] = []);list.splice(edit.index ?? list.length, 0, clone(edit.value));}
  else if (edit.op === 'move') {const list = parent[last];const [item] = list.splice(edit.from, 1);list.splice(edit.to, 0, item);}
}
function spliceOne(src, edit) {
  if (!src.endsWith('\n') && src.length) src += '\n';
  const doc = parseDocument(src);
  if (doc.errors.length) throw new EditError(422, `Front matter is invalid YAML: ${doc.errors[0].message.split('\n')[0]}`, {code: 'invalid-yaml'});
  if (!doc.contents || isScalar(doc.contents) && doc.contents.value === null) {
    if (edit.op === 'delete') return src;
    const value = {};applyToValue(value, edit);
    return src + render(value[edit.path[0]], {pair: edit.path[0], top: true});
  }
  if (!isMap(doc.contents)) throw new EditError(422, 'Front matter must be a YAML mapping.', {code: 'invalid-yaml'});
  const path = edit.path;
  // Find the deepest existing ancestor; missing levels are written as one value.
  for (let depth = 1; depth < path.length; depth++) {
    const found = locate(doc, path.slice(0, depth));
    if (found.missing || found.node === null || isScalar(found.node)) {
      if (edit.op === 'delete') return src;
      const value = {};applyToValue(value, {...edit, path: path.slice(depth - 1)});
      return spliceOne(src, {op: 'set', path: path.slice(0, depth), value: value[path[depth - 1]]});
    }
  }
  const parentPath = path.slice(0, -1), last = path.at(-1);
  const parent = parentPath.length ? locate(doc, parentPath).node : doc.contents;
  if (parent.flow) {
    // Flow collections are short; rewrite the collection as one value.
    const whole = clone(doc.toJS());applyToValue(whole, edit);
    let value = whole;for (const key of parentPath) value = value[key];
    if (!parentPath.length) throw new EditError(422, 'Front matter must be a block mapping.', {code: 'invalid-yaml'});
    return spliceOne(src, {op: 'set', path: parentPath, value});
  }
  if (edit.op === 'insert' || edit.op === 'move') {
    const target = locate(doc, path);
    if (target.missing || target.node === null || isScalar(target.node) && target.node.value === null) {
      if (edit.op === 'move') throw new EditError(422, 'Nothing to move.', {code: 'invalid-input'});
      return spliceOne(src, {op: 'set', path, value: [edit.value]});
    }
    const list = target.node;
    if (!isSeq(list)) throw new EditError(422, `${path.join('.')} must be a list.`, {code: 'invalid-input'});
    if (list.flow || !list.items.length) {
      const value = clone(list.toJS(doc));applyToValue({value}, {...edit, path: ['value']});
      return spliceOne(src, {op: 'set', path, value});
    }
    const column = dashColumn(src, list.items[0]);
    if (edit.op === 'move') {
      const [start, end] = itemExtent(src, list.items[edit.from]), text = src.slice(start, end);
      const without = src.slice(0, start) + src.slice(end);
      const reparsed = locate(parseDocument(without), path).node;
      const at = edit.to >= reparsed.items.length ? itemExtent(without, reparsed.items.at(-1))[1] : itemExtent(without, reparsed.items[edit.to])[0];
      return without.slice(0, at) + text + without.slice(at);
    }
    const index = edit.index ?? list.items.length;
    const text = indentText(render(edit.value), column);
    const at = index >= list.items.length ? itemExtent(src, list.items.at(-1))[1] : itemExtent(src, list.items[index])[0];
    return src.slice(0, at) + text + src.slice(at);
  }
  if (isSeq(parent)) {
    const item = parent.items[last];
    if (!item) {if (edit.op === 'delete') return src;throw new EditError(422, 'List index is out of range.', {code: 'invalid-input'});}
    const [start, end] = itemExtent(src, item);
    if (edit.op === 'delete') {
      if (parent.items.length === 1) return spliceOne(src, {op: 'set', path: parentPath, value: []});
      return src.slice(0, start) + src.slice(end);
    }
    return src.slice(0, start) + indentText(render(edit.value), dashColumn(src, item)) + src.slice(end);
  }
  const pair = parent.items.find(p => (isScalar(p.key) ? p.key.value : p.key) === last);
  if (edit.op === 'delete') {
    if (!pair) return src;
    const [start, end] = pairExtent(src, pair);
    return src.slice(0, start) + src.slice(end);
  }
  const column = pair ? columnOf(src, pair.key.range[0]) : parent.items.length ? columnOf(src, parent.items[0].key.range[0]) : 0;
  const text = indentText(render(edit.value, {pair: last, top: path.length === 1}), column);
  if (pair) {const [start, end] = pairExtent(src, pair);return src.slice(0, start) + text + src.slice(end);}
  const at = parent.items.length ? pairExtent(src, parent.items.at(-1))[1] : src.length;
  return src.slice(0, at) + text + src.slice(at);
}
// edits: {op: 'set'|'delete'|'insert'|'move', path: [...keys], value, index, from, to}
export function editFrontMatter(text, edits) {
  const {front, block, body, eol} = splitDocument(text);
  const original = front === null ? '' : toLF(front);
  const expected = original ? clone(parseDocument(original).toJS() ?? {}) : {};
  if (original) {const doc = parseDocument(original);if (doc.errors.length) throw new EditError(422, `Front matter is invalid YAML: ${doc.errors[0].message.split('\n')[0]}`, {code: 'invalid-yaml'});}
  let src = original ? original + '\n' : '';
  for (const edit of edits) {applyToValue(expected, edit);src = spliceOne(src, edit);}
  const result = parseDocument(src);
  if (result.errors.length || JSON.stringify(result.toJS() ?? {}) !== JSON.stringify(expected))
    throw new EditError(500, 'The front-matter edit could not be applied without changing other values.', {code: 'front-matter-mismatch'});
  const yaml = src.replace(/\n$/, '');
  const newBlock = `---\n${yaml}\n---\n`;
  if (front === null) return fromLF(newBlock, eol) + (body.startsWith('\n') || body.startsWith('\r\n') || !body ? body : fromLF('\n', eol) + body);
  const closing = block.match(/\r?\n---(\r?\n|$)/g).at(-1);
  return fromLF(`---\n${yaml}`, eol) + closing.replace(/\r?\n/g, eol).replace(/^(?:\r?\n)/, eol) + body;
}
// Replace the whole front-matter text (the advanced editor). Empty text removes it.
export function setFrontMatterText(text, yaml) {
  const {block, body, eol} = splitDocument(text);
  const trimmed = toLF(yaml).replace(/\n+$/, '');
  if (!trimmed.trim()) return block ? body.replace(/^\r?\n/, '') : text;
  const doc = parseDocument(trimmed);
  if (doc.errors.length) throw new EditError(422, `Front matter is invalid YAML: ${doc.errors[0].message.split('\n')[0]}`, {code: 'invalid-yaml', field: 'frontMatter'});
  const value = doc.toJS();
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new EditError(422, 'Front matter must be a YAML mapping.', {code: 'invalid-yaml', field: 'frontMatter'});
  return fromLF(`---\n${trimmed}\n---\n`, eol) + (block ? body : (body.startsWith('\n') ? '' : fromLF('\n', eol)) + body);
}

// --- Body edits --------------------------------------------------------------
export function replaceBody(text, body) {
  const {block, eol} = splitDocument(text);
  let next = toLF(String(body));
  if (next && !next.endsWith('\n')) next += '\n';
  // Keep the file's own separator between the front matter and the body.
  if (block && next) next = toLF(splitDocument(text).body).match(/^\n*/)[0] + next.replace(/^\n+/, '');
  return block + fromLF(next, eol);
}
function headings(body) {
  const list = [];let offset = 0;
  for (const token of marked.lexer(body)) {
    if (token.type === 'heading') list.push({offset, end: offset + token.raw.length, depth: token.depth, text: token.text, anchor: anchor(token.text)});
    offset += token.raw.length;
  }
  return list;
}
export function sectionAnchors(text) {return headings(toLF(splitDocument(text).body)).map(h => ({anchor: h.anchor, text: h.text, depth: h.depth}));}
export function readSection(text, fragment) {
  const body = toLF(splitDocument(text).body), list = headings(body), index = list.findIndex(h => h.anchor === fragment);
  if (index < 0) return null;
  const next = list.slice(index + 1).find(h => h.depth <= list[index].depth);
  return body.slice(list[index].end, next ? next.offset : body.length).trim();
}
// Replace the content under the heading whose anchor is fragment, or append
// a new heading at the end of the body.
export function replaceSection(text, fragment, content, {heading, depth = 2} = {}) {
  const {block, body: rawBody, eol} = splitDocument(text);
  const body = toLF(rawBody), list = headings(body), index = list.findIndex(h => h.anchor === fragment);
  const value = toLF(String(content)).trim();
  let next;
  if (index < 0) {
    const title = heading ?? fragment;
    if (anchor(title) !== fragment) throw new EditError(500, 'Section heading does not match its anchor.', {code: 'section-anchor'});
    next = `${body.replace(/\s*$/, '')}${body.trim() ? '\n\n' : ''}${'#'.repeat(depth)} ${title}\n\n${value}\n`;
    if (!body.trim() && block) next = '\n' + next;
  } else {
    const h = list[index], after = list.slice(index + 1).find(x => x.depth <= h.depth);
    const head = body.slice(0, h.end).replace(/\n*$/, '\n\n');
    const tail = after ? body.slice(after.offset) : '';
    next = head + (value ? value + '\n' : '') + (tail ? '\n' + tail : '');
  }
  return block + fromLF(next, eol);
}
// Checklist items in document order, outside fenced code: the same items the
// readers count. Only the checkbox character changes.
export function checklistItems(text) {
  const items = [], lines = text.split('\n');let fence = null, offset = 0;
  for (const line of lines) {
    const marker = line.match(/^\s*(`{3,}|~{3,})/);
    if (marker) {if (!fence) fence = marker[1][0];else if (marker[1][0] === fence) fence = null;}
    else if (!fence) {
      const m = line.match(/^(\s*(?:[-*+]|\d+[.)])\s+\[)( |x|X)(\]\s)/);
      if (m) items.push({offset: offset + m[1].length, checked: m[2] !== ' ', text: line.slice(m[0].length).trim()});
    }
    offset += line.length + 1;
  }
  return items;
}
export function setCheckbox(text, index, checked) {
  const items = checklistItems(text), item = items[index];
  if (!item) throw new EditError(422, 'Checklist item does not exist.', {code: 'invalid-input', field: 'index'});
  return text.slice(0, item.offset) + (checked ? 'x' : ' ') + text.slice(item.offset + 1);
}

// --- Containment and branch -------------------------------------------------
async function branchOf(root, git) {
  const branch = await git(root, ['symbolic-ref', '--quiet', '--short', 'HEAD']).catch(() => null);
  return {branch, detached: !branch, protected: !branch || PROTECTED_BRANCHES.includes(branch)};
}
export async function requireEditableBranch(root, git) {
  const state = await branchOf(root, git);
  if (state.protected) throw new EditError(403, state.detached ? 'HEAD is detached. Create a branch before you edit knowledge.' : `Branch ${state.branch} is protected. Create a branch before you edit knowledge.`, {code: 'protected-branch', branch: state.branch, action: 'branch.create'});
  return state;
}
async function targetOf(root, path) {
  const rootReal = await realpath(root), base = await realpath(resolve(rootReal, 'docs/artifacts')).catch(() => null);
  if (base !== join(rootReal, 'docs', 'artifacts')) throw new EditError(422, 'docs/artifacts must be a directory inside the worktree.', {code: 'unsafe-path', path});
  const parts = path.slice(BASE.length).split('/');let current = base, info = null;
  for (let i = 0; i < parts.length; i++) {
    current = join(current, parts[i]);
    info = await lstat(current).catch(error => {if (error.code === 'ENOENT') return null;throw error;});
    if (!info) return {target: join(base, ...parts), exists: false};
    if (info.isSymbolicLink()) throw new EditError(422, `Refusing to write through a symbolic link: ${path}`, {code: 'unsafe-path', path});
    if (i < parts.length - 1 && !info.isDirectory()) throw new EditError(422, `Path component is not a directory: ${path}`, {code: 'unsafe-path', path});
  }
  if (!info.isFile()) throw new EditError(422, `Not a regular file: ${path}`, {code: 'unsafe-path', path});
  if (info.size > MAX_BYTES) throw new EditError(422, `File is larger than 1 MiB: ${path}`, {code: 'too-large', path});
  return {target: current, exists: true};
}
// Policy rules that need repository facts: legacy artifacts, version records
// and tasks of delivered changes.
function checkPolicy(edit, policy) {
  const parts = edit.path.split('/'), artifact = parts[2], rest = parts.slice(3);
  const refuse = message => {throw new EditError(422, message, {code: 'protected-record', path: edit.path});};
  if (artifact !== 'units-of-work' && policy.layouts?.[artifact] === 'legacy' && !policy.allowLegacy) refuse(`${artifact} uses the legacy layout. Migrate it to the in-place layout before you edit it.`);
  if (rest[0] === 'versions') {
    const record = rest.length === 3 && /^\d+\.\d+\.\d+$/.test(rest[1]) && rest[2] === 'README.md';
    if (!record || edit.action === 'delete' || edit.action === 'replace' && !policy.allowVersionRecord) refuse('Version records are created once and never changed or deleted.');
  }
  if (rest[0] === 'changes' && rest[2] === 'tasks' && policy.delivered?.has(`${artifact}/${rest[1]}`)) refuse(`${rest[1]} is named by a version record; its tasks are delivered and cannot change.`);
  if (edit.path.endsWith('.yaml') && !(policy.allowLegacy && edit.action === 'delete')) refuse('Only Markdown knowledge can be written.');
}

// --- Journal ------------------------------------------------------------------
export function createJournal(limit = 50) {
  const roots = new Map();let sequence = 0;
  return {
    record(root, operation, files) {
      const list = roots.get(root) || [];const id = `op-${Date.now().toString(36)}-${(++sequence).toString(36)}`;
      list.push({id, operation, at: new Date().toISOString(), files});
      while (list.length > limit) list.shift();
      roots.set(root, list);return id;
    },
    get(root, id) {return (roots.get(root) || []).find(entry => entry.id === id) || null;},
    remove(root, id) {const list = roots.get(root) || [];const index = list.findIndex(entry => entry.id === id);if (index >= 0) list.splice(index, 1);},
    list(root) {return (roots.get(root) || []).map(({id, operation, at, files}) => ({id, operation, at, paths: files.map(f => f.path)}));},
  };
}
// One mutation at a time per repository.
const queues = new Map();
export function serialize(key, work) {
  const previous = queues.get(key) || Promise.resolve();
  const next = previous.catch(() => {}).then(work);
  const tail = next.catch(() => {});queues.set(key, tail);
  tail.then(() => {if (queues.get(key) === tail) queues.delete(key);});
  return next;
}

// --- Plan inspection and atomic apply ---------------------------------------
// edits: [{path, action: 'create'|'replace'|'delete', after: string|Buffer}]
export async function readPlan(root, edits) {
  const seen = new Set(), files = [];
  for (const edit of [...edits].sort((a, b) => a.path.localeCompare(b.path))) {
    checkPath(edit.path, {yaml: edit.action === 'delete'});
    if (seen.has(edit.path)) throw new EditError(500, `Plan edits ${edit.path} twice.`, {code: 'invalid-plan'});
    seen.add(edit.path);
    const {target, exists} = await targetOf(root, edit.path);
    let before = null;
    if (exists) {
      before = await readFile(target);
      if (!edit.path.endsWith('.yaml') && !before.equals(Buffer.from(before.toString('utf8')))) throw new EditError(422, `File is not valid UTF-8: ${edit.path}`, {code: 'not-utf8', path: edit.path});
    }
    if (edit.action === 'create' && exists) throw new EditError(409, `File already exists: ${edit.path}`, {code: 'exists', path: edit.path});
    if (edit.action !== 'create' && !exists) throw new EditError(404, `File does not exist: ${edit.path}`, {code: 'missing', path: edit.path});
    const after = edit.action === 'delete' ? null : Buffer.isBuffer(edit.after) ? edit.after : Buffer.from(String(edit.after), 'utf8');
    if (after && after.length > MAX_BYTES) throw new EditError(422, `Content is larger than 1 MiB: ${edit.path}`, {code: 'too-large', path: edit.path});
    files.push({...edit, target, before, after, beforeDigest: before ? digestOf(before) : null, afterDigest: after ? digestOf(after) : null});
  }
  return files;
}
async function writeTemp(target, bytes) {
  const temp = join(dirname(target), `.${basename(target)}.${process.pid}-${randomBytes(6).toString('hex')}.tmp`);
  await writeFile(temp, bytes, {flag: 'wx'});
  return temp;
}
async function makeDirectories(root, target, created) {
  const base = await realpath(resolve(root, 'docs/artifacts'));const missing = [];
  for (let dir = dirname(target); dir.length > base.length; dir = dirname(dir)) {
    const info = await lstat(dir).catch(() => null);
    if (info) {if (!info.isDirectory() || info.isSymbolicLink()) throw new EditError(422, 'Path component is not a directory.', {code: 'unsafe-path'});break;}
    missing.unshift(dir);
  }
  for (const dir of missing) {await mkdir(dir);created.push(dir);}
}
async function pruneDirectories(root, dirs) {
  const base = await realpath(resolve(root, 'docs/artifacts'));
  for (const start of [...new Set(dirs)].sort((a, b) => b.length - a.length))
    for (let dir = start; dir.length > base.length && dir.startsWith(base + '/'); dir = dirname(dir)) {
      const entries = await readdir(dir).catch(() => null);
      if (!entries || entries.length) break;
      await rmdir(dir).catch(() => {});
    }
}
// Writes the plan or nothing. expected maps paths to SHA-256 digests of the
// bytes the caller read; every replaced or deleted file needs one.
export async function writePlan(root, edits, {expected = {}, policy = {}, git, journal, operation, beforeRename} = {}) {
  if (git) await requireEditableBranch(root, git);
  for (const edit of edits) checkPolicy(edit, policy);
  const files = await readPlan(root, edits);
  const conflicts = {}, required = {};
  for (const file of files) {
    if (file.action === 'create') continue;
    if (expected[file.path] === undefined) required[file.path] = file.beforeDigest;
    else if (expected[file.path] !== file.beforeDigest) conflicts[file.path] = file.before.toString('utf8');
  }
  if (Object.keys(conflicts).length) throw new EditError(409, 'Files changed after you read them. Reload or overwrite.', {code: 'digest-mismatch', current: conflicts, digests: Object.fromEntries(files.filter(f => conflicts[f.path] !== undefined).map(f => [f.path, f.beforeDigest]))});
  if (Object.keys(required).length) throw new EditError(409, 'Preview the operation first. Apply needs the digests of the files it changes.', {code: 'expected-required', digests: required});
  const temps = [], dirs = [], done = [];
  try {
    for (const file of files) if (file.after) {await makeDirectories(root, file.target, dirs);file.temp = await writeTemp(file.target, file.after);temps.push(file.temp);}
    for (const [index, file] of files.entries()) {
      await beforeRename?.(index, file);
      if (file.action === 'create') {await link(file.temp, file.target);await unlink(file.temp);}
      else if (file.action === 'replace') await rename(file.temp, file.target);
      else await unlink(file.target);
      done.push(file);
    }
  } catch (error) {
    const failed = [];
    for (const file of done.reverse()) {
      try {
        if (file.action === 'create') await unlink(file.target);
        else if (file.action === 'replace') await rename(await writeTemp(file.target, file.before), file.target);
        else await writeFile(file.target, file.before, {flag: 'wx'});
      } catch {failed.push(file.path);}
    }
    for (const temp of temps) await unlink(temp).catch(() => {});
    await pruneDirectories(root, dirs);
    if (error instanceof EditError && !done.length) throw error;
    throw new EditError(500, failed.length ? 'The write failed and some files could not be restored. Git status shows the current state.' : 'The write failed; earlier files were restored.', {code: 'partial-write', paths: files.map(f => f.path), unrestored: failed});
  }
  await pruneDirectories(root, files.filter(f => f.action === 'delete').map(f => dirname(f.target)));
  const record = files.map(f => ({path: f.path, action: f.action, before: f.before, beforeDigest: f.beforeDigest, afterDigest: f.afterDigest}));
  const id = journal ? journal.record(root, operation, record) : null;
  return {operationId: id, files: files.map(f => ({path: f.path, action: f.action, digest: f.afterDigest, before: f.beforeDigest}))};
}
// The reverse plan of a journal entry, valid while every file still has the
// bytes that the operation wrote.
export async function undoPlan(root, journal, id) {
  const entry = journal.get(root, id);
  if (!entry) throw new EditError(404, 'This operation is no longer in the undo journal.', {code: 'unknown-operation'});
  const edits = [], expected = {}, changed = {};
  for (const file of entry.files) {
    const {target, exists} = await targetOf(root, file.path);
    const current = exists ? await readFile(target) : null, digest = current ? digestOf(current) : null;
    if (digest !== file.afterDigest) changed[file.path] = current ? current.toString('utf8') : null;
    if (file.action === 'create') {edits.push({path: file.path, action: 'delete'});expected[file.path] = digest;}
    else if (file.action === 'replace') {edits.push({path: file.path, action: 'replace', after: file.before});expected[file.path] = digest;}
    else edits.push({path: file.path, action: 'create', after: file.before});
  }
  if (Object.keys(changed).length) throw new EditError(409, 'Files changed after this operation. Undo is not possible.', {code: 'undo-conflict', current: changed});
  return {entry, edits, expected};
}
