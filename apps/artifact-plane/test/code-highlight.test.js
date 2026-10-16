import test from 'node:test';import assert from 'node:assert/strict';
import {highlightCode,highlightLimit,codePanelHTML,sourceLanguage} from '../src/code-highlight.js';
const textOf=html=>html.replace(/<[^>]+>/g,'').replaceAll('&lt;','<').replaceAll('&gt;','>').replaceAll('&quot;','"').replaceAll('&#x27;',"'").replaceAll('&#39;',"'").replaceAll('&#13;','\r').replaceAll('&amp;','&');
test('explicit grammars highlight without altering text, Unicode or final newlines',()=>{
 for(const [language,text]of [['js','// 中文\r\nexport const answer = "<script>&";\n'],['ts','const x: number = 42;'],['json','{"key": true}'],['yml','source_change: change-login\n'],['sh','echo "Hello"'],['go','package main\n'],['py','def login():\n    return True\n'],['css','body { color: red; }'],['html','<div title="example">Hello</div>'],['sql','SELECT * FROM users;']]){
  const result=highlightCode(text,language);assert.notEqual(result.language,'plaintext');assert.match(result.html,/hljs-/);assert.equal(textOf(result.html),text);
 }
 assert.equal(sourceLanguage('src/runtime-model.JS'),'js');
});
test('unknown and oversized blocks keep all escaped text with clear fallback',()=>{
 const malicious='<script>window.injected=true</script><img src="/tracking"><span data-knowledge-index="0">fake</span>&lt;';
 const plain=highlightCode(malicious,'unknown');assert.equal(plain.language,'plaintext');assert.equal(textOf(plain.html),malicious);assert.ok(!plain.html.includes('<script>'));
 const text='x'.repeat(highlightLimit+1)+'\n';const large=highlightCode(text,'js');assert.match(large.label,/too large/);assert.equal(textOf(large.html),text);assert.equal(highlightCode('','js').html,'');
 assert.ok(!codePanelHTML(malicious,'"><img src=x>').includes('<img'));
});
