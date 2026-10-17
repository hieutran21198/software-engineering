import React, {useState, useEffect} from 'react';
import {ReactFlowProvider} from '@xyflow/react';
import {readWorkspace, writeWorkspace, closeTab, projectLabels} from './project-tabs.js';
import {Icon} from './ui.jsx';

const tab = path => ({id: crypto.randomUUID(), path});

// The window: one top bar with the product name and project tabs, then the
// active project. The active project places its own controls in the top bar.
export default function Workspace({Explorer}) {
  const [initial] = useState(() => readWorkspace({getItem: key => localStorage.getItem(key)}));
  const [workspace, setWorkspace] = useState(() => {
    const tabs = initial.projects.length ? initial.projects.map(tab) : [tab(null)];
    return {tabs, activeId: tabs.find(t => t.path === initial.activeProject)?.id || tabs[0].id};
  });
  const [warning, setWarning] = useState(initial.warning || ''), [slot, setSlot] = useState(null);
  const {tabs, activeId} = workspace;
  const labels = projectLabels(tabs);

  useEffect(() => {
    const failure = writeWorkspace({setItem: (key, value) => localStorage.setItem(key, value)}, tabs, activeId);
    if (failure) setWarning(failure);
  }, [workspace]);

  const select = id => setWorkspace(current => ({...current, activeId: id}));
  const opened = (id, path) => setWorkspace(current => {
    const owner = current.tabs.find(t => t.id === id);
    if (!owner || owner.path === path) return current;
    const duplicate = current.tabs.find(t => t.id !== id && t.path === path);
    if (duplicate) return {tabs: current.tabs.filter(t => t.id !== id), activeId: duplicate.id};
    return {...current, tabs: current.tabs.map(t => t.id === id ? {...t, path} : t)};
  });
  function keyboard(event, index) {
    const next = {ArrowRight: (index + 1) % tabs.length, ArrowLeft: (index + tabs.length - 1) % tabs.length, Home: 0, End: tabs.length - 1}[event.key];
    if (next === undefined) return;
    event.preventDefault();select(tabs[next].id);
    document.getElementById(`project-tab-${tabs[next].id}`)?.focus();
  }
  function add() {
    const next = tab(null);
    setWorkspace(current => ({tabs: [...current.tabs, next], activeId: next.id}));
  }

  return <div className="workspace-root">
    <header className="topbar">
      <div className="brand">{Icon.logo}Artifact Plane</div>
      <div className="project-tabs">
        <div role="tablist" aria-label="Projects" style={{display: 'flex', gap: 4}}>
          {tabs.map((t, index) => <div className={`project-tab ${t.id === activeId ? 'active' : ''}`} key={t.id}>
            <button className="tab-button" role="tab" id={`project-tab-${t.id}`} aria-controls={`project-panel-${t.id}`}
              aria-selected={t.id === activeId} tabIndex={t.id === activeId ? 0 : -1}
              title={t.path || 'New project'} onClick={() => select(t.id)} onKeyDown={event => keyboard(event, index)}>
              {labels[index]}
            </button>
            <button className="icon close-project" aria-label={`Close project ${t.path || 'New project'}`}
              onClick={() => setWorkspace(current => closeTab(current.tabs, current.activeId, t.id, tab(null)))}>{Icon.close}</button>
          </div>)}
        </div>
        <button className="icon" aria-label="New project tab" onClick={add}>{Icon.plus}</button>
      </div>
      <div className="topbar-slot" ref={setSlot}/>
    </header>
    {warning && <div role="alert" className="alert-line">{warning}</div>}
    {tabs.map(t => <div key={t.id} role="tabpanel" id={`project-panel-${t.id}`}
      aria-labelledby={`project-tab-${t.id}`} hidden={t.id !== activeId} className="project-panel">
      <ReactFlowProvider>
        <Explorer tabId={t.id} active={t.id === activeId} initialPath={t.path || ''} slot={slot}
          onOpened={path => opened(t.id, path)}/>
      </ReactFlowProvider>
    </div>)}
  </div>;
}
