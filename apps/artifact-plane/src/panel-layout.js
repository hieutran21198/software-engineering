const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
// Keep responsive geometry derived from preferences; narrow layouts do not erase them.
export function panelLayout(width,left,right,details){
 if(width<=800)return {sidebar:width<=450?125:150,inspector:right,sidebarMax:420,inspectorMax:640};
 const sidebar=clamp(left??(width<=1150?180:220),180,Math.min(420,width-300-(details?240:0)));
 const inspectorMax=Math.max(240,Math.min(640,width-sidebar-300));
 const inspector=clamp(right,240,inspectorMax);
 return {sidebar,inspector,inspectorMax,sidebarMax:Math.max(180,Math.min(420,width-300-(details?inspector:0)))};
}
