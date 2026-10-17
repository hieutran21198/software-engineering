import React, {useEffect, useState} from 'react';
import {useShell} from '../page-data.js';
import {postJSON} from '../request.js';
import {PageHeader, Notice} from '../ui.jsx';
import Markdown from '../Markdown.jsx';
import {codePanelHTML, sourceLanguage} from '../code-highlight.js';
import DOMPurify from 'dompurify';

// One supporting source of a flow, read through the flow query so that only
// sources the flow names can open. Long sources load in excerpts.
export default function SourcePage({page}) {
  const {root, worktreePath, epoch, go, snapshot} = useShell();
  const [state, setState] = useState({status: 'loading', text: '', path: page.path, next: null, partial: false}), [position, setPosition] = useState({cursor: null, epoch}), [attempt, setAttempt] = useState(0);
  // A cursor belongs to the text it was read from: after a repository update the source starts again.
  const cursor = position.epoch === epoch ? position.cursor : null;
  useEffect(() => {
    const controller = new AbortController();
    setState(current => ({...current, status: 'loading'}));
    postJSON('/api/flows/query', {path: root, ...(worktreePath ? {worktree: worktreePath} : {}), knowledge: 'planning', operation: 'source', flow: page.flowId, source: page.sourceId, ...(cursor ? {cursor} : {})}, controller.signal)
      .then(result => {if (!controller.signal.aborted) setState({status: 'loaded', text: result.data.text || '', path: result.data.path || page.path, next: result.pagination?.nextCursor || null, partial: result.completeness === 'partial' || Boolean(result.pagination?.nextCursor)});})
      .catch(error => {if (!controller.signal.aborted && error.name !== 'AbortError') setState(current => ({...current, status: 'error', error: error.message}));});
    return () => controller.abort();
  }, [root, worktreePath, epoch, page.flowId, page.sourceId, cursor, attempt]);
  const artifact = snapshot.artifacts.find(a => a.id === page.artifact);
  const flowTitle = artifact?.elements.find(e => e.path === `specifications/flows/${String(page.flow).split(':')[1]}.md`)?.title || page.flow;
  const html = state.path?.endsWith('.md') ? null : DOMPurify.sanitize(codePanelHTML(state.text, sourceLanguage(state.path || '')), {ALLOWED_TAGS: ['div', 'pre', 'code', 'span'], ALLOWED_ATTR: ['class', 'tabindex', 'aria-label'], ALLOW_DATA_ATTR: false}).replaceAll('\r', '&#13;');
  return <section className="page" aria-label="Source page"><div className="column">
    <PageHeader eyebrow={<><button className="link" onClick={() => go({kind: 'flow', artifact: page.artifact, flow: page.flow})}>{flowTitle}</button> / Supporting source</>}
      title={(state.path || '').split('/').at(-1) || 'Source'} subtitle={<span className="mono">{state.path}</span>}/>
    {state.status === 'error' ? <Notice tone="error" action={<button onClick={() => setAttempt(n => n + 1)}>Retry</button>}>{state.error}</Notice>
      : state.status === 'loading' && !state.text ? <p className="muted" role="status">Reading the source…</p>
      : <>
        {state.partial && <p className="muted small" role="status">This is an excerpt of the source.</p>}
        {html === null ? <div className="prose"><Markdown text={state.text}/></div> : <div dangerouslySetInnerHTML={{__html: html}}/>}
        {state.next && <button onClick={() => setPosition({cursor: state.next, epoch})}>Next excerpt</button>}
      </>}
  </div></section>;
}
