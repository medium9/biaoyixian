import {ref,onMounted,onUnmounted} from 'vue';
import type {Route} from '../types/route';
import type {Walker} from '../types/walker';

const endpoint='/api/presence';
const pollInterval=800;

function randomHex(size:number){
 return [...crypto.getRandomValues(new Uint8Array(size))].map(n=>n.toString(16).padStart(2,'0')).join('');
}

function browserToken(){
 const key='yunzou.presence.v1';
 const token=randomHex(32);
 try{
  const stored=localStorage.getItem(key);
  if(stored&&/^[0-9a-f]{64}$/.test(stored))return stored;
  localStorage.setItem(key,token);
 }catch{/* A session can still participate when storage is temporarily unavailable. */}
 return token;
}

export function usePresence(route:Route|null,getPlayer:()=>Walker|null,enabled:boolean){
 const players=ref<Walker[]>([]);
 const status=ref<'connecting'|'online'|'offline'|'full'>('connecting');
 let token='',connection='',active=false,joined=false;
 let timer:ReturnType<typeof setTimeout>|undefined;
 let pending:AbortController|undefined;
 let frame=0;

 function updatePlayers(incoming:Walker[]){
  cancelAnimationFrame(frame);
  const previous=new Map(players.value.map(player=>[player.id,player]));
  const start=performance.now();
  function paint(now:number){
   const fraction=Math.min(1,(now-start)/500);
   players.value=incoming.map(player=>{
    const from=previous.get(player.id);
    if(!from||fraction>=1)return player;
    return {...player,progressM:from.progressM+(player.progressM-from.progressM)*fraction,
     elapsedSeconds:from.elapsedSeconds+(player.elapsedSeconds-from.elapsedSeconds)*fraction};
   });
   if(fraction<1)frame=requestAnimationFrame(paint);
  }
  paint(start);
 }

 function payload(){return {token,connection,routeId:route?.id,routeVersion:route?.version};}
 async function poll(){
  if(!active)return;
  const player=getPlayer();
  if(!player){timer=setTimeout(poll,250);return;}
  const request=new AbortController();
  pending=request;
  const timeout=setTimeout(()=>request.abort(),3200);
  let delay=pollInterval;
  try{
   const response=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},signal:request.signal,
    body:JSON.stringify({...payload(),player:{nickname:player.nickname,mode:player.mode,progressM:player.progressM,
     elapsedSeconds:player.elapsedSeconds,moving:Boolean(player.moving)&&!document.hidden}})});
   if(!response.ok){
    if(response.status===429){
     if(active&&pending===request){status.value='full';updatePlayers([]);}
     delay=2000;return;
    }
    throw Error('presence unavailable');
   }
   const snapshot=await response.json();
   if(!Array.isArray(snapshot.players))throw Error('invalid snapshot');
   if(!active||pending!==request)return;
   joined=true;status.value='online';updatePlayers(snapshot.players);
  }catch{
   if(active&&pending===request){status.value='offline';updatePlayers([]);}
   delay=1500;
  }finally{
   clearTimeout(timeout);
   if(active&&pending===request){pending=undefined;timer=setTimeout(poll,delay);}
  }
 }

 function resume(){
  if(!enabled||!route||active)return;
  token ||= browserToken();
  connection=randomHex(16);
  active=true;status.value='connecting';void poll();
 }
 function leave(){
  if(!active)return;
  active=false;clearTimeout(timer);pending?.abort();pending=undefined;cancelAnimationFrame(frame);
  if(joined){
   const body=new Blob([JSON.stringify({...payload(),leave:true})],{type:'application/json'});
   navigator.sendBeacon(endpoint,body);
  }
  joined=false;players.value=[];
 }
 onMounted(()=>{
  if(!enabled)return;
  resume();window.addEventListener('pagehide',leave);window.addEventListener('pageshow',resume);
 });
 onUnmounted(()=>{leave();window.removeEventListener('pagehide',leave);window.removeEventListener('pageshow',resume);});
 return {players,status};
}
