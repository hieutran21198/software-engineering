import React from 'react';
import {useShell} from '../page-data.js';
import {PageHeader} from '../ui.jsx';

// Task unit-flow-pages replaces this placeholder.
export default function UnitPage({page}) {
  const {worktree} = useShell(), unit = worktree?.unitsOfWork?.find(u => u.id === page.unit);
  return <section className="page" aria-label="Unit page"><div className="column"><PageHeader title={unit?.title || 'Unit of work not found'}/></div></section>;
}
