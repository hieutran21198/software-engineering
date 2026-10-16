import {labelledEdgeTypes,GraphLabelLayout} from './GraphLabels.jsx';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Workspace from "./Workspace.jsx";
import { createRoot } from "react-dom/client";
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Handle,
  Position,
} from "@xyflow/react";
import Flows from './Flows.jsx';
import SearchField, {matchesName} from './SearchField.jsx';
import ChangeReview from './ChangeReview.jsx';
import {UnitList, UnitView, UnitDetails} from './UnitsOfWork.jsx';
import {unitContext, unitNode} from './unit-canvas.js';
import {refreshQueue,repositoryQuery,mergeUnit,mergeChange} from './reload.js';
import Markdown from "./Markdown.jsx";
import Reader, {documentSummary} from "./Reader.jsx";
import {knowledgeTargets} from "./knowledge-navigation.js";
import {RuntimeProvider} from "./Runtime.jsx";
import {RecordedPicker,RecordedView,RecordedDetails} from "./RecordedExecutions.jsx";
import {TaskGraph, TaskGraphDetails} from "./TaskGraph.jsx";
import {taskSelection} from "./task-canvas.js";
import { relationships } from "./graph.js";
import {Worktrees, ChangeList, ChangeDetails} from "./Delivery.jsx";
import { canvasGraph } from "./canvas.js";
import { knowledgeGroups, typeKey, historyKey } from "./elements.js";
import "@xyflow/react/dist/style.css";
import "./style.css";

function Handles() {
  return (
    <>
      <Handle type="target" position={Position.Left} isConnectable={false} />
      <Handle type="source" position={Position.Right} isConnectable={false} />
    </>
  );
}
function ArtifactNode({ data, selected }) {
  const a = data.artifact;
  return (
    <div
      className={`artifact-node ${data.open ? "expanded" : ""} ${selected ? "selected" : ""}`}
    >
      <Handles />
      <div className="node-head">
        <span className="eyebrow">Artifact</span>
        <button
          className="node-expand nodrag nopan"
          aria-label={`${data.open ? "Collapse" : "Expand"} ${a.title}`}
          onClick={(e) => {
            e.stopPropagation();
            data.toggle(a.id);
          }}
        >
          {data.open ? "−" : "+"}
        </button>
      </div>
      <strong title={a.title}>{a.title}</strong>
      <div className="node-meta">
        <span>
          {a.currentVersion ? `v${a.currentVersion}` : "No established version"}
        </span>
        <span>{a.elements.length} elements</span>
      </div>
      {data.open &&
        data.groups.map((group) => (
          <React.Fragment key={group.key}>
            <button
              className="type-toggle canvas-type nodrag nopan"
              style={{ top: group.y, left: 16 + group.depth * 8, width: 328 - group.depth * 8 }}
              aria-label={group.ariaLabel.replace("Change histories","Historical documents") + " in " + a.title}
              aria-expanded={group.open}
              onClick={(event) => {
                event.stopPropagation();
                data.toggleType(a.id, group.key);
              }}
            >
              <span>
                {group.open ? "▾" : "▸"} {group.label==='Change histories'?'Historical documents':group.label}
              </span>
              <span className="type-count">{group.count}</span>
            </button>
            {group.headings.map((heading) => (
              <div
                className="canvas-source-heading"
                key={heading.label}
                style={{ top: heading.y }}
              >
                {heading.label}
              </div>
            ))}
          </React.Fragment>
        ))}
      {data.open && a.elements.length === 0 && (
        <p className="empty-node">No knowledge elements found.</p>
      )}
    </div>
  );
}
function ElementNode({ data, selected }) {
  const e = data.element;
  return (
    <div className={`element-node ${selected ? "selected" : ""}`}>
      <Handles />
      <span
        className={`source-tag ${e.source.startsWith("change:") ? "proposed" : ""}`}
      >
        {e.source.replace(":", " · ")}
      </span>
      <strong title={e.path}>{e.path}</strong>
    </div>
  );
}
function MissingNode({ data }) {
  return (
    <div className="missing-node">
      <Handles />
      <span className="eyebrow">Unresolved target</span>
      <strong>{data.label}</strong>
    </div>
  );
}
const nodeTypes = {
  artifact: ArtifactNode,
  element: ElementNode,
  missing: MissingNode,
};

