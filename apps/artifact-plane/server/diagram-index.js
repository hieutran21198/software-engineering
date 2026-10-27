// Diagram index: navigation metadata of the working knowledge for the overview.
// It creates no relationship, no diagnostic and no graph edge.
import {marked} from 'marked';
import {frontMatter} from './units-of-work.js';
const front=/^---\r?\n[\s\S]*?\r?\n---(?:\r?\n|$)/;
const clip=(text,size)=>text.replace(/\s+/g,' ').trim().slice(0,size);
// The same predicate as renderer.code in src/Markdown.jsx, so the index equals data-diagram-index.
const diagram=token=>token.type==='code'&&(token.lang||'').trim().split(/\s+/)[0]==='mermaid';
const labels={'Source:':'source','Illustrative:':'illustrative'};
export function diagramRecords(markdown){
 const tokens=marked.lexer(markdown.replace(front,'')),after=new Map(),records=[];let heading=null;
 // The source and stale paragraphs directly follow the diagram in its container; another block ends them.
 const siblings=list=>list.forEach((token,i)=>after.set(token,list.slice(i+1).filter(t=>t.type!=='space')));
 siblings(tokens);
 marked.walkTokens(tokens,token=>{
  if(token.type==='blockquote'||token.type==='list_item')siblings(token.tokens);
  if(token.type==='heading')heading=token.text;
  if(!diagram(token))return;
  const lines=token.text.split(/\r?\n/).map(line=>line.trim()),next=[];
  // A tight list item holds its paragraphs as block text tokens.
  for(const t of after.get(token)||[]){if(t.type!=='paragraph'&&t.type!=='text'||next.length===2)break;next.push(clip(t.text,300));}
  const title=lines.find(line=>/^accTitle\s*:/.test(line))?.replace(/^accTitle\s*:/,''),label=Object.keys(labels).find(l=>next[0]?.startsWith(l));
  records.push({index:records.length,type:lines.find(line=>line&&!line.startsWith('%%'))?.split(/\s+/)[0]??null,title:title&&clip(title,120)||null,heading,source:label?{kind:labels[label],text:next[0]}:null,stale:next.find(text=>text.startsWith('Stale:'))??null});
 });
 return records;
}
// Adds systemView and diagrams to working elements, only when they have a value.
// Only in-place artifacts have working elements; texts holds the scan bytes by repository path.
export function indexDiagrams(snapshot,texts){
 for(const artifact of snapshot.artifacts)for(const element of artifact.elements){
  const bytes=element.source==='working'&&texts?.get(element.file);if(!bytes)continue;
  const markdown=bytes.toString('utf8');
  if(markdown.includes('system_view')&&frontMatter(markdown).value?.system_view===true&&!element.path.startsWith('specifications/flows/'))element.systemView=true;
  const diagrams=markdown.includes('mermaid')?diagramRecords(markdown):[];
  if(diagrams.length)element.diagrams=diagrams;
 }
 return snapshot;
}
