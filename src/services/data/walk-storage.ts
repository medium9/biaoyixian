import type {WalkingMode,ControlMode} from '../../types/walker';
import {MODES} from '../../domain/walking/walking-engine';
type RouteRef={id:string;version:string};
type StoragePort=Pick<Storage,'getItem'|'setItem'>;
export interface SavedWalk {profileId:string;routeId:string;routeVersion:string;mode:WalkingMode;progressM:number;elapsedSeconds:number;started:boolean;controlMode?:ControlMode;visitedIds?:string[];soundEnabled?:boolean}
export function walkKey(profileId:string,route:RouteRef){return 'yunzou.walk.v1:'+encodeURIComponent(profileId)+':'+encodeURIComponent(route.id)+':'+encodeURIComponent(route.version);}
export function loadWalk(storage:Pick<Storage,'getItem'>,profileId:string,route:RouteRef):SavedWalk|null{
 const raw=storage.getItem(walkKey(profileId,route));if(raw===null)return null;
 try{
  const s=JSON.parse(raw);
  if(s.profileId!==profileId||s.routeId!==route.id||s.routeVersion!==route.version||!Object.hasOwn(MODES,s.mode)||typeof s.started!=='boolean'||!Number.isFinite(s.progressM)||s.progressM<0||s.progressM>24570||!Number.isFinite(s.elapsedSeconds)||s.elapsedSeconds<0||s.elapsedSeconds>Number.MAX_SAFE_INTEGER||(!s.started&&(s.progressM!==0||s.elapsedSeconds!==0)))throw Error();
  if(s.controlMode!==undefined&&s.controlMode!=='auto'&&s.controlMode!=='tap')throw Error();
  if(s.visitedIds!==undefined&&(!Array.isArray(s.visitedIds)||s.visitedIds.some((id:unknown)=>typeof id!=='string')))throw Error();
  if(s.soundEnabled!==undefined&&typeof s.soundEnabled!=='boolean')throw Error();
  return {profileId:s.profileId,routeId:s.routeId,routeVersion:s.routeVersion,mode:s.mode,progressM:s.progressM,elapsedSeconds:s.elapsedSeconds,started:s.started,
   ...(s.controlMode!==undefined?{controlMode:s.controlMode}:{}),...(s.visitedIds!==undefined?{visitedIds:[...new Set<string>(s.visitedIds)]}:{}),...(s.soundEnabled!==undefined?{soundEnabled:s.soundEnabled}:{})};
 }catch{throw new Error('本机行走记录无法读取，已保留原记录，未重置进度。');}
}
export function saveWalk(storage:StoragePort,session:SavedWalk):void{
 try{
  const route={id:session.routeId,version:session.routeVersion};
  const previous=loadWalk(storage,session.profileId,route);
  // 混合速度下，距离更远的快照不一定用时更长；距离优先，累计时间不回退也不相加。
  if(previous&&previous.started&&previous.progressM>session.progressM)return;
  const merged={...session,elapsedSeconds:Math.max(previous?.elapsedSeconds??0,session.elapsedSeconds),
   ...(previous?.visitedIds?{visitedIds:[...new Set([...previous.visitedIds,...session.visitedIds??[]])]}:{})};
  storage.setItem(walkKey(session.profileId,route),JSON.stringify(merged));
 }catch{throw new Error('行走进度保存失败，已暂停。请检查浏览器存储后重试。');}
}

