export type WalkingMode='run'|'hike'|'stroll';
export type ControlMode='auto'|'tap';
export interface Walker { id:string; nickname:string; mode:WalkingMode; progressM:number; elapsedSeconds:number; source?:'online'; moving?:boolean }


