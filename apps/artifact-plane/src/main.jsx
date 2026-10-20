import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {createRoot} from 'react-dom/client';
import {createPortal} from 'react-dom';
import '@fontsource/ibm-plex-sans/400.css';
import '@fontsource/ibm-plex-sans/500.css';
import '@fontsource/ibm-plex-sans/600.css';
import '@fontsource/source-serif-4/400.css';
import '@fontsource/source-serif-4/600.css';
import '@fontsource/ibm-plex-mono/400.css';
import '@xyflow/react/dist/style.css';
import './styles.css';
import Workspace from './Workspace.jsx';
import Sidebar from './Sidebar.jsx';
import TopBar, {CreateBranchForm} from './TopBar.jsx';
import {refreshQueue, repositoryQuery, mergeChange} from './reload.js';
import {RuntimeProvider, useRuntime} from './Runtime.jsx';
import {usePageVisible} from './page-visible.js';
import {taskSelection} from './task-canvas.js';
import {gitAction, unavailable, knowledgeStatus, operate, protectedBranch} from './knowledge-api.js';
import {EditContext, OperationStatus} from './editing.jsx';
import {changeKey, currentChanges, isCurrent, samePage} from './work-model.js';
import {ShellContext} from './page-data.js';
import {PageHeader, TermScope} from './ui.jsx';
import WorkPage from './pages/WorkPage.jsx';
import ArtifactPage from './pages/ArtifactPage.jsx';
import DocumentPage from './pages/DocumentPage.jsx';
import ChangePage from './pages/ChangePage.jsx';
import UnitPage from './pages/UnitPage.jsx';
import FlowPage from './pages/FlowPage.jsx';
import DiscoverPage from './pages/DiscoverPage.jsx';
import RecordedPage from './pages/RecordedPage.jsx';
import SourcePage from './pages/SourcePage.jsx';
import ImpactPage from './pages/ImpactPage.jsx';
import ConceptPage from './pages/ConceptPage.jsx';

const HOME = {kind: 'work'};
const KEPT = ['query', 'brief'];
const PAGES = {work: WorkPage, artifact: ArtifactPage, document: DocumentPage, change: ChangePage, unit: UnitPage, flow: FlowPage, discover: DiscoverPage, recorded: RecordedPage, source: SourcePage, impact: ImpactPage, concept: ConceptPage};
const VERBS = {'artifact.create': 'Created artifact', 'artifact.dependencies.set': 'Set dependencies in', 'change.start': 'Started change in', 'document.add': 'Added', 'document.save': 'Saved', 'document.delete': 'Deleted', 'document.properties.set': 'Saved front matter of', undo: 'Undid the change to'};
const short = path => path.split('/').slice(-2).join('/');
const describe = (operation, response) => {const files = response.files || [];return `${VERBS[operation] || 'Updated'} ${files.length === 1 ? short(files[0].path) : `${files.length} files`}.`;};
const KIND = /^docs\/artifacts\/([^/]+)\/(requirements|specifications|decisions)\/(flows\/)?/;
const session = (key, fallback) => {try {const value = sessionStorage.getItem(key);return value === null ? fallback : JSON.parse(value);} catch {return fallback;}};
const remember = (key, value) => {try {sessionStorage.setItem(key, JSON.stringify(value));} catch {}};
// Browser history (specifications/concept-pages.md, Browser Back): one entry for each trail push.
// The Navigation API index tells a Forward press from a Back press; without it, every press counts as Back.
const entryIndex = () => window.navigation?.currentEntry?.index ?? null;
const shown = {index: entryIndex(), hash: location.hash};
const seen = () => {shown.index = entryIndex();shown.hash = location.hash;};
const pushEntry = () => {history.pushState({plane: true}, '');seen();};
const replaceEntry = () => {history.replaceState({plane: true}, '');seen();};
// A focus target is the opening control; after a remount, the control with the same tag, name and landmark.
const nameOf = node => node.getAttribute('aria-label') || node.textContent.trim();
const focusTarget = node => node && node !== document.body ? {node, tag: node.tagName, name: nameOf(node), main: Boolean(node.closest('main'))} : null;
function restoreFocus(target, tries = 20) {
  const usable = node => node?.isConnected && !node.closest('[hidden]');
  const node = usable(target.node) ? target.node : target.name && [...document.querySelectorAll(target.tag)].find(n => usable(n) && Boolean(n.closest('main')) === target.main && nameOf(n) === target.name);
  if (node) node.focus();else if (tries) requestAnimationFrame(() => restoreFocus(target, tries - 1));
}

