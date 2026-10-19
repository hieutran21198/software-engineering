import {evidenceSource} from '../src/delivery-records.js';
import {frontMatter, safeKnowledgePath, evidenceDetail} from './units-of-work.js';
// Claim records of the ADD claim contract (artifact-driven specifications/claim-records.md).
// Claims are read from files only; a status describes evidence, never approval.
export const CLAIM_KINDS = ['decision', 'assumption', 'hypothesis', 'root_cause', 'unknown', 'risk'];
export const CLAIM_STATUSES = ['open', 'supported', 'verified', 'refuted', 'superseded'];
export const CLAIM_BASES = ['documented', 'static', 'observed', 'inferred'];
export const CLAIM_WARNINGS = new Set(['claim-check-missing', 'claim-unverified-at-version', 'claim-list-long']);
const FIELDS = ['id', 'kind', 'statement', 'status', 'basis', 'evidence', 'check', 'verified_by', 'rejected', 'risk_if_wrong', 'about', 'superseded_by'];
const REQUIRED = {open: [], supported: ['evidence'], verified: ['evidence', 'verified_by'], refuted: ['evidence'], superseded: ['superseded_by']};
const FORBIDDEN = {open: ['verified_by', 'superseded_by'], supported: ['verified_by', 'superseded_by'], verified: ['superseded_by'], refuted: ['verified_by', 'superseded_by'], superseded: ['verified_by']};
const CHECKED = new Set(['decision', 'root_cause', 'assumption']);
const ID = /^[a-z0-9][a-z0-9-]*$/;
const MAX_CLAIMS = 10;
const mapping = v => !!v && typeof v === 'object' && !Array.isArray(v);
const nonempty = (v, max = 20000) => typeof v === 'string' && v.trim().length > 0 && v.length <= max;
const textList = (v, check) => Array.isArray(v) && v.length > 0 && v.every(check);

