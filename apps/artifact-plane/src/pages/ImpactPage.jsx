// The Impact page: what a change affects, why, and where to look first. The
// server answers with tiers, typed paths and a coverage statement; this page
// groups them, filters them and explains one selected entity at a time.
import {useEffect, useId, useMemo, useRef, useState} from 'react';
import {useShell} from '../page-data.js';
import {PageHeader, Notice} from '../ui.jsx';
import {postJSON} from '../request.js';
import {GraphPanel, Handles} from '../GraphPanel.jsx';
import {impactCanvas} from '../impact-canvas.js';
import {TIERS, KINDS, STRENGTH_LABELS, VIA_LABELS, entityLabel, flowHighlight, groupRows, impactPage, kindGroup, lastRelationship, pageFor, parseEntity, readContext, sectionItems} from '../impact-model.js';
import './ImpactPage.css';

const KIND_NAMES = {flow: 'flow', step: 'step', document: 'knowledge', element: 'knowledge', module: 'code', test: 'test', model: 'model', 'go-package': 'package', build: 'build', file: 'file', unresolved: 'unknown'};
const kindName = item => KIND_NAMES[item.kind] || (kindGroup(item) === 'knowledge' ? 'knowledge' : item.kind || 'file');
const plural = (n, one, many = one + 's') => `${n} ${n === 1 ? one : many}`;
const SHOWN = {direct: true, transitive: true, potential: true, verify: true, investigate: false, unresolved: true};

function useImpact(context, depth) {
  const {root, worktreePath, epoch} = useShell();
  const [state, setState] = useState({status: 'idle', result: null, error: null}), [attempt, setAttempt] = useState(0);
  const key = context ? JSON.stringify(context) : null;
  useEffect(() => {
    if (!key || !root) return;
    const controller = new AbortController(), {title, ...query} = JSON.parse(key);
    setState(current => ({...current, status: 'loading', error: null}));
    postJSON('/api/impact/query', {path: root, ...(worktreePath ? {worktree: worktreePath} : {}), ...query, depth, limit: 100}, controller.signal)
      .then(result => {if (!controller.signal.aborted) setState({status: 'loaded', result, error: null});})
      .catch(error => {if (!controller.signal.aborted && error.name !== 'AbortError') setState(current => ({...current, status: 'error', error: error.message}));});
    return () => controller.abort();
  }, [key, root, worktreePath, epoch, depth, attempt]);
  return {...state, retry: () => setAttempt(n => n + 1)};
}

// The question form: a path with optional symbols, or a commit.
function AskForm({initial, onAsk, onCancel}) {
  const id = useId(), first = initial?.origins?.[0];
  const [path, setPath] = useState(first?.path || ''), [symbols, setSymbols] = useState((first?.symbols || []).join(', ')), [commit, setCommit] = useState(initial?.commit || '');
  const submit = event => {
    event.preventDefault();
    const names = symbols.split(',').map(s => s.trim()).filter(Boolean);
    if (commit.trim()) onAsk({commit: commit.trim(), title: `Commit ${commit.trim()}`});
    else if (path.trim()) onAsk({origins: [{path: path.trim(), ...(names.length ? {symbols: names} : {})}], title: path.trim().split('/').at(-1)});
  };
  return <form className="inline-form impact-ask" aria-label="Ask what a change affects" onSubmit={submit}>
    <div className="form-title">What does a change affect?</div>
    <div className="form-note">Name a file or document of this repository, or a commit. Changed symbols make the answer more precise.</div>
    <div className="field"><label htmlFor={`${id}-path`}>File or document path</label>
      <input id={`${id}-path`} value={path} onChange={e => setPath(e.target.value)} placeholder="apps/artifact-plane/server/reader.js" autoComplete="off" spellCheck={false}/></div>
    <div className="field"><label htmlFor={`${id}-symbols`}>Changed symbols (optional)</label>
      <input id={`${id}-symbols`} value={symbols} onChange={e => setSymbols(e.target.value)} placeholder="scanRepository, git" autoComplete="off" spellCheck={false}/><small>Separate names with commas.</small></div>
    <div className="field"><label htmlFor={`${id}-commit`}>Or a commit</label>
      <input id={`${id}-commit`} value={commit} onChange={e => setCommit(e.target.value)} placeholder="HEAD or a commit ID" autoComplete="off" spellCheck={false}/></div>
    <div className="form-actions"><button className="primary" disabled={!path.trim() && !commit.trim()}>Show impact</button>{onCancel && <button type="button" onClick={onCancel}>Cancel</button>}</div>
  </form>;
}

