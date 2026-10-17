import React, {useEffect, useRef, useState} from 'react';
import {useShell} from '../page-data.js';
import {PageHeader, Section, Badge, PhaseSteps, Notice} from '../ui.jsx';
import {DependencyGraph} from '../GraphPanel.jsx';
import {useEdit, OperationError} from '../editing.jsx';
import {knowledgeEntries} from '../knowledge-api.js';
import {artifactTitle, changeTitle, currentChanges, memberUnit, phaseLabel, phaseModel} from '../work-model.js';
import {StartChangeCard, NewUnitCard} from './WorkPageForms.jsx';
import './WorkPage.css';

const plural = (n, one, many = one + 's') => `${n} ${n === 1 ? one : many}`;
const names = list => list.length <= 1 ? list.join('') : `${list.slice(0, -1).join(', ')} and ${list.at(-1)}`;
const NARROW = '(max-width: 800px)';
function useNarrow() {
  const [narrow, setNarrow] = useState(() => window.matchMedia(NARROW).matches);
  useEffect(() => {const query = window.matchMedia(NARROW), update = () => setNarrow(query.matches);query.addEventListener('change', update);return () => query.removeEventListener('change', update);}, []);
  return narrow;
}

// One open change: where it belongs, its title, its phases and the next step.
function ChangeCard({change, snapshot, worktree, go}) {
  const model = phaseModel(change), unit = memberUnit(worktree, change.artifact, change.name), title = changeTitle(change);
  return <article className="card work-change" aria-label={title}>
    <div className="eyebrow">
      {artifactTitle(snapshot, change.artifact)} · {change.name}
      {unit && <> · unit <button className="link" aria-label={`${unit.title}, unit of ${title}`} onClick={() => go({kind: 'unit', unit: unit.id})}>{unit.title}</button></>}
    </div>
    <h2 className="card-title">{title}</h2>
    <PhaseSteps change={change}/>
    <div className="next-line">
      {model.state === 'loading' ? <p className="muted" role="status">Reading phases…</p> : <p><span className="muted">Next:</span> {model.hint}</p>}
      <button className="primary" aria-label={`Continue ${title}`} onClick={() => go({kind: 'change', artifact: change.artifact, change: change.name})}>Continue</button>
    </div>
  </article>;
}

