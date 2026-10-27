import {defineConfig} from 'vite';
import {diagramIconsModule} from './scripts/diagram-icons.mjs';
// Only adds the module virtual:diagram-icons; every other build setting keeps the Vite default.
const id='virtual:diagram-icons',resolved='\0'+id;
const diagramIcons={name:'diagram-icons',resolveId:source=>source===id?resolved:null,load:source=>source===resolved?diagramIconsModule():null};
export default defineConfig({plugins:[diagramIcons]});
