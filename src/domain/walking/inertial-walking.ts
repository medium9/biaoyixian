import type {Walker} from '../../types/walker';

export const MAX_TAP_SPEED = 12;
const DECELERATION = 4;
export function boostSpeed(speed:number):number {
 return Math.min(MAX_TAP_SPEED, Math.max(0, speed) + 3);
}

/** 恒定减速的解析积分，不受动画帧率影响；只累计仍在移动的时间。 */
export function advanceInertia(walker:Walker, speed:number, seconds:number):{walker:Walker;speed:number} {
 if(!Number.isFinite(seconds)||seconds<0||!Number.isFinite(speed)||speed<0)throw Error('无效的惯性参数');
 if(walker.progressM>=24570||speed===0)return {walker,speed:0};
 let activeSeconds=Math.min(seconds,speed/DECELERATION);
 const remaining=24570-walker.progressM;
 const travel=speed*activeSeconds-DECELERATION*activeSeconds*activeSeconds/2;
 const finished=travel>=remaining;
 if(finished)activeSeconds=2*remaining/(speed+Math.sqrt(Math.max(0,speed*speed-2*DECELERATION*remaining)));
 return {
  walker:{...walker,progressM:finished?24570:walker.progressM+travel,elapsedSeconds:walker.elapsedSeconds+activeSeconds},
  speed:finished?0:Math.max(0,speed-DECELERATION*activeSeconds),
 };
}
