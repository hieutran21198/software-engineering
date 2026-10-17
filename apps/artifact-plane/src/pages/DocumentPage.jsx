import React, {useEffect, useMemo, useRef} from 'react';
import {repositoryQuery} from '../reload.js';
import Reader from '../Reader.jsx';
import PageHeader from './PageHeader.jsx';
import {ReferenceList} from '../Relationships.jsx';

// The document page: one source with its state since main and its references.
// Task document-editing adds the editor, properties and self-check actions here.
export default function DocumentPage({entry, snapshot, root, worktree, epoch, project, targets, onOpen, onBack, backLabel, onReadEstablished, onFlows}) {
  const back = useRef(null);
  useEffect(() => {(back.current?.querySelector('.back-button') || back.current?.querySelector('h1'))?.focus();}, [entry]);
  const artifact = snapshot.artifacts.find(a => a.id === (entry.artifact || entry.scope?.artifact));
  const element = artifact?.elements.find(e => e.file === entry.source && (entry.scope?.change ? e.source === `change:${entry.scope.change}` : !e.source.startsWith('change:')));
  const refs = element ? snapshot.references.filter(r => r.consumer === element.id) : [];
  const state = entry.established ? `Established text on ${String(artifact?.baseline?.ref || 'main').replace('refs/heads/', '')}` : element ? element.source === 'working' ? ({added: 'New since main', modified: 'Changed since main', unchanged: 'Unchanged since main'})[element.state] || 'State since main unknown' : element.source.replace(':', ' · ') : null;
  // Established text comes from the protected ref through the contained query route.
  const page = useMemo(() => {
    const scope = entry.scope || (entry.artifact ? {artifact: entry.artifact} : {});
    const load = entry.load || (entry.established ? signal => repositoryQuery({path: root, worktree, section: 'markdown', artifact: scope.artifact, source: entry.source, revision: 'established'}, signal).then(r => ({markdown: r.data.markdown, source: r.data.source, partial: r.completeness === 'partial'})) : undefined);
    return {...entry, scope, load};
  }, [entry, root, worktree]);
  const openTarget = ref => {
    const target = snapshot.artifacts.find(a => a.id === ref.artifact)?.elements.find(e => e.id === ref.targetId);
    if (target) onOpen({kind: 'document', artifact: target.artifact, source: target.file, title: target.path, ...(target.source.startsWith('change:') ? {scope: {artifact: target.artifact, change: target.source.slice(7)}} : {})});
  };
  return <section className="page document-page" aria-label="Document page" ref={back}>
    <PageHeader project={project} artifact={artifact?.id} crumb={entry.title || entry.source.split('/').at(-1)} title={entry.title || entry.source} onNavigate={onOpen} onBack={onBack} backLabel={backLabel}
      status={state}
      actions={<>
        {element?.state === 'modified' && !entry.established && <button onClick={() => onReadEstablished(element)}>Read established on {String(artifact.baseline?.ref || 'main').replace('refs/heads/', '')}</button>}
        {element && <button onClick={() => onFlows({artifact: element.artifact, ids: [element.id]}, element.source.startsWith('change:'))}>Find participating flows</button>}
      </>}/>
    {refs.length > 0 && <section className="properties-strip" aria-label="References"><h2>References</h2><ReferenceList references={refs} onTarget={openTarget}/></section>}
    <Reader entry={page} root={root} worktree={worktree} epoch={epoch} targets={targets} onNavigate={({kind, fragment, ...link}) => onOpen({...link, kind: 'document', artifact: link.scope?.artifact || entry.artifact})}/>
  </section>;
}
