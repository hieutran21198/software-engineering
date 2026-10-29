// Every visible read settles or provides a local retry; callers own context cancellation.
// A refused request keeps the status and the JSON body of the reply.
export async function postJSON(url,body,signal,timeoutMs=30000){
 const deadline=AbortSignal.timeout(timeoutMs),combined=signal?AbortSignal.any([signal,deadline]):deadline;
 try{
  const response=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),signal:combined});
  const result=await response.json();
  if(!response.ok)throw Object.assign(Error(result.error?.message||result.error||'The requested evidence could not be read.'),{status:response.status,body:result});
  return result;
 }catch(error){
  if(signal?.aborted)throw new DOMException('The request was cancelled.','AbortError');
  if(deadline.aborted)throw Error('Request timed out. Retry this evidence read.');
  throw error;
 }
}
