import {parseDocument} from 'yaml';
import {safeElementPath, currentSource} from '../src/model.js';

export const safeFlowID = value => typeof value === 'string' && /^[a-z0-9][a-z0-9-]*$/.test(value);
const text = value => typeof value === 'string' && value.trim().length > 0;
const object = value => value && typeof value === 'object' && !Array.isArray(value);
const unique = values => new Set(values).size === values.length;
export const flowKey = (context, artifact, source, kind, id) => JSON.stringify([context, artifact, source, kind, id]);
export function safeFlowSource(path) {
  return typeof path === 'string' && path.length > 0 && !path.includes('\\') && !path.includes('\0') &&
    !path.startsWith('/') && !/^[a-z]:/i.test(path) &&
    path.split('/').every(part => part && part !== '.' && part !== '..' && (!part.startsWith('.') || part === '.github')) &&
    !/(?:^|\/)(?:credentials|secrets?|tokens?)\.(?:json|ya?ml|toml)$/i.test(path) &&
    /\.(?:md|go|[cm]?js|jsx|ts|tsx|py|rs|java|kt|swift|ya?ml|json|toml|sh|sql|html|css)$/i.test(path);
}

export function parseFlow(element, context = '') {
  if (!/^specifications\/flows\/.+\.md$/.test(element.path)) return null;
  const diagnostics = [];
  const report = (code, message) => diagnostics.push({code, path: element.file, message});
  const invalid=()=>({id:flowKey(context,element.artifact,element.source,'flow',element.path),localId:element.path,
    logicalId:`${element.artifact}:${element.path}`,artifact:element.artifact,source:element.source,
    title:element.path,trigger:'',outcome:'',elementId:element.id,file:element.file,markdown:element.markdown,
    steps:[],support:[],transitions:[],gaps:[],exclusions:[],state:'invalid',diagnostics});
  const match = element.markdown.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  if (!match) { report('invalid-flow', 'Flow document needs YAML front matter.'); return invalid(); }
  let data;
  try {const doc = parseDocument(match[1]); if (doc.errors.length) throw Error(doc.errors[0].message); data = doc.toJS({maxAliasCount:50}); JSON.stringify(data);}
  catch {report('invalid-flow', 'Flow front matter is invalid YAML or contains duplicate keys.'); return invalid();}
  const f = data?.flow;
  if (!object(f)) {report('invalid-flow', 'Declare a flow object.'); return invalid();}
  if (!safeFlowID(f.id) || f.artifact !== element.artifact) report('invalid-flow', 'Flow needs a safe ID and its owning artifact.');
  for (const key of ['title','trigger','outcome']) if (!text(f[key])) report('invalid-flow', `Flow needs nonempty ${key}.`);
  const steps = Array.isArray(f.steps) ? f.steps : [];
  const support = Array.isArray(f.support) ? f.support : [];
  const transitions = Array.isArray(f.transitions) ? f.transitions : [];
  if (!Array.isArray(f.steps) || !steps.length || !steps.every(s => object(s) && safeFlowID(s.id) && text(s.title)) || !unique(steps.map(s => s?.id))) report('invalid-flow', 'Steps need unique safe IDs and titles.');
  if (!Array.isArray(f.support) || !support.every(s => object(s) && safeFlowID(s.id)) || !unique(support.map(s => s?.id))) report('invalid-flow', 'Support needs unique safe IDs.');
  const stepIDs = new Set(steps.map(s => s?.id)), supportIDs = new Set(support.map(s => s?.id));
  if (!Array.isArray(f.entry_steps) || !f.entry_steps.length || !unique(f.entry_steps) || !f.entry_steps.every(id => stepIDs.has(id))) report('invalid-flow', 'Entry steps must resolve uniquely.');
  if (!Array.isArray(f.transitions) || !transitions.every(e => object(e) && stepIDs.has(e.from) && stepIDs.has(e.to) && (e.condition === undefined || text(e.condition)))) report('invalid-flow', 'Transitions need declared endpoints and valid conditions.');
  for (const step of steps) {
    if (!Array.isArray(step?.supports) || !unique(step.supports) || !step.supports.every(id => supportIDs.has(id))) report('invalid-flow', 'Step support endpoints must resolve uniquely.');
    else if (!step.supports.length && !f.gaps?.length) report('flow-evidence-gap', `Step ${step.id} has no supporting evidence or explained gap.`);
  }
  for (const s of support) {
    if (!object(s)) continue;
    if (!text(s.requires) || !['documented','static','observed','inferred'].includes(s.basis)) report('invalid-flow', 'Support needs a reason and valid evidence basis.');
    if (s.basis === 'observed' && (!Array.isArray(s.evidence) || !s.evidence.length || !s.evidence.every(safeFlowSource))) report('invalid-flow', 'Observed support needs safe recorded evidence paths.');
    if (['element','flow'].includes(s.kind)) {
      if (!safeFlowID(s.artifact) || (s.kind === 'element' ? !safeElementPath(s.element) : !safeFlowID(s.flow))) report('invalid-flow', 'Knowledge support needs safe artifact and target selectors.');
      if (s.status !== undefined && !['established','proposed'].includes(s.status) || s.status === 'proposed' && (!safeFlowID(s.change) || !s.change.startsWith('change-')) || s.change !== undefined && s.status !== 'proposed') report('invalid-flow', 'Proposed support needs its supplying change; established support cannot select a change.');
    } else if (['implementation','test'].includes(s.kind)) {
      if (!safeFlowSource(s.path) || s.symbol !== undefined && !text(s.symbol)) report('unsafe-flow-source', 'Implementation/test support needs a safe tracked text source.');
    } else report('invalid-flow', 'Support kind must be element, flow, implementation or test.');
  }
  for (const key of ['gaps','exclusions']) if (f[key] !== undefined && (!Array.isArray(f[key]) || !f[key].every(text))) report('invalid-flow', `${key} must contain nonempty explanations.`);
  const localId=safeFlowID(f.id)?f.id:element.path;
  const id = flowKey(context, element.artifact, element.source, 'flow', localId);
  const state=diagnostics.some(d => d.code !== 'flow-evidence-gap') ? 'invalid' : 'valid';
  return {...f, id, localId, artifact:element.artifact, title:text(f.title)?f.title:localId,
    trigger:text(f.trigger)?f.trigger:'',outcome:text(f.outcome)?f.outcome:'',logicalId:`${element.artifact}:${localId}`, source:element.source,
    elementId:element.id, file:element.file, markdown:element.markdown,
    steps:state==='valid'?steps:[],support:state==='valid'?support:[],transitions:state==='valid'?transitions:[],
    gaps:Array.isArray(f.gaps)?f.gaps.filter(text):[],exclusions:Array.isArray(f.exclusions)?f.exclusions.filter(text):[],diagnostics,state};
}

