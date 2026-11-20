import { it, expect } from 'vitest';
import { buildRouteIndex, pointAtProgress } from '../../src/domain/route/route-geometry';
it('按路径累计长度插值、首尾及钳制',()=>{ const index=buildRouteIndex([[120,30],[120.01,30],[120.03,30]]); expect(pointAtProgress(index,0)[0]).toBeCloseTo(120); expect(pointAtProgress(index,0.5)[0]).toBeCloseTo(120.015); expect(pointAtProgress(index,2)[0]).toBeCloseTo(120.03); expect(pointAtProgress(index,-1)[0]).toBeCloseTo(120); });
it('重复点可处理，空及零长路线拒绝',()=>{ expect(()=>buildRouteIndex([])).toThrow(); expect(()=>buildRouteIndex([[120,30],[120,30]])).toThrow(); expect(()=>buildRouteIndex([[120,30],[NaN,30]])).toThrow(); expect(pointAtProgress(buildRouteIndex([[120,30],[120,30],[121,30]]),0.5)[0]).toBeCloseTo(120.5); });
it('本地平面坐标允许像素范围并按折线长度前进',()=>{const index=buildRouteIndex([[400,200],[400,800],[800,800]]);expect(pointAtProgress(index,0.6)).toEqual([400,800]);expect(pointAtProgress(index,0.8)).toEqual([600,800]);});
