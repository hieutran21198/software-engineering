// What every page reads from the shell, and scoped queries that pages load
// themselves. A query reloads when the repository updates and keeps its last
// data while it reloads, so a refresh never blanks a page.
import {createContext, useContext, useEffect, useState} from 'react';
import {repositoryQuery} from './reload.js';

// {snapshot, worktree, root, worktreePath, epoch, go, back, canGoBack, editable, history}
export const ShellContext = createContext(null);
export const useShell = () => useContext(ShellContext);

// body: a repository query without path and worktree, or null to load nothing.
// Returns {status: 'idle'|'loading'|'loaded'|'error', data, error, partial, retry}.
export function useQuery(body, {enabled = true} = {}) {
  const shell = useShell(), key = body && enabled ? JSON.stringify(body) : null;
  const [state, setState] = useState({status: 'idle', data: null, error: null, partial: false, key: null});
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (!key || !shell?.root) {setState({status: 'idle', data: null, error: null, partial: false, key: null});return;}
    const controller = new AbortController();
    // A different query starts empty; the same query keeps its data while it reloads.
    setState(current => current.key === key ? {...current, status: 'loading'} : {status: 'loading', data: null, error: null, partial: false, key});
    repositoryQuery({...JSON.parse(key), path: shell.root, worktree: shell.worktreePath}, controller.signal).then(result => {
      if (controller.signal.aborted) return;
      const stale = result.diagnostics?.some(d => d.code === 'stale-response');
      if (stale) setState(current => ({...current, status: 'error', error: 'The repository changed while loading. Retry.', key}));
      else setState({status: 'loaded', data: result.data, error: null, partial: result.completeness === 'partial', key});
    }).catch(error => {if (!controller.signal.aborted && error.name !== 'AbortError') setState(current => ({...current, status: 'error', error: error.message, key}));});
    return () => controller.abort();
  }, [key, shell?.root, shell?.worktreePath, shell?.epoch, attempt]);
  return {...state, retry: () => setAttempt(n => n + 1)};
}

// One knowledge source as Markdown text. scope: {artifact, change} or {unit}.
export function useDocument(source, scope = null) {
  const artifact = scope?.artifact || source?.match(/^docs\/artifacts\/([^/]+)\//)?.[1];
  const body = source ? {section: 'markdown', source, ...(scope?.unit ? {unit: scope.unit} : {artifact, ...(scope?.change ? {change: scope.change} : {})})} : null;
  // A unit brief is read through its unit; other sources through their artifact.
  const result = useQuery(body && (scope?.unit || artifact !== 'units-of-work') ? body : null);
  return {...result, markdown: result.data?.markdown ?? '', ready: result.status === 'loaded' || Boolean(result.data)};
}
