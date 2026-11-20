import {it,expect} from 'vitest';
import {buildCheckpoints,crossedCheckpoints} from '../../src/domain/route/checkpoints';
import type {Route} from '../../src/types/route';
const route:Route={id:'test',version:'1',representation:'test',coordinateSystem:'local',sourceReference:'fixture',virtualDistanceM:24570,coordinates:[[0,0],[100,0],[100,100]]};
it('沿线点位按路线投影排序，背景景点不成为打卡点',()=>{
 const marks=buildCheckpoints(route,[{id:'b',name:'乙',x:102,y:50,level:0,kind:'route'},{id:'scenery',name:'背景',x:20,y:5,level:0,kind:'background'},{id:'a',name:'甲',x:50,y:5,level:0,kind:'route'},{id:'start',name:'起点',x:0,y:0,level:0,kind:'endpoint'}]);
 expect(marks.map(m=>m.id)).toEqual(['a','b']);expect(marks[0].distanceM).toBe(6142.5);expect(marks[1].distanceM).toBe(18427.5);expect(marks[0].position).toEqual([50,0]);
});
it('一次跨过多个点按顺序反馈，已到访及边界不重复',()=>{
 const marks=[{id:'a',name:'甲',distanceM:10,position:[0,0] as [number,number]},{id:'b',name:'乙',distanceM:20,position:[1,0] as [number,number]}];
 expect(crossedCheckpoints(marks,0,25,[]).map(m=>m.id)).toEqual(['a','b']);
 expect(crossedCheckpoints(marks,10,20,['a']).map(m=>m.id)).toEqual(['b']);
 expect(crossedCheckpoints(marks,20,25,['a','b'])).toEqual([]);
});
