import React from 'react';

// Every page: breadcrumb (project / artifact / page), title, status line and actions.
export default function PageHeader({project, artifact, crumb, title, status, actions, onNavigate, onBack, backLabel}) {
  return <header className="page-header">
    <nav className="breadcrumb" aria-label="Breadcrumb">
      {onBack && <button className="back-button" onClick={onBack}>Back{backLabel ? ` to ${backLabel}` : ''}</button>}
      <button className="crumb" onClick={() => onNavigate({kind: 'work'})}>{project}</button>
      {artifact && <><span aria-hidden="true">/</span><button className="crumb" onClick={() => onNavigate({kind: 'artifact', artifact})}>{artifact}</button></>}
      {crumb && <><span aria-hidden="true">/</span><span className="crumb-current">{crumb}</span></>}
    </nav>
    <div className="page-title"><h1>{title}</h1>{actions && <div className="page-actions">{actions}</div>}</div>
    {status && <p className="page-status">{status}</p>}
  </header>;
}
