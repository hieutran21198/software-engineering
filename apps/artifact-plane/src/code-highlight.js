import hljs from 'highlight.js/lib/core';
import javascript from 'highlight.js/lib/languages/javascript';
import typescript from 'highlight.js/lib/languages/typescript';
import json from 'highlight.js/lib/languages/json';
import yaml from 'highlight.js/lib/languages/yaml';
import bash from 'highlight.js/lib/languages/bash';
import go from 'highlight.js/lib/languages/go';
import python from 'highlight.js/lib/languages/python';
import css from 'highlight.js/lib/languages/css';
import xml from 'highlight.js/lib/languages/xml';
import sql from 'highlight.js/lib/languages/sql';
const grammars={javascript,typescript,json,yaml,bash,go,python,css,xml,sql};
for(const [name,grammar] of Object.entries(grammars))hljs.registerLanguage(name,grammar);
const aliases={js:'javascript',jsx:'javascript',mjs:'javascript',cjs:'javascript',ts:'typescript',tsx:'typescript',yml:'yaml',sh:'bash',py:'python',html:'xml',htm:'xml'};
const names={javascript:'JavaScript',typescript:'TypeScript',json:'JSON',yaml:'YAML',bash:'Bash',go:'Go',python:'Python',css:'CSS',xml:'HTML / XML',sql:'SQL'};
export const highlightLimit=20000;
export const escapeCode=value=>String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;').replaceAll('\r','&#13;');
export function sourceLanguage(source=''){return source.split('.').at(-1).toLowerCase();}
export function highlightCode(text='',hint=''){
 const declared=hint.trim().split(/\s+/)[0].toLowerCase(),language=aliases[declared]||declared;
 const plain={html:escapeCode(text),language:'plaintext',label:'Plain text'};
 if(text.length>highlightLimit)return {...plain,label:'Plain text · too large to highlight'};
 if(!Object.hasOwn(grammars,language))return plain;
 try{return {html:hljs.highlight(text,{language,ignoreIllegals:true}).value.replaceAll('\r','&#13;'),language,label:names[language]};}
 catch{return {...plain,label:'Plain text · highlighting unavailable'};}
}
// HTML is generated only from escaped text, registered grammars and fixed labels.
// Both consumers sanitize this markup at their existing rendering boundary.
export function codePanelHTML(text,hint){
 const result=highlightCode(text,hint);
 return `<div class="code-panel"><div class="code-panel-label">${result.label}</div><pre tabindex="0" aria-label="${result.label} code"><code class="hljs language-${result.language}">${result.html}</code></pre></div>`;
}
