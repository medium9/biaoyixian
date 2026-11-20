import {it,expect} from 'vitest';
import {boostSpeed,advanceInertia} from '../../src/domain/walking/inertial-walking';
import {advanceWalker} from '../../src/domain/walking/walking-engine';
const me={id:'me',nickname:'我',mode:'hike' as const,progressM:0,elapsedSeconds:0};

it('密集点击比稀疏点击前进更远，速度有上限',()=>{
 function walk(every:number){let state={walker:me,speed:0};for(let i=0;i<100;i++){if(i%every===0)state.speed=boostSpeed(state.speed);state=advanceInertia(state.walker,state.speed,.1);}return state;}
 expect(walk(2).walker.progressM).toBeGreaterThan(walk(10).walker.progressM*2);
 let speed=0;for(let i=0;i<100;i++)speed=boostSpeed(speed);
 expect(speed).toBe(12);
});
it('满速停止点击三秒后停止，静止不再累计时间或距离',()=>{
 const stopped=advanceInertia(me,12,5);
 expect(stopped.speed).toBe(0);expect(stopped.walker.progressM).toBeCloseTo(18);expect(stopped.walker.elapsedSeconds).toBe(3);
 expect(advanceInertia(stopped.walker,0,100)).toEqual(stopped);
});
it('惯性位移与帧率无关，靠近终点时只累计抵达前的时间',()=>{
 let state={walker:me,speed:12};for(let i=0;i<60;i++)state=advanceInertia(state.walker,state.speed,.05);
 expect(state.walker.progressM).toBeCloseTo(18);expect(state.walker.elapsedSeconds).toBeCloseTo(3);
 const end=advanceInertia({...me,progressM:24565},12,5);
 expect(end.walker.progressM).toBe(24570);expect(end.speed).toBe(0);expect(end.walker.elapsedSeconds).toBeGreaterThan(.4);expect(end.walker.elapsedSeconds).toBeLessThan(.5);
});
it('混合模式的有效时间不被原自动全程时长截断',()=>{
 const result=advanceWalker({...me,progressM:100,elapsedSeconds:40000},2);
 expect(result.elapsedSeconds).toBe(40002);expect(result.progressM).toBeCloseTo(102.275);
});
