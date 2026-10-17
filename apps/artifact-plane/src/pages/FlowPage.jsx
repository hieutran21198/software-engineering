import React, {useMemo, useState} from 'react';
import Flows from '../Flows.jsx';
import PageHeader from './PageHeader.jsx';
import FlowEditor from './FlowEditor.jsx';

// The flow page: flow browsing and behavior discovery beside the selected flow
// with its graph and evidence. It stays mounted while a source is read, so the
// list, selection and source choice survive Back. Task flow-page adds editing.
export default function FlowPage({page, active, root, worktree, epoch, knowledge, onKnowledge, artifacts, project, onOpen, snapshot}) {
  const [list, setList] = useState(null), [details, setDetails] = useState(null), [selected, setSelected] = useState(false), [flow, setFlow] = useState(null);
  const ids = JSON.stringify(page.ids || null);
  const entry = useMemo(() => ({flow: page.flow || null, artifact: page.artifact || '', ids: JSON.parse(ids), query: page.query || '', discover: Boolean(page.discover)}), [page.flow, page.artifact, ids, page.query, page.discover]);
  return <section className="page flow-page" aria-label="Flow page" hidden={!active}>
    <PageHeader project={project} artifact={page.artifact} crumb={page.discover ? 'Discover behavior' : 'Flows'} title={page.discover ? 'Discover behavior' : 'System flows'} onNavigate={onOpen}
      status="Flows describe behavior as steps with supporting knowledge, implementation and tests."
      actions={<div className="view-toggle" role="group" aria-label="Flow knowledge">
        {[['established', 'Established'], ['planning', 'Planning'], ['all', 'All snapshots']].map(([value, label]) => <button key={value} aria-pressed={knowledge === value} className={knowledge === value ? 'active' : ''} onClick={() => onKnowledge(value)}>{label}</button>)}
      </div>}/>
    <div className={`flow-page-body ${selected ? '' : 'without-details'}`}>
      <div className="flow-list-slot" ref={setList}/>
      <div className="flow-main">
        {active && <FlowEditor selected={flow} snapshot={snapshot} root={root} worktree={worktree} epoch={epoch}/>}
        <Flows path={root} worktree={worktree} epoch={epoch} isActive={active} entry={entry} knowledge={knowledge} artifacts={artifacts} sidebar={list} inspector={details} onSelection={setSelected} onFlow={setFlow}
          onRead={entry => entry && onOpen({...entry, kind: 'document', title: entry.title || entry.source})}/>
      </div>
      <aside className="flow-details-slot" ref={setDetails} hidden={!selected} aria-label="Selection details"/>
    </div>
  </section>;
}
