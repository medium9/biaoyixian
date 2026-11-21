import {createServer} from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import {extname,resolve,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createPresenceMiddleware} from './presence.mjs';

const dist=fileURLToPath(new URL('../dist',import.meta.url));
const port=Number(process.env.PORT??4173);
const host=process.env.HOST??'0.0.0.0';
const presence=createPresenceMiddleware();
const types=new Map([
 ['.html','text/html; charset=utf-8'],['.js','text/javascript; charset=utf-8'],['.css','text/css; charset=utf-8'],
 ['.svg','image/svg+xml'],['.png','image/png'],['.jpg','image/jpeg'],['.webp','image/webp'],['.ico','image/x-icon'],
]);

async function serveFiles(req,res){
 try{
  if(req.method!=='GET'&&req.method!=='HEAD'){res.writeHead(405,{Allow:'GET, HEAD'}).end();return;}
  const path=decodeURIComponent(new URL(req.url??'/','http://localhost').pathname);
  const file=resolve(dist,'.'+(path==='/'?'/index.html':path));
  if(!file.startsWith(dist+sep)){res.writeHead(404).end();return;}
  const headers={
   'Content-Type':types.get(extname(file))??'application/octet-stream',
   'Cache-Control':path.startsWith('/assets/')?'public, max-age=31536000, immutable':'no-cache',
   'X-Content-Type-Options':'nosniff',
  };
  if(req.method==='HEAD'){
   const info=await stat(file);
   if(!info.isFile()){res.writeHead(404).end();return;}
   res.writeHead(200,{...headers,'Content-Length':info.size}).end();
   return;
  }
  const body=await readFile(file);
  res.writeHead(200,{...headers,'Content-Length':body.length}).end(body);
 }catch{if(!res.headersSent)res.writeHead(404).end('Not found');}
}

try{await stat(resolve(dist,'index.html'));}catch{
 console.error('找不到 dist/index.html，请先运行 pnpm build。');
 process.exit(1);
}
createServer({requestTimeout:5000,headersTimeout:5000},(req,res)=>{
 void presence(req,res,()=>void serveFiles(req,res));
}).listen(port,host,()=>console.log(`云走标毅线已启动：http://localhost:${port}`));