function ImpactNode({data}) {
  return <div className={`graph-node impact-node tier-${data.tier} ${data.selected ? 'current' : ''}`}><Handles/>
    <small>{data.group ? data.kind : `${data.tier === 'changed' ? 'changed' : data.tier}${data.hops ? ` · ${plural(data.hops, 'hop')}` : ''}`}</small>
    <strong title={data.label}>{data.label}</strong>
  </div>;
}
const nodeTypes = {impact: ImpactNode};

// One row: kind, name, strength, hops and the last relationship.
function Row({item, snapshot, selected, onSelect}) {
  const name = entityLabel(item.entity, snapshot, item.title);
  const steps = item.steps?.length ? item.steps.map(s => s.hops > 1 ? `${s.step} (${plural(s.hops, 'hop')})` : s.step).join(', ') : null;
  // Imports explain themselves; other evidence names its strength.
  const strength = item.strength && !['static', 'static+symbol'].includes(item.strength) && item.tier !== 'potential' ? STRENGTH_LABELS[item.strength] : null;
  const uses = item.uses?.length ? `supports ${item.uses.length === 1 ? `${entityLabel(item.uses[0].flow, snapshot)}, step ${item.uses[0].step}` : plural(new Set(item.uses.map(u => u.flow)).size, 'flow')}` : null;
  const detail = [item.tier !== 'unresolved' && !uses && lastRelationship(item), uses, item.hops > 1 && plural(item.hops, 'hop'), strength].filter(Boolean);
  const showPath = parseEntity(item.entity).type === 'knowledge';
  return <li><button className={`unstyled impact-row ${selected ? 'selected' : ''}`} aria-pressed={selected} onClick={() => onSelect(item)}>
    <span className={`impact-kind kind-${kindGroup(item)}`}>{kindName(item)}</span>
    <span className="impact-name">
      <span className="impact-title">{name}</span>
      {showPath && <span className="impact-path">{item.entity}</span>}
      {steps && <span className="impact-steps">steps {steps}</span>}
      {item.tier === 'unresolved' && <span className="impact-reason">{item.reason}</span>}
    </span>
    {detail.length > 0 && <span className="impact-meta">{detail.join(' · ')}</span>}
  </button></li>;
}

