let active=0,batches=0,peak=0;const waiting=[];
function drain(){for(let i=0;i<waiting.length&&active<8;){const item=waiting[i];if(item.batch&&batches>=4){i++;continue;}waiting.splice(i,1);active++;if(item.batch)batches++;peak=Math.max(peak,active);let released=false;item.resolve(()=>{if(released)return;released=true;active--;if(item.batch)batches--;drain();});}}
export function gitSlot(batch=false){return new Promise(resolve=>{waiting.push({resolve,batch});drain();});}
export const processStats=()=>({active,batches,peak,limit:8});