function RecordedAvailable({children}) {
  const runtime = useRuntime();
  return children(runtime.status === 'loaded' && Boolean(runtime.data?.contexts?.length));
}

// One project: repository reads, the edit runner, the route, the sidebar and
// the page. Pages read the shell through ShellContext and load scoped data.
export function ProjectExplorer({active: isActive = true, initialPath = '', onOpened = () => {}, tabId = 'default', slot = null}) {
  const [path, setPath] = useState(initialPath), [snapshot, setSnapshot] = useState(null), [busy, setBusy] = useState(false), [error, setError] = useState('');
  const [editingRepo, setEditingRepo] = useState(false), [projectRoot, setProjectRoot] = useState(initialPath), [openingWorktree, setOpeningWorktree] = useState(null), [worktreePath, setWorktreePath] = useState(null);
  const [route, setRoute] = useState({page: HOME, trail: []}), page = route.page;
  const [expanded, setExpanded] = useState(() => new Set(session('plane-sidebar:' + initialPath, []))), [history, setHistory] = useState(() => session('plane-history:' + initialPath, false));
  const [drawerOpen, setDrawerOpen] = useState(false), [narrow, setNarrow] = useState(() => window.innerWidth <= 800), [sidebarWidth, setSidebarWidth] = useState(264);
  const [gitState, setGitState] = useState(null), [opStatus, setOpStatus] = useState(null), [unsaved, setUnsavedState] = useState(() => new Set());
  const [loadedSession, setLoadedSession] = useState(0), [overviewEpoch, setOverviewEpoch] = useState(0), [disconnected, setDisconnected] = useState(false);
  const workspaceRef = useRef(null), returnFocus = useRef([]), mainRef = useRef(null);
  // Event streams stay open only while this project is active and its browser tab is visible.
  const visible = usePageVisible(), observing = isActive && visible;
  useEffect(() => {const measure = () => setNarrow(window.innerWidth <= 800);window.addEventListener('resize', measure);return () => window.removeEventListener('resize', measure);}, []);
  useEffect(() => {if (projectRoot) remember('plane-sidebar:' + projectRoot, [...expanded]);}, [expanded, projectRoot]);
  useEffect(() => {if (projectRoot) remember('plane-history:' + projectRoot, history);}, [history, projectRoot]);
  // Escape closes the drawer wherever the focus is, also in the top bar.
  useEffect(() => {if (!drawerOpen) return;const close = event => {if (event.key === 'Escape') setDrawerOpen(false);};document.addEventListener('keydown', close);return () => document.removeEventListener('keydown', close);}, [drawerOpen]);
  const toggle = useCallback(key => setExpanded(current => {const next = new Set(current);next.has(key) ? next.delete(key) : next.add(key);return next;}), []);

  // Unsaved editor text asks for confirmation before another page opens.
  const routeRef = useRef(route);routeRef.current = route;
  const unsavedRef = useRef(unsaved);unsavedRef.current = unsaved;
  const leave = () => {if (!unsavedRef.current.size) return true;if (!window.confirm('Discard unsaved changes?')) return false;setUnsavedState(new Set());unsavedRef.current = new Set();return true;};
  const setUnsaved = useCallback((key, dirty) => setUnsavedState(current => {if (current.has(key) === dirty) return current;const next = new Set(current);dirty ? next.add(key) : next.delete(key);return next;}), []);
  useEffect(() => {if (!unsaved.size) return;const warn = event => {event.preventDefault();event.returnValue = '';};window.addEventListener('beforeunload', warn);return () => window.removeEventListener('beforeunload', warn);}, [unsaved.size]);
  // Opening a page reveals its sidebar row; Back restores the previous page and focus.
  const go = useCallback(next => {
    const current = routeRef.current;
    // The same page keeps its Discover query and open brief rows unless next names them, as the TopBar entry to an open Discover page.
    if (samePage(current.page, next)) next = {...Object.fromEntries(KEPT.filter(k => k in current.page).map(k => [k, current.page[k]])), ...next};
    const same = samePage(current.page, next) && JSON.stringify(current.page) === JSON.stringify(next);
    if (!same && !samePage(current.page, next) && !leave()) return;
    const reveal = [];
    if (next.artifact) reveal.push(`a:${next.artifact}`);
    const kind = next.source?.match(KIND);
    if (kind) reveal.push(`a:${kind[1]}`, `a:${kind[1]}:${kind[3] ? 'flows' : kind[2]}`);
    if (next.kind === 'flow' && next.artifact) reveal.push(`a:${next.artifact}:flows`);
    if (reveal.length) setExpanded(open => reveal.every(key => open.has(key)) ? open : new Set([...open, ...reveal]));
    setDrawerOpen(false);
    if (same) return;
    // A replacement in place keeps the trail, the focus list and the browser position.
    if (samePage(current.page, next)) {replaceEntry();const value = {...current, page: next};routeRef.current = value;setRoute(value);return;}
    returnFocus.current = [...returnFocus.current, focusTarget(document.activeElement)].slice(-50);
    const value = {page: next, trail: [...current.trail, current.page].slice(-50)};
    routeRef.current = value;setRoute(value);pushEntry();
    requestAnimationFrame(() => mainRef.current?.scrollTo?.({top: 0}));
  }, []);
  const back = useCallback(() => {
    const current = routeRef.current;if (!current.trail.length || !leave()) return false;
    const value = {page: current.trail.at(-1), trail: current.trail.slice(0, -1)};routeRef.current = value;setRoute(value);
    const target = returnFocus.current.pop();
    if (target) requestAnimationFrame(() => requestAnimationFrame(() => restoreFocus(target)));
    return true;
  }, []);
  // Browser Back moves only the active project tab, and only while its trail is not empty.
  // Forward and a move between fragments of one entry change no page; a refused leave() restores the position.
  useEffect(() => {
    if (!isActive) return;
    const pop = () => {
      const index = entryIndex(), forward = index !== null && shown.index !== null && index > shown.index, fragment = location.hash !== shown.hash;seen();
      if (forward || fragment || !routeRef.current.trail.length) return;
      if (!back()) pushEntry();
    };
    window.addEventListener('popstate', pop);window.addEventListener('hashchange', seen);
    return () => {window.removeEventListener('popstate', pop);window.removeEventListener('hashchange', seen);};
  }, [isActive, back]);
  const resetRoute = () => {const value = {page: HOME, trail: []};routeRef.current = value;setRoute(value);returnFocus.current = [];};

  // Repository reads: one queue per project, events from the observer, focus and online refresh.
  const snapshotRef = useRef(snapshot), overviewRef = useRef(null), queueRef = useRef(null), queueRoot = useRef(null), eventsRef = useRef(null), generation = useRef(0), reloadRef = useRef(null), worktreeRef = useRef(null);
  snapshotRef.current = snapshot;worktreeRef.current = worktreePath;
  function installOverview(base, refresh) {
    const previous = snapshotRef.current;
    // Keep loaded evidence of current work until its reload settles.
    if (refresh) for (const w of previous?.workflow?.worktrees || []) for (const c of w.changes) {
      const key = changeKey(w.path, c.artifact, c.name);
      if (c.loadState !== 'not-loaded' && isCurrent(c) && taskSelection(base.workflow, key)?.change.loadState === 'not-loaded') base = mergeChange(base, key, c);
    }
    overviewRef.current = base;setSnapshot(base);setOverviewEpoch(value => value + 1);
  }
  reloadRef.current = async (repositoryPath, refresh, signal, sessionId, targetWorktree = null, switching = false) => {
    setBusy(true);setError('');
    try {
      const target = targetWorktree || (refresh ? worktreeRef.current : null);
      const result = await repositoryQuery({path: repositoryPath, section: 'overview', ...(target ? {worktree: target} : {})}, signal);
      if (sessionId !== generation.current || signal.aborted) return;
      const base = result.data;
      setProjectRoot(result.repository.path);if (!refresh && !switching) setEditingRepo(false);if (!switching) onOpened(result.repository.path);
      installOverview(base, refresh);setLoadedSession(sessionId);queueRoot.current = result.repository.path;setPath(result.repository.path);
      setWorktreePath(base.repository.path);
      if (result.diagnostics.some(d => d.code === 'stale-response')) setError('The repository changed while loading. Refresh to read it again.');
      if (!refresh) {
        resetRoute();
        if (!switching) {setExpanded(new Set(session('plane-sidebar:' + result.repository.path, [])));setHistory(session('plane-history:' + result.repository.path, false));}
      }
    } catch (failure) {if (sessionId === generation.current && failure.name !== 'AbortError') setError(failure.message);}
    finally {if (sessionId === generation.current) {setBusy(false);setOpeningWorktree(null);}}
  };
  function open(repositoryPath, refresh = false, targetWorktree = null, switching = false) {
    if (refresh && queueRef.current && queueRoot.current === repositoryPath) return queueRef.current.request();
    queueRef.current?.close();eventsRef.current?.close();const sessionId = ++generation.current;setDisconnected(false);
    queueRoot.current = repositoryPath;let first = !refresh;
    const queue = refreshQueue(signal => {const initial = first;first = false;return reloadRef.current(repositoryPath, !initial, signal, sessionId, initial ? targetWorktree : null, initial && switching);});
    queueRef.current = queue;return queue.request();
  }
  useEffect(() => {
    if (isActive) {const root = queueRoot.current || initialPath;if (root) open(root, Boolean(snapshotRef.current));}
    else {generation.current++;queueRef.current?.close();queueRef.current = null;eventsRef.current?.close();setBusy(false);}
  }, [isActive]);
  useEffect(() => {if (isActive && !visible) setDisconnected(true);}, [isActive, visible]);
  useEffect(() => {
    const root = projectRoot;if (!observing || !root || !snapshot) return;const sessionId = generation.current;
    const refresh = () => {if (sessionId === generation.current) queueRef.current?.request();};
    const connect = () => {
      eventsRef.current?.close();const source = new EventSource('/api/repository/events?path=' + encodeURIComponent(root));eventsRef.current = source;
      source.onmessage = event => {if (sessionId !== generation.current || eventsRef.current !== source) return;try {const value = JSON.parse(event.data);setDisconnected(!value.available);if (value.available) refresh();} catch {setDisconnected(true);}};
      source.onerror = () => {if (sessionId === generation.current && source.readyState === EventSource.CLOSED) setDisconnected(true);};
    };
    const offline = () => {eventsRef.current?.close();setDisconnected(true);};const online = () => {connect();refresh();};
    if (navigator.onLine) connect();window.addEventListener('focus', refresh);window.addEventListener('online', online);window.addEventListener('offline', offline);
    return () => {eventsRef.current?.close();window.removeEventListener('focus', refresh);window.removeEventListener('online', online);window.removeEventListener('offline', offline);};
  }, [observing, projectRoot, snapshot?.repository.path, loadedSession]);
  useEffect(() => () => {generation.current++;queueRef.current?.close();eventsRef.current?.close();}, []);
  function activateWorktree(target) {
    if (target === worktreePath && !openingWorktree || !leave()) return;
    const entry = snapshot?.workflow.worktrees.find(w => w.path === target);
    if (entry?.availability !== 'readable') {setError(entry?.diagnostics.map(d => d.message).join(' ') || 'This worktree is unavailable.');return;}
    setOpeningWorktree(target);open(projectRoot, false, target, true);
  }
  // Declared evidence of open in-place changes gives the phases of the sidebar and work page.
  // Legacy evidence replays history, so it loads only on its change page.
  useEffect(() => {
    const root = projectRoot, base = overviewRef.current, worktree = base?.workflow?.worktrees.find(w => w.path === base.repository.path);
    if (!isActive || !root || !worktree) return;
    const controller = new AbortController(), sessionId = generation.current;
    const patch = update => {overviewRef.current = update(overviewRef.current);setSnapshot(current => current && update(current));};
    (async () => {
      for (const c of currentChanges(worktree).filter(c => c.layout === 'in-place')) {
        if (controller.signal.aborted) return;
        try {
          const key = changeKey(worktree.path, c.artifact, c.name), result = await repositoryQuery({path: root, worktree: worktree.path, artifact: c.artifact, change: c.name, section: 'workflow'}, controller.signal);
          if (controller.signal.aborted || sessionId !== generation.current) return;
          if (!result.diagnostics.some(d => d.code === 'stale-response')) patch(current => taskSelection(current.workflow, key) ? mergeChange(current, key, result.data) : current);
        } catch (failure) {if (failure.name === 'AbortError') return;}
      }
    })();
    return () => controller.abort();
  }, [isActive, overviewEpoch, loadedSession]);
  // History lists delivered changes newest first; their commit times load when History is on.
  useEffect(() => {
    const root = projectRoot, worktree = overviewRef.current?.workflow?.worktrees.find(w => w.path === overviewRef.current.repository.path);
    if (!isActive || !history || !root || !worktree) return;
    const controller = new AbortController(), sessionId = generation.current;
    (async () => {
      for (const c of worktree.changes.filter(c => c.history && c.loadState === 'not-loaded' && !c.lastCommitAt)) {
        if (controller.signal.aborted) return;
        try {
          const result = await repositoryQuery({path: root, worktree: worktree.path, artifact: c.artifact, change: c.name, section: 'history'}, controller.signal);
          if (controller.signal.aborted || sessionId !== generation.current) return;
          const patch = current => ({...current, workflow: {...current.workflow, worktrees: current.workflow.worktrees.map(w => w.path === worktree.path ? {...w, changes: w.changes.map(x => x.artifact === c.artifact && x.name === c.name ? {...x, lastCommitAt: result.data.lastCommitAt, historyReason: result.data.historyReason} : x)} : w)}});
          overviewRef.current = patch(overviewRef.current);setSnapshot(current => current && patch(current));
        } catch (failure) {if (failure.name === 'AbortError') return;}
      }
    })();
    return () => controller.abort();
  }, [isActive, history, overviewEpoch]);
  // Git status for the uncommitted count; a server without the Git route keeps the porcelain count.
  useEffect(() => {
    if (!isActive || !projectRoot || !worktreePath) return;
    const controller = new AbortController();
    gitAction({path: projectRoot, worktree: worktreePath, operation: 'status'}, controller.signal).then(result => {
      setGitState(Array.isArray(result.status?.knowledge) ? result.status : null);
    }).catch(failure => {if (failure.name !== 'AbortError') setGitState(null);});
    return () => controller.abort();
  }, [isActive, projectRoot, worktreePath, overviewEpoch]);

  // Every write goes through one runner: apply, announce with Undo, then refresh.
  const target = {path: projectRoot, worktree: worktreePath};
  async function run(operation, input, {expected, label} = {}) {
    const response = await operate(target, operation, input, {expected});
    setOpStatus({text: label || describe(operation, response), operationId: response.operationId || null});
    if (Array.isArray(response.status?.knowledge)) setGitState(response.status);
    await open(projectRoot, true);
    return response;
  }
  async function undo() {
    const operationId = opStatus?.operationId;if (!operationId) return;
    try {const response = await operate(target, 'undo', {operationId});setOpStatus({text: describe('undo', response), operationId: null});open(projectRoot, true);}
    catch (failure) {setOpStatus({text: 'Undo is not possible.', error: failure.message, operationId: null});}
  }
  async function runGit(operation, input) {
    const response = await gitAction({...target, operation, input});
    if (Array.isArray(response.status?.knowledge)) setGitState(response.status);
    if (operation === 'commit') setOpStatus({text: `Committed ${response.result?.paths?.length || 0} knowledge files as ${String(response.result?.commit || '').slice(0, 8)}.`, operationId: null});
    if (operation === 'discard') setOpStatus({text: `Discarded changes to ${short(input.path)}.`, operationId: null});
    await open(projectRoot, true);
    return response;
  }
  async function createBranch(name) {
    try {await gitAction({path: projectRoot, worktree: worktreePath, operation: 'branch.create', input: {name}});}
    catch (failure) {throw unavailable(failure) ? Error('This server cannot create branches yet. Run git switch -c in a terminal, then refresh.') : failure;}
    setOpStatus({text: `Created and switched to branch ${name}.`, operationId: null});
    await open(projectRoot, true);
  }
  const editable = Boolean(snapshot) && !protectedBranch(snapshot.repository.branch);
  const editing = {editable, run, git: runGit, setUnsaved, status: gitState, root: projectRoot, worktree: worktreePath, createBranch};
  const worktree = snapshot?.workflow?.worktrees.find(w => w.path === worktreePath);
  const shell = useMemo(() => ({snapshot, worktree, root: projectRoot, worktreePath, epoch: overviewEpoch, session: loadedSession, go, back, canGoBack: route.trail.length > 0, editable, busy, CreateBranchForm}),
    [snapshot, worktree, projectRoot, worktreePath, overviewEpoch, loadedSession, go, back, route.trail.length, editable, busy]);
  const uncommitted = gitState ? gitState.knowledge.length : knowledgeStatus(snapshot?.repository.status);
  const Page = PAGES[page.kind] || WorkPage;
  const pageKey = JSON.stringify([worktreePath, page.kind, page.artifact, page.change, page.unit, page.source, page.flow, page.context, page.sourceId, page.model]);
  const showOpen = !snapshot || editingRepo;
  const sidebarMax = 400, resize = width => setSidebarWidth(Math.max(200, Math.min(sidebarMax, Math.round(width))));
  function dividerKeys(event) {const widths = {ArrowRight: sidebarWidth + 20, ArrowLeft: sidebarWidth - 20, Home: 200, End: sidebarMax};if (Object.hasOwn(widths, event.key)) {event.preventDefault();resize(widths[event.key]);}}
  const drawerId = `navigation-${tabId}`;

  return <EditContext.Provider value={editing}><ShellContext.Provider value={shell}><RuntimeProvider snapshot={snapshot} active={observing}>
    {isActive && slot && snapshot && !editingRepo && createPortal(<RecordedAvailable>{recorded => <TopBar snapshot={snapshot} worktreePath={worktreePath} onWorktree={activateWorktree} opening={openingWorktree} busy={busy}
      stale={disconnected || Boolean(error)} uncommitted={uncommitted} onUncommitted={() => go({kind: 'work', focus: 'uncommitted', at: Date.now()})} onRefresh={() => open(projectRoot, true)}
      onCreateBranch={createBranch} drawer={{open: drawerOpen, id: drawerId, toggle: () => setDrawerOpen(value => !value)}} recorded={recorded} onOpen={go}
      onChangeRepository={() => {if (leave()) setEditingRepo(true);}}/>}</RecordedAvailable>, slot)}
    <div className="explorer">
      {error && <div role="alert" className="alert-line">{error}</div>}
      <div className="workspace" ref={workspaceRef} style={{'--sidebar-width': sidebarWidth + 'px'}}>
        {snapshot && !showOpen && (!narrow || drawerOpen) && <>
          {narrow && <button className="drawer-backdrop unstyled" aria-label="Close navigation" onClick={() => setDrawerOpen(false)}/>}
          <Sidebar id={drawerId} snapshot={snapshot} worktree={worktree} page={page} expanded={expanded} onToggle={toggle} onOpen={go} history={history} onHistory={setHistory}/>
          {!narrow && <div className="sidebar-divider" role="separator" aria-label="Resize navigation" aria-orientation="vertical" aria-valuemin={200} aria-valuemax={sidebarMax} aria-valuenow={sidebarWidth} aria-controls={drawerId} tabIndex={0}
            onKeyDown={dividerKeys} onPointerDown={event => {if (event.button !== 0) return;event.preventDefault();event.currentTarget.focus();event.currentTarget.setPointerCapture(event.pointerId);}}
            onPointerMove={event => {if (event.currentTarget.hasPointerCapture(event.pointerId)) resize(event.clientX - workspaceRef.current.getBoundingClientRect().left);}}
            onPointerUp={event => {if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);}}/>}
        </>}
        <main className="page-area" ref={mainRef}>
          {snapshot && !showOpen && <OperationStatus status={opStatus} onUndo={undo} onDismiss={() => setOpStatus(null)}/>}
          {showOpen ? <section className="open-page" aria-label="Open repository">
            <form className="open-card" onSubmit={event => {event.preventDefault();open(path);}}>
              <PageHeader title={snapshot ? 'Change repository' : 'Open an ADD repository'} subtitle="Artifact Plane reads the knowledge in docs/artifacts and helps you write and change it."/>
              <div className="open-form">
                <div className="field"><label htmlFor={`repository-path-${tabId}`}>Repository path</label>
                  <input id={`repository-path-${tabId}`} placeholder="/absolute/path/to/add-repository" value={path} onChange={event => setPath(event.target.value)} required autoComplete="off" spellCheck={false}/></div>
                <button className="primary" aria-busy={busy}>Open repository</button>
                {snapshot && <button type="button" onClick={() => {setPath(projectRoot);setEditingRepo(false);}}>Cancel</button>}
              </div>
              {busy && <p className="muted" role="status">Reading repository…</p>}
            </form>
          </section> : <TermScope key={pageKey}><Page page={page}/></TermScope>}
        </main>
      </div>
    </div>
  </RuntimeProvider></ShellContext.Provider></EditContext.Provider>;
}
createRoot(document.getElementById('root')).render(<Workspace Explorer={ProjectExplorer}/>);
