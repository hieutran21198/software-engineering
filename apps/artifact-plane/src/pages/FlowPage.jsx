import React, {useMemo, useState} from 'react';
import Flows from '../Flows.jsx';
import PageHeader from './PageHeader.jsx';

// The flow page: flow browsing and behavior discovery beside the selected flow
// with its graph and evidence. Task flow-page adds structured editing.
export default function FlowPage({page, root, worktree, epoch, knowledge, onKnowledge, artifacts, project, onOpen}) {
  const [list, setList] = useState(null), [details, setDetails] = useState(null);
  const entry = useMemo(() => ({flow: page.flow || null, artifact: page.artifact || '', ids: page.ids || null, query: page.query || '', discover: Boolean(page.discover)}), [page]);
  return <section className="page flow-page" aria-label="Flow page">
    <PageHeader project={project} artifact={page.artifact} crumb={page.flow ? page.flow.split(':').at(-1) : page.discover ? 'Discover behavior' : 'Flows'} title={page.flow ? 'Flow' : page.discover ? 'Discover behavior' : 'Flows'} onNavigate={onOpen}
      actions={<div className="view-toggle" role="group" aria-label="Flow knowledge">
        {[['established', 'Established'], ['planning', 'Planning'], ['all', 'All snapshots']].map(([value, label]) => <button key={value} aria-pressed={knowledge === value} className={knowledge === value ? 'active' : ''} onClick={() => onKnowledge(value)}>{label}</button>)}
      </div>}/>
    <div className="flow-page-body">
      <div className="flow-list-slot" ref={setList}/>
      <Flows path={root} worktree={worktree} epoch={epoch} isActive entry={entry} knowledge={knowledge} artifacts={artifacts} sidebar={list} inspector={details}
        onRead={entry => entry && onOpen({kind: 'document', ...entry, title: entry.title || entry.source})}/>
      <div className="flow-details-slot" ref={setDetails}/>
    </div>
  </section>;
}
