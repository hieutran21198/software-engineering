// Changed knowledge with inline comparison, the review context export,
// version readiness and preparation, and the delivery of a retained change.
import React, {useEffect, useId, useMemo, useRef, useState} from 'react';
import {useQuery, useShell} from '../page-data.js';
import {DiffBadge, Icon, Menu, Section, StateBadge} from '../ui.jsx';
import {termOnce, VersionLabel} from './guidance.jsx';
import {ActionForm, OperationError, useEdit} from '../editing.jsx';
import {edit as previewEdit} from '../knowledge-api.js';
import {postJSON} from '../request.js';
import {compareLines, comparisonBlocks} from '../line-comparison.js';
import {formatContextMarkdown} from '../context-packet.js';
import {impactPage} from '../impact-model.js';
import {changedKnowledge, readiness} from './ChangePageModel.js';
import {detailField} from './ChangePagePlan.jsx';
import {isError} from '../work-model.js';

// The review packet (first records page) of one change. It loads only when
// enabled and reloads when the repository updates.
export function useReviewPacket(artifact, change, enabled) {
  const {root, worktreePath, epoch} = useShell();
  const [state, setState] = useState({status: 'idle', packet: null, error: '', epoch: null});
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (!enabled || !root) return;
    const controller = new AbortController();
    setState(current => ({...current, status: 'loading', error: ''}));
    postJSON('/api/review/query', {path: root, worktree: worktreePath, artifact, change, operation: 'packet'}, controller.signal)
      .then(packet => {if (!controller.signal.aborted) setState({status: 'loaded', packet, error: '', epoch});})
      .catch(error => {if (!controller.signal.aborted && error.name !== 'AbortError') setState(current => ({...current, status: 'error', error: error.message}));});
    return () => controller.abort();
  }, [enabled, root, worktreePath, artifact, change, epoch, attempt]);
  return {...state, current: state.epoch === epoch, retry: () => setAttempt(n => n + 1)};
}

function Loader({onOpen}) {useEffect(() => {onOpen();}, []);return null;}
// Export context: copy or download the loaded review packet page. Exports are
// offered only for a fresh packet of the current repository state.
export function ExportContext({artifact, change, review, onLoad}) {
  const {busy} = useShell(), [feedback, setFeedback] = useState('');
  const [online, setOnline] = useState(() => navigator.onLine);
  useEffect(() => {const update = () => setOnline(navigator.onLine);window.addEventListener('online', update);window.addEventListener('offline', update);return () => {window.removeEventListener('online', update);window.removeEventListener('offline', update);};}, []);
  const packet = review.packet;
  const ready = review.status === 'loaded' && review.current && !busy && online && packet?.freshness === 'fresh';
  const status = !online ? 'Offline. Export needs the local server.' : review.status === 'error' ? review.error : busy || review.status === 'loading' || !review.current ? 'Reading the review packet…' : packet && packet.freshness !== 'fresh' ? 'The review packet is stale. Retry.' : '';
  async function exportPacket(format, close) {
    if (!ready) return;
    const text = format === 'json' ? JSON.stringify(packet, null, 2) + '\n' : formatContextMarkdown(packet);
    try {
      if (format === 'copy') {await navigator.clipboard.writeText(text);setFeedback('Markdown copied.');}
      else {
        const url = URL.createObjectURL(new Blob([text], {type: format === 'json' ? 'application/json' : 'text/markdown;charset=utf-8'})), link = document.createElement('a');
        try {link.href = url;link.download = `${artifact}-${change}-context.${format === 'json' ? 'json' : 'md'}`;document.body.appendChild(link);link.click();setFeedback(`${format === 'json' ? 'JSON' : 'Markdown'} download requested.`);}
        finally {link.remove();setTimeout(() => URL.revokeObjectURL(url), 1000);}
      }
      close();
    } catch {setFeedback(`${format === 'copy' ? 'Copy' : 'Download'} failed. Retry when local browser access is available.`);}
  }
  return <div className="export-context">
    <span className="tiny" role="status" aria-label="Export feedback">{feedback}</span>
    <Menu label="Export context" buttonClass="quiet" button={<>{Icon.copy}Export context</>}>{close => <>
      <Loader onOpen={onLoad}/>
      <p className="export-note">The export holds the loaded records page of the review packet: scope, baseline, records, evidence and limits.</p>
      {packet?.completeness === 'partial' && <p className="export-note"><b>Partial context packet.</b> Missing evidence, remaining pages and omitted text stay explicit in exports.</p>}
      {packet?.pagination?.nextCursor && <p className="export-note">More knowledge records remain. This packet contains the loaded page.</p>}
      {status && <p className="export-note" role="status">{status}{review.status === 'error' && <> <button className="link" onClick={review.retry}>Retry</button></>}</p>}
      <hr/>
      <button role="menuitem" disabled={!ready} onClick={() => exportPacket('copy', close)}>Copy Markdown</button>
      <button role="menuitem" disabled={!ready} onClick={() => exportPacket('markdown', close)}>Download Markdown</button>
      <button role="menuitem" disabled={!ready} onClick={() => exportPacket('json', close)}>Download JSON</button>
    </>}</Menu>
  </div>;
}

