import React from 'react';
import {useShell} from '../page-data.js';
import {PageHeader} from '../ui.jsx';

// Task work-page replaces this placeholder with the work page.
export default function WorkPage() {
  const {snapshot} = useShell();
  return <section className="page" aria-label="Work page"><div className="column">
    <PageHeader title="Current work" subtitle={snapshot.repository.path.split('/').at(-1)}/>
  </div></section>;
}
