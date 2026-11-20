import type { WalkingMode } from '../../types/walker';
export const MODES = { run:{label:'跑山',hours:3}, hike:{label:'徒步',hours:6}, stroll:{label:'慢走',hours:9} } as const;
export function advanceProgress(progressM:number,mode:WalkingMode,activeDeltaSeconds:number):number {
 if(!Number.isFinite(progressM)||progressM<0||!Number.isFinite(activeDeltaSeconds)||activeDeltaSeconds<0||!(mode in MODES)) throw new Error('无效的移动参数');
 return Math.min(24570,progressM+24570/(MODES[mode].hours*3600)*activeDeltaSeconds);
}

import type { Walker } from '../../types/walker';
export function advanceWalker(walker:Walker,seconds:number):Walker {
 const progressM=advanceProgress(walker.progressM,walker.mode,seconds);
 const speed=24570/(MODES[walker.mode].hours*3600);
 const activeSeconds=Math.min(seconds,Math.max(0,(24570-walker.progressM)/speed));
 return {...walker,progressM,elapsedSeconds:walker.elapsedSeconds+activeSeconds};
}