// This projection is not an execution DAG. Runtime transitions can contain loops.
export function buildFlowGraph(snapshot, {context = '', knowledge = 'planning'} = {}) {
  const diagnostics = [], records = [], all = new Map(), byArtifact = new Map(snapshot.artifacts.map(a => [a.id,a]));
  for (const artifact of snapshot.artifacts) for (const element of artifact.elements) {
    const flow = parseFlow(element, context); if (!flow) continue;
    diagnostics.push(...flow.diagnostics);
    if (!flow.logicalId) continue;
    const key = JSON.stringify([flow.artifact,flow.source,flow.localId]);
    if (all.has(key)) {flow.state='invalid';all.get(key).state='invalid';diagnostics.push({code:'duplicate-flow',path:flow.file,message:'Flow identity is duplicated within its snapshot.'});}
    else all.set(key,flow);
    records.push(flow);
  }
  const selected = new Map();
  for (const artifact of snapshot.artifacts) {
    const candidates = records.filter(f => f.artifact === artifact.id && f.source === currentSource(artifact));
    for (const f of candidates) selected.set(f.logicalId,f);
    if (knowledge === 'planning' && artifact.activeChange) for (const f of records.filter(f => f.artifact === artifact.id && f.source === `change:${artifact.activeChange}`)) selected.set(f.logicalId,f);
  }
  if (knowledge === 'all') {selected.clear();for (const f of records) selected.set(f.id,f);}
  const flows = [...selected.values()].sort((a,b) => a.logicalId.localeCompare(b.logicalId) || a.source.localeCompare(b.source));
  const nodes = new Map(), edges = [], sources = new Map(), elements = new Map(snapshot.artifacts.flatMap(a => a.elements.map(e => [JSON.stringify([a.id,e.source,e.path]),e])));
  const add = node => {if (!nodes.has(node.id)) nodes.set(node.id,node);return node.id;};
  const link = (source,target,kind,extra = {}) => edges.push({id:JSON.stringify([source,target,kind,edges.length]),source,target,kind,...extra});
  function knowledgeSource(s, flow) {const owner=byArtifact.get(s.artifact);if(owner?.layout==='in-place')return 'working';return s.status === 'proposed' ? `change:${s.change}` : s.artifact === flow.artifact && !s.status ? flow.source : owner?.currentVersion ? `version:${owner.currentVersion}` : null;}
  for (const flow of flows) {
    add({id:flow.id,kind:'flow',title:flow.title,artifact:flow.artifact,source:flow.source,logicalId:flow.logicalId,file:flow.file});
    const owner=add({id:flowKey(context,flow.artifact,flow.source,'artifact',flow.artifact),kind:'artifact',title:flow.artifact,artifact:flow.artifact,source:flow.source});
    link(owner,flow.id,'contains');
    const element=add({id:flowKey(context,flow.artifact,flow.source,'element',flow.file),kind:'element',title:flow.file,artifact:flow.artifact,source:flow.source,file:flow.file,elementId:flow.elementId});
    link(element,flow.id,'defines');sources.set(element,{id:element,path:flow.file,kind:'element',artifact:flow.artifact,source:flow.source});
    if (flow.state !== 'valid') continue;
    for (const step of flow.steps) {
      step.nodeId=add({id:flowKey(context,flow.artifact,flow.source,'step',`${flow.localId}:${step.id}`),kind:'step',title:step.title,artifact:flow.artifact,source:flow.source,flow:flow.id,localId:step.id});
      link(flow.id,step.nodeId,'contains');
    }
    for (const support of flow.support) {
      let target, resolved=false, file=null;
      if (['implementation','test'].includes(support.kind)) {
        file=support.path;target=flowKey(context,'', 'worktree','source',file);resolved=true;
        add({id:target,kind:support.kind,title:file,file});sources.set(target,{id:target,path:file,kind:support.kind});
      } else if (support.kind === 'element') {
        const source=knowledgeSource(support,flow), element=elements.get(JSON.stringify([support.artifact,source,support.element]));
        file=element?.file;resolved=!!element;target=flowKey(context,support.artifact,source || 'unresolved','element',file || support.element);
        add({id:target,kind:resolved?'element':'missing',title:support.element,artifact:support.artifact,source,file,elementId:element?.id});
        if(file)sources.set(target,{id:target,path:file,kind:'element',artifact:support.artifact,source});
      } else {
        const source=knowledgeSource(support,flow), targetFlow=all.get(JSON.stringify([support.artifact,source,support.flow]));
        resolved=targetFlow?.state === 'valid';target=targetFlow?.id || flowKey(context,support.artifact,source || 'unresolved','flow',support.flow);
        add({id:target,kind:resolved?'flow':'missing',title:targetFlow?.title || support.flow,artifact:support.artifact,source,logicalId:targetFlow?.logicalId});
        if(resolved&&!flows.some(f=>f.id===targetFlow.id))flows.push(targetFlow);
      }
      support.targetId=target;support.resolved=resolved;support.file=file;
      // In-place targets are labeled by their bytes against the protected baseline.
      const targetState=support.kind==='element'?elements.get(JSON.stringify([support.artifact,'working',support.element]))?.state:null;
      if(targetState)support.targetLabel=['added','modified'].includes(targetState)?'proposed':targetState==='unchanged'?'established':'unknown';
      if (!resolved) {const d={code:'unresolved-flow-support',path:flow.file,message:`Support ${support.id} has no unambiguous readable target.`};flow.diagnostics.push(d);diagnostics.push(d);}
      for (const step of flow.steps.filter(step => step.supports.includes(support.id))) link(step.nodeId,target,'supports',{reason:support.requires,basis:support.basis,support:support.id,flow:flow.id,resolved});
    }
    for (const transition of flow.transitions) link(flow.steps.find(s => s.id===transition.from).nodeId,flow.steps.find(s => s.id===transition.to).nodeId,'transition',{condition:transition.condition || '',flow:flow.id});
  }
  // Existing element references can carry impact beyond a directly linked flow.
  for (const ref of snapshot.references || []) if (ref.resolved) {
    const consumer=snapshot.artifacts.flatMap(a=>a.elements).find(e=>e.id===ref.consumer), target=snapshot.artifacts.flatMap(a=>a.elements).find(e=>e.id===ref.targetId);
    if(!consumer||!target)continue;
    const a=flowKey(context,consumer.artifact,consumer.source,'element',consumer.file), b=flowKey(context,target.artifact,target.source,'element',target.file);
    add({id:a,kind:'element',title:consumer.path,file:consumer.file,artifact:consumer.artifact,source:consumer.source,elementId:consumer.id});
    add({id:b,kind:'element',title:target.path,file:target.file,artifact:target.artifact,source:target.source,elementId:target.id});
    link(a,b,'references',{reason:ref.reason,resolved:true});
  }
  return {flows,nodes:[...nodes.values()],edges,sources:[...sources.values()],diagnostics,knowledge};
}

