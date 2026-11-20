export type Coordinate = [number, number];
export interface Route { id:string; version:string; representation:'schematic'|'test'; coordinateSystem:'local'; sourceReference:string; coordinates:Coordinate[]; virtualDistanceM:24570 }
export interface RouteIndex { points:Coordinate[]; projected:Coordinate[]; cumulative:number[]; total:number }