// The line comparison of one document with main.
function Comparison({artifact, doc}) {
  const before = useQuery(doc.state !== 'added' ? {section: 'markdown', artifact, source: doc.file, revision: 'established'} : null);
  const after = useQuery(doc.state !== 'removed' ? {section: 'markdown', artifact, source: doc.file} : null);
  const loaded = side => side.status === 'idle' || Boolean(side.data);
  const diff = useMemo(() => loaded(before) && loaded(after) ? compareLines(before.data?.markdown ?? '', after.data?.markdown ?? '') : null, [before.data, after.data, before.status, after.status]);
  const error = before.error || after.error;
  if (error && !diff) return <div className="comparison"><p role="alert" className="small">{error} <button className="link" onClick={() => {before.retry();after.retry();}}>Retry</button></p></div>;
  if (!diff) return <div className="comparison"><p className="muted small" role="status">Reading both texts…</p></div>;
  if (diff.state === 'too-large') return <div className="comparison"><p className="small" role="status">{diff.reason}</p></div>;
  const render = (lines, key) => <pre className="line-diff" key={key}>{lines.map((line, i) => <span key={i} className={`diff-line ${line.kind}`}>
    <span className="diff-number" aria-hidden="true">{line.before || ''}</span><span className="diff-number" aria-hidden="true">{line.after || ''}</span>
    <span className="diff-mark" aria-label={line.kind === 'add' ? 'Added' : line.kind === 'remove' ? 'Removed' : 'Unchanged'}>{line.kind === 'add' ? '+' : line.kind === 'remove' ? '−' : ' '}</span>
    <code>{line.text.replace(/\n$/, '')}</code>{'\n'}</span>)}</pre>;
  return <div className="comparison" aria-label={`Comparison of ${doc.title} with main`} role="region">
    {!diff.changed && <p className="muted small">No changed lines.</p>}
    {comparisonBlocks(diff.lines).map((block, i) => block.kind === 'unchanged'
      ? <details key={i} className="diff-fold"><summary>{block.lines.length} unchanged lines</summary>{render(block.lines)}</details>
      : render(block.lines, i))}
  </div>;
}

export function ChangedKnowledge({change, artifact, review, onLoadReview}) {
  const {go} = useShell(), [open, setOpen] = useState(null), [all, setAll] = useState(false);
  const docs = changedKnowledge(artifact), shown = all ? docs : docs.slice(0, 6);
  return <Section title="Changed knowledge" label="Changed knowledge" id="change-knowledge" summary="· compared with main"
    actions={<span className="section-actions"><button className="link" onClick={() => go(impactPage({diff: {base: 'protected'}, title: 'this change'}))}>What does this change affect?</button><ExportContext artifact={change.artifact} change={change.name} review={review} onLoad={onLoadReview}/></span>}>
    {docs.length ? <><div className="rows">{shown.map(doc => <React.Fragment key={doc.file}>
      <div className={`row ${open === doc.file ? 'selected' : ''}`}>
        <div className="grow">{doc.removed ? <span className="row-title">{doc.title}</span> : <button className="link doc-link" onClick={() => go({kind: 'document', artifact: change.artifact, source: doc.file})}>{doc.title}</button>} <span className="muted">· {doc.kind}</span></div>
        <StateBadge state={doc.state}/>
        <button className="quiet" aria-expanded={open === doc.file} aria-label={`Compare ${doc.title}`} onClick={() => setOpen(open === doc.file ? null : doc.file)}>{Icon.compare}{open === doc.file ? 'Hide' : 'Compare'}</button>
      </div>
      {open === doc.file && <Comparison artifact={change.artifact} doc={doc}/>}
    </React.Fragment>)}</div>
    {docs.length > shown.length && <button className="link show-all" onClick={() => setAll(true)}>Show all {docs.length}</button>}</> : <p className="muted">No knowledge of {artifact?.title || change.artifact} differs from main.</p>}
  </Section>;
}

