// Captured source text is inert data. This formatter has no IO or authority.
const escapeText = value => String(value)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/[\\`*_{}\[\]()#!|~]/g, '\\$&')
  .replace(/:/g, '&#58;').replace(/@/g, '&#64;').replace(/www\./gi, match => '&#119;' + match.slice(1));
const label = key => escapeText(key.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/_/g, ' '));
const scalar = value => value === null ? 'None (null)' : value === '' ? '(empty string)' : escapeText(value);
function factLines(value, depth = 0) {
  const indent = '  '.repeat(depth);
  if (Array.isArray(value)) {
    if (!value.length) return [indent + '- None recorded.'];
    return value.flatMap((item, index) => item !== null && typeof item === 'object'
      ? [indent + `- Item ${index + 1}:`, ...factLines(item, depth + 1)]
      : scalarLines(item, indent + '- ', indent + '  '));
  }
  if (value !== null && typeof value === 'object') {
    const entries = Object.entries(value).filter(([, item]) => item !== undefined);
    if (!entries.length) return [indent + '- No fields recorded.'];
    return entries.flatMap(([key, item]) => item !== null && typeof item === 'object'
      ? [indent + `- **${label(key)}:**`, ...factLines(item, depth + 1)]
      : scalarLines(item, indent + `- **${label(key)}:** `, indent + '  '));
  }
  return scalarLines(value, indent + '- ', indent + '  ');
}
function scalarLines(value, prefix, continuation) {
  const parts = scalar(value).split(/\r?\n/);
  return parts.map((part, index) => (index ? continuation : prefix) + part + (index < parts.length - 1 ? '  ' : ''));
}
function fencedSource(text) {
  const runs = text.match(/`+/g) || [];
  const fence = '`'.repeat(Math.max(3, ...runs.map(run => run.length + 1)));
  return `${fence}text\n${text}\n${fence}`;
}
export function formatContextMarkdown(envelope) {
  const data = envelope.data;
  const lines = ['# Change context packet', '',
    `Schema: ${escapeText(data.schema)}`, '',
    `Revision: ${escapeText(envelope.revision)}`, '',
    `Freshness: ${escapeText(envelope.freshness)}; completeness: ${escapeText(envelope.completeness)}`];
  const section = (title, value) => lines.push('', `## ${title}`, '', ...factLines(value));
  section('Context', {repository: envelope.repository, worktree: envelope.worktree, ...envelope.context});
  section('Scope', data.scope);
  section('Knowledge changes', {records: data.records, governingSources: data.governingSources, pagination: envelope.pagination});
  // The tiered impact answer is additive: it has its own section after the recorded candidates.
  const {tiers, ...recorded} = data.impact || {};
  section('Recorded flow impact', data.impact ? recorded : data.impact);
  if (tiers) section('Change impact', tiers);
  if (data.brief) section('Change brief', data.brief);
  section('Evidence and unresolved facts', {evidence: data.evidence, unresolvedFacts: data.unresolvedFacts, diagnostics: envelope.diagnostics});
  lines.push('', '## Sources', '');
  if (!data.sources?.length) lines.push('No source excerpts recorded.');
  for (const source of data.sources || []) {
    lines.push(`### ${escapeText(source.path)}`, '', ...factLines({...source, text: undefined}), '', fencedSource(source.text), '');
  }
  section('Omissions', envelope.omissions);
  section('Limits', data.limits);
  return lines.join('\n') + '\n';
}
