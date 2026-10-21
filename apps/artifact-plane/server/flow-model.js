import {parseDocument} from 'yaml';
import {safeElementPath, currentSource, documentTitle} from '../src/model.js';

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

// Diagnostics that do not invalidate an otherwise valid flow record.
const SEMANTIC_CODES = new Set(['flow-evidence-gap', 'invalid-flow-participants', 'invalid-flow-interaction']);
// Model declarations: a top-level models list in specification front matter.
// Identity is artifact:model-id within one snapshot; sources are evidence only.
export function parseModels(element) {
  if (!/^specifications\/.+\.md$/.test(element.path) || /^specifications\/flows\//.test(element.path)) return null;
  const match = element.markdown.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  if (!match || !/(?:^|\n)models\s*:/.test(match[1])) return null;
  const diagnostics = [], models = [];
  const report = (code, message) => diagnostics.push({code, path: element.file, message});
  let data;
  try {const doc = parseDocument(match[1]);if (doc.errors.length) throw Error();data = doc.toJS({maxAliasCount: 50});}
  catch {report('invalid-model', 'Model front matter is invalid YAML or contains duplicate keys.');return {models, diagnostics};}
  if (!Array.isArray(data?.models)) {report('invalid-model', 'models must be a list.');return {models, diagnostics};}
  for (const m of data.models) {
    if (!object(m) || !safeFlowID(m.id) || !text(m.title) || !text(m.description) || !Array.isArray(m.sources) || !m.sources.length || !unique(m.sources)) {report('invalid-model', 'Models need a safe id, title, description and a nonempty unique sources list.');continue;}
    const unsafe = m.sources.filter(path => typeof path !== 'string' || !safeElementPath(path));
    if (unsafe.length) {report('unsafe-model-source', `Model ${m.id} has unsafe sources: ${unsafe.join(', ')}.`);continue;}
    models.push({id: m.id, title: m.title, description: m.description, sources: [...m.sources], artifact: element.artifact, source: element.source, file: element.file, elementId: element.id, logicalId: `${element.artifact}:${m.id}`});
  }
  return {models, diagnostics};
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
  // Participants and interactions are a separate semantic layer: invalid
  // records are diagnosed and dropped without invalidating the legacy flow.
  const participants = [];
  if (f.participants !== undefined) {
    if (!Array.isArray(f.participants)) report('invalid-flow-participants', 'participants must be a list.');
    else for (const p of f.participants) {
      const selector = p?.status === undefined && p?.change === undefined || p?.status === 'established' && p?.change === undefined || p?.status === 'proposed' && safeFlowID(p?.change) && p.change.startsWith('change-');
      if (!object(p) || !safeFlowID(p.id) || !safeFlowID(p.artifact) || !safeFlowID(p.model) || !text(p.requires) || !selector || participants.some(x => x.id === p.id)) {report('invalid-flow-participants', 'Participants need unique safe IDs, an owning artifact, a model ID, a role and valid selectors.');continue;}
      participants.push({id: p.id, artifact: p.artifact, model: p.model, requires: p.requires, ...(p.status ? {status: p.status} : {}), ...(p.change ? {change: p.change} : {})});
    }
  }
  const participantIDs = new Set(participants.map(p => p.id));
  const semanticSteps = steps.map(step => {
    if (!object(step) || step.interactions === undefined) return step;
    const interactions = [];
    if (!Array.isArray(step.interactions)) report('invalid-flow-interaction', `Step ${step.id} interactions must be a list.`);
    else for (const i of step.interactions) {
      if (!object(i) || !participantIDs.has(i.from) || !participantIDs.has(i.to) || !text(i.action) || !text(i.outcome) || !Array.isArray(i.supports) || !i.supports.length || !unique(i.supports) || !i.supports.every(id => supportIDs.has(id))) {report('invalid-flow-interaction', `Step ${step.id} interactions need declared participants, action, outcome and existing support IDs.`);continue;}
      interactions.push({from: i.from, to: i.to, action: i.action, outcome: i.outcome, supports: [...i.supports]});
    }
    return {...step, interactions};
  });
  const localId=safeFlowID(f.id)?f.id:element.path;
  const id = flowKey(context, element.artifact, element.source, 'flow', localId);
  const state=diagnostics.some(d => !SEMANTIC_CODES.has(d.code)) ? 'invalid' : 'valid';
  return {...f, id, localId, artifact:element.artifact, title:text(f.title)?f.title:localId,
    trigger:text(f.trigger)?f.trigger:'',outcome:text(f.outcome)?f.outcome:'',logicalId:`${element.artifact}:${localId}`, source:element.source,
    elementId:element.id, file:element.file, markdown:element.markdown,
    steps:state==='valid'?semanticSteps:[],participants:state==='valid'?participants:[],support:state==='valid'?support:[],transitions:state==='valid'?transitions:[],
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
  const models = new Map();
  for (const artifact of snapshot.artifacts) for (const element of artifact.elements) {
    const parsed = parseModels(element); if (!parsed) continue;
    diagnostics.push(...parsed.diagnostics);
    for (const m of parsed.models) {
      const key = JSON.stringify([m.artifact, m.source, m.id]);
      if (models.has(key)) {const first = models.get(key);if (first) diagnostics.push({code: 'duplicate-model', path: m.file, message: `Model ${m.logicalId} is declared more than once in ${m.source} (${first.file}).`});models.set(key, null);continue;}
      const known = new Set(artifact.elements.filter(e => e.source === m.source).map(e => e.path));
      m.missingSources = m.sources.filter(p => !known.has(p));
      models.set(key, m);
    }
  }
  // One declaration for each logical id: the current source, replaced by the
  // active change outside established knowledge, as for flows.
  const declared = new Map();
  const pick = (artifact, source) => {for (const [key, m] of models) {const [a, s, id] = JSON.parse(key);if (a === artifact && s === source) declared.set(`${a}:${id}`, m);}};
  for (const artifact of snapshot.artifacts) {
    const current = currentSource(artifact);
    if (current) pick(artifact.id, current);
    if (knowledge !== 'established' && artifact.activeChange) pick(artifact.id, `change:${artifact.activeChange}`);
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
  // One model node for each logical id. Only the declaration of the node gives
  // the missing-model-source diagnostic; a declaration that no flow uses
  // registers no flow source.
  const modelNodes = new Map(), modelId = m => flowKey(context, m.artifact, m.source, 'model', m.id);
  function modelNode(m, used) {
    if (modelNodes.has(m.logicalId)) return modelId(modelNodes.get(m.logicalId));
    const id = add({id: modelId(m), kind: 'model', title: m.title, description: m.description, artifact: m.artifact, source: m.source, logicalId: m.logicalId, file: m.file, sources: m.sources, missingSources: m.missingSources});
    modelNodes.set(m.logicalId, m);
    if (m.missingSources.length) diagnostics.push({code: 'missing-model-source', path: m.file, message: `Model ${m.logicalId} sources do not exist: ${m.missingSources.join(', ')}.`, model: m.logicalId, file: m.file});
    if (used) {const declaring = flowKey(context, m.artifact, m.source, 'element', m.file);sources.set(declaring, {id: declaring, path: m.file, kind: 'element', artifact: m.artifact, source: m.source});}
    for (const path of m.sources) {
      const element = elements.get(JSON.stringify([m.artifact, m.source, path]));
      if (!element) continue;
      const target = add({id: flowKey(context, m.artifact, m.source, 'element', element.file), kind: 'element', title: path, artifact: m.artifact, source: m.source, file: element.file, elementId: element.id});
      if (used) sources.set(target, {id: target, path: element.file, kind: 'element', artifact: m.artifact, source: m.source});
      link(id, target, 'describes', {resolved: true});
    }
    return id;
  }
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
    // Participants resolve like knowledge support; missing models stay named targets.
    for (const p of flow.participants || []) {
      // A participant that resolves to another source of the same logical id links to the selected node.
      const source = knowledgeSource(p, flow), model = source ? models.get(JSON.stringify([p.artifact, source, p.model])) : undefined;
      if (model) {
        p.nodeId = modelNode(declared.get(model.logicalId) || model, true);
      } else {
        p.nodeId = add({id: flowKey(context, p.artifact, source || 'unresolved', 'missing-model', p.model), kind: 'missing', title: `${p.artifact}:${p.model}`, artifact: p.artifact, source, selector: {status: p.status || 'established', ...(p.change ? {change: p.change} : {})}});
        const d = {code: model === null ? 'ambiguous-model' : 'unresolved-model', path: flow.file, message: `Participant ${p.id} has no unambiguous model ${p.artifact}:${p.model} in ${source || 'any declared source'}.`};
        flow.diagnostics.push(d);diagnostics.push(d);
      }
      p.source = source;p.resolved = !!model;
      link(flow.id, p.nodeId, 'participates', {participant: p.id, requires: p.requires, flow: flow.id, resolved: p.resolved});
    }
    const byParticipant = new Map((flow.participants || []).map(p => [p.id, p]));
    for (const step of flow.steps) for (const i of step.interactions || []) {
      const from = byParticipant.get(i.from), to = byParticipant.get(i.to), records = i.supports.map(id => flow.support.find(s => s.id === id));
      i.resolved = from.resolved && to.resolved && records.every(s => s?.resolved);
      i.bases = [...new Set(records.map(s => s?.basis).filter(Boolean))];
      link(from.nodeId, to.nodeId, 'interaction', {flow: flow.id, step: step.id, action: i.action, outcome: i.outcome, supports: i.supports, bases: i.bases, resolved: i.resolved});
    }
    for (const transition of flow.transitions) link(flow.steps.find(s => s.id===transition.from).nodeId,flow.steps.find(s => s.id===transition.to).nodeId,'transition',{condition:transition.condition || '',flow:flow.id});
  }
  // Models that no flow uses, then the declares edge of every model node.
  for (const m of declared.values()) if (m) modelNode(m, false);
  const byElement = new Map(snapshot.artifacts.flatMap(a => a.elements.map(e => [e.id, e])));
  for (const m of modelNodes.values()) {
    const element = byElement.get(m.elementId);
    if (!element) continue;
    // The declaring element shows its document title, also when a support created it.
    const target = add({id: flowKey(context, m.artifact, m.source, 'element', element.file), kind: 'element', artifact: m.artifact, source: m.source, file: element.file, elementId: element.id});
    nodes.get(target).title = documentTitle(element.markdown || '', element.path);
    link(modelId(m), target, 'declares', {resolved: true});
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
    if(!['supports','references','defines','participates','describes','declares'].includes(edge.kind)||edge.resolved===false)continue;
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
