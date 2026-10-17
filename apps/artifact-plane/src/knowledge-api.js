// Client for the knowledge edit and Git routes. Expected digests are the
// SHA-256 hex of the file bytes the client read, as the server computes them.
const call=async(url,body,signal)=>{
 const response=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),signal});
 let result={};try{result=await response.json();}catch{}
 if(!response.ok)throw Object.assign(Error(result.error?.message||result.error||`Request failed with status ${response.status}.`),{status:response.status,diagnostics:result.diagnostics||[],current:result.current||null,body:result});
 return result;
};
export const edit=({path,worktree,operation,input,expected,dryRun},signal)=>call('/api/knowledge/edit',{path,...(worktree?{worktree}:{}),operation,input,...(expected?{expected}:{}),...(dryRun?{dryRun:true}:{})},signal);
export const gitAction=({path,worktree,operation,input},signal)=>call('/api/knowledge/git',{path,...(worktree?{worktree}:{}),operation,...(input?{input}:{})},signal);
// A missing route means this server has no write path; callers hide write actions.
export const unavailable=error=>[404,405].includes(error?.status);
export async function sha256(text){
 const bytes=typeof text==='string'?new TextEncoder().encode(text):text;
 return [...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(b=>b.toString(16).padStart(2,'0')).join('');
}
// Protected branches refuse every write; a detached HEAD has no branch to commit to.
export const protectedBranch=branch=>!branch||['main','master','detached'].includes(branch);
// Count uncommitted knowledge paths from porcelain v1 status text.
export const knowledgeStatus=(status='')=>status.split('\n').filter(line=>line.length>3&&/(?:^|\s|")docs\/artifacts\//.test(line.slice(3))).length;
