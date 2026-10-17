import React, {useEffect, useId, useRef, useState} from 'react';
import {useShell} from '../page-data.js';
import {PageHeader, Notice} from '../ui.jsx';
import {postJSON} from '../request.js';
import {artifactTitle} from '../work-model.js';
import './DiscoverPage.css';

const query = (body, signal) => postJSON('/api/flows/query', body, signal);
const NOTES = {'flow-model-unavailable': 'Semantic search is not available. Keyword search and graph discovery still work.'};

// Behavior discovery: describe a behavior, read the related flows, open one.
export default function DiscoverPage({page}) {
  const {snapshot, root, worktreePath, epoch, go} = useShell(), fieldId = useId();
  const [text, setText] = useState(page.query || ''), [search, setSearch] = useState(page.query || ''), [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState(null), [cursor, setCursor] = useState(null), [loading, setLoading] = useState(false), [error, setError] = useState('');
  const shown = useRef(null);shown.current = result;
  useEffect(() => {
    if (!search || !root) return;
    const controller = new AbortController();
    setLoading(true);setError('');
    query({path: root, ...(worktreePath ? {worktree: worktreePath} : {}), knowledge: 'planning', operation: 'search', query: search, match: 'discovery', limit: 20, ...(cursor ? {cursor} : {})}, controller.signal).then(next => {
      if (controller.signal.aborted) return;
      const previous = shown.current;
      // A later page of another ranking would mix two orders: start the search again instead.
      if (cursor && previous && (next.generation !== previous.generation || next.revision !== previous.revision)) {setResult(null);setCursor(null);setAttempt(n => n + 1);return;}
      setResult(cursor && previous ? {...next, data: {...next.data, flows: [...new Map([...previous.data.flows, ...next.data.flows].map(f => [f.id, f])).values()]}} : next);
    }).catch(failure => {if (!controller.signal.aborted && failure.name !== 'AbortError') {setError(failure.message);if (cursor) setCursor(null);}})
      .finally(() => {if (!controller.signal.aborted) setLoading(false);});
    return () => controller.abort();
  }, [search, cursor, attempt, root, worktreePath, epoch]);
  const submit = event => {event.preventDefault();const value = text.trim();if (!value) return;setCursor(null);setResult(null);setSearch(value);setAttempt(n => n + 1);};
  const flows = result?.data?.flows || [];
  const notes = [...new Set((result?.diagnostics || []).map(d => NOTES[d.code]).filter(Boolean))];

  return <section className="page discover-page" aria-label="Discover behavior"><div className="column">
    <PageHeader title="Discover behavior" subtitle="Describe a behavior. The Plane lists the flows that describe related behavior, most relevant first."/>
    <form className="discover-form" role="search" onSubmit={submit}>
      <label className="sr-only" htmlFor={fieldId}>Behavior</label>
      <input id={fieldId} value={text} placeholder="For example: commit knowledge files on a branch" autoComplete="off" onChange={e => setText(e.target.value)}/>
      <button className="primary" disabled={loading && !cursor} aria-busy={loading}>Search</button>
    </form>
    {notes.map(n => <p key={n} className="tiny discover-note">{n}</p>)}
    {error && <Notice tone="error" action={<button onClick={() => setAttempt(n => n + 1)}>Retry</button>}>{error}</Notice>}
    <div role="status" className="sr-only">{loading ? 'Searching…' : result ? `${flows.length} flows found` : ''}</div>
    {result && <>
      {result.freshness && result.freshness !== 'fresh' && <p className="tiny discover-note">The results can be out of date. Search again to read the current knowledge.</p>}
      {flows.length ? <ul className="doc-list discover-results">{flows.map(f => <li key={f.id}>
        <button className="unstyled" onClick={() => go({kind: 'flow', artifact: f.artifact, flow: f.logicalId || `${f.artifact}:${f.localId}`})}>
          <span className="doc-title"><span className="result-title">{f.title}</span><span className="result-detail">{artifactTitle(snapshot, f.artifact)}{f.trigger ? ` · Starts when ${f.trigger.charAt(0).toLowerCase()}${f.trigger.slice(1)}` : ''}</span></span>
        </button>
      </li>)}</ul> : <p className="muted">No flow matches. No match does not prove that the behavior does not exist.</p>}
      {result.pagination?.nextCursor && <button className="quiet show-more" disabled={loading} onClick={() => setCursor(result.pagination.nextCursor)}>{loading ? 'Loading…' : 'Show more results'}</button>}
    </>}
  </div></section>;
}