// Title and kind of an uncommitted knowledge file: the document title from
// the read data, the unit title for a brief, otherwise the path.
const KINDS = [[/^README\.md$/, 'artifact overview'], [/^requirements\//, 'requirement'], [/^specifications\/flows\//, 'flow'], [/^specifications\//, 'specification'], [/^decisions\//, 'decision'],
  [/^changes\/[^/]+\/README\.md$/, 'change'], [/^changes\/[^/]+\/tasks\/README\.md$/, 'plan'], [/^changes\/[^/]+\/tasks\//, 'task'], [/^versions\//, 'version record']];
function describeFile(path, snapshot, worktree) {
  const parts = path.split('/'), owner = parts[2], rest = parts.slice(3).join('/'), short = parts.slice(2).join('/');
  if (owner === 'units-of-work') {
    const unit = (worktree?.unitsOfWork || []).find(u => u.path === path);
    return {title: unit?.title || short, kind: parts.length === 5 && parts[4] === 'README.md' ? 'unit brief' : 'unit of work', short};
  }
  const artifact = snapshot.artifacts.find(a => a.id === owner), kind = KINDS.find(([pattern]) => pattern.test(rest))?.[1] || 'file';
  if (!artifact) return {title: short, kind, short};
  if (kind === 'artifact overview') return {title: artifact.title, kind, short};
  const element = artifact.elements.find(e => e.file === path && e.source === 'working') || artifact.elements.find(e => e.file === path);
  if (element?.title) return {title: element.title, kind, short};
  const change = kind === 'change' && artifact.changes.find(c => c.name === parts[4]);
  const titled = change && (worktree?.changes || []).find(c => c.artifact === owner && c.name === change.name);
  if (titled?.title) return {title: titled.title, kind, short};
  if (kind === 'version record') return {title: `Version ${parts[4]}`, kind, short};
  return {title: short, kind, short};
}
// Git porcelain letters: untracked or added is New, deleted is Deleted, the rest Changed.
const fileBadge = (code = '') => code.includes('?') || code[0] === 'A' ? ['new', 'New'] : code.includes('D') ? ['removed', 'Deleted'] : ['changed', 'Changed'];

// The commit message of 1.16.0: the change and its phase when one open change owns every file.
function commitMessage(entries, changes) {
  const owners = [...new Set(entries.map(e => e.path.split('/')[2]))];
  // A unit brief travels with its change, so it does not make the commit generic.
  const artifacts = owners.filter(o => o !== 'units-of-work');
  const single = artifacts.length === 1 ? changes.find(c => c.artifact === artifacts[0]) : null;
  if (single) return `${single.artifact} ${single.name}: ${phaseModel(single).state === 'loading' ? 'update' : phaseLabel(single)}`;
  return `Update knowledge of ${owners.filter(o => o !== 'units-of-work').join(', ') || 'units of work'}`;
}

function UncommittedSection({entries, changes, snapshot, worktree, focus, at}) {
  const edit = useEdit(), heading = useRef(null);
  const [excluded, setExcluded] = useState(() => new Set()), [typed, setTyped] = useState(null), [busy, setBusy] = useState(false), [error, setError] = useState(null);
  useEffect(() => {
    if (focus !== 'uncommitted') return;
    const frame = requestAnimationFrame(() => {heading.current?.scrollIntoView({block: 'start'});heading.current?.focus({preventScroll: true});});
    return () => cancelAnimationFrame(frame);
  }, [focus, at]);
  const rows = entries.map(e => ({...e, ...describeFile(e.path, snapshot, worktree), badge: fileBadge(e.code)}));
  // Two files with one title are named by their paths.
  const counts = rows.reduce((map, r) => map.set(r.title, (map.get(r.title) || 0) + 1), new Map());
  for (const r of rows) r.name = counts.get(r.title) > 1 ? r.short : r.title;
  const checked = rows.filter(r => !excluded.has(r.path)), message = typed ?? commitMessage(entries, changes);
  const toggle = path => setExcluded(current => {const next = new Set(current);next.has(path) ? next.delete(path) : next.add(path);return next;});
  async function commit(event) {
    event.preventDefault();if (busy || !checked.length) return;
    setBusy(true);setError(null);
    try {await edit.git('commit', {paths: checked.map(r => r.path), message});setTyped(null);setExcluded(new Set());}
    catch (failure) {setError(failure);}
    finally {setBusy(false);}
  }
  async function discard(row) {
    if (!window.confirm(`Discard the uncommitted changes to ${row.name}? This cannot be undone.`)) return;
    setError(null);
    try {await edit.git('discard', {path: row.path});} catch (failure) {setError(failure);}
  }
  return <section className="section" aria-labelledby="work-uncommitted">
    <div className="section-head">
      <h2 className="section-title" id="work-uncommitted" ref={heading} tabIndex={-1}>Uncommitted knowledge</h2>
      {rows.length > 0 && <span className="muted">{plural(rows.length, 'file')}</span>}
    </div>
    {rows.length ? <div className="rows">
      {rows.map(r => <div className="row work-file" key={r.path}>
        {edit.editable && <input type="checkbox" aria-label={`Include ${r.name}`} checked={!excluded.has(r.path)} onChange={() => toggle(r.path)}/>}
        <div className="grow">
          <div className="row-title">{r.title}</div>
          <div className="row-detail">{r.kind}{r.title !== r.short && <span className="work-path"> · <span className="mono">{r.short}</span></span>}</div>
        </div>
        <Badge tone={r.badge[0]}>{r.badge[1]}</Badge>
        {edit.editable && <button className="quiet" aria-label={`Discard ${r.name}`} onClick={() => discard(r)}>Discard</button>}
      </div>)}
      {edit.editable && <form className="work-commit" aria-label="Commit" onSubmit={commit}>
        <label className="sr-only" htmlFor="work-commit-message">Commit message</label>
        <input id="work-commit-message" value={message} required onChange={event => setTyped(event.target.value)} autoComplete="off" spellCheck={false}/>
        <button disabled={busy || !checked.length} aria-busy={busy}>{`Commit ${plural(checked.length, 'file')}`}</button>
      </form>}
    </div> : <p className="muted">All knowledge is committed.</p>}
    {error && <div className="work-error"><OperationError error={error}/></div>}
  </section>;
}

// One sentence that names the working dependency edges: "B and C depend on A."
function dependencySentence(snapshot) {
  const edges = snapshot.edges.filter(e => e.status !== 'proposed-remove'), title = id => artifactTitle(snapshot, id);
  if (!edges.length) return 'No artifact depends on another artifact.';
  const prerequisites = [...new Set(edges.map(e => e.source))];
  const clauses = prerequisites.map(source => {const dependents = edges.filter(e => e.source === source).map(e => title(e.target));return `${names(dependents)} ${dependents.length === 1 ? 'depends' : 'depend'} on ${title(source)}`;});
  return clauses.join('; ') + '.';
}

export default function WorkPage({page}) {
  const {snapshot, worktree, root, go, editable, CreateBranchForm} = useShell(), edit = useEdit(), narrow = useNarrow();
  const [form, setForm] = useState(null), [graph, setGraph] = useState(false);
  const openers = {start: useRef(null), unit: useRef(null)};
  const changes = currentChanges(worktree), branch = snapshot.repository.branch;
  const entries = edit.status ? edit.status.knowledge.map(e => ({code: e.status, path: e.path})) : knowledgeEntries(snapshot.repository.status);
  const repository = (root || snapshot.repository.path).split('/').filter(Boolean).at(-1);
  const toggleForm = kind => setForm(current => current === kind ? null : kind);
  const closeForm = () => {const kind = form;setForm(null);requestAnimationFrame(() => openers[kind]?.current?.focus());};
  // Start a change sits in the empty state when there is no open change; on a
  // phone the page actions follow the content, as in the phone mockup.
  const startButton = cls => <button ref={openers.start} className={cls} aria-expanded={form === 'start'} onClick={() => toggleForm('start')}>Start a change</button>;
  const unitButton = cls => <button ref={openers.unit} className={cls} aria-expanded={form === 'unit'} onClick={() => toggleForm('unit')}>New unit</button>;
  const card = form === 'start' ? <StartChangeCard snapshot={snapshot} worktree={worktree} onClose={closeForm} onOpen={go}/>
    : form === 'unit' ? <NewUnitCard snapshot={snapshot} worktree={worktree} onClose={closeForm} onOpen={go}/> : null;
  // Without an open change, Start a change opens its card in place of the empty state.
  const empty = !changes.length, inPlace = empty && form === 'start';
  return <section className="page work-page" aria-label="Work page"><div className="column">
    <PageHeader title="Current work" subtitle={`${repository} · ${plural(changes.length, 'open change')}`}
      action={editable && !narrow ? <div className="work-actions">{!empty && startButton('')}{unitButton('quiet')}</div> : null}/>
    {!editable && <Notice action={<div className="work-branch"><CreateBranchForm onCreate={edit.createBranch} idPrefix="work-branch"/></div>}>
      {branch && branch !== 'detached' ? <>This branch is <span className="mono">{branch}</span>. Create a branch to edit knowledge.</> : 'This is a detached HEAD. Create a branch to edit knowledge.'}
    </Notice>}
    {card && !narrow && !inPlace && <div className="work-form">{card}</div>}
    {inPlace ? <div className="work-form">{card}</div> : empty ? <div className="empty-state work-empty">
      <h2>No open change.</h2>
      {editable && startButton('primary')}
    </div> : changes.map(c => <ChangeCard key={`${c.artifact}/${c.name}`} change={c} snapshot={snapshot} worktree={worktree} go={go}/>)}
    <UncommittedSection entries={entries} changes={changes} snapshot={snapshot} worktree={worktree} focus={page.focus} at={page.at}/>
    <Section title="Dependencies" actions={<button className="quiet" aria-expanded={graph} onClick={() => setGraph(value => !value)}>{graph ? 'Hide graph' : 'Show graph'}</button>}>
      <p className="muted">{dependencySentence(snapshot)}</p>
      {graph && <DependencyGraph snapshot={snapshot} onOpen={go}/>}
    </Section>
    {editable && narrow && <section className="section work-phone-actions" aria-label="Actions">
      {card && !inPlace && <div className="work-form">{card}</div>}
      {!empty && startButton('full')}
      {unitButton('quiet full')}
    </section>}
  </div></section>;
}
