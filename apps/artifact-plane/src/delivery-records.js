// Readers of the ADD 3.0.0 delivery fields: change tier, plan compatibility,
// task covers, requirement IDs and the project configuration file. Pure
// functions over Markdown or YAML text, shared by the server and the browser.
import {parseDocument} from 'yaml';

export const TIERS = ['small', 'medium', 'large'];
export const LEVELS = ['patch', 'minor', 'major'];
export const CONFIG_PATH = 'docs/artifacts/add.config.yaml';
export const ROLES = ['coordinator', 'product-owner', 'technical-lead', 'implementer'];
export const DEFAULT_CONFIG = Object.freeze({version: 1, tiers: {small: {max_code_lines: 100}}, unit_brief: {required_for: ['medium', 'large']}, reading: Object.fromEntries(ROLES.map(r => [r, []]))});
const REQUIREMENT_ID = /^[A-Z][A-Z0-9]*[0-9]+$/;
const mapping = v => v !== null && typeof v === 'object' && !Array.isArray(v);

function front(markdown) {
  if (typeof markdown !== 'string' || !/^---\r?\n/.test(markdown)) return {value: {}};
  const match = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  if (!match) return {error: true};
  try {
    const doc = parseDocument(match[1], {uniqueKeys: true});
    const value = doc.toJS() ?? {};
    return doc.errors.length || !mapping(value) ? {error: true} : {value};
  } catch {return {error: true};}
}

// Change README `tier`; absent means medium. Malformed front matter is
// reported by the existing readers, so it reads as medium here.
export function changeTier(markdown, path) {
  const value = front(markdown).value || {};
  if (!Object.hasOwn(value, 'tier')) return {tier: 'medium', declared: false, diagnostics: []};
  if (TIERS.includes(value.tier)) return {tier: value.tier, declared: true, diagnostics: []};
  return {tier: 'medium', declared: false, diagnostics: [{code: 'invalid-tier', path, message: `tier must be ${TIERS.join(', ')}.`}]};
}

// Plan `compatibility`; absent is allowed.
export function planCompatibility(markdown, path) {
  const value = front(markdown).value || {};
  if (!Object.hasOwn(value, 'compatibility')) return {compatibility: null, diagnostics: []};
  if (LEVELS.includes(value.compatibility)) return {compatibility: value.compatibility, diagnostics: []};
  return {compatibility: null, diagnostics: [{code: 'invalid-compatibility', path, message: `compatibility must be ${LEVELS.join(', ')}.`}]};
}

// Task `covers`: a list of {artifact?, element, ids}. `artifact` defaults to
// the task's artifact. Shape problems are `invalid-covers` errors.
export function taskCovers(markdown, path) {
  const value = front(markdown).value || {};
  if (!Object.hasOwn(value, 'covers')) return {covers: [], diagnostics: []};
  const owner = path?.split('/')[2];
  const bad = message => ({covers: [], diagnostics: [{code: 'invalid-covers', path, message}]});
  if (!Array.isArray(value.covers) || !value.covers.length) return bad('covers must be a nonempty list.');
  const covers = [];
  for (const entry of value.covers) {
    if (!mapping(entry) || Object.keys(entry).some(k => !['artifact', 'element', 'ids'].includes(k))) return bad('Each covers entry has only artifact, element and ids.');
    if (entry.artifact !== undefined && !/^[a-z0-9][a-z0-9-]*$/.test(entry.artifact)) return bad('covers artifact must be an artifact ID.');
    if (typeof entry.element !== 'string' || !/^requirements\/[^\\\0]+\.md$/.test(entry.element) || entry.element.split('/').some(p => !p || p === '.' || p === '..')) return bad('covers element must be a path under requirements/.');
    if (!Array.isArray(entry.ids) || !entry.ids.length || !entry.ids.every(id => typeof id === 'string' && REQUIREMENT_ID.test(id))) return bad('covers ids must be a nonempty list of requirement IDs.');
    covers.push({artifact: entry.artifact ?? owner, element: entry.element, ids: entry.ids});
  }
  return {covers, diagnostics: []};
}

