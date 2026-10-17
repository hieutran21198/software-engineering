import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {createRoot} from 'react-dom/client';
import {panelLayout} from './panel-layout.js';
import Workspace from './Workspace.jsx';
import {unitContext, unitNode} from './unit-canvas.js';
import {refreshQueue, repositoryQuery, mergeUnit, mergeChange} from './reload.js';
import {knowledgeTargets} from './knowledge-navigation.js';
import {RuntimeProvider} from './Runtime.jsx';
import {RecordedView, RecordedDetails} from './RecordedExecutions.jsx';
import {taskSelection} from './task-canvas.js';
import {typeKey, historyKey} from './elements.js';
import {gitAction, unavailable, knowledgeStatus} from './knowledge-api.js';
import {changeKey, unitKeyFor, currentChanges, samePage} from './work-model.js';
import NavigationTree from './NavigationTree.jsx';
import {SourceBar, ProtectedBanner} from './SourceBar.jsx';
import WorkPage from './pages/WorkPage.jsx';
import GraphPage from './pages/GraphPage.jsx';
import ArtifactPage from './pages/ArtifactPage.jsx';
import DocumentPage from './pages/DocumentPage.jsx';
import ChangePage from './pages/ChangePage.jsx';
import UnitPage from './pages/UnitPage.jsx';
import FlowPage from './pages/FlowPage.jsx';
import '@xyflow/react/dist/style.css';
import './style.css';
import './workbench.css';

