// Renders the fenced Mermaid blocks of one Markdown container as sanitized SVG.
// Loaded by dynamic import only when a page has a diagram block.
import mermaid from 'mermaid';
import DOMPurify from 'dompurify';
export const maxTextSize=50000;
const font='"IBM Plex Sans", system-ui, sans-serif';
let initialized=false,counter=0;
function initialize(){
 if(initialized)return;
 mermaid.initialize({startOnLoad:false,securityLevel:'strict',htmlLabels:false,flowchart:{htmlLabels:false},theme:'neutral',fontFamily:font,maxTextSize});
 initialized=true;
}
// A separate DOMPurify instance keeps these hooks out of the Markdown sanitizing profile.
const purify=DOMPurify(window);
const localURL=value=>String(value).trim().startsWith('#');
const localCSS=css=>css.replace(/@import[^;]*;?/gi,'').replace(/url\(\s*(['"]?)(.*?)\1\s*\)/gi,(match,quote,value)=>localURL(value)?match:'none');
purify.addHook('uponSanitizeAttribute',(node,data)=>{
 const name=data.attrName.toLowerCase();
 if(name.startsWith('on'))data.keepAttr=false;
 if((name==='href'||name==='xlink:href')&&!localURL(data.attrValue))data.keepAttr=false;
});
purify.addHook('afterSanitizeElements',node=>{
 if(node.nodeName?.toLowerCase()==='style')node.textContent=localCSS(node.textContent);
});
export function sanitizeSVG(svg){
 return purify.sanitize(svg,{USE_PROFILES:{svg:true,svgFilters:true},ADD_ATTR:['role'],FORBID_TAGS:['script','foreignObject','foreignobject','a','image'],RETURN_DOM_FRAGMENT:true});
}
export function refusal(text){
 if(text.includes('%%{'))return 'the block contains a configuration directive (%%{).';
 if(text.length>maxTextSize)return `the block is larger than ${maxTextSize.toLocaleString('en-US')} characters.`;
 return null;
}
function note(figure,reason){
 const element=document.createElement('p');
 element.className='diagram-note';element.setAttribute('role','note');
 const line=String(reason||'').split('\n')[0].trim()||'unknown error.';
 element.textContent='Diagram not rendered: '+line.slice(0,160);
 figure.append(element);
}
// Renders the blocks in document order. current() is false after a newer render or unmount.
export async function renderDiagrams(container,blocks,current){
 initialize();
 for(const figure of container.querySelectorAll('figure.diagram-block[data-diagram-index]')){
  const text=blocks[Number(figure.dataset.diagramIndex)];
  if(typeof text!=='string')continue;
  const refused=refusal(text);
  if(refused){note(figure,refused);continue;}
  const id=`plane-diagram-${++counter}`;
  let result,failure;
  try{result=await mermaid.render(id,text);}
  catch(error){failure=error?.message||String(error);}
  finally{for(const temporary of [document.getElementById('d'+id),document.getElementById('i'+id)])temporary?.remove();}
  if(!current())return;
  if(failure){note(figure,failure);continue;}
  const fragment=sanitizeSVG(result.svg);
  const svg=fragment.querySelector('svg');
  if(!svg){note(figure,'the renderer returned no SVG.');continue;}
  // A diagram shrinks to the column down to three quarters of its natural width,
  // so its text stays legible; a wider diagram scrolls inside the figure.
  const width=Number((svg.getAttribute('viewBox')||'').split(/[\s,]+/)[2]);
  if(width>0)Object.assign(svg.style,{width:`${Math.ceil(width)}px`,maxWidth:'100%',minWidth:`${Math.ceil(width*.75)}px`});
  figure.querySelector('.code-panel')?.replaceWith(fragment);
 }
}
