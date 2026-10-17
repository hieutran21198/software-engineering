// Shared page parts. Every page uses the same header, sections, badges, phase
// steps, notices and menus, so pages look and behave the same.
import React, {useEffect, useId, useRef, useState} from 'react';
import {badgeOf, phaseModel, PHASES} from './work-model.js';

// Eyebrow, title once, subtitle, at most one action at the right.
export function PageHeader({eyebrow, title, subtitle, action}) {
  return <header className="page-header">
    <div className="heading">
      {eyebrow && <div className="eyebrow">{eyebrow}</div>}
      <h1 className="page-title">{title}</h1>
      {subtitle && <div className="subtitle">{subtitle}</div>}
    </div>
    {action}
  </header>;
}

// A titled page section. summary follows the title in secondary text.
export function Section({title, summary, actions, label, id, children}) {
  return <section className="section" aria-label={label || (typeof title === 'string' ? title : undefined)} id={id}>
    <div className="section-head">
      <h2 className="section-title">{title}{summary !== undefined && summary !== null && <span className="summary"> {summary}</span>}</h2>
      {actions}
    </div>
    {children}
  </section>;
}

export const Badge = ({tone = '', children, className = ''}) => <span className={`badge ${tone} ${className}`}>{children}</span>;
// New, Changed or Removed compared with main; nothing when equal.
export function StateBadge({state, small}) {
  const badge = badgeOf(state);
  return badge ? <Badge tone={badge[0]} className={small ? 'small' : ''}>{badge[1]}</Badge> : null;
}

// The five phases of a change. onOpen(source) opens the document that completed a step.
export function PhaseSteps({change, onOpen}) {
  const model = phaseModel(change);
  const current = model.current;
  return <>
    <ol className="phase-steps" aria-label="Phases">
      {model.steps.map((step, i) => <li key={step.name} className={`phase-step ${step.state}`} aria-current={step.state === 'current' ? 'step' : undefined}>
        <span className="phase-mark" aria-hidden="true">{step.state === 'done' ? '✓' : i + 1}</span>
        {step.state === 'done' && step.source && onOpen ? <button className="link" onClick={() => onOpen(step.source)}>{step.name}</button> : <span>{step.name}</span>}
        <span className="sr-only">{step.state === 'done' ? ' (done)' : step.state === 'current' ? ' (current)' : ''}</span>
      </li>)}
    </ol>
    <div className="phase-compact" aria-hidden="true">
      <div className="small"><span className="muted">{current === null ? model.state === 'loading' ? 'Reading phases…' : 'Phases' : `Step ${current + 1} of ${PHASES.length}:`}</span> <b>{current === null ? '' : PHASES[current]}</b></div>
      <div className="phase-bar">{model.steps.map(step => <i key={step.name} className={step.state === 'todo' ? '' : step.state}/>)}</div>
    </div>
  </>;
}

// tone: '' (information), 'warning' or 'error'.
export function Notice({tone = '', children, action, role}) {
  return <div className={`notice ${tone}`} role={role || (tone === 'error' ? 'alert' : undefined)}><div>{children}</div>{action}</div>;
}

export const Icon = {
  refresh: <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M13 8a5 5 0 1 1-1.5-3.6"/><path d="M13 2.5v3h-3"/></svg>,
  more: <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><circle cx="3.5" cy="8" r="1.3"/><circle cx="8" cy="8" r="1.3"/><circle cx="12.5" cy="8" r="1.3"/></svg>,
  plus: <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M8 3v10M3 8h10"/></svg>,
  close: <svg width="12" height="12" viewBox="0 0 12 12" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M3 3l6 6M9 3l-6 6"/></svg>,
  chevron: <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M3 4.5l3 3 3-3"/></svg>,
  search: <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><circle cx="7" cy="7" r="4.5"/><path d="M10.5 10.5L14 14"/></svg>,
  home: <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M2.5 7.5L8 3l5.5 4.5V13h-11z"/></svg>,
  menu: <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="M3 5.5h14M3 10h14M3 14.5h14"/></svg>,
  logo: <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#1F5BD8" strokeWidth="1.6" aria-hidden="true"><rect x="2.5" y="2.5" width="6" height="6" rx="1.5"/><rect x="11.5" y="11.5" width="6" height="6" rx="1.5"/><path d="M8.5 5.5h3a2.5 2.5 0 0 1 2.5 2.5v3.5"/></svg>,
};

// A button that opens a menu. Escape and outside clicks close it and return
// focus. children is a function that receives close().
export function Menu({label, button, className = '', buttonClass = 'icon', children}) {
  const [open, setOpen] = useState(false), id = useId(), root = useRef(null), opener = useRef(null);
  useEffect(() => {
    if (!open) return;
    const outside = event => {if (!root.current?.contains(event.target)) setOpen(false);};
    document.addEventListener('pointerdown', outside);
    requestAnimationFrame(() => root.current?.querySelector('[role^="menuitem"]:not(:disabled), input, select')?.focus());
    return () => document.removeEventListener('pointerdown', outside);
  }, [open]);
  const close = () => {setOpen(false);opener.current?.focus();};
  const keys = event => {
    if (event.key === 'Escape') {event.stopPropagation();close();return;}
    if (!['ArrowDown', 'ArrowUp'].includes(event.key)) return;
    const items = [...root.current.querySelectorAll('[role^="menuitem"]:not(:disabled)')], index = items.indexOf(document.activeElement);
    if (index < 0) return;
    event.preventDefault();items[(index + (event.key === 'ArrowDown' ? 1 : items.length - 1)) % items.length].focus();
  };
  return <div className={`menu-root ${className}`} ref={root} style={{position: 'relative'}} onKeyDown={keys}>
    <button ref={opener} className={buttonClass} aria-label={label} aria-haspopup="menu" aria-expanded={open} aria-controls={open ? id : undefined} onClick={() => setOpen(value => !value)}>{button}</button>
    {open && <div className="menu" id={id} role="menu" aria-label={label}>{children(close)}</div>}
  </div>;
}
