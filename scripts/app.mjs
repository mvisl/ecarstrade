import{spawn}from'node:child_process';
const children=[];const run=(cmd,args)=>{const p=spawn(cmd,args,{stdio:'inherit'});children.push(p);return p};
run(process.execPath,['server/index.mjs']);
setTimeout(()=>run(process.execPath,['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port','4317','--open']),350);
const stop=()=>{for(const p of children)p.kill('SIGTERM')};process.on('SIGINT',stop);process.on('SIGTERM',stop);
