import React from 'react';
import {useShell} from '../page-data.js';
import {PageHeader} from '../ui.jsx';

// Task unit-flow-pages replaces this placeholder.
export default function FlowPage({page}) {
  const {snapshot} = useShell(), artifact = snapshot.artifacts.find(a => a.id === page.artifact), element = artifact?.elements.find(e => `${artifact.id}:${e.path.split('/').at(-1).replace(/\.md$/, '')}` === page.flow && e.path.startsWith('specifications/flows/'));
  return <section className="page" aria-label="Flow page"><div className="column"><PageHeader title={element?.title || 'Flow'}/></div></section>;
}
