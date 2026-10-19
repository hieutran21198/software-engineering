// The PR description of a change (specifications/delivery-support.md, PR
// description): Markdown sections in a fixed order, rendered from the tier
// check, the record checks, the task records and the change brief. It stores
// nothing, never pushes or opens a PR, and records no approval.
import {marked} from 'marked';
import {parseArtifact} from '../src/model.js';
import {changeTier, planCompatibility, taskCovers, requirementIds} from '../src/delivery-records.js';
import {compareLines} from '../src/line-comparison.js';
import {buildTaskGraph} from './task-graph.js';
import {checklist} from './workflow.js';
import {frontMatter} from './units-of-work.js';
import {tierCheck} from './tier-check.js';
import {recordChecks, nextVersion} from './record-checks.js';
import {protectedRefs} from './knowledge-baseline.js';

export const DESCRIPTION_LIMIT = 60000;
export const APPROVAL_NOTE = 'Approval is not recorded by this description.';
export const SECTIONS = ['Summary', 'Tier', 'Plan', 'Changed knowledge', 'Requirement coverage', 'DoD and evidence', 'Validator', 'Impact', 'Compatibility', 'Open claims'];
const STATUS = {added: 'New', modified: 'Changed', removed: 'Removed'};
const KIND = {decision: 'Decision', assumption: 'Assumption', hypothesis: 'Hypothesis', root_cause: 'Root cause', unknown: 'Unknown', risk: 'Risk'};
const oneLine = text => String(text ?? '').trim().replace(/\s*\n\s*/g, ' ');

// The first paragraph of the Markdown, or of its level-2 section whose heading matches.
function paragraph(markdown, heading) {
  const tokens = marked.lexer(String(markdown || '').replace(/^---\r?\n[\s\S]*?\r?\n---(?:\r?\n|$)/, ''));
  let i = 0;
  if (heading) {i = tokens.findIndex(t => t.type === 'heading' && t.depth === 2 && heading.test(t.text)) + 1;if (!i) return null;}
  for (; i < tokens.length; i++) {
    if (heading && tokens[i].type === 'heading' && tokens[i].depth <= 2) return null;
    if (tokens[i].type === 'paragraph') return oneLine(tokens[i].raw);
  }
  return null;
}
// Added and removed lines; a multiset count when the comparison is too large.
function lineCounts(before = '', after = '') {
  const result = compareLines(before, after);
  if (result.state === 'complete') return {added: result.lines.filter(l => l.kind === 'add').length, removed: result.lines.filter(l => l.kind === 'remove').length};
  const lines = text => text.match(/[^\n]*\n|[^\n]+$/g) || [];
  const missing = (from, to) => {const left = new Map();for (const l of from) left.set(l, (left.get(l) || 0) + 1);let n = 0;for (const l of to) {const k = left.get(l);if (k) left.set(l, k - 1);else n++;}return n;};
  return {added: missing(lines(before), lines(after)), removed: missing(lines(after), lines(before))};
}
async function protectedVersion(root, git, artifact, baselines) {
  if (baselines[artifact]?.state === 'available') return baselines[artifact].currentVersion ?? null;
  const oid = (await protectedRefs(root, git).catch(() => []))[0]?.oid;
  const text = oid ? await git(root, ['show', `${oid}:docs/artifacts/${artifact}/README.md`]).catch(() => null) : null;
  return text ? parseArtifact(artifact, text, [], 'legacy').currentVersion ?? null : null;
}

// Cuts the longest sections until the text fits; each cut ends with an omission line.
export function fitSections(sections, limit = DESCRIPTION_LIMIT) {
  const render = () => sections.map(s => [`## ${s.title}`, '', ...s.lines].join('\n')).join('\n\n') + '\n\n' + APPROVAL_NOTE;
  const size = s => s.lines.reduce((n, l) => n + l.length + 1, 0);
  for (let text = render(); text.length > limit; text = render()) {
    const section = sections.filter(s => !s.cut).sort((a, b) => size(b) - size(a))[0];
    if (!section) break;
    const total = section.lines.length;
    const omission = n => `_The ${section.title} section is cut: ${n} of ${total} lines are omitted to keep this description within ${limit.toLocaleString('en-US')} characters._`;
    const target = size(section) - (text.length - limit) - omission(total).length - 2;
    let kept = 0;
    for (let used = 0; kept < total && used + section.lines[kept].length + 1 <= target; kept++) used += section.lines[kept].length + 1;
    section.lines = [...section.lines.slice(0, kept), ...(kept ? [''] : []), omission(total - kept)];
    section.cut = true;
  }
  return render();
}

