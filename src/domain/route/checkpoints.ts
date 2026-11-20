import type {Route,Coordinate} from '../../types/route';
import {buildRouteIndex} from './route-geometry';
export interface Landmark {id:string;name:string;x:number;y:number;level:number;kind:string}
export interface Checkpoint {id:string;name:string;distanceM:number;position:Coordinate}

export function buildCheckpoints(route:Route, landmarks:Landmark[]):Checkpoint[] {
 const index=buildRouteIndex(route.coordinates);
 return landmarks.filter(p=>p.kind!=='background'&&p.id!=='start').map(p=>{
  let nearest=Infinity,distance=0,position:Coordinate=[p.x,p.y];
  for(let i=1;i<index.points.length;i++){
   const a=index.points[i-1],b=index.points[i],dx=b[0]-a[0],dy=b[1]-a[1],lengthSquared=dx*dx+dy*dy;
   if(!lengthSquared)continue;
   const t=Math.max(0,Math.min(1,((p.x-a[0])*dx+(p.y-a[1])*dy)/lengthSquared));
   const point:Coordinate=[a[0]+t*dx,a[1]+t*dy],error=(point[0]-p.x)**2+(point[1]-p.y)**2;
   if(error<nearest){nearest=error;position=point;distance=index.cumulative[i-1]+t*Math.sqrt(lengthSquared);}
  }
  return {id:p.id,name:p.name,position,distanceM:distance/index.total*route.virtualDistanceM};
 }).sort((a,b)=>a.distanceM-b.distanceM);
}
export function crossedCheckpoints(checkpoints:Checkpoint[],before:number,after:number,visited:string[]):Checkpoint[] {
 return checkpoints.filter(p=>p.distanceM>before&&p.distanceM<=after&&!visited.includes(p.id));
}