const HOME = {kind: 'work'};
// The overview reads every in-place change record, so its open-or-retained
// decision is kept when scoped evidence for one change is merged.
const withOverview = (snapshot, key, change) => {const known = taskSelection(snapshot?.workflow, key)?.change;return known?.layout === 'in-place' ? {...change, history: known.history, declaredActive: known.declaredActive, historyReason: known.history ? change.historyReason || known.historyReason : ''} : change;};
const KIND = /^docs\/artifacts\/([^/]+)\/(requirements|specifications|decisions)\/(flows\/)?/;
const pageName = page => ({work: 'work', graph: 'graph', artifact: 'artifact', document: 'document', change: 'change', unit: 'unit', flow: 'flow', recorded: 'executions'})[page?.kind];
const readTree = root => {try {return new Set(JSON.parse(sessionStorage.getItem('plane-tree:' + root)) || ['g:work', 'g:artifacts', 'g:units']);} catch {return new Set(['g:work', 'g:artifacts', 'g:units']);}};
// The shell owns repository reads, the source bar, the navigation tree and a
// page router keyed by project and worktree. Pages present one subject each.
export function ProjectExplorer({active: isActive = true, initialPath = '', onOpened = () => {}, tabId = 'default'}) {
  const [path, setPath] = useState(initialPath), [snapshot, setSnapshot] = useState(null), [busy, setBusy] = useState(false), [error, setError] = useState('');
  const [editingRepo, setEditingRepo] = useState(false), [projectRoot, setProjectRoot] = useState(initialPath), [openingWorktree, setOpeningWorktree] = useState(null), [worktreePath, setWorktreePath] = useState(null);
  const [route, setRoute] = useState({page: HOME, trail: []}), page = route.page;
  const [treeOpen, setTreeOpen] = useState(() => readTree(initialPath)), [drawerOpen, setDrawerOpen] = useState(false);
  const [expanded, setExpanded] = useState(new Set()), [expandedTypes, setExpandedTypes] = useState(new Set()), [listTypes, setListTypes] = useState(new Set()), [selection, setSelection] = useState(null), [planning, setPlanning] = useState(false);
  const [unitView, setUnitView] = useState('artifacts'), [unitPlanning, setUnitPlanning] = useState(false), [unitNodeSelected, setUnitNodeSelected] = useState(null);
  const [deliveryPhase, setDeliveryPhase] = useState(null), [taskSelected, setTaskSelected] = useState(null), [recordedNode, setRecordedNode] = useState(null);
  const [flowKnowledge, setFlowKnowledge] = useState('established'), [gitState, setGitState] = useState(null);
  const chooseKnowledge = value => {setFlowKnowledge(value);if (value !== 'all') setPlanning(value === 'planning');};
  const workspaceRef = useRef(null), returnFocus = useRef([]);
  const [panelPreference, setPanelWidth] = useState(340), [sidebarPreference, setSidebarPreference] = useState(null), [workspaceWidth, setWorkspaceWidth] = useState(window.innerWidth);
  useEffect(() => {
    const workspace = workspaceRef.current, measure = () => setWorkspaceWidth(workspace.getBoundingClientRect().width);
    const observer = new ResizeObserver(measure);observer.observe(workspace);measure();return () => observer.disconnect();
  }, []);
  const toggleList = key => setListTypes(current => {const next = new Set(current);next.has(key) ? next.delete(key) : next.add(key);return next;});
  const toggleTree = key => setTreeOpen(current => {const next = new Set(current);next.has(key) ? next.delete(key) : next.add(key);return next;});
  useEffect(() => {if (projectRoot) try {sessionStorage.setItem('plane-tree:' + projectRoot, JSON.stringify([...treeOpen]));} catch {}}, [treeOpen, projectRoot]);
  // Opening a page reveals its tree row; Back restores the previous page and focus.
  const routeRef = useRef(route);routeRef.current = route;
  const go = next => {
    const current = routeRef.current, reveal = [];
    if (next.artifact && next.kind !== 'change') reveal.push(`a:${next.artifact}`);
    const kind = next.source?.match(KIND);
    if (kind) reveal.push(`a:${kind[1]}:${kind[3] ? 'flows' : kind[2]}`);
    if (next.kind === 'flow' && next.artifact) reveal.push(`a:${next.artifact}:flows`);
    if (reveal.length) setTreeOpen(open => reveal.every(key => open.has(key)) ? open : new Set([...open, ...reveal]));
    setDrawerOpen(false);
    if (samePage(current.page, next) && current.page.tab === next.tab) return;
    returnFocus.current = [...returnFocus.current, document.activeElement].slice(-50);
    const value = {page: next, trail: [...current.trail, current.page].slice(-50)};
    routeRef.current = value;setRoute(value);
  };
  const back = () => {
    const current = routeRef.current;if (!current.trail.length) return;
    const value = {page: current.trail.at(-1), trail: current.trail.slice(0, -1)};routeRef.current = value;setRoute(value);
    const target = returnFocus.current.pop();
    requestAnimationFrame(() => requestAnimationFrame(() => {
      const identity = target?.dataset?.readerReturn, replacement = identity ? workspaceRef.current?.querySelector(`[data-reader-return="${CSS.escape(identity)}"]`) : null;
      const element = target?.isConnected ? target : replacement;
      if (element?.isConnected && !element.closest('[hidden]')) element.focus();
    }));
  };
  const replacePage = next => {const value = {...routeRef.current, page: next};routeRef.current = value;setRoute(value);};
  const lastFlow = useRef(null);
  const resetRoute = () => {lastFlow.current = null;const value = {page: HOME, trail: []};routeRef.current = value;setRoute(value);returnFocus.current = [];};
  const resizeSidebar = width => setSidebarPreference(Math.max(180, Math.min(sidebarMax, width)));
  function dragSidebar(event) {if (event.currentTarget.hasPointerCapture(event.pointerId)) resizeSidebar(event.clientX - workspaceRef.current.getBoundingClientRect().left);}
  function sidebarKeyboard(event) {const widths = {ArrowRight: sidebarWidth + 20, ArrowLeft: sidebarWidth - 20, Home: 180, End: sidebarMax};if (Object.hasOwn(widths, event.key)) {event.preventDefault();resizeSidebar(widths[event.key]);}}
  const resizePanel = width => setPanelWidth(Math.max(240, Math.min(panelMax, width)));
  const snapshotRef = useRef(snapshot), overviewRef = useRef(null), queueRef = useRef(null), queueRoot = useRef(null), eventsRef = useRef(null), generation = useRef(0), reloadRef = useRef(null);
  snapshotRef.current = snapshot;
  const [loadedSession, setLoadedSession] = useState(0), [overviewEpoch, setOverviewEpoch] = useState(0), [sectionState, setSectionState] = useState('Not loaded'), [connected, setConnected] = useState(false), [fresh, setFresh] = useState(false), [document_, setDocument] = useState(null), [completionState, setCompletionState] = useState('idle'), [completionError, setCompletionError] = useState(''), [sectionRetry, setSectionRetry] = useState(0);
  const unitSelected = page.kind === 'unit' && worktreePath ? unitKeyFor(worktreePath, page.unit) : null;
  const changeSelected = page.kind === 'change' && worktreePath ? changeKey(worktreePath, page.artifact, page.change) : null;
  const changeTab = page.tab || 'overview';
  const active = useRef(null);active.current = {overviewEpoch, unitSelected, unitView, unitPlanning, worktreePath, page, selection, changeSelected, taskSelected, unitNodeSelected};
  const completionController = useRef(null);
  function installOverview(base, refresh) {
    const current = active.current, previous = snapshotRef.current;
    overviewRef.current = base;
    let next = base;
    if (refresh && current.unitSelected) {const old = unitContext(previous, current.unitSelected);if (old && unitContext(base, current.unitSelected)) next = mergeUnit(base, current.unitSelected, old.unit);else setUnitNodeSelected(null);}
    if (refresh && current.changeSelected) {const old = taskSelection(previous?.workflow, current.changeSelected);if (old && taskSelection(base.workflow, current.changeSelected)) next = mergeChange(next, current.changeSelected, old.change);else {setTaskSelected(null);setDeliveryPhase(null);}}
    // Keep loaded evidence of current work visible until its reload settles.
    if (refresh) for (const w of previous?.workflow?.worktrees || []) for (const c of w.changes) {
      const key = changeKey(w.path, c.artifact, c.name);
      if (c.loadState !== 'not-loaded' && !c.history && key !== current.changeSelected && taskSelection(next.workflow, key)?.change.loadState === 'not-loaded') next = mergeChange(next, key, c);
    }
    if (refresh && current.selection && !base.artifacts.some(a => a.id === current.selection.artifact && (!current.selection.element || a.elements.some(e => e.id === current.selection.element)))) setSelection(null);
    setSnapshot(next);setOverviewEpoch(value => value + 1);
  }
  reloadRef.current = async (repositoryPath, refresh, signal, session, targetWorktree = null, switching = false) => {
    setBusy(true);setFresh(false);setError('');
    try {
      const target = targetWorktree || (refresh ? active.current.worktreePath : null);
      const result = await repositoryQuery({path: repositoryPath, section: 'overview', ...(target ? {worktree: target} : {})}, signal);
      if (session !== generation.current || signal.aborted) return;
      const base = result.data;
      setProjectRoot(result.repository.path);if (!refresh && !switching) setEditingRepo(false);if (!switching) onOpened(result.repository.path);
      installOverview(base, refresh);setLoadedSession(session);queueRoot.current = result.repository.path;setPath(result.repository.path);setFresh(!result.diagnostics.some(d => d.code === 'stale-response'));
      setWorktreePath(base.repository.path);
      if (!refresh) {
        resetRoute();setListTypes(new Set());setRecordedNode(null);setUnitNodeSelected(null);setUnitView('artifacts');setUnitPlanning(false);setTaskSelected(null);setDeliveryPhase(null);setExpanded(new Set());setExpandedTypes(new Set());setSelection(null);
        if (!switching) {setPlanning(false);setFlowKnowledge('established');setTreeOpen(readTree(result.repository.path));}
        setCompletionState('idle');setDocument(null);
      }
    } catch (error) {if (session === generation.current && error.name !== 'AbortError') {setError(error.message);setFresh(false);}}
    finally {if (session === generation.current) {setBusy(false);setOpeningWorktree(null);}}
  };
  function open(repositoryPath, refresh = false, targetWorktree = null, switching = false) {
    if (refresh && queueRef.current && queueRoot.current === repositoryPath) return queueRef.current.request();
    queueRef.current?.close();eventsRef.current?.close();completionController.current?.abort();const session = ++generation.current;setConnected(false);
    queueRoot.current = repositoryPath;let first = !refresh;const queue = refreshQueue(signal => {const initial = first;first = false;return reloadRef.current(repositoryPath, !initial, signal, session, initial ? targetWorktree : null, initial && switching);});queueRef.current = queue;return queue.request();
  }
  useEffect(() => {
    if (isActive) {const root = queueRoot.current || initialPath;if (root) open(root, Boolean(snapshotRef.current));}
    else {generation.current++;queueRef.current?.close();queueRef.current = null;eventsRef.current?.close();completionController.current?.abort();setConnected(false);setFresh(false);setBusy(false);}
  }, [isActive]);
  useEffect(() => {
    const root = projectRoot;if (!isActive || !root || !snapshot) return;const session = generation.current;
    const refresh = () => {if (session === generation.current) queueRef.current?.request();};
    const connect = () => {eventsRef.current?.close();const source = new EventSource('/api/repository/events?path=' + encodeURIComponent(root));eventsRef.current = source;
      source.onmessage = event => {if (session !== generation.current || eventsRef.current !== source) return;try {const value = JSON.parse(event.data);setConnected(Boolean(value.available));setFresh(false);if (value.available) refresh();} catch {setConnected(false);setFresh(false);}};
      source.onerror = () => {if (session === generation.current) {setConnected(false);setFresh(false);}};
    };
    const offline = () => {eventsRef.current?.close();setConnected(false);setFresh(false);};const online = () => {connect();refresh();};
    if (navigator.onLine) connect();window.addEventListener('focus', refresh);window.addEventListener('online', online);window.addEventListener('offline', offline);
    return () => {eventsRef.current?.close();window.removeEventListener('focus', refresh);window.removeEventListener('online', online);window.removeEventListener('offline', offline);};
  }, [isActive, projectRoot, snapshot?.repository.path, loadedSession]);
  useEffect(() => () => {generation.current++;queueRef.current?.close();eventsRef.current?.close();completionController.current?.abort();}, []);
  function activateWorktree(target) {
    if (target === worktreePath && !openingWorktree) return;
    const entry = snapshot?.workflow.worktrees.find(w => w.path === target);
    if (entry?.availability !== 'readable') {setError(entry?.diagnostics.map(d => d.message).join(' ') || 'This worktree is unavailable.');return;}
    setOpeningWorktree(target);open(projectRoot, false, target, true);
  }
  // Scoped evidence for the visible unit or change page.
  useEffect(() => {
    const root = projectRoot, base = overviewRef.current;if (!isActive || !root || !base) return;
    const controller = new AbortController(), session = generation.current;let key, body;
    if (unitSelected) {const [worktree, unit] = JSON.parse(unitSelected);if (!unitContext(base, unitSelected)) {setSectionState('Not loaded');return;}key = unitSelected;body = {path: root, worktree, unit, section: unitView, ...(unitView === 'artifacts' ? {dependencyMode: unitPlanning ? 'planning' : 'established'} : {})};}
    else if (changeSelected && changeTab !== 'review' && taskSelection(base.workflow, changeSelected)) {key = changeSelected;const [worktree, artifact, change] = JSON.parse(key);body = {path: root, worktree, artifact, change, section: 'workflow'};}
    else {setSectionState('Not loaded');setSnapshot(current => current ? overviewRef.current : current);return;}
    setSectionState('Loading');
    repositoryQuery(body, controller.signal).then(result => {
      if (session !== generation.current || controller.signal.aborted) return;
      if (result.diagnostics.some(d => d.code === 'stale-response')) {setSectionState('Stale');setFresh(false);setError(result.diagnostics.filter(d => d.code === 'stale-response').map(d => d.message).join(' '));return;}
      let unitData = result.data;const existing = body.unit ? unitContext(snapshotRef.current, key)?.unit : null;if (existing?.completionEpoch === overviewEpoch) unitData = {...unitData, completion: existing.completion, evidence: existing.evidence, completionEpoch: existing.completionEpoch};
      const next = body.unit ? mergeUnit(overviewRef.current, key, unitData) : mergeChange(overviewRef.current, key, withOverview(overviewRef.current, key, result.data));
      setSnapshot(next);setSectionState(result.completeness === 'partial' ? 'Loaded with diagnostics' : 'Loaded');
      if (body.unit) {if (active.current.unitNodeSelected && !unitNode(unitContext(next, key), unitView, unitPlanning, active.current.unitNodeSelected)) setUnitNodeSelected(null);}
      else if (active.current.taskSelected && !taskSelection(next.workflow, key, active.current.taskSelected)?.task) setTaskSelected(null);
    }).catch(error => {if (error.name !== 'AbortError' && session === generation.current) {setSectionState('Error');setFresh(false);setError(error.message);}});
    return () => controller.abort();
  }, [isActive, snapshot?.repository.path, overviewEpoch, unitSelected, unitView, unitPlanning, changeSelected, changeTab, sectionRetry]);
  // Declared evidence of open in-place changes feeds the phase chips of the tree
  // and work page. Legacy evidence replays history, so it loads only on its page.
  useEffect(() => {
    const root = projectRoot, base = overviewRef.current, worktree = base?.workflow?.worktrees.find(w => w.path === base.repository.path);
    if (!isActive || !root || !worktree) return;
    const controller = new AbortController(), session = generation.current;
    const patch = update => {overviewRef.current = update(overviewRef.current);setSnapshot(current => current && update(current));};
    (async () => {
      for (const c of currentChanges(worktree).filter(c => c.layout === 'in-place')) {
        if (controller.signal.aborted) return;
        try {
          const key = changeKey(worktree.path, c.artifact, c.name), result = await repositoryQuery({path: root, worktree: worktree.path, artifact: c.artifact, change: c.name, section: 'workflow'}, controller.signal);
          if (controller.signal.aborted || session !== generation.current) return;
          if (!result.diagnostics.some(d => d.code === 'stale-response')) patch(current => taskSelection(current.workflow, key) ? mergeChange(current, key, withOverview(current, key, result.data)) : current);
        } catch (error) {if (error.name === 'AbortError') return;}
      }
    })();
    return () => controller.abort();
  }, [isActive, overviewEpoch, loadedSession]);
  // Git status for the edit state; a server without the Git route keeps the porcelain count.
  useEffect(() => {
    if (!isActive || !projectRoot || !worktreePath) return;
    const controller = new AbortController();
    gitAction({path: projectRoot, worktree: worktreePath, operation: 'status'}, controller.signal).then(result => {
      const status = result.status && typeof result.status === 'object' ? result.status : result, list = status.knowledge || status.dirty || status.paths;
      setGitState(Array.isArray(list) ? {count: list.length} : null);
    }).catch(error => {if (error.name !== 'AbortError') setGitState(null);});
    return () => controller.abort();
  }, [isActive, projectRoot, worktreePath, overviewEpoch]);
  async function loadCompletion() {
    const key = active.current.unitSelected, root = projectRoot;if (!key || !root) return;
    completionController.current?.abort();const controller = new AbortController();completionController.current = controller;const session = generation.current, epoch = overviewEpoch, [worktree, unit] = JSON.parse(key);setCompletionState('loading');setCompletionError('');
    try {
      const result = await repositoryQuery({path: root, worktree, unit, section: 'completion'}, controller.signal);if (session !== generation.current || active.current.unitSelected !== key || active.current.overviewEpoch !== epoch || controller.signal.aborted) return;
      setSnapshot(current => {const existing = unitContext(current, key);if (!existing) return current;return mergeUnit(current, key, {...existing.unit, completion: result.data.completion, completionEpoch: overviewEpoch, evidence: result.data.evidence, diagnostics: result.data.diagnostics, members: existing.unit.members.map(m => ({...m, establishmentEvidence: result.data.members.find(n => n.artifact === m.artifact)?.establishmentEvidence || m.establishmentEvidence}))});});
      setCompletionState('loaded');
    } catch (error) {if (error.name !== 'AbortError' && !controller.signal.aborted && session === generation.current && active.current.unitSelected === key && active.current.overviewEpoch === epoch) {setCompletionState('error');setCompletionError(error.message);}}
  }
  useEffect(() => {
    completionController.current?.abort();setCompletionState('idle');setCompletionError('');
    if (isActive && unitSelected) loadCompletion();
    return () => completionController.current?.abort();
  }, [isActive, unitSelected, overviewEpoch, loadedSession]);
  // Page state survives other pages; it resets when another unit or change opens.
  const lastUnit = useRef(null), lastChange = useRef(null);
  useEffect(() => {if (unitSelected && lastUnit.current !== unitSelected) {if (lastUnit.current) {setUnitNodeSelected(null);setUnitView('artifacts');}lastUnit.current = unitSelected;}}, [unitSelected]);
  useEffect(() => {if (changeSelected && lastChange.current !== changeSelected) {if (lastChange.current) {setTaskSelected(null);setDeliveryPhase(null);}lastChange.current = changeSelected;}}, [changeSelected]);
  const toggle = useCallback(id => setExpanded(current => {const next = new Set(current);next.has(id) ? next.delete(id) : next.add(id);return next;}), []);
  const toggleType = useCallback((artifactId, type) => {
    setExpanded(current => new Set([...current, artifactId]));
    setExpandedTypes(current => {const next = new Set(current);next.has(type) ? next.delete(type) : next.add(type);return next;});
  }, []);
  function revealElement(artifactId, elementId) {
    const record = snapshot.artifacts.find(a => a.id === artifactId)?.elements.find(e => e.id === elementId);
    if (!record) return;
    setExpanded(current => new Set([...current, artifactId]));
    setExpandedTypes(current => new Set([...current, typeKey(artifactId, record.path.split('/')[0], record.source.startsWith('change:') ? record.source : undefined), ...(record.source.startsWith('change:') ? [historyKey(artifactId), historyKey(artifactId, record.source)] : [])]));
    setSelection({artifact: artifactId, element: elementId});
  }
  const scopeOf = e => ({artifact: e.artifact, ...(e.source.startsWith('change:') ? {change: e.source.slice(7)} : {})});
  const readElement = e => {go({kind: 'document', artifact: e.artifact, source: e.file, title: e.path, scope: scopeOf(e)});};
  const readEstablished = e => go({kind: 'document', artifact: e.artifact, source: e.file, title: `${e.path} · established on ${String(snapshot.artifacts.find(a => a.id === e.artifact)?.baseline?.ref || 'main').replace('refs/heads/', '')}`, established: true});
  const openFlows = (entry, proposed) => {if (proposed) chooseKnowledge('planning');go({kind: 'flow', ...entry});};
  const showInGraph = (artifact, dependency) => {setSelection({artifact, ...(dependency ? {dependency} : {})});go({kind: 'graph'});};
  const worktree = snapshot?.workflow?.worktrees.find(w => w.path === worktreePath);
  const selectedUnit = unitContext(snapshot, unitSelected, unitNodeSelected);
  const changeContext = changeSelected ? taskSelection(snapshot?.workflow, changeSelected, taskSelected) : null;
  const graphArtifact = snapshot?.artifacts.find(a => a.id === selection?.artifact), graphElement = graphArtifact?.elements.find(e => e.id === selection?.element);
  // The details text each page shows beside its main content.
  let documentSource = null, documentScope = null;
  if (page.kind === 'graph' && graphArtifact) {documentSource = graphElement?.file || `docs/artifacts/${graphArtifact.id}/README.md`;documentScope = graphElement ? scopeOf(graphElement) : {artifact: graphArtifact.id};}
  else if (page.kind === 'artifact') {documentSource = `docs/artifacts/${page.artifact}/README.md`;documentScope = {artifact: page.artifact};}
  else if (page.kind === 'change' && changeContext) {documentSource = changeTab === 'plan' ? changeContext.task?.path || null : `docs/artifacts/${page.artifact}/changes/${page.change}/README.md`;documentScope = {artifact: page.artifact, change: page.change};}
  else if (page.kind === 'unit' && selectedUnit) {const node = unitNode(selectedUnit, unitView, unitPlanning, unitNodeSelected);documentSource = node?.source || node?.step?.evidence[0]?.file || selectedUnit.unit.path;documentScope = {unit: selectedUnit.unit.id};}
  const documentIdentity = JSON.stringify([snapshot?.repository.path, documentSource, documentScope]);
  useEffect(() => {
    if (!isActive) return;
    if (!documentSource || !documentScope) {setDocument(null);return;}const controller = new AbortController(), session = generation.current;
    setDocument(current => current?.identity === documentIdentity ? {...current, status: 'Loading'} : {source: documentSource, markdown: '', status: 'Loading'});
    repositoryQuery({path: projectRoot, worktree: worktreePath, section: 'markdown', source: documentSource, ...documentScope}, controller.signal).then(result => {if (!controller.signal.aborted && session === generation.current) setDocument({...result.data, identity: documentIdentity, status: 'Loaded'});}).catch(error => {if (error.name !== 'AbortError' && session === generation.current) setDocument({source: documentSource, markdown: '', status: 'Error', error: error.message});});
    return () => controller.abort();
  }, [isActive, documentIdentity, overviewEpoch]);
  // Delivery history recency for the artifact page, read on demand.
  const historyArtifact = page.kind === 'artifact' ? page.artifact : null, deliveryHistoryKey = historyArtifact && historyKey(historyArtifact, 'delivery-histories');
  useEffect(() => {
    if (!isActive || !historyArtifact || !worktree || !listTypes.has(deliveryHistoryKey)) return;
    const controller = new AbortController(), session = generation.current, root = projectRoot;
    const candidates = worktree.changes.filter(c => c.artifact === historyArtifact && c.history && c.loadState === 'not-loaded');
    (async () => {for (const c of candidates) {if (controller.signal.aborted) return;try {const result = await repositoryQuery({path: root, worktree: worktree.path, artifact: c.artifact, change: c.name, section: 'history'}, controller.signal);if (controller.signal.aborted || session !== generation.current) return;
      const patch = current => ({...current, workflow: {...current.workflow, worktrees: current.workflow.worktrees.map(w => w.path === worktree.path ? {...w, changes: w.changes.map(change => change.artifact === c.artifact && change.name === c.name ? {...change, lastCommitAt: result.data.lastCommitAt, historyReason: result.data.historyReason, loadState: 'summary-loaded'} : change)} : w)}});
      overviewRef.current = patch(overviewRef.current);setSnapshot(current => patch(current));
    } catch (error) {if (error.name !== 'AbortError') setError(error.message);}}})();
    return () => controller.abort();
  }, [isActive, historyArtifact, deliveryHistoryKey, listTypes.has(deliveryHistoryKey), overviewEpoch]);
  async function createBranch(name) {
    try {await gitAction({path: projectRoot, worktree: worktreePath, operation: 'branch.create', input: {name}});}
    catch (error) {throw unavailable(error) ? Error('This server cannot create branches yet. Run git switch -c in a terminal, then refresh.') : error;}
    await open(projectRoot, true);
  }
  const navigationTargets = useMemo(() => knowledgeTargets(snapshot, selectedUnit), [snapshot, selectedUnit]);
  const narrow = workspaceWidth <= 800;
  const {sidebar: sidebarWidth, inspector: panelWidth, sidebarMax, inspectorMax: panelMax} = panelLayout(workspaceWidth, sidebarPreference, panelPreference, true);
  const rail = {width: panelWidth, max: panelMax, onResize: resizePanel};
  const project = snapshot?.repository.path.split('/').at(-1) || '';
  const uncommitted = gitState?.count ?? knowledgeStatus(snapshot?.repository.status);
  const editState = uncommitted ? `${uncommitted} uncommitted knowledge ${uncommitted === 1 ? 'file' : 'files'}` : 'Clean';
  const backLabel = route.trail.length ? pageName(route.trail.at(-1)) : null;
  const common = {project, onOpen: go};
  // The last flow page stays mounted while its sources are read.
  if (page.kind === 'flow') lastFlow.current = page;
  const flowPage = lastFlow.current;
  return <RuntimeProvider snapshot={snapshot} active={isActive}><div className="app" onKeyDown={event => {if (event.key === 'Escape' && drawerOpen) {setDrawerOpen(false);}}}>
    <header className="topbar" hidden={Boolean(snapshot)}>
      <div className="brand"><span className="brand-icon">⌘</span><div><h1>Artifact Plane</h1><span>Local ADD workbench</span></div></div>
    </header>
    <form className="open-bar" hidden={Boolean(snapshot) && !editingRepo} onSubmit={e => {e.preventDefault();open(path);}}>
      <label htmlFor={`repository-path-${tabId}`}>Repository path</label>
      <input id={`repository-path-${tabId}`} placeholder="/absolute/path/to/add-repository" value={path} onChange={e => setPath(e.target.value)} required autoComplete="off" spellCheck={false}/>
      <button className="primary" aria-busy={busy}>Open repository</button>
      {snapshot && <button type="button" onClick={() => {setPath(projectRoot);setEditingRepo(false);}}>Cancel</button>}
    </form>
    {snapshot && <SourceBar snapshot={snapshot} worktreePath={worktreePath} onSelect={activateWorktree} busy={busy} opening={openingWorktree} editState={editState}
      onRefresh={() => open(projectRoot, true)} onChangeRepository={() => setEditingRepo(true)} drawerOpen={drawerOpen} onDrawer={() => setDrawerOpen(value => !value)} drawerId={`navigation-panel-${tabId}`}/>}
    {snapshot && <ProtectedBanner key={worktreePath} branch={snapshot.repository.branch} onCreate={createBranch}/>}
    {error && <div role="alert" className="error-banner">{error}</div>}
    <div className={`workspace ${drawerOpen ? 'drawer-open' : ''}`} ref={workspaceRef} style={{'--sidebar-width': sidebarWidth + 'px'}}>
      <aside className="tree-panel" id={`navigation-panel-${tabId}`} aria-label="Repository navigation" hidden={!snapshot || narrow && !drawerOpen}>
        {snapshot && <NavigationTree snapshot={snapshot} worktree={worktree} page={page} expanded={treeOpen} onToggle={toggleTree} onOpen={go}/>}
        <div className="sidebar-footer">Git + Markdown<br/><span>Source of truth</span></div>
      </aside>
      {snapshot && !narrow && <div className="navigation-divider" role="separator" aria-label="Resize navigation panel" aria-orientation="vertical" aria-valuemin={180} aria-valuemax={sidebarMax} aria-valuenow={sidebarWidth} aria-controls={`navigation-panel-${tabId}`} tabIndex={0}
        onKeyDown={sidebarKeyboard} onPointerDown={event => {if (event.button !== 0) return;event.preventDefault();event.currentTarget.focus();event.currentTarget.setPointerCapture(event.pointerId);}}
        onPointerMove={dragSidebar} onPointerUp={event => {if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);}}
        onPointerCancel={event => {if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);}}/>}
      <main className="page-area">
        {!snapshot ? <div className="empty-canvas"><div className="empty-symbol">◇ → ◇</div><h2>Work with the knowledge behind your code</h2><p>Open an ADD repository to see current work, artifacts and units of work.</p></div> : <>
          <GraphPage {...common} snapshot={snapshot} active={page.kind === 'graph'} planning={planning} onPlanning={value => chooseKnowledge(value ? 'planning' : 'established')} expanded={expanded} expandedTypes={expandedTypes} listTypes={listTypes} selection={selection} onSelection={setSelection}
            toggle={toggle} toggleType={toggleType} toggleList={toggleList} revealElement={revealElement} document={page.kind === 'graph' ? document_ : null} onRead={readElement} onReadEstablished={readEstablished} onFlows={openFlows} rail={rail} tabId={tabId}/>
          {page.kind === 'work' && <WorkPage {...common} snapshot={snapshot} worktree={worktree}/>}
          {page.kind === 'artifact' && <ArtifactPage {...common} snapshot={snapshot} artifactId={page.artifact} worktree={worktree} document={document_?.source === documentSource ? document_ : null} planning={planning}
            historiesOpen={listTypes.has(deliveryHistoryKey)} onToggleHistories={() => toggleList(deliveryHistoryKey)} onGraph={showInGraph} onFlows={openFlows}/>}
          {page.kind === 'document' && <DocumentPage {...common} entry={page} snapshot={snapshot} root={projectRoot} worktree={worktreePath} epoch={overviewEpoch} targets={navigationTargets} onBack={route.trail.length ? back : null} backLabel={backLabel} onReadEstablished={readEstablished} onFlows={openFlows}/>}
          {page.kind === 'change' && <ChangePage {...common} context={changeContext} tab={changeTab} onTab={tab => replacePage({...page, tab})} phase={deliveryPhase} onPhase={setDeliveryPhase} taskSelected={taskSelected} onTask={setTaskSelected}
            document={document_} loading={sectionState} review={{root: projectRoot, epoch: overviewEpoch, session: loadedSession, updating: busy, fresh}} rail={rail} tabId={tabId} active={isActive}/>}
          {page.kind === 'unit' && <UnitPage {...common} context={selectedUnit} view={unitView} onView={value => {setUnitView(value);setUnitNodeSelected(null);}} planning={unitPlanning} onPlanning={value => {setUnitPlanning(value);setUnitNodeSelected(null);}}
            selection={unitNodeSelected} onSelect={setUnitNodeSelected} loading={sectionState} document={document_} completion={{state: completionState, error: completionError, load: loadCompletion}}
            onDocument={source => go({kind: 'document', source, title: source.split('/').at(-1), scope: {unit: page.unit}})}
            onFlow={entry => {const owner = entry.flow?.split(':')[0], member = selectedUnit?.unit.members.find(m => m.artifact === owner);if (member?.sourcePath?.includes('/changes/') || member?.establishmentEvidence?.state === 'proposed') chooseKnowledge('planning');go({kind: 'flow', flow: entry.flow, artifact: owner});}}
            rail={rail} tabId={tabId}/>}
          {flowPage && <FlowPage {...common} page={flowPage} active={isActive && page.kind === 'flow'} root={projectRoot} worktree={worktreePath} epoch={overviewEpoch} knowledge={flowKnowledge} onKnowledge={chooseKnowledge} artifacts={snapshot.artifacts.map(a => ({id: a.id, title: a.title}))}/>}
          {page.kind === 'recorded' && <section className="page canvas-page" aria-label="Recorded executions">
            <div className="page-body with-rail" style={{'--rail-width': panelWidth + 'px'}}>
              <div className="canvas-area"><RecordedView id={page.context} selection={recordedNode} onSelect={setRecordedNode}/></div>
              <div className="rail-divider" aria-hidden="true"/>
              <aside className="details-panel" aria-label="Selection details"><RecordedDetails id={page.context} selection={recordedNode} onSelect={setRecordedNode}/></aside>
            </div>
          </section>}
          {(sectionState === 'Error' || sectionState === 'Stale') && ['unit', 'change'].includes(page.kind) && <div className="section-retry" role="alert">Evidence could not be updated. <button onClick={() => setSectionRetry(n => n + 1)}>Retry evidence</button></div>}
        </>}
      </main>
    </div>
    <footer className="statusbar">
      <span>{busy ? 'Reading repository…' : snapshot ? `${snapshot.artifacts.length} artifacts · ${snapshot.references.length} element references` : 'Ready to open a repository'}</span>
      <span role="status" aria-label="Repository update status">{busy || sectionState === 'Loading' ? 'Updating' : snapshot ? connected && fresh && sectionState !== 'Error' && sectionState !== 'Stale' ? 'Current' : 'Stale · repository observation disconnected or update unavailable' : 'Not loaded'}</span>
    </footer>
  </div></RuntimeProvider>;
}
createRoot(document.getElementById('root')).render(<Workspace Explorer={ProjectExplorer}/>);
