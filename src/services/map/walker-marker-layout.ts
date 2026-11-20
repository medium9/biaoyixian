import type {ScreenPoint} from './walker-cluster';

interface Marker extends ScreenPoint {
 halfWidth:number;
 halfHeight:number;
}

/** Markers are nudged in screen pixels. Route coordinates are never changed. */
export function layoutWalkerMarkers(markers:Marker[],fixed:Marker[],width:number,height:number):ScreenPoint[] {
 const placed=[...fixed];
 return markers.map(marker=>{
  const {x,y,halfWidth,halfHeight}=marker;
  const fits=(nextX:number,nextY:number)=>placed.every(other=>
   Math.abs(nextX-other.x)>=halfWidth+other.halfWidth+4||
   Math.abs(nextY-other.y)>=halfHeight+other.halfHeight+4,
  );
  if(x<0||x>width||y<0||y>height||fits(x,y)){
   placed.push(marker);
   return marker;
  }

  // Try horizontal separation first so people read as walking side by side.
  for(let distance=36;distance<=180;distance+=18){
   const offsets=[[-distance,0],[distance,0],[0,-distance],[0,distance],
    [-distance,-distance],[distance,-distance],[-distance,distance],[distance,distance]];
   for(const [dx,dy] of offsets){
    const nextX=x+dx,nextY=y+dy;
    if(nextX<halfWidth||nextX>width-halfWidth||nextY<halfHeight||nextY>height-halfHeight)continue;
    if(!fits(nextX,nextY))continue;
    const display={...marker,x:nextX,y:nextY};
    placed.push(display);
    return display;
   }
  }
  placed.push(marker);
  return marker;
 });
}
