import React, {useEffect, useMemo, useRef, useState} from 'react';
import {sidebarRows, samePage, enterRow} from './work-model.js';
import {DiffBadge, Icon} from './ui.jsx';

// The sidebar: search, current work, artifacts with their documents, and
// history behind the Show history switch. Rows open pages; artifact and kind
// rows also expand. Roving tabindex keeps one row in the tab order.
// While the filter has text, concept rows join the tree and a link after the
// tree opens Discover with the query; onSearch tells the explorer to load concepts.
export default function Sidebar({snapshot, worktree, page, expanded, onToggle, onOpen, history, onHistory, id, concepts, conceptsReady = true, onSearch}) {
  const [filter, setFilter] = useState(''), [focus, setFocus] = useState(null), tree = useRef(null);
  const query = filter.trim();
  // An unmounted sidebar has no filter text: the drawer closes at 800 px or less.
  useEffect(() => {onSearch?.(Boolean(query));return () => onSearch?.(false);}, [Boolean(query)]);
  const rows = useMemo(() => sidebarRows({snapshot, worktree, filter, expanded, history, concepts}), [snapshot, worktree, filter, expanded, history, concepts]);
  const items = rows.filter(r => r.kind !== 'heading');
  const current = items.find(r => r.page && samePage(r.page, page)) || (page.kind === 'work' ? items[0] : null);
  const focused = items.some(r => r.key === focus) ? focus : current?.key || items[0]?.key;
  useEffect(() => {if (tree.current?.contains(document.activeElement) && document.activeElement.dataset.key !== focused) tree.current.querySelector(`[data-key="${CSS.escape(focused || '')}"]`)?.focus();}, [focused]);
  const parent = index => {for (let i = index - 1; i >= 0; i--) if ((items[i].level ?? 0) < (items[index].level ?? 0)) return items[i];return null;};
  function activate(row) {
    setFocus(row.key);
    // Opening an artifact reveals its kinds; the twisty collapses it.
    if (row.page) onOpen(row.page);
    else if (row.expandable) onToggle(row.key);
  }
  function keyboard(event) {
    const index = items.findIndex(r => r.key === focused), row = items[index];
    if (!row) return;
    const move = target => {if (target) {event.preventDefault();setFocus(target.key);}};
    if (event.key === 'ArrowDown') move(items[index + 1]);
    else if (event.key === 'ArrowUp') move(items[index - 1]);
    else if (event.key === 'Home') move(items[0]);
    else if (event.key === 'End') move(items.at(-1));
    else if (event.key === 'ArrowRight') {event.preventDefault();if (row.expandable && !row.open && !filter) onToggle(row.key);else if (row.expandable && (items[index + 1]?.level ?? 0) > (row.level ?? 0)) setFocus(items[index + 1].key);}
    else if (event.key === 'ArrowLeft') {event.preventDefault();if (row.expandable && row.open && !filter) onToggle(row.key);else move(parent(index));}
    else if (event.key === 'Enter' || event.key === ' ') {event.preventDefault();activate(row);}
  }
  const first = enterRow(items, filter);
  // Enter before the concepts of the worktree arrive waits for them, at most 3 s, so an exact concept title still wins.
  const [pending, setPending] = useState(null);
  useEffect(() => {
    if (pending === null) return;
    if (pending !== filter) {setPending(null);return;}
    const open = () => {setPending(null);if (first) onOpen(first.page);};
    if (conceptsReady) {open();return;}
    const timer = setTimeout(open, 3000);
    return () => clearTimeout(timer);
  }, [pending, filter, conceptsReady, first]);
  return <nav className="sidebar" id={id} aria-label="Navigation">
    <div className="sidebar-scroll">
      <form role="search" className="sidebar-search" onSubmit={event => {event.preventDefault();if (!filter) return;if (conceptsReady) {if (first) onOpen(first.page);} else setPending(filter);}}>
        {Icon.search}
        <input aria-label="Search knowledge" placeholder="Search or jump to…" title="Search or jump to… (/)" aria-keyshortcuts="/" value={filter} onChange={event => setFilter(event.target.value)} autoComplete="off"/>
        {filter && <button type="button" className="icon" style={{width: 24, height: 24}} aria-label="Clear search" onClick={() => setFilter('')}>{Icon.close}</button>}
      </form>
      {filter && !rows.some(r => r.kind !== 'heading' && r.kind !== 'home') && <p className="tree-empty" role="status">Nothing matches this title or ID.</p>}
      <div className="tree" role="tree" aria-label="Knowledge" ref={tree} onKeyDown={keyboard}>
        {rows.map(row => row.kind === 'heading' ? <div key={row.key} role="none" className="tree-heading">{row.label}</div> :
          <div key={row.key} data-key={row.key} role="treeitem" aria-level={(row.level ?? 0) + 1} aria-expanded={row.expandable ? row.open : undefined}
            aria-selected={current?.key === row.key} tabIndex={row.key === focused ? 0 : -1}
            className={`tree-row level-${row.level ?? 0} ${row.kind === 'show-all' || row.kind === 'concept' ? row.kind : ''}`}
            onClick={() => activate(row)} onFocus={() => setFocus(row.key)}>
            <span className="twisty" aria-hidden="true" onClick={event => {if (row.expandable && row.page && !filter) {event.stopPropagation();setFocus(row.key);onToggle(row.key);}}}>
              {row.kind === 'home' ? Icon.home : row.expandable ? row.open ? '⌄' : '›' : ''}
            </span>
            <span className="tree-label">
              <span className="tree-title" title={row.label}>{row.label}</span>
              {row.detail && <span className="tree-detail">{row.detail}</span>}
            </span>
            {row.badge && <DiffBadge name={row.badge} small/>}
            {row.count !== undefined && <span className="tree-count">{row.count}</span>}
          </div>)}
      </div>
      {query && <a href="#" className="sidebar-discover" onClick={event => {event.preventDefault();onOpen({kind: 'discover', query});}}>{Icon.search}Find “{query}” in Discover behavior</a>}
    </div>
    <div className="sidebar-foot">
      <span id={`${id}-history`}>Show history</span>
      <button className="switch" role="switch" aria-checked={history} aria-labelledby={`${id}-history`} onClick={() => onHistory(!history)}/>
    </div>
  </nav>;
}
