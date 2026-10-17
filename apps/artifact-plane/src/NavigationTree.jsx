import React, {useEffect, useMemo, useRef, useState} from 'react';
import SearchField from './SearchField.jsx';
import {treeRows, samePage} from './work-model.js';

// One tree replaces the view switchers and sidebars. Rows open pages; groups
// and kinds expand. Roving tabindex keeps one row in the tab order.
export default function NavigationTree({snapshot, worktree, page, expanded, onToggle, onOpen, id}) {
  const [filter, setFilter] = useState(''), [focus, setFocus] = useState(null), tree = useRef(null);
  const rows = useMemo(() => treeRows({snapshot, worktree, filter, expanded}), [snapshot, worktree, filter, expanded]);
  const current = rows.find(r => r.page && samePage(r.page, page));
  const focused = rows.some(r => r.key === focus) ? focus : current?.key || rows[0]?.key;
  useEffect(() => {if (tree.current?.contains(document.activeElement) && document.activeElement.dataset.key !== focused) tree.current.querySelector(`[data-key="${CSS.escape(focused || '')}"]`)?.focus();}, [focused]);
  const parent = index => {for (let i = index - 1; i >= 0; i--) if (rows[i].level < rows[index].level) return rows[i];return null;};
  function activate(row) {
    setFocus(row.key);
    // Opening a page reveals its own row, so an artifact row expands as it opens.
    if (row.page) onOpen(row.page);
    else if (row.expandable) onToggle(row.key);
  }
  function keyboard(event) {
    const index = rows.findIndex(r => r.key === focused), row = rows[index];
    if (!row) return;
    const move = target => {if (target) {event.preventDefault();setFocus(target.key);}};
    if (event.key === 'ArrowDown') move(rows[index + 1]);
    else if (event.key === 'ArrowUp') move(rows[index - 1]);
    else if (event.key === 'Home') move(rows[0]);
    else if (event.key === 'End') move(rows.at(-1));
    else if (event.key === 'ArrowRight') {event.preventDefault();if (row.expandable && !row.open && !filter) onToggle(row.key);else if (row.expandable && rows[index + 1]?.level > row.level) setFocus(rows[index + 1].key);}
    else if (event.key === 'ArrowLeft') {event.preventDefault();if (row.expandable && row.open && !filter) onToggle(row.key);else move(parent(index));}
    else if (event.key === 'Enter' || event.key === ' ') {event.preventDefault();activate(row);}
  }
  return <section className="navigation-tree" id={id} aria-label="Navigation">
    <SearchField label="Search knowledge" value={filter} onChange={setFilter}/>
    {filter && !rows.length && <p className="tiny" role="status">No work, artifacts or units match this title or ID.</p>}
    <div role="tree" aria-label="Knowledge" ref={tree} onKeyDown={keyboard}>
      {rows.map(row => <div key={row.key} data-key={row.key} role="treeitem" aria-level={row.level} aria-expanded={row.expandable ? row.open : undefined}
        aria-selected={current?.key === row.key} tabIndex={row.key === focused ? 0 : -1}
        className={`tree-row level-${row.level}${row.level === 1 ? ' tree-group' : ''}${row.action ? ' tree-action' : ''}${current?.key === row.key ? ' active' : ''}`}
        onClick={() => activate(row)} onFocus={() => setFocus(row.key)}>
        <span className="tree-twisty" aria-hidden="true" onClick={event => {if (row.expandable && row.page && !filter) {event.stopPropagation();setFocus(row.key);onToggle(row.key);}}}>{row.expandable ? row.open ? '▾' : '▸' : ''}</span>
        <span className="tree-label"><span className="tree-title" title={row.label}>{row.label}</span>
          {(row.chip || row.pill || row.detail || row.hint) && <span className="tree-meta">
            {row.chip && <span className="phase-chip">{row.chip}</span>}
            {row.pill && <span className={`status-pill ${row.pill.split(' ')[0]}`}>{row.pill}</span>}
            {(row.detail || row.hint) && <small>{row.detail || row.hint}</small>}
          </span>}
        </span>
        {row.count !== undefined && <span className="type-count">{row.count}</span>}
      </div>)}
    </div>
  </section>;
}
