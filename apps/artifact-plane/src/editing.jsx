import React, {createContext, useContext, useEffect, useId, useRef, useState} from 'react';
import {parseDocument} from 'yaml';

// Shared editing support: the operation runner the shell provides, one inline
// form component for every action, error display and front-matter reading.
export const EditContext = createContext({editable: false, run: async () => {throw Error('Editing is not available.');}, git: async () => {}, setUnsaved: () => {}});
export const useEdit = () => useContext(EditContext);

const FRONT = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/;
export function splitFront(text = '') {
  const match = text.match(FRONT);
  return match ? {front: match[1], body: text.slice(match[0].length)} : {front: null, body: text};
}
export function frontValue(text = '') {
  const {front} = splitFront(text);
  if (front === null) return {};
  try {const doc = parseDocument(front);if (doc.errors.length) return {error: doc.errors[0].message};const value = doc.toJS();return value && typeof value === 'object' && !Array.isArray(value) ? value : {};}
  catch (error) {return {error: error.message};}
}
// The same checklist positions as the writer: fenced blocks are skipped.
export function checklistItems(text = '') {
  const items = [];let fence = null;
  for (const line of text.split('\n')) {
    const marker = line.match(/^\s*(`{3,}|~{3,})/);
    if (marker) {if (!fence) fence = marker[1][0];else if (marker[1][0] === fence) fence = null;}
    else if (!fence) {const m = line.match(/^(\s*(?:[-*+]|\d+[.)])\s+\[)( |x|X)(\]\s)/);if (m) items.push({checked: m[2] !== ' ', text: line.slice(m[0].length).trim()});}
  }
  return items;
}
// Body text of one heading section, as the readers anchor it.
export const anchorOf = text => text.toLowerCase().replace(/[^\p{L}\p{N}_\s-]/gu, '').trim().replace(/\s/g, '-');
export function sectionText(markdown = '', anchor) {
  const lines = splitFront(markdown).body.split('\n');let depth = 0, out = null;
  for (const line of lines) {
    const h = line.match(/^(#{1,6})\s+(.*)$/);
    if (h && out !== null && h[1].length <= depth) break;
    if (out !== null) out.push(line);
    else if (h && anchorOf(h[2]) === anchor) {depth = h[1].length;out = [];}
  }
  return out === null ? null : out.join('\n').trim();
}

export function OperationError({error}) {
  if (!error) return null;
  const diagnostics = (error.diagnostics || []).filter(d => d.state !== 'existing' && d.severity !== 'warning');
  return <div role="alert" className="operation-error">
    <p>{error.message}</p>
    {diagnostics.length > 0 && <ul>{diagnostics.slice(0, 8).map((d, i) => <li key={i}><strong>{d.code}</strong> {d.message}{d.path && <small> {d.path}</small>}</li>)}</ul>}
    {error.unchecked?.length > 0 && <ul>{error.unchecked.slice(0, 12).map((u, i) => <li key={i}>{u.task}: {u.item}</li>)}</ul>}
  </div>;
}
// One inline form for each action. Fields: {name, label, type, options, value,
// required, placeholder}. Enter in a one-line field submits. onSubmit returns a
// promise; an error stays inline at the form.
export function ActionForm({label, submitLabel, fields, onSubmit, open: initiallyOpen = false, disabled = false, onClose, className = '', opener: openerClass = '', note, title}) {
  const id = useId(), [open, setOpen] = useState(initiallyOpen), [values, setValues] = useState({}), [busy, setBusy] = useState(false), [error, setError] = useState(null), first = useRef(null), opener = useRef(null);
  useEffect(() => {if (open) {setValues(Object.fromEntries(fields.map(f => [f.name, f.value ?? (f.type === 'checkbox' ? false : f.type === 'checks' ? [] : '')])));setError(null);}}, [open]);
  // Focus moves once, at once, so it never lands in a field the person already left.
  useEffect(() => {if (open) first.current?.focus();}, [open]);
  useEffect(() => {if (initiallyOpen) setOpen(true);}, [initiallyOpen]);
  const close = () => {setOpen(false);onClose?.();requestAnimationFrame(() => opener.current?.focus());};
  if (!open) return label ? <button ref={opener} className={openerClass} disabled={disabled} onClick={() => setOpen(true)}>{label}</button> : null;
  async function submit(event) {
    event.preventDefault();if (busy) return;
    setBusy(true);setError(null);
    try {await onSubmit(values);setOpen(false);onClose?.();}
    catch (failure) {setError(failure);}
    finally {setBusy(false);}
  }
  const set = (name, value) => setValues(current => ({...current, [name]: value}));
  return <form className={`inline-form ${className}`} aria-label={submitLabel} onSubmit={submit} onKeyDown={event => {if (event.key === 'Escape') {event.stopPropagation();close();}}}>
    {title && <div className="form-title">{title}</div>}
    {note && <p className="form-note">{note}</p>}
    {fields.filter(f => !f.hidden?.(values)).map((f, i) => {
      const fieldId = `${id}-${f.name}`, ref = i === 0 ? first : undefined, value = values[f.name] ?? '';
      if (f.type === 'checkbox') return <label className="check" key={f.name}><input ref={ref} type="checkbox" checked={Boolean(values[f.name])} onChange={e => set(f.name, e.target.checked)}/>{f.label}</label>;
      const options = typeof f.options === 'function' ? f.options(values) : f.options || [];
      if (f.type === 'checks') return <fieldset key={f.name} className="checks"><legend>{f.label}</legend>{options.length ? options.map(o => <label className="check" key={o.value}><input type="checkbox" checked={(values[f.name] || []).includes(o.value)} onChange={e => set(f.name, e.target.checked ? [...(values[f.name] || []), o.value] : (values[f.name] || []).filter(v => v !== o.value))}/>{o.label}</label>) : <p className="tiny">{f.empty || 'None available.'}</p>}</fieldset>;
      return <div className="field" key={f.name}>
        <label htmlFor={fieldId}>{f.label}</label>
        {f.type === 'select' ? <select ref={ref} id={fieldId} value={value} required={f.required} onChange={e => {set(f.name, e.target.value);f.onChange?.(e.target.value, set);}}>{options.map(o => <option key={o.value} value={o.value} disabled={o.disabled}>{o.label}</option>)}</select>
          : f.type === 'textarea' || f.type === 'lines' ? <textarea ref={ref} id={fieldId} value={value} rows={f.rows || 4} required={f.required} placeholder={f.placeholder} onChange={e => set(f.name, e.target.value)}/>
          : <><input ref={ref} id={fieldId} value={value} required={f.required} placeholder={f.placeholder} autoComplete="off" spellCheck={f.spellCheck ?? true} list={f.suggestions?.length ? `${fieldId}-options` : undefined} onChange={e => set(f.name, e.target.value)}/>{f.suggestions?.length ? <datalist id={`${fieldId}-options`}>{f.suggestions.map(s => <option key={s} value={s}/>)}</datalist> : null}</>}
        {f.help && <small>{f.help}</small>}
      </div>;
    })}
    <OperationError error={error}/>
    <div className="form-actions"><button className="primary" disabled={busy} aria-busy={busy}>{submitLabel}</button><button type="button" onClick={close}>Cancel</button></div>
  </form>;
}
export const lines = text => String(text || '').split('\n').map(s => s.trim()).filter(Boolean);
// The status of the last applied operation, with Undo while the journal holds it.
export function OperationStatus({status, onUndo, onDismiss}) {
  return <div className={`status-line ${status?.error ? 'error' : ''}`} role="status" aria-live="polite" data-empty={status ? undefined : 'true'} style={status ? undefined : {display: 'none'}}>
    {status && <><span>{status.text}</span>{status.error && <span>{status.error}</span>}<span className="spacer"/>{status.operationId && <button className="quiet" onClick={onUndo}>Undo</button>}<button className="icon" aria-label="Dismiss status" onClick={onDismiss}>×</button></>}
  </div>;
}