// The detail of the selected entity: every path as typed edges, with evidence.
function Detail({item, data, snapshot, go, onClose}) {
  const name = entityLabel(item.entity, snapshot, item.title), parsed = parseEntity(item.entity);
  const highlight = parsed.type === 'flow' ? flowHighlight(item, data.steps) : null;
  const page = pageFor(item.entity, {highlight});
  const isPath = parsed.type === 'path' || parsed.type === 'knowledge';
  return <aside className="impact-detail" aria-label="Selected entity">
    <div className="impact-detail-head">
      <div><span className={`badge small tier-${item.tier}`}>{item.tier}</span> <span className="muted small">{kindName(item)}</span></div>
      <button className="icon" aria-label="Close details" onClick={onClose}>×</button>
    </div>
    <h3>{name}</h3>
    {name !== item.entity && !item.entity.startsWith('flow:') && <p className="impact-path">{item.entity}</p>}
    <dl className="impact-facts">
      {item.strength && <><dt>Evidence</dt><dd>{STRENGTH_LABELS[item.strength] || item.strength}</dd></>}
      {item.hops !== undefined && <><dt>Distance</dt><dd>{plural(item.hops, 'relationship')}</dd></>}
      {item.origins?.length > 0 && <><dt>Changed</dt><dd>{item.origins.map(o => <span key={o} className="impact-path block">{o}</span>)}</dd></>}
      {item.affected_exports?.length > 0 && <><dt>Affected exports</dt><dd className="mono">{item.affected_exports.join(', ')}</dd></>}
      {item.reason && item.tier !== 'unresolved' && <><dt>Reason</dt><dd>{item.reason}</dd></>}
      {item.tier === 'unresolved' && <><dt>Why unresolved</dt><dd>{item.reason}</dd></>}
      {item.evidence?.co_changed && <><dt>History</dt><dd>Changed together in {item.evidence.co_changed}.</dd></>}
      {item.evidence?.shared_terms && <><dt>Shared terms</dt><dd className="mono">{item.evidence.shared_terms.join(', ')}</dd></>}
      {item.evidence?.note && <><dt>Note</dt><dd>{item.evidence.note}</dd></>}
    </dl>
    {item.uses?.length > 0 && <><h4>Supports</h4><ul className="impact-step-list">{item.uses.map(u => <li key={u.flow + u.step}>{entityLabel(u.flow, snapshot)}, step <b>{u.step}</b></li>)}</ul></>}
    {item.steps?.length > 0 && <><h4>Affected steps</h4><ul className="impact-step-list">{item.steps.map(s => <li key={s.step}><b>{s.step}</b> <span className="muted small">{STRENGTH_LABELS[s.strength]}{s.hops > 1 ? ` · ${plural(s.hops, 'hop')}` : ''}</span>{s.reason && <div className="small">{s.reason}</div>}</li>)}</ul></>}
    {item.paths?.length > 0 && <><h4>{item.paths.length === 1 ? 'Path' : `Paths (${item.paths.length})`}</h4>
      {item.paths.map((path, i) => <ol key={i} className="impact-path-steps">
        <li className="origin"><span className="impact-path">{path[0]?.from || item.origins?.[0]}</span></li>
        {path.map((edge, j) => <li key={j}>
          <span className="via">{VIA_LABELS[edge.via] || edge.via}{edge.symbols?.length ? ` (${edge.symbols.join(', ')})` : ''}</span>
          <span className={['path', 'knowledge'].includes(parseEntity(edge.to).type) ? 'impact-path' : 'impact-node-name'}>{['path'].includes(parseEntity(edge.to).type) ? edge.to : entityLabel(edge.to, snapshot)}</span>
          {(edge.reason || edge.basis || edge.sameBytes === false) && <span className="small muted">{[edge.basis, edge.reason && `“${edge.reason}”`, edge.sameBytes === false && 'copy differs'].filter(Boolean).join(' · ')}</span>}
        </li>)}
      </ol>)}</>}
    <div className="impact-links">
      {page && <button className="quiet" onClick={() => go(page)}>{parsed.type === 'flow' ? 'Open flow with affected steps' : 'Open'}</button>}
      {isPath && <button className="quiet" onClick={() => go(impactPage({origins: [{path: item.entity}], title: item.entity.split('/').at(-1)}))}>What does this affect?</button>}
    </div>
  </aside>;
}

