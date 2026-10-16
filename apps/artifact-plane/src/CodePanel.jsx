import React,{useMemo} from 'react';
import DOMPurify from 'dompurify';
import {codePanelHTML,sourceLanguage} from './code-highlight.js';
export default function CodePanel({text='',source=''}){
 const html=useMemo(()=>DOMPurify.sanitize(codePanelHTML(text,sourceLanguage(source)),{ALLOWED_TAGS:['div','pre','code','span'],ALLOWED_ATTR:['class','tabindex','aria-label'],ALLOW_DATA_ATTR:false}).replaceAll('\r','&#13;'),[text,source]);
 return <div className="source-code" dangerouslySetInnerHTML={{__html:html}}/>;
}
