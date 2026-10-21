// Links of the existing pages to concept pages. The UI word is concept; the
// record word is model. The facts come from the concepts operation.
import React, {useEffect, useState} from 'react';
import {useShell} from '../page-data.js';
import {postJSON} from '../request.js';
import {DiffBadge} from '../ui.jsx';

const DECLARATION = {new: 'New', changed: 'Changed', removed: 'Removed'};

// The concept page of a concept item or a flow model: {kind, artifact, model}.
export const conceptPage = ({artifact, logicalId}) => ({kind: 'concept', artifact, model: logicalId.slice(artifact.length + 1)});
// The first sentence of a description: up to the first stop that ends a sentence.
export const firstSentence = text => String(text || '').trim().match(/^.*?[.!?](?=\s|$)/s)?.[0] || String(text || '').trim();

// The concepts of one artifact in the selected worktree, with planning knowledge.
// The list is empty while it loads and when the read fails, so a repository
// without models shows nothing new.
export function useConcepts(artifact) {
  const {root, worktreePath, epoch} = useShell();
  const [state, setState] = useState({artifact: null, concepts: []});
  useEffect(() => {
    if (!root || !artifact) return;
    const controller = new AbortController();
    postJSON('/api/flows/query', {path: root, ...(worktreePath ? {worktree: worktreePath} : {}), knowledge: 'planning', operation: 'concepts', artifact}, controller.signal)
      .then(result => {if (!controller.signal.aborted) setState({artifact, concepts: result.data?.concepts || []});})
      .catch(() => {});
    return () => controller.abort();
  }, [root, worktreePath, epoch, artifact]);
  return state.artifact === artifact ? state.concepts : [];
}

// A concept name: a link to its page with the DiffBadge of its declaration.
// A removed declaration has no page, so its name is plain text.
export function ConceptName({concept, go}) {
  const badge = DECLARATION[concept.declaration];
  return <span className="concept-name">
    {concept.declaration === 'removed' ? concept.title : <button className="link" onClick={() => go(conceptPage(concept))}>{concept.title}</button>}
    {badge && <> <DiffBadge name={badge} small/></>}
  </span>;
}