// Requirement IDs: list items (`- R1: `) and paragraph labels (`R1. `),
// outside front matter and code fences.
export function requirementIds(markdown) {
  const ids = [];
  let fence = null, offset = 0;
  const lines = String(markdown || '').split(/\r?\n/);
  if (/^---$/.test(lines[0])) {const end = lines.indexOf('---', 1);if (end > 0) offset = end + 1;}
  for (let i = offset; i < lines.length; i++) {
    const line = lines[i], marker = line.match(/^\s{0,3}(`{3,}|~{3,})/);
    if (marker) {fence = fence ? (marker[1][0] === fence[0] && marker[1].length >= fence.length ? null : fence) : marker[1];continue;}
    if (fence) continue;
    const list = line.match(/^- ([A-Z][A-Z0-9]*[0-9]+): /), paragraph = line.match(/^([A-Z][A-Z0-9]*[0-9]+)\. /);
    if (list) ids.push({id: list[1], line: i + 1, form: 'list', text: line.slice(list[0].length)});
    else if (paragraph) ids.push({id: paragraph[1], line: i + 1, form: 'paragraph', text: line.slice(paragraph[0].length)});
  }
  return ids;
}
export function duplicateIds(ids, path) {
  const seen = new Set(), diagnostics = [];
  for (const {id, line} of ids) {
    if (seen.has(id)) diagnostics.push({code: 'requirement-id-duplicate', path, message: `Requirement ID ${id} occurs again on line ${line}.`});
    seen.add(id);
  }
  return diagnostics;
}

// docs/artifacts/add.config.yaml with defaults. Unknown keys and wrong types
// are `config-invalid`; the defaults then apply.
export function readConfig(text) {
  const config = structuredClone(DEFAULT_CONFIG);
  if (text === undefined || text === null) return {config, present: false, diagnostics: []};
  const problems = [];
  let value;
  try {
    const doc = parseDocument(text, {uniqueKeys: true});
    value = doc.toJS() ?? {};
    if (doc.errors.length) problems.push(doc.errors[0].message.split('\n')[0]);
  } catch (error) {problems.push(error.message.split('\n')[0]);}
  const unknown = (object, keys, where) => {for (const key of Object.keys(object)) if (!keys.includes(key)) problems.push(`unknown key ${where}${key}`);};
  if (!problems.length && !mapping(value)) problems.push('the file must be a YAML mapping');
  if (!problems.length) {
    unknown(value, ['version', 'tiers', 'unit_brief', 'reading'], '');
    if (value.version !== undefined && value.version !== 1) problems.push('version must be 1');
    if (value.tiers !== undefined) {
      if (!mapping(value.tiers)) problems.push('tiers must be a mapping');
      else {
        unknown(value.tiers, ['small'], 'tiers.');
        if (value.tiers.small !== undefined) {
          if (!mapping(value.tiers.small)) problems.push('tiers.small must be a mapping');
          else {
            unknown(value.tiers.small, ['max_code_lines'], 'tiers.small.');
            const max = value.tiers.small.max_code_lines;
            if (max !== undefined) {if (Number.isInteger(max) && max > 0) config.tiers.small.max_code_lines = max;else problems.push('tiers.small.max_code_lines must be a positive integer');}
          }
        }
      }
    }
    if (value.unit_brief !== undefined) {
      if (!mapping(value.unit_brief)) problems.push('unit_brief must be a mapping');
      else {
        unknown(value.unit_brief, ['required_for'], 'unit_brief.');
        const list = value.unit_brief.required_for;
        if (list !== undefined) {if (Array.isArray(list) && list.every(t => TIERS.includes(t)) && new Set(list).size === list.length) config.unit_brief.required_for = list;else problems.push('unit_brief.required_for must be a list of distinct tiers');}
      }
    }
    if (value.reading !== undefined) {
      if (!mapping(value.reading)) problems.push('reading must be a mapping');
      else for (const [role, paths] of Object.entries(value.reading)) {
        if (!ROLES.includes(role)) {problems.push(`unknown key reading.${role}`);continue;}
        if (Array.isArray(paths) && paths.every(p => typeof p === 'string' && p.endsWith('.md') && !p.startsWith('/') && !p.includes('\\') && !p.includes('\0') && p.split('/').every(s => s && s !== '.' && s !== '..'))) config.reading[role] = paths;
        else problems.push(`reading.${role} must be a list of repository-relative Markdown paths`);
      }
    }
  }
  if (problems.length) return {config: structuredClone(DEFAULT_CONFIG), present: true, diagnostics: [{code: 'config-invalid', path: CONFIG_PATH, message: `Configuration is invalid: ${problems.join('; ')}. The defaults apply.`}]};
  return {config, present: true, diagnostics: []};
}

// A task evidence record without `source` uses the task's Evidence section.
export const evidenceSource = (record, taskPath) => typeof record?.source === 'string' ? record.source : `${taskPath}#evidence`;
