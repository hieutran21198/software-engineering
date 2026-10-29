// The sessions of one project (specifications/agent-orchestration.md, Workbench): the session
// query, the waiting count, the launch dialogs, the stream of one session and its output.
// Without a launch profile the workbench shows no session control (requirement AO18), so
// `control` is false and no dialog opens.
import React, {createContext, useCallback, useContext, useEffect, useMemo, useRef, useState} from 'react';
import {useRuntime} from './Runtime.jsx';
import {querySessions, sessionOutput, streamUrl} from './sessions-api.js';
import {waitingSessions} from './session-model.js';
import {LaunchDialog, StartWorkDialog} from './pages/LaunchDialog.jsx';
import './pages/SessionsPage.css';

const EMPTY = {status: 'idle', sessions: [], profiles: 0, error: null};
const Context = createContext({...EMPTY, control: false, waiting: [], observing: false, refresh() {}, openLaunch() {}, openStartWork() {}});
export const useSessions = () => useContext(Context);

// root: the repository root of the project; active: the project tab is active and visible.
// A change of the runtime sequence (a lifecycle event or a hook observation) reads the sessions again.
export function SessionsProvider({root, active, children}) {
  const runtime = useRuntime(), sequence = runtime.data?.sequence ?? null;
  const [state, setState] = useState(EMPTY), [tick, setTick] = useState(0), [dialog, setDialog] = useState(null);
  const opener = useRef(null);
  useEffect(() => {setState(EMPTY);setDialog(null);}, [root]);
  useEffect(() => {
    if (!root || !active) return;
    const controller = new AbortController();
    querySessions(root, controller.signal).then(result => setState({status: 'loaded', sessions: result.sessions || [], profiles: result.profiles ?? 0, error: null}))
      .catch(error => {if (error.name !== 'AbortError') setState(current => ({...current, status: 'error', error: error.message}));});
    return () => controller.abort();
  }, [root, active, sequence, tick]);
  const refresh = useCallback(() => setTick(n => n + 1), []);
  const open = kind => props => {opener.current = document.activeElement;setDialog({kind, props, key: Date.now()});};
  const close = useCallback(() => {
    setDialog(null);const target = opener.current;
    requestAnimationFrame(() => {if (target?.isConnected) target.focus();});
  }, []);
  const control = state.profiles > 0;
  const value = useMemo(() => ({...state, control, waiting: waitingSessions(state.sessions), observing: Boolean(active), refresh,
    openLaunch: control ? open('launch') : () => {}, openStartWork: control ? open('work') : () => {}}), [state, control, active, refresh]);
  return <Context.Provider value={value}>
    {children}
    {dialog && control && (dialog.kind === 'work' ? <StartWorkDialog key={dialog.key} {...dialog.props} onClose={close} onStarted={refresh}/>
      : <LaunchDialog key={dialog.key} {...dialog.props} onClose={close} onStarted={refresh}/>)}
  </Context.Provider>;
}

// The newest session of a task of a change, or null.
export function useTaskSession(artifact, change, taskPath) {
  const {sessions} = useSessions(), task = taskPath?.split('/tasks/').at(-1);
  return sessions.find(s => s.role === 'implementer' && s.artifact === artifact && s.change === change && s.task === task) || null;
}

// The server-sent events of one session (Commands: the session stream): the session, its
// live state, an output counter and the connection. The stream closes while the project tab is
// inactive or the browser tab is hidden, as the other streams of the workbench do.
export function useSessionStream(id, enabled) {
  const [state, setState] = useState({session: null, live: null, connected: false, closed: false, output: 0}), [attempt, setAttempt] = useState(0);
  useEffect(() => {setState({session: null, live: null, connected: false, closed: false, output: 0});}, [id]);
  useEffect(() => {
    if (!id || !enabled) {setState(current => ({...current, connected: false}));return;}
    const source = new EventSource(streamUrl(id));
    const on = (event, apply) => source.addEventListener(event, message => {try {const data = JSON.parse(message.data);setState(current => apply(current, data));} catch {/* a malformed event changes nothing */}});
    on('snapshot', (current, data) => ({...current, session: data.session, live: data.live, connected: true, closed: false, output: current.output + 1}));
    on('state', (current, data) => ({...current, session: data.session, output: current.output + 1}));
    on('live', (current, data) => ({...current, live: data.live}));
    on('output', current => ({...current, output: current.output + 1}));
    on('runner-lost', current => ({...current, connected: false}));
    source.onerror = () => setState(current => ({...current, connected: false, closed: source.readyState === EventSource.CLOSED}));
    return () => source.close();
  }, [id, enabled, attempt]);
  return {...state, reconnect: () => setAttempt(n => n + 1)};
}

// The output of a session (Output): read again when `trigger` changes, and every 15 seconds
// while `working` is true.
export function useSessionOutput(id, trigger, working = false) {
  const [state, setState] = useState({status: 'loading', data: null, error: null}), [tick, setTick] = useState(0);
  useEffect(() => {setState({status: 'loading', data: null, error: null});}, [id]);
  useEffect(() => {
    if (!working) return;
    const timer = setInterval(() => setTick(n => n + 1), 15000);
    return () => clearInterval(timer);
  }, [working]);
  useEffect(() => {
    if (!id) return;
    const controller = new AbortController();
    sessionOutput(id, controller.signal).then(data => setState({status: 'loaded', data, error: null}))
      .catch(error => {if (error.name !== 'AbortError') setState(current => ({...current, status: 'error', error: error.message}));});
    return () => controller.abort();
  }, [id, trigger, tick]);
  return {...state, retry: () => setTick(n => n + 1)};
}