export default function ImpactPage({page}) {
  const {snapshot, go} = useShell();
  const context = readContext(page);
  const [depth, setDepth] = useState(context?.depth || 2);
  const impact = useImpact(context, depth);
  const [shown, setShown] = useState(SHOWN), [kind, setKind] = useState('all'), [origin, setOrigin] = useState(''), [selection, setSelection] = useState(null);
  const [graph, setGraph] = useState(false), [asking, setAsking] = useState(!context), [allOrigins, setAllOrigins] = useState(false);
  const detailRef = useRef(null), filterId = useId();
  const result = impact.result, data = result?.data;
  const selected = useMemo(() => {
    if (!data || !selection) return null;
    for (const [tier] of TIERS) {const hit = sectionItems(data, tier).find(i => `${tier}:${i.entity}` === selection);if (hit) return hit;}
    return null;
  }, [data, selection]);
  useEffect(() => {if (selected && window.innerWidth <= 800) detailRef.current?.scrollIntoView({block: 'start', behavior: 'smooth'});}, [selected]);
  useEffect(() => {if (!selected) return;const close = e => {if (e.key === 'Escape') setSelection(null);};document.addEventListener('keydown', close);return () => document.removeEventListener('keydown', close);}, [selected]);
  const canvas = useMemo(() => graph && data ? impactCanvas(data, {selection: selected?.entity, snapshot}) : null, [graph, data, selected, snapshot]);

  const ask = query => {setAsking(false);go(impactPage(query));};
  const title = context?.title ? `What does ${context.title} affect?` : 'What does this change affect?';
  const header = <PageHeader eyebrow="Impact" title={title}
    subtitle={context ? 'Affected knowledge, flows, code and tests, with the relationship that connects each one to the change.' : null}
    action={context && !asking ? <button className="quiet" onClick={() => setAsking(true)}>Ask about something else</button> : null}/>;
  if (!context || asking) return <section className="page wide impact-page" aria-label="Impact page"><div className="column">{header}
    <AskForm initial={context} onAsk={ask} onCancel={context ? () => setAsking(false) : null}/></div></section>;

  const omitted = Object.fromEntries((result?.omissions || []).map(o => [o.section, o.total]));
  const count = tier => tier === 'potential' ? data?.potential_total ?? data?.potential?.length ?? 0 : omitted[tier] ?? data?.[tier]?.length ?? 0;
  const changed = data?.changed || [];
  const visibleOrigins = allOrigins ? changed : changed.slice(0, 6);
  const frontier = data?.coverage?.frontier || 0;
  const consumers = (data?.direct?.length || 0) + (data?.transitive?.length || 0);

  return <section className="page wide impact-page" aria-label="Impact page"><div className="column">
    {header}
    {impact.status === 'error' && <Notice tone="error" action={<button onClick={impact.retry}>Retry</button>}>{impact.error}</Notice>}
    {!data && impact.status !== 'error' && <p className="muted" role="status">Reading what the change affects…</p>}
    {data && <>
      <div className="impact-origins" aria-label="Changed">
        <span className="impact-origins-label">Changed</span>
        {visibleOrigins.map(c => <span key={c.path} className="impact-origin" title={c.path}>
          <span className="mono">{c.path}</span>
          {c.status && c.status !== 'modified' && <span className="badge small">{c.status}</span>}
          {c.symbols?.length > 0 && <span className="impact-origin-detail" title={c.symbols.join(', ')}>{c.symbols.slice(0, 3).join(', ')}{c.symbols.length > 3 ? ` +${c.symbols.length - 3}` : ''}</span>}
        </span>)}
        {changed.length > 6 && <button className="link small" onClick={() => setAllOrigins(v => !v)}>{allOrigins ? 'Show fewer' : `and ${changed.length - 6} more`}</button>}
        {!changed.length && <span className="muted small">No changed entity could be resolved.</span>}
      </div>

      {result.freshness === 'stale' && <Notice tone="warning" action={<button onClick={impact.retry}>Reload</button>}>The repository changed while the answer was computed.</Notice>}
      {result.diagnostics?.length > 0 && <details className="impact-diagnostics"><summary>{plural(result.diagnostics.length, 'diagnostic')} make this answer partial</summary>
        <ul>{result.diagnostics.slice(0, 20).map((d, i) => <li key={i}><span className="mono">{d.code}</span> {d.path && <span className="mono muted">{d.path}</span>} {d.message}</li>)}</ul></details>}

      <div className="impact-summary" role="group" aria-label="Show tiers">
        {TIERS.map(([tier, label]) => <button key={tier} className={`impact-toggle tier-${tier}`} aria-pressed={shown[tier]} onClick={() => setShown(s => ({...s, [tier]: !s[tier]}))}>
          <b>{count(tier)}</b> {label}</button>)}
      </div>
      <div className="impact-controls">
        <label className="sr-only" htmlFor={`${filterId}-kind`}>Kind</label>
        <select id={`${filterId}-kind`} value={kind} onChange={e => setKind(e.target.value)}>{KINDS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
        {changed.length > 1 && <><label className="sr-only" htmlFor={`${filterId}-origin`}>Changed entity</label>
          <select id={`${filterId}-origin`} value={origin} onChange={e => setOrigin(e.target.value)}><option value="">All changed entities</option>{changed.map(c => <option key={c.path} value={c.path}>{c.path.split('/').at(-1)}</option>)}</select></>}
        <button disabled={!frontier || depth >= 4 || impact.status === 'loading'} aria-busy={impact.status === 'loading'} onClick={() => setDepth(d => Math.min(4, d + 1))}
          title={frontier ? `${plural(frontier, 'relationship')} lie beyond depth ${depth}` : 'Nothing lies beyond this depth'}>One more hop ({frontier})</button>
        <button aria-pressed={graph} onClick={() => setGraph(g => !g)}>{graph ? 'Show as list' : 'Show as graph'}</button>
      </div>

      <div className={`impact-body ${selected ? 'with-detail' : ''}`}>
        <div className="impact-lists">
          {!consumers && <p className="impact-empty" role="status">No consumer found in the analyzed relationships. This does not prove that the change affects nothing; see Coverage below.</p>}
          {graph && canvas && <GraphPanel label="Impact graph" nodes={canvas.nodes} edges={canvas.edges} nodeTypes={nodeTypes} labelled flowKey={`${page.context}:${depth}:${selected?.entity || ''}:${canvas.grouped}`}
            message={canvas.nodes.length ? null : 'Nothing to draw.'}
            onNodeClick={(_, node) => {for (const [tier] of TIERS) if (sectionItems(data, tier).some(i => i.entity === node.id)) {setSelection(`${tier}:${node.id}`);return;}}}
            legend={<><span><i/>Relationship</span><span>{canvas.grouped ? 'Grouped by artifact or folder.' : 'Select an entity to show its paths.'}</span></>}/>}
          {TIERS.filter(([tier]) => shown[tier]).map(([tier, label, note]) => {
            const items = sectionItems(data, tier, {kind, origin: origin || null});
            if (!items.length) return null;
            return <section key={tier} className="impact-section" aria-label={label}>
              <h2 className="section-title"><span className={`badge tier-${tier}`}>{label}</span> <span className="summary">{items.length}{omitted[tier] ? ` of ${omitted[tier]}` : ''}</span></h2>
              <p className="tiny">{note}</p>
              {groupRows(items).map(({group, rows}) => <div key={group} className="impact-group">
                <h3>{snapshot.artifacts.find(a => a.id === group)?.title || group}</h3>
                <ul>{rows.map(item => <Row key={`${tier}:${item.entity}:${item.flowRef || ''}`} item={item} snapshot={snapshot} selected={selection === `${tier}:${item.entity}`}
                  onSelect={i => setSelection(current => current === `${tier}:${i.entity}` ? null : `${tier}:${i.entity}`)}/>)}</ul>
              </div>)}
            </section>;
          })}
          {data.declared && <section className="impact-section" aria-label="Declared assessment">
            <h2 className="section-title">Declared in unit {data.declared.unit}</h2>
            <p className="small">Flows declared but not reached: {data.declared.declared_not_reached.join(', ') || 'none'}.</p>
            <p className="small">Flows reached but not declared: {data.declared.reached_not_declared.join(', ') || 'none'}.</p>
          </section>}
          <details className="impact-coverage" open={!consumers}>
            <summary>Coverage</summary>
            <p className="small">Depth {data.coverage.depth}; {plural(data.coverage.frontier, 'relationship')} beyond it. {data.coverage.symbol_level}. History: {data.coverage.history_window}.</p>
            <p className="small"><b>Analyzed:</b> {data.coverage.sources_used.join('; ')}.</p>
            <p className="small"><b>Not analyzed:</b> {data.coverage.not_analyzed.join('; ')}.</p>
            <p className="tiny">A path proves a relationship, not a failure. A missing path proves nothing.</p>
          </details>
        </div>
        {selected && <div ref={detailRef} className="impact-detail-wrap"><Detail item={selected} data={data} snapshot={snapshot} go={go} onClose={() => setSelection(null)}/></div>}
      </div>
    </>}
  </div></section>;
}