// The record types that may declare claims. Change READMEs, version records,
// identity records and flow records may not.
export function claimRecord(path, value = {}) {
  if (/^docs\/artifacts\/units-of-work\/[^/]+\/README\.md$/.test(path)) return 'unit';
  const rest = path.match(/^docs\/artifacts\/(?!units-of-work\/)[^/]+\/(.+\.md)$/)?.[1];
  if (!rest || mapping(value) && 'flow' in value) return null;
  if (/^(requirements|specifications|decisions)\//.test(rest)) return 'knowledge';
  if (/^changes\/[^/]+\/tasks\/[^/]+$/.test(rest)) return rest.endsWith('/README.md') ? 'plan' : 'task';
  return null;
}
const declares = markdown => typeof markdown === 'string' && markdown.startsWith('---') && /^claims\s*:/m.test(markdown.slice(0, markdown.indexOf('\n---', 3) + 1 || undefined));
// Resolve one evidence source like evidence_records: a safe Markdown path with an
// optional heading that resolves to nonempty detail.
export function resolveSource(files, source) {
  if (typeof source !== 'string') return null;
  const [path, fragment, extra] = source.split('#');
  if (!safeKnowledgePath(path) || extra !== undefined || fragment === '') return null;
  const body = files.get(path);
  return body === undefined ? null : evidenceDetail(body, fragment);
}
function shapeProblems(claim, ids) {
  if (!mapping(claim)) return ['a claim must be a mapping'];
  const problems = [];
  for (const key of Object.keys(claim)) if (!FIELDS.includes(key)) problems.push(`unknown key ${key}`);
  if (!ID.test(claim.id ?? '')) problems.push('id must match [a-z0-9][a-z0-9-]*');
  if (!CLAIM_KINDS.includes(claim.kind)) problems.push(`kind must be ${CLAIM_KINDS.join(', ')}`);
  if (!nonempty(claim.statement)) problems.push('statement must be nonempty text');
  if (!CLAIM_STATUSES.includes(claim.status)) problems.push(`status must be ${CLAIM_STATUSES.join(', ')}`);
  if (!CLAIM_BASES.includes(claim.basis)) problems.push(`basis must be ${CLAIM_BASES.join(', ')}`);
  if (claim.evidence !== undefined && !textList(claim.evidence, s => typeof s === 'string')) problems.push('evidence must be a nonempty list of sources');
  if (claim.check !== undefined && !nonempty(claim.check)) problems.push('check must be nonempty text');
  if (claim.verified_by !== undefined && !['person', 'agent'].includes(claim.verified_by)) problems.push('verified_by must be person or agent');
  if (claim.rejected !== undefined && (claim.kind !== 'decision' || !textList(claim.rejected, r => mapping(r) && Object.keys(r).every(k => k === 'option' || k === 'reason') && nonempty(r.option) && nonempty(r.reason)))) problems.push('rejected is a nonempty list of option and reason, on decision claims only');
  if (claim.risk_if_wrong !== undefined && (!nonempty(claim.risk_if_wrong, 1000) || /\n/.test(claim.risk_if_wrong.trim()))) problems.push('risk_if_wrong must be one line of text');
  if (claim.about !== undefined && !textList(claim.about, a => nonempty(a, 1000) && !/\s/.test(a))) problems.push('about must be a nonempty list of entity identities or paths');
  if (claim.superseded_by !== undefined && (claim.superseded_by === claim.id || !ids.has(claim.superseded_by))) problems.push('superseded_by must name another claim of this file');
  if (CLAIM_STATUSES.includes(claim.status)) {
    for (const field of REQUIRED[claim.status]) if (claim[field] === undefined) problems.push(`status ${claim.status} requires ${field}`);
    for (const field of FORBIDDEN[claim.status]) if (claim[field] !== undefined) problems.push(`status ${claim.status} forbids ${field}`);
  }
  if (claim.basis === 'observed' && claim.evidence === undefined) problems.push('basis observed requires evidence');
  return problems;
}
// Parse the claims of one file. Shape errors drop the claim; evidence errors keep
// it with available: false. Returns {claims, diagnostics}.
export function parseClaims(path, markdown, files) {
  const diagnostics = [], claims = [];
  const report = (code, message, claim) => {const d = {code, path, message, severity: CLAIM_WARNINGS.has(code) ? 'warning' : 'error', ...(claim ? {claim} : {})};diagnostics.push(d);return d;};
  const metadata = frontMatter(markdown);
  const list = metadata.value?.claims;
  if (metadata.error || list === undefined) return {claims, diagnostics};
  if (!claimRecord(path, metadata.value)) {report('invalid-claim', 'This record type cannot declare claims; its claims are ignored.');return {claims, diagnostics};}
  if (!Array.isArray(list)) {report('invalid-claim', 'claims must be a list.');return {claims, diagnostics};}
  if (list.length > MAX_CLAIMS) report('claim-list-long', `${list.length} claims in one file; record only consequential claims, at most ${MAX_CLAIMS}.`);
  const ids = new Set(list.filter(mapping).map(c => c.id)), seen = new Set();
  for (const value of list) {
    const label = mapping(value) && typeof value.id === 'string' ? value.id : null;
    const problems = shapeProblems(value, ids);
    if (label && seen.has(label)) problems.push('id is not unique in this file');
    if (label) seen.add(label);
    if (problems.length) {report('invalid-claim', `Claim ${label ?? '(no id)'}: ${problems.join('; ')}.`, label);continue;}
    const own = [];
    for (const source of value.evidence || []) if (!resolveSource(files, source)) own.push(report('claim-evidence-missing', `Claim ${value.id}: evidence ${source} does not resolve to nonempty detail.`, value.id));
    if (CHECKED.has(value.kind) && ['open', 'supported', 'verified'].includes(value.status) && value.check === undefined) own.push(report('claim-check-missing', `Claim ${value.id}: a ${value.kind.replace('_', ' ')} claim should state the cheapest check.`, value.id));
    claims.push({id: value.id, kind: value.kind, statement: value.statement, status: value.status, basis: value.basis,
      evidence: value.evidence || [], check: value.check ?? null, verifiedBy: value.verified_by ?? null, rejected: value.rejected || [],
      riskIfWrong: value.risk_if_wrong ?? null, about: value.about || [], supersededBy: value.superseded_by ?? null, file: path, diagnostics: own});
  }
  return {claims, diagnostics};
}
// Sources of failed or incomplete evidence_records and self_check entries.
function negativeSources(files) {
  const result = new Set();
  for (const [path, markdown] of files) {
    if (!path.endsWith('.md') || typeof markdown !== 'string' || !markdown.startsWith('---') || !/^(evidence_records|self_check)\s*:/m.test(markdown)) continue;
    const value = frontMatter(markdown).value || {};
    const records = [...(Array.isArray(value.evidence_records) ? value.evidence_records.map(r => mapping(r) ? {...r, source: evidenceSource(r, path)} : r) : []), value.self_check];
    for (const r of records) if (mapping(r) && ['failed', 'incomplete'].includes(r.result) && typeof r.source === 'string') result.add(r.source);
  }
  return result;
}
// The files whose claims belong to a change: its plan and tasks, the working
// knowledge it adds or modifies (open change only) and the brief of the unit that owns it.
export function changeClaimPaths(artifact, change, files, units = []) {
  const prefix = `docs/artifacts/${artifact.id}/changes/${change}/tasks/`, paths = new Set();
  for (const path of files.keys()) if (path.startsWith(prefix) && path.endsWith('.md')) paths.add(path);
  if (artifact.activeChange === change) for (const e of artifact.elements || []) if (e.source === 'working' && ['added', 'modified'].includes(e.state)) paths.add(e.file);
  for (const unit of units) if (unit.members?.some(m => m.artifact === artifact.id && m.change === change)) paths.add(unit.path);
  return paths;
}
// Read every claim of the files: claims by path and all claim diagnostics.
export function readClaims(files, {snapshot = null, baselines = {}, units = []} = {}) {
  const byPath = new Map(), diagnostics = [];
  for (const [path, markdown] of files) {
    if (!path.startsWith('docs/artifacts/') || !path.endsWith('.md') || !declares(markdown)) continue;
    const parsed = parseClaims(path, markdown, files);
    byPath.set(path, parsed.claims);diagnostics.push(...parsed.diagnostics);
  }
  if (!byPath.size) return {byPath, diagnostics};
  const negative = negativeSources(files);
  for (const claim of [...byPath.values()].flat()) if (['supported', 'verified'].includes(claim.status)) for (const source of claim.evidence) if (negative.has(source)) {
    const d = {code: 'claim-evidence-conflict', path: claim.file, claim: claim.id, severity: 'error', message: `Claim ${claim.id}: ${source} also records a failed or incomplete check.`};
    claim.diagnostics.push(d);diagnostics.push(d);
  }
  for (const artifact of snapshot?.artifacts || []) for (const change of artifact.changes || []) {
    if (change.layout !== 'in-place' || !change.version || baselines?.[artifact.id]?.versionRecords?.includes(change.version)) continue;
    for (const path of changeClaimPaths(artifact, change.name, files, units)) for (const claim of byPath.get(path) || []) if (CHECKED.has(claim.kind) && ['open', 'supported'].includes(claim.status)) {
      const d = {code: 'claim-unverified-at-version', path, claim: claim.id, severity: 'warning', message: `Claim ${claim.id} is ${claim.status} while ${artifact.id} ${change.version} is prepared.`};
      claim.diagnostics.push(d);diagnostics.push(d);
    }
  }
  for (const claim of [...byPath.values()].flat()) claim.available = !claim.diagnostics.some(d => d.severity === 'error');
  return {byPath, diagnostics};
}
