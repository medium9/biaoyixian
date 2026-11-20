import { describe, it, expect } from 'vitest';
import { advanceProgress } from '../../src/domain/walking/walking-engine';
describe('虚拟移动', () => {
  for (const [mode, hours, hourly] of [['run',3,8190],['hike',6,4095],['stroll',9,2730]] as const) {
    it(mode, () => { expect(advanceProgress(0,mode,3600)).toBeCloseTo(hourly); expect(advanceProgress(0,mode,hours*3600)).toBe(24570); });
  }
  it('帧率无关与终点钳制', () => { let p=0; for(let i=0;i<600;i++) p=advanceProgress(p,'hike',0.1); expect(p).toBeCloseTo(advanceProgress(0,'hike',60)); expect(advanceProgress(24569,'run',100)).toBe(24570); });
  it('无效时间拒绝，零时间不动', () => { expect(()=>advanceProgress(0,'run',-1)).toThrow(); expect(()=>advanceProgress(0,'run',NaN)).toThrow(); expect(advanceProgress(100,'hike',0)).toBe(100); });
});
import { advanceWalker } from '../../src/domain/walking/walking-engine';
it('人物累计有效时间，到终点不多累计',()=>{const w={id:'me',nickname:'我',mode:'run' as const,progressM:0,elapsedSeconds:0};const next=advanceWalker(w,60);expect(next.elapsedSeconds).toBe(60);expect(next.progressM).toBeCloseTo(136.5);const end=advanceWalker(w,20000);expect(end.elapsedSeconds).toBe(10800);expect(advanceWalker(end,20).elapsedSeconds).toBe(10800);});
