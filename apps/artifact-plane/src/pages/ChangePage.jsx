import React from 'react';
import {useShell} from '../page-data.js';
import {PageHeader} from '../ui.jsx';
import {changeTitle} from '../work-model.js';

// Task change-page replaces this placeholder.
export default function ChangePage({page}) {
  const {worktree} = useShell(), change = worktree?.changes.find(c => c.artifact === page.artifact && c.name === page.change);
  return <section className="page wide" aria-label="Change page"><div className="column"><PageHeader title={change ? changeTitle(change) : 'Change not found'}/></div></section>;
}
