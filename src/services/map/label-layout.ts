export interface LabelPoint {id:string;x:number;y:number}
export interface LabelExclusion {left:number;top:number;right:number;bottom:number}
export function layoutLabels<T extends LabelPoint>(points:T[],obstacles:LabelPoint[],width:number,height:number,reserved:LabelExclusion[]=[]):(T&{anchorX:number;anchorY:number})[]{
 const visible=points.filter(p=>p.x>=0&&p.x<=width&&p.y>=0&&p.y<=height);
 const bodies=[...visible,...obstacles];const placed:(T&{anchorX:number;anchorY:number})[]=[];
 for(const p of visible){
  const candidates:{x:number;y:number}[]=[];
  for(let ring=0;ring<7;ring++){const d=ring*48;candidates.push({x:p.x,y:p.y-52-d},{x:p.x+88+d,y:p.y-12},{x:p.x-88-d,y:p.y-12},{x:p.x,y:p.y+52+d});}
  // 在极密集场景扫描剩余空位，保留人物点击详情作为窄屏兜底。
  for(let y=28;y<height-22;y+=46)for(let x=71;x<width-65;x+=136)candidates.push({x,y});
  const spot=candidates.find(c=>c.x>=69&&c.x<=width-69&&c.y>=24&&c.y<=height-24&&reserved.every(r=>c.x+68<=r.left||c.x-68>=r.right||c.y+23<=r.top||c.y-23>=r.bottom)&&bodies.every(b=>Math.abs(c.x-b.x)>=85||Math.abs(c.y-b.y)>=47)&&placed.every(b=>Math.abs(c.x-b.x)>=136||Math.abs(c.y-b.y)>=46));
  if(spot)placed.push({...p,anchorX:p.x,anchorY:p.y,...spot});
 }
 return placed;
}

