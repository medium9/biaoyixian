import type { Route } from '../../types/route';
import { buildRouteIndex } from '../../domain/route/route-geometry';
export function validateRoute(value:unknown):Route {
 const route=value as Route;
 if(!route||!['schematic','test'].includes(route.representation)||route.coordinateSystem!=='local'||route.virtualDistanceM!==24570||!route.id||!route.version||!route.sourceReference||!Array.isArray(route.coordinates)) throw new Error('路线格式不完整或坐标系不匹配');
 buildRouteIndex(route.coordinates);return route;
}
const routes=import.meta.glob('../../../data/routes/schematic/*.json',{eager:true,import:'default'});
export function loadRoute():Route|null {
 const items=Object.values(routes); if(items.length>1) throw new Error('仅允许启用一条示意路线');
 return items.length?validateRoute(items[0]):null;
}