// Version preparation shows both files before it writes them.
function PrepareVersion({change, acknowledge, onClose}) {
  const edit = useEdit(), id = useId(), first = useRef(null);
  const [values, setValues] = useState({level: 'minor', reason: '', summary: ''}), [preview, setPreview] = useState(null), [error, setError] = useState(null), [busy, setBusy] = useState(false);
  useEffect(() => {first.current?.focus();}, []);
  const input = {artifact: change.artifact, change: change.name, level: values.level, reason: values.reason, summary: values.summary, ...(acknowledge ? {acknowledgeUnchecked: true} : {})};
  const set = (key, value) => {setValues(current => ({...current, [key]: value}));setPreview(null);};
  async function show(event) {event.preventDefault();if (busy) return;setBusy(true);setError(null);try {setPreview(await previewEdit({path: edit.root, worktree: edit.worktree, operation: 'version.prepare', input, dryRun: true}));} catch (failure) {setError(failure);} finally {setBusy(false);}}
  async function apply() {setBusy(true);setError(null);try {await edit.run('version.prepare', input, {expected: preview.expected});onClose();} catch (failure) {setError(failure);setBusy(false);}}
  return <form className="inline-form prepare-form" aria-label="Prepare version" onSubmit={show} onKeyDown={e => {if (e.key === 'Escape') {e.stopPropagation();onClose();}}}>
    <div className="form-title">Prepare version</div>
    {acknowledge && <p className="form-note">The version is prepared with unchecked Definition of Done items. The preview counts them.</p>}
    <div className="field"><label htmlFor={`${id}-level`}>Level</label><select ref={first} id={`${id}-level`} value={values.level} onChange={e => set('level', e.target.value)}>
      <option value="patch">Patch: compatible fix</option><option value="minor">Minor: compatible addition</option><option value="major">Major: incompatible change</option></select></div>
    <div className="field"><label htmlFor={`${id}-reason`}>Reason</label><input id={`${id}-reason`} required value={values.reason} onChange={e => set('reason', e.target.value)} placeholder="Why this level applies"/></div>
    <div className="field"><label htmlFor={`${id}-summary`}>Summary</label><textarea id={`${id}-summary`} required rows={3} value={values.summary} onChange={e => set('summary', e.target.value)} placeholder="What the version delivers"/></div>
    <OperationError error={error}/>
    {preview && <section className="version-preview" aria-label="Version preview">
      <h3>Version {preview.result.version}</h3>
      {preview.result.unchecked?.length > 0 && <p className="small muted">{preview.result.unchecked.length} unchecked Definition of Done items are acknowledged.</p>}
      {preview.files.map(f => <div key={f.path} className="preview-file"><div className="preview-path"><span className="mono">{f.path}</span> <DiffBadge name={f.action === 'create' ? 'New' : 'Changed'}/></div><pre>{f.after}</pre></div>)}
    </section>}
    <div className="form-actions">
      {preview ? <button type="button" className="primary" disabled={busy} onClick={apply}>Prepare {preview.result.version}</button> : <button className="primary" disabled={busy}>Preview version</button>}
      <button type="button" onClick={onClose}>Cancel</button>
    </div>
  </form>;
}

// preparing and onPreparing come from the page; cardPrepares: the status card holds Prepare version.
export function ReadySection({change, artifact, writable, onFix, preparing, onPreparing: setPreparing, cardPrepares}) {
  const {snapshot, go, editable} = useShell();
  const [acknowledged, setAcknowledged] = useState(false);
  const prefix = `docs/artifacts/${change.artifact}/`;
  const diagnostics = [...snapshot.diagnostics.filter(d => isError(d) && String(d.path).startsWith(prefix)), ...(change.taskGraph?.diagnostics || [])];
  const items = readiness(change, diagnostics, editable), unmet = items.filter(i => !i.met);
  const onlyDod = unmet.length > 0 && unmet.every(i => i.key === 'dod');
  const enabled = writable && (!unmet.length || onlyDod && acknowledged);
  const docTitle = path => artifact?.elements.find(e => e.file === path)?.title;
  const FIX = {plan: ['Open the plan', () => onFix('plan')], selfchecks: ['Record the self-checks', () => onFix('selfchecks')], branch: ['Create a branch', () => go({kind: 'work'})]};
  if (change.version) return <Section title="Ready for a version" label="Version readiness" id="change-ready">
    <p><VersionLabel version={change.version} established={Boolean(change.delivered)}/> <button className="link" onClick={() => go({kind: 'document', artifact: change.artifact, source: `${prefix}versions/${change.version}/README.md`})}>Open version record</button></p>
    <p className="muted small">Open a pull request for team review and merge. The version is delivered when its record is on main.</p>
  </Section>;
  return <Section title="Ready for a version" label="Version readiness" id="change-ready">
    <ul className="ready-list">{items.map(item => <li key={item.key} className={item.met ? 'met' : 'unmet'}>
      <span className="ready-mark" aria-hidden="true">{item.met ? '✓' : '○'}</span>
      <div className="grow">
        <span>{item.label}</span>{item.detail && <span className="muted"> · {item.detail}</span>}<span className="sr-only">{item.met ? ' (met)' : ' (not met)'}</span>
        {!item.met && item.key === 'dod' && <> <button className="link" onClick={() => onFix('plan')}>Check the open items</button></>}
        {!item.met && FIX[item.key] && item.key !== 'dod' && !(item.key === 'plan' && !writable) && <> <button className="link" onClick={FIX[item.key][1]}>{FIX[item.key][0]}</button></>}
        {!item.met && item.key === 'diagnostics' && <ul className="ready-diagnostics">{diagnostics.slice(0, 8).map((d, i) => <li key={i}>{d.message}{docTitle(d.path) && <> <button className="link" onClick={() => go({kind: 'document', artifact: change.artifact, source: d.path})}>Open {docTitle(d.path)}</button></>}</li>)}</ul>}
        {!item.met && item.key === 'dod' && onlyDod && writable && <label className="check acknowledge"><input type="checkbox" checked={acknowledged} onChange={e => setAcknowledged(e.target.checked)}/>Prepare with unchecked items</label>}
      </div>
    </li>)}</ul>
    {preparing ? <PrepareVersion change={change} acknowledge={onlyDod && acknowledged} onClose={() => setPreparing(false)}/>
      : !cardPrepares && <button disabled={!enabled} onClick={() => setPreparing(true)}>Prepare version</button>}
  </Section>;
}

