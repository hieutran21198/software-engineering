import {StdioServerTransport} from '@modelcontextprotocol/sdk/server/stdio.js';
import {resolve,isAbsolute} from 'node:path';
import {createFlowMcpServer} from './flow-mcp.js';
const roots=[];let stateDir,allowWrites=false;
try{
 const args=process.argv.slice(2);
 for(let i=0;i<args.length;i++){
  if(args[i]==='--allow-writes'){allowWrites=true;continue;}
  const flag=args[i],value=args[++i];
  if(!['--repository','--state-dir'].includes(flag)||!value||!isAbsolute(value))throw Error('Use --repository /absolute/root (repeatable), optional --state-dir /absolute/private/state and optional --allow-writes.');
  if(flag==='--repository')roots.push(resolve(value));else stateDir=resolve(value);
 }
 if(!roots.length)throw Error('Configure at least one --repository root.');
 const app=createFlowMcpServer({roots,stateDir,allowWrites});
 await app.server.connect(new StdioServerTransport());
 const close=async()=>{await app.close();process.exit(0);};
 process.once('SIGINT',close);process.once('SIGTERM',close);
}catch(error){console.error(error.message);process.exitCode=1;}
