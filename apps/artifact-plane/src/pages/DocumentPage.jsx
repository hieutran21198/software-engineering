import React from 'react';
import {useShell} from '../page-data.js';
import {PageHeader} from '../ui.jsx';

// Task artifact-document-pages replaces this placeholder.
export default function DocumentPage({page}) {
  const {snapshot} = useShell(), element = snapshot.artifacts.flatMap(a => a.elements).find(e => e.file === page.source);
  return <section className="page" aria-label="Document page"><div className="column"><PageHeader title={element?.title || page.source}/></div></section>;
}
