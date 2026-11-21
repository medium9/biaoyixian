import {ref,computed,onMounted,onUnmounted} from 'vue';
import {advanceWalker,MODES} from '../domain/walking/walking-engine';
import {advanceInertia,boostSpeed} from '../domain/walking/inertial-walking';
import {buildCheckpoints,crossedCheckpoints,type Checkpoint} from '../domain/route/checkpoints';
import {findOvertaken} from '../domain/walking/overtaking';
import {loadWalk,saveWalk} from '../services/data/walk-storage';
import type {Profile} from '../domain/profile/profile';
import type {Walker,WalkingMode,ControlMode} from '../types/walker';
import type {Route} from '../types/route';
import seeds from '../../data/mock/walkers.json';
import landmarks from '../../data/pois/landmarks.json';

export interface OvertakeEvent {sequence:number;names:string[]}
export function useSimulation(route:Route|null,demo:boolean,getPeers:()=>Walker[]){
 const walkers=ref<Walker[]>((demo?seeds:seeds.slice(0,1)).map(w=>({...w})) as Walker[]);
 const running=ref(false),started=ref(false),storageError=ref('');
 const controlMode=ref<ControlMode>('auto'),inertiaSpeed=ref(0),soundEnabled=ref(true);
 const visitedIds=ref<string[]>([]),arrivals=ref<Checkpoint[]>([]),overtake=ref<OvertakeEvent|null>(null);
 const checkpoints=route?buildCheckpoints(route,landmarks):[];
 const speed=computed(()=>!running.value?0:controlMode.value==='tap'?inertiaSpeed.value:24570/(MODES[walkers.value[0].mode].hours*3600));
 const moving=computed(()=>speed.value>0&&walkers.value[0].progressM<24570);
 let identity:Profile|null=null;
 let previousPeers:Walker[]=[];
 let frame=0,previous=0,lastPaint=0,lastSaved=0,lastTap=-Infinity,sequence=0;
 function resetClock(){previous=performance.now();lastPaint=previous;}
 function restore(profile:Profile){
  identity=profile;running.value=false;inertiaSpeed.value=0;storageError.value='';arrivals.value=[];overtake.value=null;
  try{
   const saved=route?loadWalk(localStorage,profile.id,route):null;
   walkers.value[0]={...walkers.value[0],id:profile.id,nickname:profile.nickname,mode:saved?.mode??'hike',progressM:saved?.progressM??0,elapsedSeconds:saved?.elapsedSeconds??0};
   started.value=saved?.started??false;controlMode.value=saved?.controlMode??'auto';soundEnabled.value=saved?.soundEnabled??true;
   // 旧记录已走过的点只标记，不在恢复时补播。
   visitedIds.value=[...new Set([...(saved?.visitedIds??[]),...checkpoints.filter(p=>p.distanceM<=walkers.value[0].progressM).map(p=>p.id)])];
  }catch(e){storageError.value=(e as Error).message;}
  resetClock();
 }
 function persist(){
  if(!identity||!route)return;
  const me=walkers.value[0];
  try{
   saveWalk(localStorage,{profileId:identity.id,routeId:route.id,routeVersion:route.version,mode:me.mode,progressM:me.progressM,elapsedSeconds:me.elapsedSeconds,started:started.value,controlMode:controlMode.value,visitedIds:[...visitedIds.value],soundEnabled:soundEnabled.value});
   storageError.value='';
  }catch(e){running.value=false;inertiaSpeed.value=0;storageError.value=(e as Error).message;}
 }
 function advanceFrame(now:number){
  const delta=Math.max(0,(now-previous)/1000);previous=now;lastPaint=now;
  if(document.hidden)return;
  const before=walkers.value;
  const prevPeers=previousPeers;
  previousPeers=getPeers();
  walkers.value=before.map((w,i)=>{
   if(i!==0)return advanceWalker(w,delta);
   if(!running.value)return w;
   if(controlMode.value==='auto')return advanceWalker(w,delta);
   const next=advanceInertia(w,inertiaSpeed.value,delta);inertiaSpeed.value=next.speed;return next.walker;
  });
  if(!running.value)return;
  const arrived=crossedCheckpoints(checkpoints,before[0].progressM,walkers.value[0].progressM,visitedIds.value);
  if(arrived.length){visitedIds.value.push(...arrived.map(p=>p.id));persist();if(!storageError.value)arrivals.value.push(...arrived);}
  const passed=findOvertaken([...before,...prevPeers],[...walkers.value,...previousPeers],walkers.value[0].id);
  if(passed.length)overtake.value={sequence:++sequence,names:passed.map(w=>w.nickname)};
  if(walkers.value[0].progressM>=24570){running.value=false;inertiaSpeed.value=0;persist();}
  if(running.value&&now-lastSaved>=1000){lastSaved=now;persist();}
 }
 function tick(now:number){
  if(document.hidden)resetClock();else if(now-lastPaint>=50)advanceFrame(now);
  frame=requestAnimationFrame(tick);
 }
 function visibility(){persist();inertiaSpeed.value=0;resetClock();}
 function leave(){persist();running.value=false;inertiaSpeed.value=0;resetClock();}
 function start(mode:WalkingMode){
  if(!identity||!route||running.value)return;
  const preferred=controlMode.value,sound=soundEnabled.value;
  restore(identity);if(storageError.value||walkers.value[0].progressM>=24570)return;
  if(!started.value){walkers.value[0]={...walkers.value[0],mode};controlMode.value=preferred;soundEnabled.value=sound;}
  started.value=true;running.value=true;resetClock();lastSaved=previous;lastTap=-Infinity;persist();
 }
 function setControlMode(value:ControlMode){
  if(value===controlMode.value)return;
  advanceFrame(performance.now());controlMode.value=value;inertiaSpeed.value=0;lastTap=-Infinity;resetClock();persist();
 }
 function tap(){
  const now=performance.now();
  if(!running.value||controlMode.value!=='tap'||document.hidden||storageError.value||now-lastTap<70)return;
  advanceFrame(now);if(!running.value)return;
  inertiaSpeed.value=boostSpeed(inertiaSpeed.value);lastTap=now;
 }
 function toggleSound(){soundEnabled.value=!soundEnabled.value;persist();}
 onMounted(()=>{
  document.addEventListener('visibilitychange',visibility);window.addEventListener('pagehide',leave);
  resetClock();frame=requestAnimationFrame(tick);
 });
 onUnmounted(()=>{leave();cancelAnimationFrame(frame);document.removeEventListener('visibilitychange',visibility);window.removeEventListener('pagehide',leave);});
 return {walkers,running,moving,started,start,restore,storageError,controlMode,setControlMode,tap,speed,soundEnabled,toggleSound,checkpoints,arrivals,overtake};
}

