import React,{useEffect,useMemo,useRef} from 'react';
import {marked,Renderer} from 'marked';
import DOMPurify from 'dompurify';
import {codePanelHTML} from './code-highlight.js';
import {resolveKnowledgeLink} from './knowledge-navigation.js';
const forbidden=['img','svg','math','iframe','form','input','button','style'];
const rawOptions={FORBID_TAGS:forbidden,FORBID_ATTR:['href','src','style','id','name','target'],ALLOW_DATA_ATTR:false};
const escape=value=>String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const slug=text=>text.trim().toLowerCase().replace(/[^\p{L}\p{N}\s-]/gu,'').replace(/\s+/g,'-');
export default function Markdown({text='',source,targets,onNavigate}){
 const ref=useRef(null);
 const {html,links,diagrams}=useMemo(()=>{
  const content=text.replace(/^---\r?\n[\s\S]*?\r?\n---(?:\r?\n|$)/,''),links=[],diagrams=[],renderer=new Renderer();
  // A fenced block with the first info word "mermaid" is a diagram block: a figure that holds its code panel.
  renderer.code=({text,lang})=>{
   const panel=codePanelHTML(text,lang||'');
   if((lang||'').trim().split(/\s+/)[0]!=='mermaid')return panel;
   return `<figure class="diagram-block" data-diagram-index="${diagrams.push(text)-1}">${panel}</figure>`;
  };
  renderer.html=token=>DOMPurify.sanitize(token.text,rawOptions);
  renderer.link=function({href,tokens}){
   const label=this.parser.parseInline(tokens);
   if(!onNavigate||!source)return label;
   const target=resolveKnowledgeLink(source,href,targets),index=links.push(target)-1;
   return `<span data-knowledge-index="${index}">${label}</span>`;
  };
  const fragment=DOMPurify.sanitize(marked.parse(content,{renderer}),{...rawOptions,ADD_ATTR:['data-knowledge-index','data-diagram-index'],RETURN_DOM_FRAGMENT:true});
  const seen=new Map();for(const heading of fragment.querySelectorAll('h1,h2,h3,h4,h5,h6')){const base=slug(heading.textContent),n=seen.get(base)||0;seen.set(base,n+1);heading.id=`knowledge-heading-${base}${n?`-${n}`:''}`;}
  for(const marker of fragment.querySelectorAll('[data-knowledge-index]')){
   const index=Number(marker.getAttribute('data-knowledge-index')),target=links[index];
   if(target?.kind==='heading'&&!fragment.querySelector(`[id="knowledge-heading-${CSS.escape(target.fragment)}"]`))links[index]={kind:'unavailable',reason:'This heading is unavailable.',destination:'#'+target.fragment};
   if(links[index]?.kind==='unavailable'){
    marker.removeAttribute('data-knowledge-index');marker.className='unavailable-link';marker.title=`${links[index].reason} ${links[index].destination}`;
    const note=document.createElement('small');note.textContent=' (link unavailable)';marker.append(note);marker.setAttribute('aria-label',`${marker.textContent}. ${marker.title}`);
   }else if(target){const button=document.createElement('button');button.type='button';button.className='knowledge-link';button.dataset.knowledgeIndex=String(index);button.append(...marker.childNodes);marker.replaceWith(button);}
  }
  const container=document.createElement('div');container.append(fragment);return {html:container.innerHTML,links,diagrams};
 },[text,source,targets,onNavigate]);
 // The diagram module loads only for a page with a diagram block; cleanup discards older results.
 // The effect depends on the HTML text: the same text keeps the same DOM, so it renders once.
 useEffect(()=>{
  if(!diagrams.length)return;
  let live=true;
  const unavailable=()=>{if(!live)return;for(const figure of ref.current?.querySelectorAll('figure.diagram-block')??[]){const note=document.createElement('p');note.className='diagram-note';note.setAttribute('role','note');note.textContent='Diagram not rendered: the diagram renderer did not load.';figure.append(note);}};
  import('./diagram-render.js').then(module=>live&&module.renderDiagrams(ref.current,diagrams,()=>live),unavailable);
  return ()=>{live=false;};
 },[html]);
 const activate=event=>{const marker=event.target.closest?.('button[data-knowledge-index]');if(!marker||!event.currentTarget.contains(marker))return;const link=links[Number(marker.dataset.knowledgeIndex)];if(link?.kind==='heading'){event.currentTarget.querySelector(`[id="knowledge-heading-${CSS.escape(link.fragment)}"]`)?.scrollIntoView({block:'start'});}else if(link?.kind==='source')onNavigate(link);};
 return <div ref={ref} className="markdown" onClick={activate} dangerouslySetInnerHTML={{__html:html}}/>;
}