function Commit({commit}) {
  return <li><span className="mono">{commit.id.slice(0, 8)}</span> {commit.subject}</li>;
}
// A retained change: its version, publication state and commits.
export function DeliverySection({change, review, onLoadReview}) {
  const {go} = useShell(), edit = useEdit();
  const [recording, setRecording] = useState(false);
  useEffect(() => {if (change.version) onLoadReview();}, [change.version]);
  const prefix = `docs/artifacts/${change.artifact}/`;
  const publication = review.packet?.data?.evidence?.publication;
  const merged = change.delivered ?? (publication ? publication.state !== 'proposed' : /protected ref/.test(change.historyReason || ''));
  const terms = termOnce();
  const commits = (change.steps || []).flatMap(s => [s.completionCommit, ...(s.commits || [])]).filter(Boolean).filter((c, i, all) => all.findIndex(x => x.id === c.id) === i);
  const needsReview = change.version && publication?.state === 'unverified';
  return <Section title="Delivery" label="Delivery" id="change-delivery" actions={<ExportContext artifact={change.artifact} change={change.name} review={review} onLoad={onLoadReview}/>}>
    <dl className="delivery">
      <dt>Version</dt>
      <dd><div className="delivery-line">{change.version ? <VersionLabel version={change.version} established={merged} term={terms}/> : <span>{terms('Retained change')} record</span>}
        {change.version && <button className="link" onClick={() => go({kind: 'document', artifact: change.artifact, source: `${prefix}versions/${change.version}/README.md`})}>Open version record</button>}</div>
        {change.historyReason && <p className="small muted">{change.historyReason}</p>}</dd>
      {change.version && <><dt>{terms('Publication review')}</dt>
        <dd>{publication ? <>
          <p>{publication.state === 'established' ? 'Recorded' : publication.state === 'unverified' ? 'Not recorded' : 'Not possible yet: the version record is not on main'}</p>
          {publication.reasons.map((reason, i) => <p key={i} className="small muted">{reason}</p>)}
          {review.packet.data.evidence.approval && <p className="small muted">{review.packet.data.evidence.approval}</p>}
        </> : review.status === 'error' ? <p className="small" role="alert">{review.error} <button className="link" onClick={review.retry}>Retry</button></p>
          : <p className="small muted" role="status">Reading the publication evidence…</p>}</dd></>}
      <dt>Commits</dt>
      <dd>{commits.length ? <ul className="commit-list">{commits.map(c => <Commit key={c.id} commit={c}/>)}</ul>
        : <p className="small muted">{change.layout === 'in-place' ? <>{terms('Declared evidence')}; Git history is not replayed. This record names no commit.</> : 'Exact completion commits are unknown.'}</p>}</dd>
    </dl>
      {needsReview && edit.editable && (recording ? <ActionForm open submitLabel="Record publication review" title="Publication review" onClose={() => setRecording(false)} fields={[
        {name: 'pullRequest', label: 'Pull request URL', required: true, placeholder: 'https://…/pull/1', spellCheck: false},
        {name: 'scope', label: 'Scope', required: true, value: `${change.artifact} knowledge and implementation`},
        detailField('All required knowledge and implementation changes have landed on main.'),
        {name: 'repository', label: 'Repository URL (empty: the origin remote)', spellCheck: false},
      ]} onSubmit={v => edit.run('publication.record', {artifact: change.artifact, version: change.version, pullRequest: v.pullRequest, scope: v.scope, detail: v.detail, ...(v.repository.trim() ? {repository: v.repository.trim()} : {})})}/>
        : <div className="delivery-action"><button onClick={() => setRecording(true)}>Record publication review</button></div>)}
  </Section>;
}
