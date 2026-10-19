// Validate one repository's ADD knowledge with the existing readers: scanner,
// snapshot, task graphs, unit briefs and flows. Prints JSON; exits 1 when any
// diagnostic is an error. Optional tool: ADD remains usable without it.
// Usage: node scripts/validate-knowledge.mjs <repository>
import {resolve} from 'node:path';
import {scanRepository} from '../server/reader.js';
import {buildTaskGraph} from '../server/task-graph.js';
import {checklist} from '../server/workflow.js';
import {unitBriefs} from '../server/units-of-work.js';
import {buildFlowGraph} from '../server/flow-model.js';
import {readClaims} from '../server/claims.js';

// Informational codes, reported gaps and claim warnings do not fail validation;
// claim diagnostics carry their own severity.
const NOT_ERRORS = new Set(['flow-evidence-gap']);
export async function validateKnowledge(path) {
  const {snapshot, files, unsafeTaskPaths, baselines} = await scanRepository(resolve(path));
  const diagnostics = snapshot.diagnostics.map(d => ({...d, source: 'snapshot'}));
  for (const artifact of snapshot.artifacts) for (const change of artifact.changes) {
    const graph = buildTaskGraph(files, `docs/artifacts/${artifact.id}/changes/${change.name}/`, checklist, unsafeTaskPaths);
    if (graph.state !== 'unavailable') diagnostics.push(...graph.diagnostics.map(d => ({...d, source: 'task-graph'})));
  }
  const units = unitBriefs(files);
  for (const unit of units) {
    diagnostics.push(...unit.diagnostics.map(d => ({...d, source: 'unit'})));
    for (const member of unit.members) if (!snapshot.artifacts.find(a => a.id === member.artifact)?.changes.some(c => c.name === member.change))
      diagnostics.push({code: 'missing-member', path: unit.path, message: `${member.artifact}/${member.change} has no change record.`, source: 'unit'});
  }
  diagnostics.push(...readClaims(files, {snapshot, baselines, units}).diagnostics.map(d => ({...d, source: 'claims'})));
  const flows = buildFlowGraph(snapshot, {context: snapshot.repository.path, knowledge: 'planning'});
  diagnostics.push(...flows.diagnostics.map(d => ({...d, source: 'flow'})));
  for (const d of diagnostics) d.severity ??= NOT_ERRORS.has(d.code) ? 'warning' : 'error';
  const errors = diagnostics.filter(d => d.severity === 'error').length;
  return {
    repository: snapshot.repository.path,
    artifacts: snapshot.artifacts.map(a => ({id: a.id, layout: a.layout, currentVersion: a.currentVersion, proposedVersion: a.proposedVersion ?? null, activeChange: a.activeChange, baseline: a.baseline?.state ?? null})),
    counts: {artifacts: snapshot.artifacts.length, elements: snapshot.artifacts.reduce((n, a) => n + a.elements.length, 0), units: units.length, flows: flows.flows.length, errors, diagnostics: diagnostics.length},
    diagnostics,
  };
}
if (import.meta.url === `file://${process.argv[1]}`) {
  const path = process.argv[2];
  // Set exitCode instead of exiting so large JSON reports flush to pipes.
  if (!path) {console.error('Usage: validate-knowledge.mjs <repository>');process.exitCode = 2;}
  else try {const result = await validateKnowledge(path);console.log(JSON.stringify(result, null, 1));process.exitCode = result.counts.errors ? 1 : 0;}
  catch (error) {console.log(JSON.stringify({error: error.message, status: error.status ?? null}));process.exitCode = 2;}
}
