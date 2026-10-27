// Builds the module virtual:diagram-icons from the pinned Iconify packs: the logos names that
// start with aws and the lucide names of src/diagram-icon-names.js. A name that the packs lack stops the build.
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {lucideNames} from '../src/diagram-icon-names.js';
export const logosCount=65;
const subset=({aliases,...pack},info,names)=>({...pack,info,icons:Object.fromEntries(names.map(name=>[name,pack.icons[name]]))});
export function iconPacks({logos,logosInfo,lucide,lucideInfo,names,notice}){
 const aws=Object.keys(logos.icons).filter(name=>name.startsWith('aws'));
 if(aws.length!==logosCount)throw new Error(`The logos pack has ${aws.length} names that start with aws, not ${logosCount}.`);
 const missing=names.filter(name=>!Object.hasOwn(lucide.icons,name));
 if(missing.length)throw new Error(`The lucide pack has no icon named ${missing.join(', ')}.`);
 // Lucide's license asks to keep its notice in every copy, so the notice travels with the icons.
 return {logos:subset(logos,logosInfo,aws),lucide:{...subset(lucide,lucideInfo,names),notice}};
}
export function diagramIconsModule(){
 const require=createRequire(import.meta.url);
 const packs=iconPacks({
  logos:require('@iconify-json/logos/icons.json'),logosInfo:require('@iconify-json/logos/info.json'),
  lucide:require('@iconify-json/lucide/icons.json'),lucideInfo:require('@iconify-json/lucide/info.json'),
  names:lucideNames,notice:readFileSync(new URL('./lucide-license.txt',import.meta.url),'utf8'),
 });
 return Object.entries(packs).map(([name,pack])=>`export const ${name}=${JSON.stringify(pack)};`).join('\n');
}
