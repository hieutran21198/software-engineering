// Shared guidance parts of the pages (specifications/human-guidance.md): the
// badge name of a change status, version labels, glossary terms once per
// section, the section link row and the PR description copy.
import React from 'react';
import {StatusBadge, Term} from '../ui.jsx';
import {GLOSSARY, STATUS_FAMILIES} from '../glossary.js';
import {postJSON} from '../request.js';

const MEMBERS = new Set(Object.values(STATUS_FAMILIES).flatMap(f => f.members.map(m => m.toLowerCase())));
const TERMS = new Set(GLOSSARY.map(e => e.term.toLowerCase()));
export const isTerm = text => TERMS.has(String(text || '').toLowerCase());
// A change status (work-model changeStatus) as a status name of the vocabulary:
// its own name when the vocabulary lists it, otherwise a member of its family.
const FAMILY_MEMBER = {active: 'current phase', waiting: 'prepared', done: 'Delivered', problem: 'error', neutral: 'Unknown'};
export const statusMember = status => MEMBERS.has(String(status.name).toLowerCase()) ? status.name : status.name === 'Reading' ? 'not loaded' : FAMILY_MEMBER[status.family] || 'Unknown';

// Wraps the first occurrence of each glossary term in one section with Term.
// Create one with termOnce() for each section render.
export function termOnce() {
  const seen = new Set();
  return (term, children) => {
    const key = term.toLowerCase();
    if (seen.has(key)) return children ?? term;
    seen.add(key);
    return <Term term={term}>{children}</Term>;
  };
}
// A status text: a glossary term opens its explanation; "Delivered 1.2.0" explains "Delivered".
export function StatusText({text, term = t => <Term term={t}/>}) {
  if (isTerm(text)) return term(text);
  const delivered = /^Delivered (.+)$/.exec(text || '');
  return delivered ? <>{term('Delivered')} {delivered[1]}</> : text;
}

// Version labels: "<version> established" (done) and "<version> prepared on this branch" (waiting).
export function VersionLabel({version, established, term = t => t, small}) {
  return established
    ? <StatusBadge status="established" small={small}>{version} {term('established')}</StatusBadge>
    : <StatusBadge status="prepared" small={small}>{version} {term('prepared')} on this branch</StatusBadge>;
}
export const versionText = (version, established) => `${version} ${established ? 'established' : 'prepared on this branch'}`;

// A row of links to the sections of a long page. Names end in "section", so they
// differ from phase and action controls with the same words.
export function SectionLinks({sections}) {
  const shown = sections.filter(Boolean);
  if (shown.length < 2) return null;
  return <div className="section-links" role="group" aria-label="Sections">
    {shown.map(([id, title]) => <a key={id} href={`#${id}`} aria-label={`${title} section`} onClick={event => {
      const target = document.getElementById(id);
      if (!target) return;
      event.preventDefault();target.scrollIntoView({behavior: 'smooth', block: 'start'});
    }}>{title}</a>)}
  </div>;
}

// Reads the PR description of a change and copies its Markdown. Returns the feedback text.
export async function copyPrDescription({root, worktreePath}, artifact, change) {
  try {
    const response = await postJSON('/api/review/query', {path: root, worktree: worktreePath, artifact, change, operation: 'description'});
    await navigator.clipboard.writeText(response.data.markdown);
    return 'PR description copied. Paste it into the pull request.';
  } catch {
    return 'Copy failed. Open the change and copy the PR description there.';
  }
}