export function flowImpact(graph, ids) {
  const nodes=new Map(graph.nodes.map(n=>[n.id,n])), reverse=new Map(), starts=new Set(), paths=new Map();
  const matches=(node,id)=>node.id===id||node.logicalId===id||node.elementId===id||node.file===id||id.startsWith('artifact:')&&node.artifact===id.slice(9);
  for(const id of ids)for(const node of graph.nodes)if(matches(node,id))starts.add(node.id);
  for(const edge of graph.edges) {
    if(!['supports','references','defines'].includes(edge.kind)||edge.resolved===false)continue;
    if(!reverse.has(edge.target))reverse.set(edge.target,[]);reverse.get(edge.target).push(edge);
  }
  const queue=[...starts],visited=new Set(queue);for(const id of queue)paths.set(id,[]);
  const flowByStep=new Map(graph.nodes.filter(n=>n.kind==='step').map(n=>[n.id,n.flow]));
  for(let i=0;i<queue.length;i++) {
    const id=queue[i], parent=flowByStep.get(id);
    if(parent&&!visited.has(parent)){visited.add(parent);queue.push(parent);paths.set(parent,[...paths.get(id),{source:parent,target:id,kind:'contains'}]);}
    for(const edge of reverse.get(id)||[])if(!visited.has(edge.source)){visited.add(edge.source);queue.push(edge.source);paths.set(edge.source,[...paths.get(id),edge]);}
  }
  const flows=graph.flows.filter(f=>visited.has(f.id)).map(f=>({...f,impactPath:paths.get(f.id)}));
  return {flows,visited:[...visited].map(id=>nodes.get(id)),unresolved:ids.filter(id=>![...starts].some(start=>matches(nodes.get(start),id))),coverage:'Explicit known relationships only; participation requires contract impact review.'};
}
