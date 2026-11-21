import {createHash} from 'node:crypto';
import route from '../data/routes/schematic/biaoyixian-v1.json' with {type:'json'};

const LEASE_MS=7500;
const MAX_PARTICIPANTS=100;
const REQUEST_LIMIT=2048;
const modes=new Set(['run','hike','stroll']);

function reply(res,status,value){
 res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});
 res.end(JSON.stringify(value));
}

async function readPayload(req){
 if(Number(req.headers['content-length'])>REQUEST_LIMIT)return null;
 let bytes=0;
 const chunks=[];
 for await(const chunk of req.iterator({destroyOnReturn:false})){
  bytes+=chunk.length;
  if(bytes>REQUEST_LIMIT){req.resume();return null;}
  chunks.push(chunk);
 }
 return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

function validEnvelope(value){
 return value&&typeof value.token==='string'&&/^[0-9a-f]{64}$/.test(value.token)&&
  typeof value.connection==='string'&&/^[0-9a-f]{32}$/.test(value.connection)&&
  value.routeId===route.id&&value.routeVersion===route.version;
}

function readPlayer(value,id){
 if(!value||typeof value.nickname!=='string')return null;
 const nickname=value.nickname.trim();
 if([...nickname].length<2||[...nickname].length>12||/[\u0000-\u001f\u007f]/.test(nickname))return null;
 const {mode,progressM,elapsedSeconds,moving}=value;
 if(!modes.has(mode)||typeof moving!=='boolean'||!Number.isFinite(progressM)||progressM<0||progressM>route.virtualDistanceM||
    !Number.isFinite(elapsedSeconds)||elapsedSeconds<0||elapsedSeconds>Number.MAX_SAFE_INTEGER)return null;
 return {id,nickname,mode,progressM,elapsedSeconds,moving:moving&&progressM<route.virtualDistanceM,source:'online'};
}

/** A single-process room. Public snapshots never include browser tokens. */
export function createPresenceMiddleware(){
 const room=new Map();
 return async (req,res,next)=>{
  if(req.url?.split('?')[0]!=='/api/presence'){next();return;}
  if(req.method!=='POST'){res.setHeader('Allow','POST');reply(res,405,{error:'method'});return;}
  const origin=req.headers.origin;
  if(origin&&origin!==`http://${req.headers.host}`&&origin!==`https://${req.headers.host}`){reply(res,403,{error:'origin'});return;}
  if(req.headers['content-type']?.split(';')[0]!=='application/json'){reply(res,415,{error:'type'});return;}
  try{
   const payload=await readPayload(req);
   if(!validEnvelope(payload)){reply(res,400,{error:'request'});return;}
   const now=Date.now();
   for(const [id,entry] of room)if(entry.expiresAt<=now)room.delete(id);
   const id='online-'+createHash('sha256').update(payload.token).digest('hex').slice(0,32);
   if(payload.leave===true){
    if(room.get(id)?.connection===payload.connection)room.delete(id);
    reply(res,200,{players:[]});return;
   }
   const player=readPlayer(payload.player,id);
   if(!player){reply(res,400,{error:'player'});return;}
   if(!room.has(id)&&room.size>=MAX_PARTICIPANTS){reply(res,429,{error:'room_full'});return;}
   room.set(id,{player,connection:payload.connection,expiresAt:now+LEASE_MS});
   reply(res,200,{players:[...room.values()].map(entry=>entry.player).filter(peer=>peer.id!==id)});
  }catch{
   if(!res.headersSent&&!res.destroyed)reply(res,400,{error:'request'});
  }
 };
}
