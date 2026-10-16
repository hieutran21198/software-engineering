export const comparisonLimits={characters:200000,lines:2000,work:1000000};
const lines=text=>text.match(/[^\n]*\n|[^\n]+$/g)||[];
export function compareLines(before,after,limits=comparisonLimits){
 if(before.length+after.length>limits.characters)return {state:'too-large',reason:'Comparison too large: character limit exceeded.'};
 const a=lines(before),b=lines(after),n=a.length,m=b.length;
 if(n>limits.lines||m>limits.lines||n*m>limits.work)return {state:'too-large',reason:'Comparison too large: line or comparison-work limit exceeded.'};
 const width=m+1,table=new Uint16Array((n+1)*width);
 for(let i=n-1;i>=0;i--)for(let j=m-1;j>=0;j--)table[i*width+j]=a[i]===b[j]?1+table[(i+1)*width+j+1]:Math.max(table[(i+1)*width+j],table[i*width+j+1]);
 const result=[];let i=0,j=0;
 while(i<n||j<m){
  if(i<n&&j<m&&a[i]===b[j]){result.push({kind:'equal',text:a[i],before:i+1,after:j+1});i++;j++;}
  else if(i<n&&(j===m||table[(i+1)*width+j]>=table[i*width+j+1])){result.push({kind:'remove',text:a[i],before:i+1,after:null});i++;}
  else {result.push({kind:'add',text:b[j],before:null,after:j+1});j++;}
 }
 return {state:'complete',lines:result,changed:result.some(line=>line.kind!=='equal')};
}
export function comparisonBlocks(input,context=3){
 const blocks=[];
 for(let start=0;start<input.length;){let end=start+1;while(end<input.length&&(input[end].kind==='equal')===(input[start].kind==='equal'))end++;
  const run=input.slice(start,end);
  if(input[start].kind!=='equal'||run.length<=context*2)blocks.push({kind:'lines',lines:run});
  else {const head=start?context:0,tail=end<input.length?context:0;if(head)blocks.push({kind:'lines',lines:run.slice(0,head)});blocks.push({kind:'unchanged',lines:run.slice(head,run.length-tail)});if(tail)blocks.push({kind:'lines',lines:run.slice(-tail)});}
  start=end;
 }
 return blocks;
}
