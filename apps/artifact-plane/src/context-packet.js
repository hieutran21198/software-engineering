// Captured source text is inert data. This formatter has no IO or authority.
export function formatContextMarkdown(envelope){
 const d=envelope.data,lines=['# Change context packet','',`Schema: ${d.schema}`,'',`Revision: ${envelope.revision}`,`Freshness: ${envelope.freshness}; completeness: ${envelope.completeness}`];
 const fence=value=>{const text=typeof value==='string'?value:JSON.stringify(value,null,2);const runs=text.match(/`+/g)||[];const ticks='`'.repeat(Math.max(3,...runs.map(r=>r.length+1)));return `${ticks}text\n${text}\n${ticks}`;};
 const section=(title,value)=>lines.push('',`## ${title}`,'',fence(value));
 section('Context',{repository:envelope.repository,worktree:envelope.worktree,...envelope.context});section('Scope',d.scope);section('Knowledge changes',{records:d.records,governingSources:d.governingSources,pagination:envelope.pagination});section('Recorded flow impact',d.impact);section('Evidence and unresolved facts',{evidence:d.evidence,unresolvedFacts:d.unresolvedFacts,diagnostics:envelope.diagnostics});
 lines.push('','## Sources');for(const s of d.sources||[]){lines.push('',fence({...s,text:undefined}), '',fence(s.text));}section('Omissions',envelope.omissions);section('Limits',d.limits);return lines.join('\n')+'\n';
}
