// Scenario measurement: user actions, files written by operations, raw
// front-matter edits, validation and bytes outside the edited targets.
import {readFile, writeFile, mkdir} from 'node:fs/promises';
import {join, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {validateKnowledge} from '../../scripts/validate-knowledge.mjs';
import {fingerprint} from '../fixtures.js';

const ACTIONS = ['click', 'fill', 'selectOption', 'check', 'uncheck', 'press', 'type'];
// Free-text entry: content that a person writes in any tool.
const TEXT = ['fill', 'type', 'insertText'];
// Count Playwright user actions after the repository is open. Locator calls
// are counted through page.locator results, keyboard calls through page.keyboard.
export function measure(page, root) {
  const state = {actions: 0, text: 0, log: [], operations: [], rawFrontMatter: 0, start: Date.now(), root, before: null};
  const wrapLocator = locator => new Proxy(locator, {get(target, key) {
    const value = target[key];
    if (typeof value !== 'function') return value;
    if (ACTIONS.includes(key)) return (...args) => {state.actions++;if (TEXT.includes(key)) state.text++;state.log.push(`${key} ${target.toString().slice(0, 120)}`);return value.apply(target, args);};
    return (...args) => {const result = value.apply(target, args);return result && typeof result === 'object' && typeof result.click === 'function' ? wrapLocator(result) : result;};
  }});
  const keyboard = new Proxy(page.keyboard, {get(target, key) {
    const value = target[key];
    if (typeof value !== 'function') return value;
    return (...args) => {if (['press', 'type', 'insertText'].includes(key)) {state.actions++;if (TEXT.includes(key)) state.text++;state.log.push(`keyboard.${key} ${args[0]}`);}return value.apply(target, args);};
  }});
  const counted = new Proxy(page, {get(target, key) {
    if (key === 'keyboard') return keyboard;
    const value = target[key];
    if (typeof value !== 'function') return value;
    return (...args) => {const result = value.apply(target, args);return result && typeof result === 'object' && typeof result.click === 'function' ? wrapLocator(result) : result;};
  }});
  page.on('response', async response => {
    if (!response.url().endsWith('/api/knowledge/edit') || response.request().method() !== 'POST') return;
    try {
      const request = response.request().postDataJSON(), body = await response.json();
      if (request.operation === 'document.properties.set') state.rawFrontMatter++;
      state.operations.push({operation: request.operation, dryRun: !!request.dryRun, status: response.status(), files: (body.files || []).map(f => ({path: f.path, action: f.action}))});
    } catch { /* A closed page has no body. */ }
  });
  return {page: counted, state,
    async begin() {state.before = await fingerprint(root);state.actions = 0;state.text = 0;state.log = [];state.operations = [];state.rawFrontMatter = 0;state.start = Date.now();},
    async finish(name, extra = {}) {
      const after = await fingerprint(root), changed = Object.keys({...state.before, ...after}).filter(p => !p.startsWith('.git/') && state.before[p] !== after[p]).sort();
      const written = [...new Set(state.operations.filter(o => !o.dryRun && o.status === 200).flatMap(o => o.files.map(f => f.path)))].sort();
      const validation = await validateKnowledge(root);
      return {scenario: name, actions: state.actions, textEntries: state.text, otherActions: state.actions - state.text, rawFrontMatterEdits: state.rawFrontMatter, seconds: Math.round((Date.now() - state.start) / 100) / 10,
        operations: state.operations.filter(o => !o.dryRun && o.status === 200).map(o => o.operation), filesWritten: written,
        unexpectedChanges: changed.filter(p => !written.includes(p) && !(extra.allowed || []).includes(p)),
        validationErrors: validation.diagnostics.filter(d => d.severity === 'error').map(d => `${d.code} ${d.path}`), log: state.log, ...extra};
    }};
}
// Each scenario suite writes its results to test-results/<name>.json.
export async function report(result, name = 'authoring-scenarios') {
  const file = fileURLToPath(new URL(`../../test-results/${name}.json`, import.meta.url));
  await mkdir(dirname(file), {recursive: true});
  const current = JSON.parse(await readFile(file, 'utf8').catch(() => '{}'));
  current[result.scenario] = result;
  await writeFile(file, JSON.stringify(current, null, 1));
}
export const text = (root, path) => readFile(join(root, path), 'utf8');
