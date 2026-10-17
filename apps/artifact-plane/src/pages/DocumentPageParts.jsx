import React, {useEffect, useMemo, useRef, useState} from 'react';
import {splitFront, OperationError} from '../editing.jsx';
import {compareLines} from '../line-comparison.js';

// A knowledge link opens its page: a flow opens the flow page, other sources
// open as document pages with the scope the link resolved.
export function linkPage(link, fallbackArtifact) {
  const artifact = link.scope?.artifact || fallbackArtifact;
  const flow = link.source.match(/^docs\/artifacts\/([^/]+)\/specifications\/flows\/([^/]+)\.md$/);
  if (flow) return {kind: 'flow', artifact: flow[1], flow: `${flow[1]}:${flow[2]}`};
  const scope = link.scope?.unit ? {unit: link.scope.unit} : link.scope?.change ? {artifact, change: link.scope.change} : null;
  return {kind: 'document', artifact, source: link.source, ...(scope ? {scope} : {})};
}

// Fenced code keeps its lines; everything else is read line by line.
function outsideFences(lines, visit) {
  let fence = null;
  lines.forEach((line, i) => {
    const marker = line.match(/^\s{0,3}(`{3,}|~{3,})/);
    if (marker) {fence = fence ? (marker[1][0] === fence[0] ? null : fence) : marker[1];return;}
    if (!fence) visit(line, i);
  });
}
// The body without front matter and without its first level-1 heading.
export function bodyWithoutTitle(markdown = '') {
  const lines = splitFront(markdown).body.split('\n');
  let index = -1;
  outsideFences(lines, (line, i) => {if (index < 0 && /^ {0,3}#[ \t]+\S/.test(line)) index = i;});
  if (index >= 0) lines.splice(index, 1);
  return lines.join('\n').replace(/^\s*\n/, '');
}
// The README purpose: the first paragraph as the lead and the headings of the rest.
export function purposeParts(markdown = '') {
  const blocks = bodyWithoutTitle(markdown).split(/\n\s*\n/).map(b => b.trim()).filter(Boolean);
  const index = blocks.findIndex(b => !/^#{1,6}\s/.test(b));
  const lead = index >= 0 ? blocks[index] : '';
  const headings = [];
  outsideFences(bodyWithoutTitle(markdown).split('\n'), line => {const h = line.match(/^#{2}\s+(.+?)\s*#*$/);if (h) headings.push(h[1]);});
  return {lead, headings};
}

// Media query state for layouts that move a part instead of hiding it.
export function useMedia(query) {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const list = window.matchMedia(query), update = () => setMatches(list.matches);
    update();list.addEventListener('change', update);
    return () => list.removeEventListener('change', update);
  }, [query]);
  return matches;
}

// A save that meets newer bytes on disk: the text on disk beside the editor
// text, then Reload (take the disk text) or Overwrite (save the editor text).
export function ConflictDialog({current, draft, onReload, onOverwrite, onClose, busy}) {
  const dialog = useRef(null);
  useEffect(() => {dialog.current?.querySelector('button')?.focus();}, []);
  const columns = useMemo(() => {
    const diff = compareLines(splitFront(current).body, draft);
    if (diff.state !== 'complete') return null;
    return {disk: diff.lines.filter(l => l.kind !== 'add'), mine: diff.lines.filter(l => l.kind !== 'remove')};
  }, [current, draft]);
  const keys = event => {
    if (event.key === 'Escape') {event.stopPropagation();onClose();return;}
    if (event.key !== 'Tab') return;
    const buttons = [...dialog.current.querySelectorAll('button')], first = buttons[0], last = buttons.at(-1);
    if (event.shiftKey && document.activeElement === first) {event.preventDefault();last.focus();}
    else if (!event.shiftKey && document.activeElement === last) {event.preventDefault();first.focus();}
  };
  const column = (label, lines, text) => <div className="conflict-column">
    <div className="conflict-label">{label}</div>
    <pre className="line-diff">{lines ? lines.map((line, i) => <span key={i} className={`diff-line ${line.kind}`}>{line.text.replace(/\n$/, '') || ' '}{'\n'}</span>) : text}</pre>
  </div>;
  return <div className="conflict-backdrop">
    <section className="conflict-dialog" role="alertdialog" aria-modal="true" aria-label="Save conflict" aria-describedby="conflict-text" ref={dialog} onKeyDown={keys}>
      <h2>The file changed on disk</h2>
      <p id="conflict-text" className="muted">Another edit changed this file after you opened it. Reload takes the text on disk. Overwrite saves your text over it.</p>
      <div className="form-actions"><button onClick={onReload} disabled={busy}>Reload</button><button className="primary" onClick={onOverwrite} disabled={busy} aria-busy={busy}>Overwrite</button></div>
      <div className="conflict-columns">
        {column('On disk', columns?.disk, splitFront(current).body)}
        {column('Your text', columns?.mine, draft)}
      </div>
    </section>
  </div>;
}

// The advanced editor for the YAML front matter of one document.
export function FrontMatterEditor({text, onSave}) {
  const [value, setValue] = useState(text), [busy, setBusy] = useState(false), [error, setError] = useState(null);
  return <div className="front-editor">
    <textarea className="code-editor" aria-label="Front matter" value={value} rows={10} spellCheck={false} onChange={e => setValue(e.target.value)}/>
    <OperationError error={error}/>
    <div className="form-actions"><button disabled={busy || value === text} aria-busy={busy} onClick={async () => {setBusy(true);setError(null);try {await onSave(value);} catch (failure) {setError(failure);} finally {setBusy(false);}}}>Save front matter</button></div>
  </div>;
}
