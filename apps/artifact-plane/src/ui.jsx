// Shared page parts. Every page uses the same header, sections, badges, phase
// steps, notices and menus, so pages look and behave the same.
import React, {createContext, useContext, useEffect, useId, useLayoutEffect, useRef, useState} from 'react';
import {phaseLabel, phaseModel, PHASES} from './work-model.js';
import {difference, differenceOf, glossaryEntry, kindTag, statusFamily, STATUS_FAMILIES} from './glossary.js';

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

// A titled page section. summary follows the title in secondary text;
// description is one muted line below the title.
export function Section({title, summary, description, actions, label, id, children}) {
  return <section className="section" aria-label={label || (typeof title === 'string' ? title : undefined)} id={id}>
    <div className="section-head">
      <h2 className="section-title">{title}{summary !== undefined && summary !== null && <span className="summary"> {summary}</span>}</h2>
      {actions}
    </div>
    {description && <p className="section-description">{description}</p>}
    {children}
  </section>;
}


// The five phases of a change. onOpen(source) opens the document that completed a step.
// status replaces the narrow line when no phase is current.
export function PhaseSteps({change, onOpen, status}) {
  const model = phaseModel(change);
  return <>
    <ol className="phase-steps" aria-label="Phases">
      {model.steps.map((step, i) => <li key={step.name} className={`phase-step ${step.state}`} aria-current={step.state === 'current' ? 'step' : undefined}>
        <span className="phase-mark" aria-hidden="true">{step.state === 'done' ? '✓' : step.state === 'prepared' ? '◷' : i + 1}</span>
        {step.state === 'done' && step.source && onOpen ? <button className="link" onClick={() => onOpen(step.source)}>{step.name}</button> : <span>{step.name}</span>}
        <span className="sr-only">{STEP_STATES[step.state] || ''}</span>
      </li>)}
    </ol>
    <div className="phase-compact">
      <div className="phase-bar" aria-hidden="true">{model.steps.map(step => <i key={step.name} className={step.state === 'todo' ? '' : step.state}/>)}</div>
      <div className="phase-text small">{phaseText(model, change, status)}</div>
    </div>
  </>;
}
const STEP_STATES = {done: ' (done)', current: ' (current)', incomplete: ' (unchecked items)', prepared: ' (prepared)'};
// The narrow stepper line: "Phase n of 5: name", or the status text when no phase is current.
export const phaseText = (model, change, status) => model.current !== null ? `Phase ${model.current + 1} of ${PHASES.length}: ${PHASES[model.current]}`
  : status || (model.state === 'loading' ? 'Reading phases…' : change ? phaseLabel(change) : 'Phases');