function DependencyList({ title, value, onSelect }) {
  return (
    <div className="relationship">
      <h4>{title}</h4>
      <p className="tiny">Direct</p>
      <div className="chips">
        {value.direct.length ? (
          value.direct.map((id) => (
            <button key={id} onClick={() => onSelect(id)}>
              {id}
            </button>
          ))
        ) : (
          <span className="muted">None</span>
        )}
      </div>
      {value.transitive.some(id=>!value.direct.includes(id))&&<><p className="tiny">All reachable</p>
      <div className="chips">
        {value.transitive.length ? (
          value.transitive.map((id) => (
            <button key={id} onClick={() => onSelect(id)}>
              {id}
            </button>
          ))
        ) : (
          <span className="muted">None</span>
        )}
      </div></>}
    </div>
  );
}
function ReferenceList({ references, onTarget }) {
  return (
    <div className="references">
      {references.length === 0 ? (
        <p className="muted">No element references.</p>
      ) : (
        references.map((r) => (
          <div className="reference" key={r.id}>
            <span
              className={`source-tag ${r.status === "proposed" ? "proposed" : ""}`}
            >
              {r.status} · {r.resolved ? "resolved" : "unresolved"}
            </span>
            <button
              className="reference-target"
              disabled={!r.resolved}
              onClick={() => onTarget(r)}
            >
              {r.artifact} / {r.element}
            </button>
            <p>{r.reason}</p>
            <small>{r.targetSource || "No declared target source"}</small>
            {r.diagnostic && <p className="error-text">{r.diagnostic}</p>}
          </div>
        ))
      )}
    </div>
  );
}
export function ProjectExplorer({active: isActive = true, initialPath = "", onOpened = () => {}, tabId = "default"}) {
  const [path, setPath] = useState(initialPath),
    [snapshot, setSnapshot] = useState(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const [editingRepo,setEditingRepo]=useState(false);
  const [projectRoot, setProjectRoot] = useState(initialPath), [openingWorktree,setOpeningWorktree]=useState(null);
  const [expanded, setExpanded] = useState(new Set()),
    [selection, setSelection] = useState(null),
    [planning, setPlanning] = useState(false);
  const [expandedTypes, setExpandedTypes] = useState(new Set());
  const [listTypes,setListTypes]=useState(new Set()),[readerTrail,setReaderTrail]=useState([]),[flowSelected,setFlowSelected]=useState(false);
  const reader=readerTrail.at(-1);
  const handleFlowSelection=useCallback(selected=>{setFlowSelected(selected);setReaderTrail(current=>current.length?[]:current);},[]);
  const openReader=entry=>setReaderTrail(current=>entry?[...current,entry]:[]);
  const closeReader=()=>{setReaderTrail([]);};
  const backReader=()=>{if(readerTrail.length===1&&reader?.scope?.artifact)setSelection({artifact:reader.scope.artifact});setReaderTrail(current=>current.slice(0,-1));};
  const toggleList=key=>setListTypes(current=>{const next=new Set(current);next.has(key)?next.delete(key):next.add(key);return next;});
  const [unitFilter,setUnitFilter]=useState("");
  const [reviewKey,setReviewKey]=useState(null),[reviewInspector,setReviewInspector]=useState(null);
  const [deliveryChange, setDeliveryChange] = useState(null), [deliveryPhase, setDeliveryPhase] = useState(null);
  const [taskChange, setTaskChange] = useState(null), [taskSelected, setTaskSelected] = useState(null);
  const [unitSelected,setUnitSelected] = useState(null), [unitNodeSelected,setUnitNodeSelected] = useState(null), [unitWorktree,setUnitWorktree] = useState(null), [unitView,setUnitView] = useState('artifacts'), [unitPlanning,setUnitPlanning] = useState(false);
  const [view, setView] = useState("canvas");
  const [flowEntry,setFlowEntry]=useState(null);
  const [flowKnowledge,setFlowKnowledge]=useState("established"),[flowSidebar,setFlowSidebar]=useState(null),[flowInspector,setFlowInspector]=useState(null);
  const chooseKnowledge=value=>{setFlowKnowledge(value);if(value!=="all")setPlanning(value==="planning");};
  const openFlows=entry=>{if(entry!==null){if(entry.worktree)setUnitWorktree(entry.worktree);setFlowEntry(entry);}setView("flows");};
  const [recordedSelected,setRecordedSelected]=useState(null),[recordedNode,setRecordedNode]=useState(null);
  const [filter, setFilter] = useState("");
  const workspaceRef = useRef(null);
  const [panelWidth, setPanelWidth] = useState(340),
    [panelMax, setPanelMax] = useState(640);
  useEffect(() => {
    const workspace = workspaceRef.current;
    const measure = () => {
      const width = workspace.getBoundingClientRect().width;
      if (width <= 800) return;
      const sidebar = workspace
        .querySelector(".sidebar")
        .getBoundingClientRect().width;
      const max = Math.max(
        240,
        Math.min(640, Math.floor(width - sidebar - 300)),
      );
      setPanelMax(max);
      setPanelWidth((current) => Math.max(240, Math.min(max, current)));
    };
    const observer = new ResizeObserver(measure);
    observer.observe(workspace);
    measure();
    return () => observer.disconnect();
  }, []);
  const resizePanel = (width) =>
    setPanelWidth(Math.max(240, Math.min(panelMax, width)));
  function dragPanel(event) {
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
    resizePanel(
      workspaceRef.current.getBoundingClientRect().right - event.clientX,
    );
  }
  function resizeWithKeyboard(event) {
    const widths = {
      ArrowLeft: panelWidth + 20,
      ArrowRight: panelWidth - 20,
      Home: 240,
      End: panelMax,
    };
    if (Object.hasOwn(widths, event.key)) {
      event.preventDefault();
      resizePanel(widths[event.key]);
    }
  }
  const snapshotRef=useRef(snapshot),overviewRef=useRef(null),queueRef=useRef(null),queueRoot=useRef(null),eventsRef=useRef(null),generation=useRef(0),reloadRef=useRef(null);
  snapshotRef.current=snapshot;
  const [loadedSession,setLoadedSession]=useState(0),[overviewEpoch,setOverviewEpoch]=useState(0),[sectionState,setSectionState]=useState('Not loaded'),[connected,setConnected]=useState(false),[fresh,setFresh]=useState(false),[document,setDocument]=useState(null),[completionState,setCompletionState]=useState('idle'),[completionError,setCompletionError]=useState(''),[sectionRetry,setSectionRetry]=useState(0),[requestedSource,setRequestedSource]=useState(null);
  const active=useRef(null);active.current={overviewEpoch,unitSelected,unitView,unitPlanning,unitWorktree,view,selection,taskChange,taskSelected,deliveryChange,deliveryPhase,unitNodeSelected,reviewKey};
  const completionController=useRef(null);
  function installOverview(base,refresh){
    const current=active.current,previous=snapshotRef.current;
    overviewRef.current=base;
    let next=base;
    if(refresh&&current.unitSelected){const old=unitContext(previous,current.unitSelected);if(old&&unitContext(base,current.unitSelected))next=mergeUnit(base,current.unitSelected,old.unit);else{setUnitSelected(null);setUnitNodeSelected(null);}}
    if(refresh&&current.taskChange){const old=taskSelection(previous?.workflow,current.taskChange);if(old&&taskSelection(base.workflow,current.taskChange))next=mergeChange(next,current.taskChange,old.change);else{setTaskChange(null);setTaskSelected(null);}}
    if(refresh&&current.deliveryChange){const old=taskSelection(previous?.workflow,current.deliveryChange);if(old&&taskSelection(base.workflow,current.deliveryChange))next=mergeChange(next,current.deliveryChange,old.change);else{setDeliveryChange(null);setDeliveryPhase(null);}}
    if(refresh&&current.reviewKey&&!taskSelection(base.workflow,current.reviewKey)){setReviewKey(null);}
    if(refresh&&current.selection&&!base.artifacts.some(a=>a.id===current.selection.artifact&&(!current.selection.element||a.elements.some(e=>e.id===current.selection.element))))setSelection(null);
    setSnapshot(next);setOverviewEpoch(value=>value+1);
  }
  reloadRef.current=async(repositoryPath,refresh,signal,session,targetWorktree=null,switching=false)=>{
    setBusy(true);setFresh(false);setError('');
    try{
      const target=targetWorktree||(refresh?active.current.unitWorktree:null);
      const result=await repositoryQuery({path:repositoryPath,section:'overview',...(target?{worktree:target}:{})},signal);
      if(session!==generation.current||signal.aborted)return;
      const base=result.data;
      setProjectRoot(result.repository.path);if(!refresh&&!switching)setEditingRepo(false);if(!switching)onOpened(result.repository.path);
      installOverview(base,refresh);setLoadedSession(session);queueRoot.current=result.repository.path;setPath(result.repository.path);setFresh(!result.diagnostics.some(d=>d.code==='stale-response'));
      if(!refresh){setReaderTrail([]);setListTypes(new Set());setReviewKey(null);setFlowEntry(null);setRecordedSelected(null);setRecordedNode(null);if(active.current.view==='recorded')setView('canvas');setUnitSelected(null);setUnitNodeSelected(null);setUnitWorktree(base.repository.path);setUnitView('artifacts');setUnitPlanning(false);setTaskChange(null);setTaskSelected(null);setDeliveryChange(null);setDeliveryPhase(null);setExpanded(new Set());setExpandedTypes(new Set());setSelection(null);setFilter('');setUnitFilter('');if(!switching){setPlanning(false);setFlowKnowledge('established');}setCompletionState('idle');setDocument(null);}
    }catch(error){if(session===generation.current&&error.name!=='AbortError'){setError(error.message);setFresh(false);}}
    finally{if(session===generation.current){setBusy(false);setOpeningWorktree(null);}}
  };
  function open(repositoryPath,refresh=false,targetWorktree=null,switching=false){
    if(refresh&&queueRef.current&&queueRoot.current===repositoryPath)return queueRef.current.request();
    queueRef.current?.close();eventsRef.current?.close();completionController.current?.abort();const session=++generation.current;setConnected(false);
    queueRoot.current=repositoryPath;let first=!refresh;const queue=refreshQueue(signal=>{const initial=first;first=false;return reloadRef.current(repositoryPath,!initial,signal,session,initial?targetWorktree:null,initial&&switching);});queueRef.current=queue;return queue.request();
  }
  useEffect(()=>{
    if(isActive){const root=queueRoot.current||initialPath;if(root)open(root,Boolean(snapshotRef.current));}
    else{generation.current++;queueRef.current?.close();queueRef.current=null;eventsRef.current?.close();completionController.current?.abort();setConnected(false);setFresh(false);setBusy(false);}
  },[isActive]);
  useEffect(()=>{
    const root=projectRoot;if(!isActive||!root||!snapshot)return;const session=generation.current;
    const refresh=()=>{if(session===generation.current)queueRef.current?.request();};
    const connect=()=>{eventsRef.current?.close();const source=new EventSource('/api/repository/events?path='+encodeURIComponent(root));eventsRef.current=source;
      source.onmessage=event=>{if(session!==generation.current||eventsRef.current!==source)return;try{const value=JSON.parse(event.data);setConnected(Boolean(value.available));setFresh(false);if(value.available)refresh();}catch{setConnected(false);setFresh(false);}};
      source.onerror=()=>{if(session===generation.current){setConnected(false);setFresh(false);}};
    };
    const offline=()=>{eventsRef.current?.close();setConnected(false);setFresh(false);};const online=()=>{connect();refresh();};
    if(navigator.onLine)connect();window.addEventListener('focus',refresh);window.addEventListener('online',online);window.addEventListener('offline',offline);
    return()=>{eventsRef.current?.close();window.removeEventListener('focus',refresh);window.removeEventListener('online',online);window.removeEventListener('offline',offline);};
  },[isActive,projectRoot,snapshot?.repository.path,loadedSession]);
  useEffect(()=>()=>{generation.current++;queueRef.current?.close();eventsRef.current?.close();completionController.current?.abort();},[]);
  function activateWorktree(target){
    if(target===unitWorktree&&!openingWorktree)return;
    const entry=snapshot?.workflow.worktrees.find(w=>w.path===target);
    if(entry?.availability!=='readable'){setError(entry?.diagnostics.map(d=>d.message).join(' ')||'This worktree is unavailable.');return;}
    setOpeningWorktree(target);open(projectRoot,false,target,true);
  }
  useEffect(()=>{
    const root=projectRoot,base=overviewRef.current;if(!isActive||!root||!base)return;if(view==='canvas'&&reviewKey){setSectionState('Not loaded');return;}
    const controller=new AbortController(),session=generation.current;let key,body;
    if(view==='units'&&unitSelected){const [worktree,unit]=JSON.parse(unitSelected);if(!unitContext(base,unitSelected))return;key=unitSelected;body={path:root,worktree,unit,section:unitView,...(unitView==='artifacts'?{dependencyMode:unitPlanning?'planning':'established'}:{})};}
    else if(view==='canvas'&&(taskChange||deliveryChange)){key=taskChange||deliveryChange;const [worktree,artifact,change]=JSON.parse(key);body={path:root,worktree,artifact,change,section:taskChange?'implementation':'workflow'};}
    else{setSectionState('Not loaded');setSnapshot(current=>{if(!current)return current;return base;});return;}
    setSectionState('Loading');
    repositoryQuery(body,controller.signal).then(result=>{
      if(session!==generation.current||controller.signal.aborted)return;
      if(result.diagnostics.some(d=>d.code==='stale-response')){setSectionState('Stale');setFresh(false);setError(result.diagnostics.filter(d=>d.code==='stale-response').map(d=>d.message).join(' '));return;}
      let unitData=result.data;const existing=body.unit?unitContext(snapshotRef.current,key)?.unit:null;if(existing?.completionEpoch===overviewEpoch)unitData={...unitData,completion:existing.completion,evidence:existing.evidence,completionEpoch:existing.completionEpoch};
      const next=body.unit?mergeUnit(base,key,unitData):mergeChange(base,key,result.data);
      setSnapshot(next);setSectionState(result.completeness==='partial'?'Loaded with diagnostics':'Loaded');
      if(body.unit){if(active.current.unitNodeSelected&&!unitNode(unitContext(next,key),unitView,unitPlanning,active.current.unitNodeSelected))setUnitNodeSelected(null);}
      else if(active.current.taskSelected&&!taskSelection(next.workflow,key,active.current.taskSelected)?.task)setTaskSelected(null);
    }).catch(error=>{if(error.name!=='AbortError'&&session===generation.current){setSectionState('Error');setFresh(false);setError(error.message);}});
    return()=>controller.abort();
  },[isActive,snapshot?.repository.path,overviewEpoch,view,unitSelected,unitView,unitPlanning,taskChange,deliveryChange,reviewKey,sectionRetry]);
  async function loadCompletion(){
    const key=active.current.unitSelected,root=projectRoot;if(!key||!root)return;
    completionController.current?.abort();const controller=new AbortController();completionController.current=controller;const session=generation.current,epoch=overviewEpoch,[worktree,unit]=JSON.parse(key);setCompletionState('loading');setCompletionError('');
    try{const result=await repositoryQuery({path:root,worktree,unit,section:'completion'},controller.signal);if(session!==generation.current||active.current.unitSelected!==key||active.current.overviewEpoch!==epoch||controller.signal.aborted)return;
      setSnapshot(current=>{const existing=unitContext(current,key);if(!existing)return current;return mergeUnit(current,key,{...existing.unit,completion:result.data.completion,completionEpoch:overviewEpoch,evidence:result.data.evidence,diagnostics:result.data.diagnostics,members:existing.unit.members.map(m=>({...m,establishmentEvidence:result.data.members.find(n=>n.artifact===m.artifact)?.establishmentEvidence||m.establishmentEvidence}))});});
      setCompletionState('loaded');
    }catch(error){if(error.name!=='AbortError'&&!controller.signal.aborted&&session===generation.current&&active.current.unitSelected===key&&active.current.overviewEpoch===epoch){setCompletionState('error');setCompletionError(error.message);}}
  }
  useEffect(()=>{
    completionController.current?.abort();setCompletionState('idle');setCompletionError('');
    if(isActive&&view==='units'&&unitSelected)loadCompletion();
    return()=>completionController.current?.abort();
  },[isActive,unitSelected,view,overviewEpoch,loadedSession]);
  const toggle = useCallback(
    (id) =>
      setExpanded((current) => {
        const next = new Set(current);
        next.has(id) ? next.delete(id) : next.add(id);
        return next;
      }),
    [],
  );
  const toggleType = useCallback((artifactId, type) => {
    setExpanded((current) => new Set([...current, artifactId]));
    setExpandedTypes((current) => {
      const next = new Set(current),
        key = type;
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }, []);
  const graph = useMemo(() => {
    if (!snapshot) return { nodes: [], edges: [] };
    const result = canvasGraph(snapshot, expanded, planning, expandedTypes);
    result.nodes = result.nodes.map((n) => ({
      ...n,
      selected:
        n.type === "artifact"
          ? selection?.artifact === n.data.artifact.id && !selection?.element
          : n.type === "element" && selection?.element === n.data.element.id,
      data: { ...n.data, toggle, toggleType },
    }));
    return result;
  }, [
    snapshot,
    expanded,
    expandedTypes,
    planning,
    selection,
    toggle,
    toggleType,
  ]);
  const artifact = snapshot?.artifacts.find(
    (a) => a.id === selection?.artifact,
  );
  const element = artifact?.elements.find((e) => e.id === selection?.element);
  const refs =
    snapshot?.references.filter((r) =>
      element ? r.consumer === element.id : r.consumerArtifact === artifact?.id,
    ) || [];
  const reachability =
    artifact && relationships(artifact.id, snapshot.edges, planning);
  const selectArtifact = (id) => {closeReader();setReviewKey(null);setSelection({ artifact: id });setDeliveryChange(null);setDeliveryPhase(null);setTaskChange(null);setTaskSelected(null);};
  function revealElement(artifactId, elementId) {
    const record = snapshot.artifacts
      .find((a) => a.id === artifactId)
      ?.elements.find((e) => e.id === elementId);
    if (!record) return;
    setExpanded((current) => new Set([...current, artifactId]));
    setExpandedTypes(
      (current) =>
        new Set([...current, typeKey(artifactId, record.path.split("/")[0], record.source.startsWith("change:") ? record.source : undefined), ...(record.source.startsWith("change:") ? [historyKey(artifactId), historyKey(artifactId, record.source)] : [])]),
    );
    setSelection({ artifact: artifactId, element: elementId });
    setReviewKey(null);setDeliveryChange(null);setDeliveryPhase(null);setTaskChange(null);setTaskSelected(null);
  }
  function readElement(e){
    setSelection({artifact:e.artifact,element:e.id});setReviewKey(null);setDeliveryChange(null);setTaskChange(null);
    openReader({returnFocus:e.id,source:e.file,title:e.path,parent:'artifact',scope:{artifact:e.artifact,...(e.source.startsWith('change:')?{change:e.source.slice(7)}:{})}});
  }
  function selectTarget(ref) {
    revealElement(ref.artifact, ref.targetId);
  }
  const selectedUnit = unitContext(snapshot,unitSelected,unitNodeSelected);
  const taskContext = taskSelection(snapshot?.workflow, taskChange, taskSelected);
  const deliveryContext = taskSelection(snapshot?.workflow, deliveryChange, null);
  const selectedWorktree = snapshot?.workflow?.worktrees.find(w=>w.path===unitWorktree);
  useEffect(()=>setRequestedSource(null),[unitSelected,unitView,unitNodeSelected,view,selection?.artifact,selection?.element,taskSelected]);
  const documentSource=requestedSource||(view==='units'?selectedUnit?(unitNode(selectedUnit,unitView,unitPlanning,unitNodeSelected)?.source||unitNode(selectedUnit,unitView,unitPlanning,unitNodeSelected)?.step?.evidence[0]?.file||selectedUnit.unit.path):null:view==='canvas'?taskContext?.task?.path||element?.file||(artifact?`docs/artifacts/${artifact.id}/README.md`:null):null);
  const documentScope=view==='units'&&selectedUnit?{worktree:selectedUnit.worktree.path,unit:selectedUnit.unit.id}:taskContext?{worktree:taskContext.worktree.path,artifact:taskContext.change.artifact,change:taskContext.change.name}:artifact?{artifact:artifact.id,...(element?.source.startsWith('change:')?{change:element.source.slice(7)}:{})}:null;
  const documentIdentity=JSON.stringify([snapshot?.repository.path,documentSource,documentScope]);
  useEffect(()=>{
    if(!isActive)return;
    if(!documentSource||!documentScope){setDocument(null);return;}const controller=new AbortController(),session=generation.current;
    setDocument(current=>current?.identity===documentIdentity?{...current,status:'Loading'}:{source:documentSource,markdown:'',status:'Loading'});
    repositoryQuery({path:projectRoot,worktree:unitWorktree,section:'markdown',source:documentSource,...documentScope},controller.signal).then(result=>{if(!controller.signal.aborted&&session===generation.current)setDocument({...result.data,identity:documentIdentity,status:'Loaded'});}).catch(error=>{if(error.name!=='AbortError'&&session===generation.current)setDocument({source:documentSource,markdown:'',status:'Error',error:error.message});});
    return()=>controller.abort();
  },[isActive,documentIdentity,overviewEpoch]);
  const deliveryHistoryKey = artifact && historyKey(artifact.id, 'delivery-histories');
  const selectDelivery = key => {setReviewKey(null);setDeliveryChange(key);setDeliveryPhase(null);setTaskChange(null);setTaskSelected(null);};
  const changeList = artifact && <ChangeList worktree={selectedWorktree} artifact={artifact.id} selected={deliveryChange} onSelect={selectDelivery} historiesOpen={listTypes.has(deliveryHistoryKey)} onToggleHistories={()=>toggleList(deliveryHistoryKey)}/>;
  useEffect(()=>{
    if(!isActive||!artifact||!selectedWorktree||!listTypes.has(deliveryHistoryKey))return;
    const controller=new AbortController(),session=generation.current,root=projectRoot;
    const candidates=selectedWorktree.changes.filter(c=>c.artifact===artifact.id&&c.history&&c.loadState==='not-loaded');
    (async()=>{for(const c of candidates){if(controller.signal.aborted)return;try{const result=await repositoryQuery({path:root,worktree:selectedWorktree.path,artifact:c.artifact,change:c.name,section:'history'},controller.signal);if(controller.signal.aborted||session!==generation.current)return;
      const patch=current=>({...current,workflow:{...current.workflow,worktrees:current.workflow.worktrees.map(w=>w.path===selectedWorktree.path?{...w,changes:w.changes.map(change=>change.artifact===c.artifact&&change.name===c.name?{...change,lastCommitAt:result.data.lastCommitAt,historyReason:result.data.historyReason,loadState:'summary-loaded'}:change)}:w)}});
      overviewRef.current=patch(overviewRef.current);setSnapshot(current=>patch(current));
    }catch(error){if(error.name!=='AbortError')setError(error.message);}}})();
    return()=>controller.abort();
  },[isActive,artifact?.id,deliveryHistoryKey,listTypes.has(deliveryHistoryKey),overviewEpoch]);
  const openTaskGraph = () => {setReviewKey(null);setTaskChange(deliveryChange);setTaskSelected(null);};
  const onNodeClick = (_, node) => {
    if (node.type === "artifact") selectArtifact(node.data.artifact.id);
    else if (node.type === "element")
      setSelection({
        artifact: node.data.element.artifact,
        element: node.data.element.id,
      });
  };
  const navigationTargets=useMemo(()=>knowledgeTargets(snapshot,selectedUnit),[snapshot,selectedUnit]);
  const hasDetails=Boolean(view==='canvas'?(artifact||reviewKey||taskContext||deliveryContext):view==='units'?unitSelected:view==='flows'?flowSelected:recordedSelected);
  return (
    <RuntimeProvider snapshot={snapshot} active={isActive}><div className="app">
      <header className="topbar" hidden={Boolean(snapshot)}>
        <div className="brand">
          <span className="brand-icon">⌘</span>
          <div>
            <h1>Artifact Plane</h1>
            <span>Local repository explorer</span>
          </div>
        </div>
        <span className="read-only">
          <i />
          Read-only
        </span>
      </header>
      <form
        className="open-bar"
        hidden={Boolean(snapshot)&&!editingRepo}
        onSubmit={(e) => {
          e.preventDefault();
          open(path);
        }}
      >
        <label htmlFor={`repository-path-${tabId}`}>Repository path</label>
        <input
          id={`repository-path-${tabId}`}
          placeholder="/absolute/path/to/add-repository"
          value={path}
          onChange={(e) => setPath(e.target.value)}
          required
          autoComplete="off"
          spellCheck={false}
        />
        <button className="primary" aria-busy={busy}>
          Open repository
        </button>
        <button
          type="button"
          disabled={!snapshot}
          hidden={Boolean(snapshot)}
          onClick={() => open(projectRoot, true)}
        >
          Refresh
        </button>
        {snapshot&&<button type="button" onClick={()=>{setPath(projectRoot);setEditingRepo(false);}}>Cancel</button>}
      </form>
      {snapshot&&<div className="source-bar"><strong>Artifact Plane</strong><span title={snapshot.repository.path}>{snapshot.repository.path.split('/').at(-1)} · {snapshot.repository.branch||'Detached HEAD'}</span><button onClick={()=>setEditingRepo(true)}>Change repository</button><button onClick={()=>open(projectRoot,true)}>Refresh</button><small>Read-only</small></div>}
      {error && (
        <div role="alert" className="error-banner">
          {error}
        </div>
      )}
      <div
        className={`workspace ${hasDetails?'':'without-inspector'}`}
        ref={workspaceRef}
        style={{ "--inspector-width": panelWidth + "px" }}
      >
        <aside className="sidebar">
          <div className="sidebar-title">
            <span className="eyebrow">Repository</span>
            {snapshot && (
              <span className="count">{snapshot.artifacts.length}</span>
            )}
          </div>
          {snapshot ? (
            <>
              <div className="repo-info">
                <strong title={snapshot.repository.path}>
                  {snapshot.repository.path.split("/").at(-1)}
                </strong>
                <span>
                  {snapshot.repository.branch} ·{" "}
                  {snapshot.repository.head?.slice(0, 7) || "No commits"}
                </span>
                <small>
                  {snapshot.repository.dirty
                    ? "Working tree has changes"
                    : "Working tree is clean"}
                </small>
              </div>
              <Worktrees workflow={snapshot.workflow} selected={unitWorktree} onSelect={activateWorktree} busy={busy}/>{openingWorktree&&<p role="status">Opening {openingWorktree}…</p>}
              {view==='units'?<SearchField label="Search units of work" value={unitFilter} onChange={setUnitFilter}/>:view!=='flows'&&<SearchField label="Filter artifact list" value={filter} onChange={setFilter}/>}
              <nav aria-label="Artifacts" style={{display:view === "units" || view === "flows" ? "none" : undefined}}>
                {snapshot.artifacts
                  .filter((a) =>
                    matchesName(filter,a.id,a.title),
                  )
                  .map((a) => (
                    <button
                      className={`artifact-list-item ${artifact?.id === a.id ? "active" : ""}`}
                      key={a.id}
                      onClick={() => selectArtifact(a.id)}
                    >
                      <span>{a.title}</span>
                      <small>
                        {a.currentVersion ? `v${a.currentVersion}` : "Initial"}{" "}
                        · {a.elements.length} elements
                      </small>
                    </button>
                  ))}
              </nav>
              {view==='canvas'&&filter&&<p className="tiny" role="status">{snapshot.artifacts.some(a=>matchesName(filter,a.id,a.title))?'Only the artifact list is filtered.':'No artifacts match this title or ID. The graph is unchanged.'}{artifact&&!matchesName(filter,artifact.id,artifact.title)&&' Selected artifact is outside the current results.'}</p>}
              <div ref={setFlowSidebar} className="flow-sidebar-slot" style={{display:view=== "flows" ? undefined : "none"}}/>
              {view!=="flows"&&<RecordedPicker selected={recordedSelected} onSelect={id=>{setRecordedSelected(id);setRecordedNode(null);if(id)setView('recorded');}}/>}
              {view === "units" && <UnitList snapshot={snapshot} worktreePath={unitWorktree} filter={unitFilter} selected={unitSelected} onSelect={value=>{setUnitSelected(value);setUnitView('artifacts');setUnitNodeSelected(null);}}/>}
            </>
          ) : (
            <p className="muted sidebar-help">
              Open a local ADD repository to discover its artifacts.
            </p>
          )}
          <div className="sidebar-footer">
            Git + Markdown
            <br />
            <span>Source of truth</span>
          </div>
        </aside>
        <main className={`canvas-area ${reader?'reading':''}`}>
          <div className="canvas-toolbar">
            <div>
              <strong>{view === "canvas" ? reviewKey ? "Change review" : taskContext ? "Implementation task graph" : "Dependency canvas" : view === "units" ? "Units of work" : view === "flows" ? "System flows" : "Recorded executions"}</strong>
              <small>{view === "canvas" ? reviewKey ? "Declared-current knowledge comparison" : "Upstream → downstream" : "Local worktrees · Git + Markdown"}</small>
            </div>
            {snapshot && <div className="view-toggle" role="group" aria-label="Explorer view"><button aria-pressed={view === "canvas"} className={view === "canvas" ? "active" : ""} onClick={()=>{closeReader();setView("canvas");}}>Dependencies</button><button aria-pressed={view === "units"} className={view === "units" ? "active" : ""} onClick={()=>{closeReader();setView("units");}}>Units of work</button><button aria-pressed={view === "flows"} className={view === "flows" ? "active" : ""} onClick={()=>{closeReader();openFlows(null);}}>Flows</button></div>}
            <div className="dependency-view-slot">{snapshot && (view === "canvas" && !taskContext && !reviewKey || view === "flows") && (
              <div
                className="view-toggle"
                role="group"
                aria-label={view === "flows" ? "Flow knowledge" : "Dependency view"}
              >
                <button
                  aria-pressed={view==="flows"?flowKnowledge==="established":!planning}
                  className={(view==="flows"?flowKnowledge==="established":!planning) ? "active" : ""}
                  onClick={() => chooseKnowledge("established")}
                >
                  Established
                </button>
                <button
                  aria-pressed={view==="flows"?flowKnowledge==="planning":planning}
                  className={(view==="flows"?flowKnowledge==="planning":planning) ? "active" : ""}
                  onClick={() => chooseKnowledge("planning")}
                >
                  Planning
                </button>
                {view === "flows" && <button aria-pressed={flowKnowledge==="all"} className={flowKnowledge==="all"?"active":""} onClick={()=>chooseKnowledge("all")}>All snapshots</button>}
              </div>
            )}
          </div></div>
          <div style={{ display: view === "canvas" && !taskContext && !reviewKey ? "contents" : "none" }}>
          {!snapshot || snapshot.artifacts.length === 0 ? (
            <div className="empty-canvas">
              <div className="empty-symbol">◇ → ◇</div>
              <h2>
                {snapshot
                  ? "No artifacts found"
                  : "Explore the knowledge behind your code"}
              </h2>
              <p>
                {snapshot
                  ? "Add artifact root READMEs under docs/artifacts in your repository."
                  : "Open an ADD repository to see its dependencies. Expand an artifact to follow the element references."}
              </p>
            </div>
          ) : (
            <div className="canvas-surface">
              <ReactFlow
                key={snapshot.repository.path}
                nodes={graph.nodes}
                edges={graph.edges}
                nodeTypes={nodeTypes}
                edgeTypes={labelledEdgeTypes}
                onNodeClick={onNodeClick}
                fitView
                fitViewOptions={{ padding: 0.18 }}
                onInit={instance=>requestAnimationFrame(()=>requestAnimationFrame(()=>instance.fitView({padding:0.18})))}
                nodesDraggable={false}
                nodesConnectable={false}
                edgesReconnectable={false}
                deleteKeyCode={null}
                selectionOnDrag={false}
                minZoom={0.1}
                maxZoom={2}
                colorMode="dark"
                proOptions={{}}
              >
                <GraphLabelLayout/>
                <Background color="#334059" gap={24} size={1} />
              </ReactFlow>
            </div>
          )}
          {snapshot && snapshot.artifacts.length > 0 && (
            <div className="canvas-legend">
              <span>
                <i className="line established" />
                Established
              </span>
              <span>
                <i className="line added" />
                Proposed addition
              </span>
              <span>
                <i className="line removed" />
                Proposed removal
              </span>
              <span>
                <i className="line reference-line" />
                Element reference
              </span>
            </div>
          )}
          {snapshot?.diagnostics.length > 0 && (
            <details className="diagnostics">
              <summary>
                {snapshot.diagnostics.length} repository diagnostic
                {snapshot.diagnostics.length === 1 ? "" : "s"}
              </summary>
              <div>
                {snapshot.diagnostics.map((d, i) => (
                  <p key={i}>
                    <strong>{d.code}</strong>
                    <span>{d.path}</span>
                    {d.message}
                  </p>
                ))}
              </div>
            </details>
          )}
          </div>
          {snapshot && reviewKey && <ChangeReview root={projectRoot} contextKey={reviewKey} epoch={overviewEpoch} session={loadedSession} active={isActive&&view==='canvas'} updating={busy} repositoryFresh={fresh} inspector={reviewInspector} onBack={()=>setReviewKey(null)}/>}
          {snapshot && taskContext && <div style={{display:view === "canvas" ? "contents" : "none"}}><TaskGraph key={taskChange} context={taskContext} selection={taskSelected} onSelect={setTaskSelected} onBack={()=>{setTaskChange(null);setTaskSelected(null);}}/></div>}
          {snapshot && view==='recorded' && <RecordedView id={recordedSelected} selection={recordedNode} onSelect={setRecordedNode}/>}
          {snapshot && <Flows path={projectRoot} worktree={unitWorktree} epoch={overviewEpoch} isActive={isActive&&view==="flows"} entry={flowEntry} knowledge={flowKnowledge} artifacts={snapshot.artifacts.map(a=>({id:a.id,title:a.title}))} sidebar={flowSidebar} inspector={flowInspector} onSelection={handleFlowSelection} onRead={openReader}/>}
          {(sectionState==='Error'||sectionState==='Stale')&&<div className="section-retry" role="alert">Evidence could not be updated. <button onClick={()=>setSectionRetry(n=>n+1)}>Retry evidence</button></div>}
          {snapshot && view === "units" && <UnitView loading={sectionState} context={selectedUnit} view={unitView} onView={value=>{setUnitView(value);setUnitNodeSelected(null);}} planning={unitPlanning} onPlanning={value=>{setUnitPlanning(value);setUnitNodeSelected(null);}} selection={unitNodeSelected} onSelect={setUnitNodeSelected}/>}
        </main>
        {reader&&<Reader entry={reader} root={projectRoot} worktree={unitWorktree} epoch={overviewEpoch} onBack={backReader} backLabel={readerTrail.length>1?'previous document':undefined} onClose={closeReader} targets={navigationTargets} onNavigate={openReader}/>}
        <div
          className="inspector-divider"
          hidden={!hasDetails}
          role="separator"
          aria-label="Resize details panel"
          aria-orientation="vertical"
          aria-valuemin={240}
          aria-valuemax={panelMax}
          aria-valuenow={panelWidth}
          aria-controls={`details-panel-${tabId}`}
          tabIndex={0}
          onKeyDown={resizeWithKeyboard}
          onPointerDown={(event) => {
            if (event.button !== 0) return;
            event.preventDefault();
            event.currentTarget.focus();
            event.currentTarget.setPointerCapture(event.pointerId);
          }}
          onPointerMove={dragPanel}
          onPointerUp={(event) => {
            if (event.currentTarget.hasPointerCapture(event.pointerId))
              event.currentTarget.releasePointerCapture(event.pointerId);
          }}
          onPointerCancel={(event) => {
            if (event.currentTarget.hasPointerCapture(event.pointerId))
              event.currentTarget.releasePointerCapture(event.pointerId);
          }}
        />
        <aside
          id={`details-panel-${tabId}`}
          className="details-panel"
          hidden={!hasDetails}
          aria-label="Selection details"
          inert={reader?true:undefined}
        >
          {view==='canvas'&&reviewKey ? <div ref={setReviewInspector} className="review-inspector-slot"/> : view==='flows' ? <div ref={setFlowInspector} className="flow-inspector-slot"/> : view==='recorded' ? <RecordedDetails id={recordedSelected} selection={recordedNode} onSelect={setRecordedNode}/> : view === "units" ? <UnitDetails onFlow={entry=>{const owner=entry.flow?.split(':')[0],member=selectedUnit?.unit.members.find(m=>m.artifact===owner);if(member?.sourcePath?.includes('/changes/')||member?.establishmentEvidence?.state==='proposed')chooseKnowledge('planning');openFlows(entry);}} onDocument={source=>openReader({source,parent:'unit',scope:{unit:selectedUnit.unit.id}})} document={document} onCompletion={loadCompletion} completionState={completionState} completionError={completionError} context={selectedUnit} view={unitView} planning={unitPlanning} selection={unitNodeSelected} onSelect={setUnitNodeSelected}/> : taskContext ? <TaskGraphDetails onRead={()=>openReader({source:taskContext.task.path,parent:'task',scope:{artifact:taskContext.change.artifact,change:taskContext.change.name}})} document={document} context={taskContext} onClear={()=>setTaskSelected(null)}/> : deliveryContext ? <ChangeDetails loading={sectionState} context={deliveryContext} phase={deliveryPhase} onPhase={setDeliveryPhase} onBack={()=>{setDeliveryChange(null);setDeliveryPhase(null);}} onTaskGraph={openTaskGraph} onReview={()=>setReviewKey(deliveryChange)}>{changeList}</ChangeDetails> : artifact ? (
            <>
              <div className="details-heading">
                <span className="eyebrow">
                  {element ? "Element details" : "Artifact details"}
                </span>
                <button
                  aria-label="Clear selection"
                  onClick={() => setSelection(null)}
                >
                  ×
                </button>
              </div>
              <h2>{element ? element.path : artifact.title}</h2>
              <div className="details-meta">
                <span>
                  {element
                    ? element.source
                    : artifact.currentVersion
                      ? `Established v${artifact.currentVersion}`
                      : "No established version"}
                </span>
                {!element && (
                  <span>
                    Active change:{" "}
                    {artifact.activeChange ||
                      (artifact.changes.length ? "Ambiguous" : "None")}
                  </span>
                )}
              </div>
              {!element&&<section aria-label="Artifact overview"><Markdown text={documentSummary(document?.markdown)}/><button onClick={()=>openReader({source:`docs/artifacts/${artifact.id}/README.md`,title:artifact.title,parent:'artifact',scope:{artifact:artifact.id}})}>Read overview</button></section>}
              {!element && (
                <>
                  <button
                    className="expand-details"
                    onClick={() => toggle(artifact.id)}
                  >
                    {expanded.has(artifact.id) ? "Collapse" : "Expand"} elements
                    on canvas
                  </button>
                  {changeList}
                  <details className="relationships"><summary>Dependencies</summary>
                    <h3>
                      {planning ? "Planning" : "Established"} dependencies
                    </h3>
                    <DependencyList
                      title="Upstream"
                      value={reachability.upstream}
                      onSelect={selectArtifact}
                    />
                    <DependencyList
                      title="Downstream"
                      value={reachability.downstream}
                      onSelect={selectArtifact}
                    />
                  </details>
                  <section>
                    <h3>Knowledge elements</h3>
                    {artifact.elements.length ? (
                      knowledgeGroups(artifact, listTypes).map((group) => {
                        const open = group.open;
                        return (
                          <div className="knowledge-type" key={group.key}>
                            <button
                              className="type-toggle inspector-type"
                              aria-label={group.ariaLabel.replace("Change histories","Historical documents") + " in inspector"}
                              aria-expanded={open}
                              onClick={() =>
                                toggleList(group.key)
                              }
                            >
                              <span>
                                {open ? "▾" : "▸"} {group.label==='Change histories'?'Historical documents':group.label}
                              </span>
                              <span className="type-count">{group.count}</span>
                            </button>
                            {open &&
                              group.sources.map((source) => (
                                <div
                                  className="knowledge-source"
                                  key={source.source}
                                >
                                  <h4>{source.label}</h4>
                                  {source.elements.map((e) => (
                                    <button
                                      className="element-list-item"
                                      data-reader-return={e.id}
                                      key={e.id}
                                      onClick={() =>
                                        readElement(e)
                                      }
                                    >
                                      <span>{e.path}</span>
                                      <small>{e.source}</small>
                                    </button>
                                  ))}
                                </div>
                              ))}
                          </div>
                        );
                      })
                    ) : (
                      <p className="muted">No elements found.</p>
                    )}
                  </section>
                </>
              )}
              {refs.length>0&&<section>
                <h3>References</h3>
                <ReferenceList references={refs} onTarget={selectTarget} />
              </section>}
              <section>
                <button onClick={()=>{if(element?.source?.startsWith('change:'))chooseKnowledge('planning');openFlows({artifact:artifact.id,worktree:selectedWorktree?.path||snapshot.repository.path,...(element?{ids:[element.id]}:{})});}}>Find participating flows</button>
                {element&&<button onClick={()=>readElement(element)}>Read document</button>}
              </section>
            </>
          ) : (
            <div className="empty-details">
              <span className="eyebrow">Inspector</span>
              <h2>Follow a dependency</h2>
              <p>
                Select an artifact or element on the canvas to inspect its
                knowledge and relationships.
              </p>
            </div>
          )}
        </aside>
      </div>
      <footer className="statusbar">
        <span>
          {busy
            ? "Reading repository…"
            : snapshot
              ? `${snapshot.artifacts.length} artifacts · ${snapshot.references.length} element references`
              : "Ready to open a repository"}
        </span>
        <span role="status" aria-label="Repository update status">{busy||sectionState==='Loading'?'Updating':snapshot?connected&&fresh&&sectionState!=='Error'&&sectionState!=='Stale'?'Current':'Stale · repository observation disconnected or update unavailable':'Not loaded'}</span>
      </footer>
    </div></RuntimeProvider>
  );
}
createRoot(document.getElementById("root")).render(<Workspace Explorer={ProjectExplorer}/>);
