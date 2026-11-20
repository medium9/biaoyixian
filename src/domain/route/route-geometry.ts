import type { Coordinate, RouteIndex } from '../../types/route';
export function buildRouteIndex(points:Coordinate[]):RouteIndex {
 if(points.length<2||points.some(p=>!Array.isArray(p)||p.length!==2||!p.every(Number.isFinite))) throw new Error('路线至少需要两个有效平面坐标');
 const projected=points.map(p=>[...p] as Coordinate),cumulative=[0];
 for(let i=1;i<projected.length;i++) cumulative.push(cumulative[i-1]+Math.hypot(projected[i][0]-projected[i-1][0],projected[i][1]-projected[i-1][1]));
 const total=cumulative.at(-1)!;
 if(total===0) throw new Error('路线长度不能为零');
 return {points,projected,cumulative,total};
}
export function pointAtProgress(index:RouteIndex,progress:number):Coordinate {
 if(!Number.isFinite(progress)) throw new Error('无效进度');
 if(progress<=0) return [...index.points[0]];
 if(progress>=1) return [...index.points.at(-1)!];
 const distance=progress*index.total;
 let lo=1,hi=index.cumulative.length-1;
 while(lo<hi){const mid=(lo+hi)>>1;if(index.cumulative[mid]<distance)lo=mid+1;else hi=mid;}
 const a=index.projected[lo-1],b=index.projected[lo],ratio=(distance-index.cumulative[lo-1])/(index.cumulative[lo]-index.cumulative[lo-1]);
 return [a[0]+(b[0]-a[0])*ratio,a[1]+(b[1]-a[1])*ratio];
}