// brief: the change brief data; records: the review records; sourceText(path): captured text.
export async function buildDescription({root, worktree = root, artifact, change, git, impactService, scan, records, sourceText, brief, limit = DESCRIPTION_LIMIT}) {
  const {files, baselines = {}, unsafeTaskPaths} = scan;
  const prefix = `docs/artifacts/${artifact}/`, changePath = `${prefix}changes/${change}/`;
  // The tier check queries the impact service of the configured root for this worktree.
  const impact = impactService && {query: request => impactService.query({...request, path: root, ...(worktree !== root ? {worktree} : {})})};
  const tier = await tierCheck({root: worktree, scan, git, artifact, change, impactService: impact});
  const checks = [...await recordChecks({root: worktree, scan, git, scope: {artifact, change}}), ...tier.diagnostics];
  const readme = files.get(`${changePath}README.md`) || '';
  const tasks = buildTaskGraph(files, changePath, checklist, unsafeTaskPaths).tasks || [];
  const covers = tasks.map(t => ({task: t, covers: taskCovers(t.body, t.path).covers}));
  const name = t => t.id ?? t.path.slice(changePath.length);
  const sections = [];
  const add = (title, lines) => sections.push({title, lines});

  add('Summary', [paragraph(readme) ?? 'The change README has no paragraph.', '', `Artifact \`${artifact}\`, change \`${change}\`.`]);

  const t = tier.tier;
  add('Tier', [`Declared: ${t.declared}${changeTier(readme).declared ? '' : ' (no tier key; medium applies)'}. Allowed: ${t.allowed}.`, '',
    ...t.criteria.map(c => `- ${c.id}: ${c.result}. ${oneLine(c.detail)}`)]);

  const plan = t.declared === 'small' ? paragraph(readme, /^plan$/i) : null;
  add('Plan', [...(plan ? [plan, ''] : []), ...(tasks.length ? tasks.map(({title}, i) => {const c = covers[i].covers;return `- ${oneLine(title)} (\`${name(tasks[i])}\`): ${c.length ? 'covers ' + c.map(x => `${x.artifact === artifact ? '' : x.artifact + '/'}${x.element} ${x.ids.join(', ')}`).join('; ') : 'no covers'}.`;}) : ['The plan lists no task.'])]);

  const changed = records.filter(r => r.status !== 'unchanged');
  add('Changed knowledge', changed.length ? changed.map(r => {const n = lineCounts(r.baseline ? sourceText(r.baseline.path) : '', r.change ? sourceText(r.change.path) : '');return `- ${STATUS[r.status]} \`${r.path}\` (+${n.added} −${n.removed})`;}) : ['No knowledge record differs from the baseline.']);

  const coverage = [];
  for (const r of changed.filter(r => r.category === 'requirements' && r.status !== 'removed')) {
    const before = new Map(requirementIds(r.baseline ? sourceText(r.baseline.path) : '').map(x => [x.id, x.text]));
    for (const x of requirementIds(sourceText(r.change.path))) {
      if (before.get(x.id) === x.text) continue;
      const by = covers.filter(c => c.covers.some(e => e.artifact === artifact && e.element === r.path && e.ids.includes(x.id))).map(c => `\`${name(c.task)}\``);
      coverage.push(`- ${r.path} ${x.id} (${before.has(x.id) ? 'changed' : 'added'}): ${by.length ? by.join(', ') : 'no task covers it'}.`);
    }
  }
  add('Requirement coverage', coverage.length ? coverage : ['No requirement ID is added or changed.']);

  add('DoD and evidence', tasks.length ? tasks.map(task => {
    const records = frontMatter(task.body).value?.evidence_records;
    const results = Array.isArray(records) ? records.filter(r => r && typeof r === 'object').map(r => `${r.id ?? r.criterion ?? 'record'} ${r.result ?? 'no result'}`) : [];
    return `- \`${name(task)}\`: ${task.checked} of ${task.checked + task.unchecked} DoD items checked; evidence: ${results.length ? results.join(', ') : 'no evidence record'}.`;
  }) : ['The plan lists no task.']);

  const count = severity => checks.filter(d => d.severity === severity).length;
  add('Validator', [`ok: ${count('error') === 0}. Errors: ${count('error')}. Warnings: ${count('warning')}.`,
    ...(checks.length ? ['', ...checks.slice(0, 10).map(d => `- ${d.severity} \`${d.code}\` ${d.path}: ${oneLine(d.message)}`), ...(checks.length > 10 ? ['', `${checks.length - 10} more diagnostics are not shown.`] : [])] : [])]);

  const affected = brief.answers.find(a => a.question === 'What is affected?');
  const statement = affected?.items.find(i => i.text.startsWith('Coverage:'))?.text;
  add('Impact', affected?.summary ? [affected.summary, ...(statement ? ['', statement] : [])] : [brief.origin.reason ?? 'The impact answer is not available.']);

  const level = planCompatibility(files.get(`${changePath}tasks/README.md`) || '').compatibility;
  const current = await protectedVersion(worktree, git, artifact, baselines);
  add('Compatibility', [level ? `Plan level: ${level}. Computed version: ${nextVersion(current, level)}, from ${current ? current + ' on the protected branch' : 'no protected version'}.` : 'The plan declares no compatibility level; no version number is computed.']);

  const open = brief.claims.filter(c => c.status === 'open');
  add('Open claims', open.length ? open.map(c => `- ${KIND[c.kind] ?? c.kind} \`${c.id}\`: ${oneLine(c.statement)} (${c.file})`) : ['No open claim.']);

  return {markdown: fitSections(sections, limit), tier: t};
}
