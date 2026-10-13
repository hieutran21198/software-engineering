import {buildUnitGraphs} from './unit-graphs.js';
import {parseDocument} from 'yaml';
import {marked} from 'marked';
import {buildTaskGraph} from './task-graph.js';

const name = value => typeof value === 'string' && /^[a-z0-9][a-z0-9-]*$/.test(value);
const changeName = value => typeof value === 'string' && /^change-[a-z0-9][a-z0-9-]*$/.test(value);
const nonempty = value => typeof value === 'string' && value.trim().length > 0;
const mapping = value => value && typeof value === 'object' && !Array.isArray(value);
export const safeKnowledgePath = value => typeof value === 'string' && value.startsWith('docs/artifacts/') && !value.includes('\\') && !value.includes('\0') && value.split('/').every(p => p && p !== '.' && p !== '..' && p !== '.git') && value.endsWith('.md');
export function frontMatter(markdown) {
  if (!markdown?.startsWith('---\n') && !markdown?.startsWith('---\r\n')) return {value: {}};
  const match = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  if (!match) return {error: true};
  try {
    const doc = parseDocument(match[1]);
    const value = doc.toJS();
    return doc.errors.length || !mapping(value) ? {error: true} : {value};
  } catch {return {error: true};}
}
export function parseUnitBrief(path, markdown) {
  const id = path.split('/')[3];
  const diagnostics = [];
  const report = (code, message) => diagnostics.push({code, path, message});
  const metadata = frontMatter(markdown), value = metadata.value || {};
  if (metadata.error || !name(id) || value.unit_of_work !== id) report('invalid-unit', 'Brief metadata must be valid YAML with a unit_of_work matching its safe directory name.');
  const members = [], seen = new Set(), artifacts = new Set();
  if (!Array.isArray(value.changes) || !value.changes.length) report('invalid-membership', 'A unit needs at least one participating artifact change.');
  else for (const member of value.changes) {
    if (!mapping(member) || !name(member.artifact) || !changeName(member.change)) {report('invalid-membership', 'Each member must name a safe artifact and change.');continue;}
    const key = JSON.stringify([member.artifact, member.change]);
    if (seen.has(key)) {report('invalid-membership', 'Members must be unique, with one change per artifact.');continue;}
    if (artifacts.has(member.artifact)) report('invalid-membership', 'Members must be unique, with one change per artifact.');
    seen.add(key);artifacts.add(member.artifact);members.push({artifact:member.artifact, change:member.change});
  }
  const acceptance = [], criteria = new Set();
  if (!Array.isArray(value.acceptance) || !value.acceptance.length) report('invalid-acceptance', 'A unit needs observable shared acceptance criteria.');
  else for (const criterion of value.acceptance) {
    if (!mapping(criterion) || !name(criterion.id) || !nonempty(criterion.criterion) || (criterion.integration !== undefined && typeof criterion.integration !== 'boolean') || criteria.has(criterion.id)) {report('invalid-acceptance', 'Criteria need unique IDs, nonempty text, and an optional boolean integration declaration.');continue;}
    criteria.add(criterion.id);acceptance.push({id:criterion.id, criterion:criterion.criterion, integration:criterion.integration === true});
  }
  if (members.length > 1 && !acceptance.some(c=>c.integration)) report('missing-integration-criterion', 'A multi-artifact outcome requires a shared integration criterion.');
  const evidence = [];
  if (value.evidence !== undefined && !Array.isArray(value.evidence)) report('invalid-evidence', 'Evidence must be a list of recorded check results.');
  else for (const entry of value.evidence || []) {
    const source = typeof entry?.source === 'string' ? entry.source.split('#') : [];
    if (!mapping(entry) || !criteria.has(entry.criterion) || !nonempty(entry.method) || !['passed','failed','incomplete'].includes(entry.result) || !safeKnowledgePath(source[0]) || source.length > 2 || source.length === 2 && !nonempty(source[1])) {report('invalid-evidence', 'Evidence must name a criterion, method, recorded result, and safe Markdown source.');continue;}
    evidence.push({...entry, resolved:false, markdown:null});
  }
  const title = marked.lexer(markdown || '').find(t=>t.type==='heading' && t.depth===1)?.text || id;
  return {id, title, path, markdown, members, acceptance, evidence, diagnostics, completion:{derivation:'unknown',reasons:[],sources:[]}};
}
export function unitBriefs(files) {
  return [...files].filter(([p])=>/^docs\/artifacts\/units-of-work\/[^/]+\/README\.md$/.test(p)).map(([p,body])=>parseUnitBrief(p,body));
}
export function versionClaims(files, artifact, change) {
  return [...files].filter(([p,body])=>{
    const match = p.match(/^docs\/artifacts\/([^/]+)\/versions\/(\d+\.\d+\.\d+)\/README\.md$/);
    return match && match[1]===artifact && frontMatter(body).value?.source_change===change;
  }).map(([path])=>({version:path.split('/')[4], prefix:path.slice(0,-'README.md'.length)}));
}
// Only local protected refs establish knowledge. Branch files are never proof.
async function publication(root, prefix, files, git, reviewText = '', reviewSource = null) {
  const refs = [];
  for (const ref of ['refs/heads/main','refs/heads/master']) {
    try {await git(root,['rev-parse','--verify',ref]);refs.push(ref);} catch { /* Missing local ref is not publication. */ }
  }
  if (!refs.length) return {state:'unknown', reasons:['No readable local main or master ref.'], sources:[]};
  const observed = [], sources = [];
  try {
    for (const ref of refs) {
      const paths = (await git(root,['ls-tree','-r','--name-only',ref,'--',prefix])).split('\n').filter(Boolean);
      if (!paths.length) continue;
      const contents = new Map();
      for (const path of paths) contents.set(path,await git(root,['show',`${ref}:${path}`],true));
      observed.push(contents);
      const selected = [...files].filter(([p])=>p.startsWith(prefix));
      if (contents.size===selected.length && selected.every(([p,body])=>contents.get(p)===body)) sources.push({ref,path:`${prefix}README.md`});
    }
    if (observed.length > 1 && [...observed[0]].some(([p,body])=>observed[1].get(p)!==body) || observed.length > 1 && observed[0].size!==observed[1].size) return {state:'unknown',reasons:['Protected refs disagree about delivered knowledge.'],sources:[]};
    if (!sources.length) return {state:'proposed',reasons:['Delivered snapshot is not identical to knowledge on local main or master.'],sources:[]};
    // Merge evidence remains an author assertion. Require an explicit statement
    // of the all-required-merges boundary rather than guessing from task checks.
    const review = [...files].filter(([p])=>p.startsWith(prefix)).map(([,body])=>marked.lexer(body).filter(t=>t.type!=='code').map(t=>t.raw).join('\n')).join('\n') + '\n' + reviewText;
    const localBoundary = /all required (?:knowledge and (?:code|implementation)|implementation and knowledge) changes (?:are|live|reside) in this repository\b/i.test(review);
    const mergedBoundary = /all required (?:knowledge and (?:code|implementation)|implementation and knowledge) (?:changes |merges )?(?:have landed|have merged|are merged|landed) (?:on|into) (?:main|master)\b/i.test(review);
    if ((localBoundary || mergedBoundary) && reviewText && reviewSource) sources.push({path:reviewSource,kind:'documented-merge-review'});
    return {state:localBoundary || mergedBoundary ? 'established' : 'unverified',reasons:localBoundary || mergedBoundary ? [] : ['Knowledge is published; all required implementation merges lack explicit review evidence.'],sources};
  } catch {return {state:'unknown',reasons:['Protected-ref snapshot evidence could not be read.'],sources:[]};}
}
function anchor(text) {return text.toLowerCase().replace(/[^\p{L}\p{N}_\s-]/gu,'').trim().replace(/\s/g,'-');}
function evidenceDetail(markdown, fragment) {
  const body = markdown.replace(/^---\r?\n[\s\S]*?\r?\n---(?:\r?\n|$)/,'');
  const tokens = marked.lexer(body);
  if (!fragment) return tokens.some(t=>t.type!=='heading' && t.type!=='space') ? body : null;
  let start=-1,end=tokens.length;
  for (let i=0;i<tokens.length;i++) if (tokens[i].type==='heading' && anchor(tokens[i].text)===fragment) {start=i;break;}
  if (start<0) return null;
  for(let i=start+1;i<tokens.length;i++)if(tokens[i].type==='heading' && tokens[i].depth<=tokens[start].depth){end=i;break;}
  const section=tokens.slice(start+1,end);
  return section.some(t=>t.type!=='space') ? section.map(t=>t.raw).join('') : null;
}
export async function readUnitsOfWork(root, data, changes, git, checklist) {
  const {files,snapshot,unsafeTaskPaths} = data, units=unitBriefs(files), owners=new Map(), publicationCache=new Map();
  for(const unit of units)for(const m of unit.members){const key=JSON.stringify([m.artifact,m.change]);const list=owners.get(key)||[];list.push(unit);owners.set(key,list);}
  for(const list of owners.values())if(new Set(list).size>1)for(const unit of new Set(list))unit.diagnostics.push({code:'duplicate-membership',path:unit.path,message:'This change is claimed by multiple units of work.'});
  for(const unit of units){
    for(const member of unit.members){
      const base=`docs/artifacts/${member.artifact}/`,changePath=`${base}changes/${member.change}/`,claims=versionClaims(files,member.artifact,member.change);
      const artifact=snapshot.artifacts.find(a=>a.id===member.artifact);
      member.retainedChangePath=artifact?.changes.some(c=>c.name===member.change)?changePath:null;
      member.deliveredVersion=claims.length===1?claims[0].version:null;
      member.sourcePath=member.deliveredVersion?claims[0].prefix:member.retainedChangePath;
      member.workflow=changes.find(c=>c.artifact===member.artifact && c.name===member.change)||null;
      member.establishmentEvidence={state:'proposed',reasons:['No originating version is published.'],sources:[]};
      if(!artifact || !member.sourcePath || claims.length>1)unit.diagnostics.push({code:claims.length>1?'ambiguous-provenance':'missing-member',path:unit.path,message:`Cannot resolve ${member.artifact} / ${member.change} unambiguously.`});
      for (const [path,body] of files) {
        if (!path.startsWith(`${base}versions/`) || !/^docs\/artifacts\/[^/]+\/versions\/\d+\.\d+\.\d+\/README\.md$/.test(path)) continue;
        const metadata = frontMatter(body);
        if (metadata.error || metadata.value?.source_change !== undefined && !changeName(metadata.value.source_change)) unit.diagnostics.push({code:'invalid-provenance',path,message:'Version provenance must be valid YAML naming a safe originating change.'});
      }
      if(member.deliveredVersion){if(!publicationCache.has(member.sourcePath))publicationCache.set(member.sourcePath,await publication(root,member.sourcePath,files,git,unit.markdown.split('\n').filter(line=>line.startsWith(`${member.artifact} ${member.deliveredVersion}: `)).join('\n'),unit.path));member.establishmentEvidence=publicationCache.get(member.sourcePath);}
      member.knowledge=[...files].filter(([p])=>member.sourcePath && p.startsWith(member.sourcePath) || member.retainedChangePath && p.startsWith(member.retainedChangePath)).map(([path,markdown])=>({path,markdown}));
      member.markdown=files.get(`${member.sourcePath}README.md`)||'';
      member.taskGraph=member.sourcePath?buildTaskGraph(files,member.sourcePath,checklist,unsafeTaskPaths):{state:'unavailable',tasks:[],edges:[],diagnostics:[]};
    }
    for(const evidence of unit.evidence){
      const [source,fragment]=evidence.source.split('#'),body=files.get(source);
      evidence.markdown=body===undefined?null:evidenceDetail(body,fragment);
      evidence.resolved=!!evidence.markdown;
      // A source in mutable change knowledge cannot support historical completion.
      evidence.deliveredSource=source===unit.path || unit.members.some(m=>m.deliveredVersion && source.startsWith(m.sourcePath));
      if(!evidence.resolved)unit.diagnostics.push({code:'missing-evidence',path:evidence.source,message:'Evidence source or nonempty check details cannot be resolved.'});
    }
    const reasons=[];
    const missing=unit.acceptance.filter(c=>!unit.evidence.some(e=>e.criterion===c.id && e.result==='passed' && e.resolved && e.deliveredSource) || unit.evidence.some(e=>e.criterion===c.id && e.result!=='passed'));
    if(missing.length)reasons.push(`Shared criteria lack passing delivered evidence: ${missing.map(c=>c.id).join(', ')}.`);
    for(const m of unit.members)if(m.establishmentEvidence.state!=='established')reasons.push(`${m.artifact}: ${m.establishmentEvidence.reasons.join(' ')}`);
    const unknown=unit.diagnostics.length>0 || unit.members.some(m=>['unknown','unverified'].includes(m.establishmentEvidence.state));
    unit.completion={derivation:unknown?'unknown':missing.length || unit.members.some(m=>m.establishmentEvidence.state!=='established')?'incomplete':'documented-complete',reasons,sources:unit.members.flatMap(m=>m.establishmentEvidence.sources)};
  }
  return units.map(unit=>buildUnitGraphs(unit,snapshot,root,files));
}
