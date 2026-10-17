import React from 'react';
import {useShell} from '../page-data.js';
import {PageHeader} from '../ui.jsx';

// Task artifact-document-pages replaces this placeholder.
export default function ArtifactPage({page}) {
  const {snapshot} = useShell(), artifact = snapshot.artifacts.find(a => a.id === page.artifact);
  return <section className="page" aria-label="Artifact page"><div className="column"><PageHeader title={artifact?.title || 'Artifact not found'}/></div></section>;
}
