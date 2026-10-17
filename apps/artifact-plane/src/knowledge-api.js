// Client for the knowledge edit and Git routes. Expected digests are the
// SHA-256 hex of the file bytes the client read, as the server computes them.
const call=async(url,body,signal)=>{
 const response=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),signal});
 let result={};try{result=await response.json();}catch{}
 if(!response.ok)throw Object.assign(Error(result.error?.message||result.error||`Request failed with status ${response.status}.`),{status:response.status,code:result.code||null,field:result.field||null,diagnostics:result.diagnostics||[],current:result.current||null,unchecked:result.unchecked||null,body:result});
 return result;
};
export const edit=({path,worktree,operation,input,expected,dryRun},signal)=>call('/api/knowledge/edit',{path,...(worktree?{worktree}:{}),operation,input,...(expected?{expected}:{}),...(dryRun?{dryRun:true}:{})},signal);
export const gitAction=({path,worktree,operation,input},signal)=>call('/api/knowledge/git',{path,...(worktree?{worktree}:{}),operation,...(input?{input}:{})},signal);
// Apply in one step: an apply that replaces files needs their digests, so the
// server names them and the same request repeats once with those digests.
export async function operate(target, operation, input, {expected} = {}) {
  try {return await edit({...target, operation, input, expected});}
  catch (error) {
    if (error.status !== 409 || error.body?.code !== 'expected-required') throw error;
    return edit({...target, operation, input, expected: {...error.body.digests, ...(expected || {})}});
  }
}
// A missing route means this server has no write path; callers hide write actions.
export const unavailable=error=>[404,405].includes(error?.status);
export async function sha256(text){
 const bytes=typeof text==='string'?new TextEncoder().encode(text):text;
 return [...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(b=>b.toString(16).padStart(2,'0')).join('');
}
// Protected branches refuse every write; a detached HEAD has no branch to commit to.
export const protectedBranch=branch=>!branch||['main','master','detached'].includes(branch);
// Uncommitted knowledge paths from porcelain v1 status text. The reader trims
// the text, so the first line can lose its leading status space.
export const knowledgeEntries=(status='')=>status.split('\n').map(line=>line.match(/^([ MADRCUT?!]{1,2}) (.+)$/)).filter(Boolean).map(([,code,path])=>({code:code.trim()||'?',path:path.replace(/^"|"$/g,'').split(' -> ').at(-1)})).filter(e=>e.path.startsWith('docs/artifacts/'));
export const knowledgeStatus=status=>knowledgeEntries(status).length;