// Status vocabulary (specifications/human-guidance.md): one component per family.
// Pages pass a status name; children replace the shown text. An unknown name throws.
const svg = children => <svg className="family-icon" width="13" height="13" viewBox="0 0 16 16" aria-hidden="true">{children}</svg>;
const FAMILY_ICONS = {
  check: svg(<><circle cx="8" cy="8" r="7" fill="currentColor" opacity=".18"/><path d="M4.8 8.3l2.1 2.1 4.3-4.6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></>),
  clock: svg(<><circle cx="8" cy="8" r="6.2" fill="none" stroke="currentColor" strokeWidth="1.6"/><path d="M8 4.8V8l2.2 1.4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></>),
  dot: svg(<><circle cx="8" cy="8" r="6.2" fill="none" stroke="currentColor" strokeWidth="1.6"/><circle cx="8" cy="8" r="2.8" fill="currentColor"/></>),
  alert: svg(<><circle cx="8" cy="8" r="6.2" fill="none" stroke="currentColor" strokeWidth="1.6"/><path d="M8 4.6v4.1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><circle cx="8" cy="11.2" r="1" fill="currentColor"/></>),
  info: svg(<><circle cx="8" cy="8" r="6.2" fill="none" stroke="currentColor" strokeWidth="1.6"/><path d="M8 7.2v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><circle cx="8" cy="4.9" r="1" fill="currentColor"/></>),
};
export function StatusBadge({status, children, small}) {
  const family = statusFamily(status);
  return <span className={`status-badge ${family}${small ? ' small' : ''}`} data-status={status}>{FAMILY_ICONS[STATUS_FAMILIES[family].icon]}<span>{children ?? status}</span></span>;
}
// New, Changed or Removed against the protected branch.
export function DiffBadge({name, small}) {
  const {family, sign} = difference(name);
  return <span className={`diff-badge ${family}${small ? ' small' : ''}`}><span className="diff-sign" aria-hidden="true">{sign}</span><span>{name}</span></span>;
}
export const KindTag = ({kind, children}) => <span className="kind-tag" data-kind={kindTag(kind)}>{children ?? kindTag(kind)}</span>;
// The difference of a server document state (added, modified, removed); nothing when equal.
export function StateBadge({state, small}) {
  const name = differenceOf(state);
  return name ? <DiffBadge name={name} small={small}/> : null;
}

// One status card: a 4-pixel stripe and badge of the status family, the status
// and next step texts, at most one action (the page's primary button), and meta.
export function StatusCard({status, text, title, next, action, children, label = 'Status'}) {
  const family = statusFamily(status);
  return <section className={`status-card ${family}`} aria-label={label}>
    <div className="status-card-head"><StatusBadge status={status}>{text}</StatusBadge>{title && <b>{title}</b>}</div>
    {next && <div className="status-card-next">{next}</div>}
    {action && <div className="status-card-action">{action}</div>}
    {children && <div className="status-card-meta">{children}</div>}
  </section>;
}

// One term button per page: inside a TermScope, the first Term of each glossary
// term in document order is the button; later ones render as plain text.
const TermContext = createContext(null);
export function TermScope({children}) {
  const [scope] = useState(() => {
    const terms = new Map();
    const order = (a, b) => a.root.current.compareDocumentPosition(b.root.current) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;
    const update = key => [...(terms.get(key) || [])].filter(t => t.root.current).sort(order).forEach((t, i) => t.setFirst(i === 0));
    return (key, entry) => {
      if (!terms.has(key)) terms.set(key, new Set());
      terms.get(key).add(entry);update(key);
      return () => {terms.get(key).delete(entry);update(key);};
    };
  });
  return <TermContext.Provider value={scope}>{children}</TermContext.Provider>;
}

// A glossary term: a dotted-underline button that opens its definition in a
// popover. Enter, Space or a pointer toggles it; Escape, a pointer outside or
// focus leaving closes it; Escape and a second activation keep focus on the term.
export function Term({term, children}) {
  const entry = glossaryEntry(term), register = useContext(TermContext);
  const [open, setOpen] = useState(false), [first, setFirst] = useState(true), id = useId(), root = useRef(null), button = useRef(null), popover = useRef(null);
  useLayoutEffect(() => register?.(entry.term.toLowerCase(), {root, setFirst}), [register, entry.term]);
  // Keep the popover inside the viewport with a 16-pixel margin.
  useLayoutEffect(() => {
    const box = popover.current?.getBoundingClientRect();
    if (box && box.right > innerWidth - 16) popover.current.style.left = `${Math.min(0, innerWidth - 16 - box.right)}px`;
  }, [open]);
  useEffect(() => {
    if (!open) return;
    const outside = event => {if (!root.current?.contains(event.target)) setOpen(false);};
    document.addEventListener('pointerdown', outside);
    return () => document.removeEventListener('pointerdown', outside);
  }, [open]);
  const keys = event => {if (event.key === 'Escape' && open) {event.stopPropagation();setOpen(false);button.current?.focus();}};
  const blur = event => {if (!root.current?.contains(event.relatedTarget)) setOpen(false);};
  if (!first) return <span ref={root}>{children ?? entry.term}</span>;
  return <span className="term-root" ref={root} onKeyDown={keys} onBlur={blur}>
    <button ref={button} type="button" className="term" aria-expanded={open} aria-controls={open ? id : undefined} onClick={() => {setOpen(value => !value);button.current?.focus();}}>{children ?? entry.term}</button>
    {open && <span ref={popover} className="term-popover" id={id} role="dialog" aria-label={entry.term} tabIndex={-1}><b>{entry.term}</b><span>{entry.definition}</span></span>}
  </span>;
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
  copy: <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><rect x="5" y="5" width="8" height="8.5" rx="1.5"/><path d="M3 10.5V3.8C3 3.1 3.6 2.5 4.3 2.5H10"/></svg>,
  pen: <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" aria-hidden="true"><path d="M3 13l.6-2.6 7-7 2 2-7 7z"/></svg>,
  up: <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M8 12.5v-9M4.5 7L8 3.5 11.5 7"/></svg>,
  down: <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M8 3.5v9M4.5 9L8 12.5 11.5 9"/></svg>,
  graph: <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><rect x="2" y="2.5" width="4.5" height="4" rx="1"/><rect x="9.5" y="9.5" width="4.5" height="4" rx="1"/><path d="M6.5 4.5h2.5a1.5 1.5 0 0 1 1.5 1.5v3.5"/></svg>,
  check: <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3.5 8.5l3 3 6-7"/></svg>,
  compare: <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true"><path d="M5 2.5v11M11 2.5v11M2.5 5.5H5M11 10.5h2.5"/></svg>,
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
