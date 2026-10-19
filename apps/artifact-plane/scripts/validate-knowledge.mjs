// ADD record validator (artifact-driven specifications/record-checks.md,
// Validator). It checks one repository's ADD knowledge with the existing
// readers and the shared record checks, and writes one JSON object with the
// schema add-validate.result.v1. It never writes files, runs commands found in
// records, fetches or pushes; it reads local Git refs only. `npm run
// build:validator` bundles this file into docs/artifact-driven/tools/add-validate.mjs.
// Usage: node validate-knowledge.mjs [--repository <path>] [--change <artifact>/<change>]
// A single positional repository path is also accepted.
import {resolve} from 'node:path';
import {scanRepository, git} from '../server/reader.js';
import {buildTaskGraph} from '../server/task-graph.js';
import {checklist} from '../server/workflow.js';
import {unitBriefs, frontMatter} from '../server/units-of-work.js';
import {buildFlowGraph} from '../server/flow-model.js';
import {readClaims} from '../server/claims.js';
import {recordChecks} from '../server/record-checks.js';
import {tierCheck} from '../server/tier-check.js';

export const SCHEMA = 'add-validate.result.v1';
// Informational codes, reported gaps and claim warnings do not fail validation;
// claim and record diagnostics carry their own severity.
const NOT_ERRORS = new Set(['flow-evidence-gap']);
const CHANGE = /^([a-z0-9][a-z0-9-]*)\/(change-[a-z0-9][a-z0-9-]*)$/;
export class UsageError extends Error {}

export function parseArguments(args) {
  const options = {repository: process.cwd(), change: null};
  let positional = false;
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--repository' || arg === '--change') {
      const value = args[++i];
      if (!value || value.startsWith('--')) throw new UsageError(`${arg} needs a value.`);
      if (arg === '--repository') options.repository = value;
      else if (!CHANGE.test(value)) throw new UsageError('--change must be <artifact>/<change>.');
      else options.change = value;
    } else if (!arg.startsWith('--') && !positional) {options.repository = arg;positional = true;}
    else throw new UsageError(`Unknown argument ${arg}.`);
  }
  return options;
}

export async function validateKnowledge(path, {change = null} = {}) {
  const scan = await scanRepository(resolve(path));
  const {snapshot, files, unsafeTaskPaths, baselines} = scan;
  const root = snapshot.repository.path;
  const scope = change ? {artifact: change.split('/')[0], change: change.split('/')[1]} : null;
  if (scope && !snapshot.artifacts.find(a => a.id === scope.artifact)?.changes.some(c => c.name === scope.change)) throw new UsageError(`${change} has no change record.`);
  const diagnostics = snapshot.diagnostics.map(d => ({...d, source: 'snapshot'}));
  for (const artifact of snapshot.artifacts) for (const c of artifact.changes) {
    const graph = buildTaskGraph(files, `docs/artifacts/${artifact.id}/changes/${c.name}/`, checklist, unsafeTaskPaths);
    if (graph.state !== 'unavailable') diagnostics.push(...graph.diagnostics.map(d => ({...d, source: 'task-graph'})));
  }
  const units = unitBriefs(files);
  for (const unit of units) {
    diagnostics.push(...unit.diagnostics.map(d => ({...d, source: 'unit'})));
    for (const member of unit.members) if (!snapshot.artifacts.find(a => a.id === member.artifact)?.changes.some(c => c.name === member.change))
      diagnostics.push({code: 'missing-member', path: unit.path, message: `${member.artifact}/${member.change} has no change record.`, source: 'unit'});
  }
  diagnostics.push(...readClaims(files, {snapshot, baselines, units}).diagnostics.map(d => ({...d, source: 'claims'})));
  const flows = buildFlowGraph(snapshot, {context: root, knowledge: 'planning'});
  diagnostics.push(...flows.diagnostics.map(d => ({...d, source: 'flow'})));
  diagnostics.push(...(await recordChecks({root, scan, git})).map(d => ({...d, source: 'records'})));
  // Tier: the scoped change, or every undelivered change that declares small.
  let tier = null;
  const delivered = new Set();
  for (const [path, body] of files) {const m = path.match(/^docs\/artifacts\/([^/]+)\/versions\/(\d+\.\d+\.\d+)\/README\.md$/);const source = m && frontMatter(body).value?.source_change;if (source && baselines[m[1]]?.versionRecords?.includes(m[2])) delivered.add(`${m[1]}/${source}`);}
  const targets = scope ? [scope] : snapshot.artifacts.flatMap(a => a.changes.filter(c => c.tierDeclared && c.tier === 'small' && !delivered.has(`${a.id}/${c.name}`)).map(c => ({artifact: a.id, change: c.name})));
  for (const target of targets) {
    const result = await tierCheck({root, scan, git, ...target, standalone: true});
    diagnostics.push(...result.diagnostics.map(d => ({...d, source: 'tier'})));
    if (scope) tier = result.tier;
  }
  for (const d of diagnostics) d.severity ??= NOT_ERRORS.has(d.code) ? 'warning' : 'error';
  const kept = (scope ? diagnostics.filter(d => inScope(d, scope, files, baselines)) : diagnostics)
    .sort((a, b) => String(a.path).localeCompare(String(b.path)) || a.code.localeCompare(b.code) || String(a.message).localeCompare(String(b.message)));
  const errors = kept.filter(d => d.severity === 'error').length;
  return {
    schema: SCHEMA, ok: errors === 0, repository: root, scope: change, tier,
    artifacts: snapshot.artifacts.map(a => ({id: a.id, layout: a.layout, currentVersion: a.currentVersion, proposedVersion: a.proposedVersion ?? null, activeChange: a.activeChange, baseline: a.baseline?.state ?? null})),
    counts: {artifacts: snapshot.artifacts.length, elements: snapshot.artifacts.reduce((n, a) => n + a.elements.length, 0), units: units.length, flows: flows.flows.length, errors, diagnostics: kept.length},
    diagnostics: kept,
  };
}
// --change keeps the files of the change, its identity record and the records it touches.
function inScope(d, {artifact, change}, files, baselines) {
  const path = String(d.path || ''), prefix = `docs/artifacts/${artifact}/`;
  if (path.startsWith(`${prefix}changes/${change}/`) || path === `${prefix}README.md` || path === 'docs/artifacts/add.config.yaml') return true;
  if (['added', 'modified'].includes(baselines[artifact]?.status?.get(path))) return true;
  if (path.startsWith(`${prefix}versions/`) && frontMatter(files.get(path) || '').value?.source_change === change) return true;
  if (/^docs\/artifacts\/units-of-work\//.test(path)) return (frontMatter(files.get(path) || '').value?.changes || []).some(m => m?.artifact === artifact && m?.change === change);
  return false;
}

export async function main(args) {
  try {
    const options = parseArguments(args);
    const result = await validateKnowledge(options.repository, {change: options.change});
    return {code: result.ok ? 0 : 1, output: result};
  } catch (error) {
    return {code: 2, output: {schema: SCHEMA, ok: false, error: error.message, status: error.status ?? null}};
  }
}
if (import.meta.url === `file://${process.argv[1]}`) {
  const {code, output} = await main(process.argv.slice(2));
  // Set exitCode instead of exiting so large JSON reports flush to pipes.
  console.log(JSON.stringify(output, null, 1));process.exitCode = code;
}
