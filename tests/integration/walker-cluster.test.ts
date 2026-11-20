import { it, expect } from 'vitest';
import { clusterPoints } from '../../src/services/map/walker-cluster';
it('聚合不丢人物，不改逻辑位置，放大可展开',()=>{ const points=Array.from({length:20},(_,i)=>({id:String(i),x:i*2,y:0})); const before=JSON.stringify(points); const groups=clusterPoints(points,50); expect(groups).toHaveLength(1); expect(groups.flat().map(p=>p.id).sort()).toEqual(points.map(p=>p.id).sort()); expect(clusterPoints(points.map(p=>({...p,x:p.x*100})),50)).toHaveLength(20); expect(JSON.stringify(points)).toBe(before); });
