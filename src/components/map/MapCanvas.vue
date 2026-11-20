<script setup lang="ts">
import {ref,computed,onMounted,onBeforeUnmount} from 'vue';
import {layoutLabels} from '../../services/map/label-layout';
import {layoutWalkerMarkers} from '../../services/map/walker-marker-layout';
import WalkerLabel from '../walkers/WalkerLabel.vue';
import WalkerSprite from '../walkers/WalkerSprite.vue';
import HangzhouBackdrop from './HangzhouBackdrop.vue';
import type {Checkpoint} from '../../domain/route/checkpoints';
import type {Coordinate,Route} from '../../types/route';import type {Walker} from '../../types/walker';
import {buildRouteIndex,pointAtProgress} from '../../domain/route/route-geometry';
import {clusterPoints} from '../../services/map/walker-cluster';import pois from '../../../data/pois/landmarks.json';
const props=defineProps<{route:Route|null;walkers:Walker[];selfId:string;selfActive:boolean;showSelf:boolean;checkpoints:Checkpoint[];arrivalId?:string;overtaking?:boolean}>();const emit=defineEmits<{ready:[];select:[ids:string[]];advance:[]}>();
// Allow room around the trail while keeping the camera within the illustrated area.
const mapBounds={west:-1480,east:2640,north:-560,south:1920};
const svg=ref<SVGSVGElement>();const zoom=ref(1),cx=ref(540),cy=ref(730);const width=ref(900),height=ref(800);
const baseHeight=computed(()=>Math.max(1320,1150*height.value/width.value));const viewHeight=computed(()=>baseHeight.value/zoom.value);const viewWidth=computed(()=>viewHeight.value*width.value/height.value);
const left=computed(()=>cx.value-viewWidth.value/2),top=computed(()=>cy.value-viewHeight.value/2);
const viewBox=computed(()=>[left.value,top.value,viewWidth.value,viewHeight.value].join(' '));
const unit=computed(()=>viewHeight.value/height.value);
const baseUnit=computed(()=>baseHeight.value/height.value);
function limitCenter(value:number,min:number,max:number,span:number){
 if(span>=max-min)return (min+max)/2;
 return Math.max(min+span/2,Math.min(max-span/2,value));
}
function setCenter(x:number,y:number){
 cx.value=limitCenter(x,mapBounds.west,mapBounds.east,viewWidth.value);
 cy.value=limitCenter(y,mapBounds.north,mapBounds.south,viewHeight.value);
}
const index=computed(()=>props.route?buildRouteIndex(props.route.coordinates):null);
function toScreen([x,y]:Coordinate){return {x:(x-left.value)/unit.value,y:(y-top.value)/unit.value};}
const groups=computed(()=>{
 if(!index.value)return [];
 const walkers=props.walkers.filter(w=>w.id!==props.selfId).map(w=>{
  const position=pointAtProgress(index.value!,w.progressM/24570);
  return {id:w.id,...toScreen(position),position,nickname:w.nickname,distance:w.progressM,seconds:w.elapsedSeconds,moving:w.progressM<24570};
 });
 // The toolbar rounds to one decimal place, so a displayed 2.0× is already a close view.
 return zoom.value>=1.95?walkers.map(w=>[w]):clusterPoints(walkers,85);
});
const self=computed(()=>props.walkers.find(w=>w.id===props.selfId));
const selfPosition=computed(()=>index.value&&self.value?pointAtProgress(index.value,self.value.progressM/24570):null);
const markers=computed(()=>{
 const fixed=props.showSelf&&selfPosition.value?[{id:props.selfId,...toScreen(selfPosition.value),halfWidth:22,halfHeight:22}]:[];
 const points=groups.value.map(group=>({...group[0],halfWidth:group.length>1?21:14,halfHeight:21}));
 return layoutWalkerMarkers(points,fixed,width.value,height.value).map((p,i)=>{
  const group=groups.value[i],anchor=group[0];
  const offset=p.x!==anchor.x||p.y!==anchor.y;
  const position:Coordinate=offset?[left.value+p.x*unit.value,top.value+p.y*unit.value]:anchor.position;
  return {group,position,offset,screen:p};
 });
});
const trail=computed(()=>{if(!index.value||!self.value||!selfPosition.value)return '';const distance=self.value.progressM/24570*index.value.total;const points=index.value.points.filter((_,i)=>index.value!.cumulative[i]<distance);return [...points,selfPosition.value].map(p=>p.join(',')).join(' ');});
function locateMe(){if(!selfPosition.value)return;zoom.value=3;setCenter(...selfPosition.value);}
const labels=computed(()=>{
 const entries=markers.value.filter(m=>m.group.length===1).map(m=>({...m.group[0],...m.screen,position:m.position,own:false}));
 if(props.showSelf&&self.value&&selfPosition.value)entries.unshift({id:self.value.id,nickname:self.value.nickname,distance:self.value.progressM,seconds:self.value.elapsedSeconds,moving:props.selfActive,position:selfPosition.value,...toScreen(selfPosition.value),own:true});
 const obstacles=markers.value.filter(m=>m.group.length>1).map(m=>m.screen);
 const reserved=[{left:0,top:0,right:70,bottom:74},{left:width.value-255,top:height.value-46,right:width.value,bottom:height.value}];
 return layoutLabels(entries,obstacles,width.value,height.value,reserved).map(l=>({...l,mapX:left.value+l.x*unit.value,mapY:top.value+l.y*unit.value}));
});
const visiblePois=computed(()=>{
 const positions=new Map(props.checkpoints.map(p=>[p.id,p.position]));
 return pois.filter(p=>p.id===props.arrivalId||p.level===0||zoom.value>=1.35&&p.level===1||zoom.value>=2.3)
 .map(p=>{
  const [x,y]=positions.get(p.id)??[p.x,p.y];
  const screenX=(x-cx.value)/unit.value+width.value/2;
  const labelLeft=p.id==='start'?screenX>110:screenX+18+p.name.length*14>width.value;
  return {...p,x,y,labelLeft};
 });
});
function fit(){zoom.value=1;setCenter(540,730);}
function zoomAt(factor:number,x=width.value/2,y=height.value/2,panX=0,panY=0){
 const oldUnit=unit.value;
 zoom.value=Math.max(.8,Math.min(7,zoom.value*factor));
 const scaleDelta=oldUnit-unit.value;
 setCenter(cx.value-panX*oldUnit+(x-width.value/2)*scaleDelta,
  cy.value-panY*oldUnit+(y-height.value/2)*scaleDelta);
}
function zoomToRoute(){
 if(props.route){
  const closest=props.route.coordinates.reduce((a,b)=>Math.hypot(a[0]-cx.value,a[1]-cy.value)<Math.hypot(b[0]-cx.value,b[1]-cy.value)?a:b);
  [cx.value,cy.value]=closest;
 }
 zoomAt(1.4);
}
function zoomOut(){zoomAt(1/1.4);}
function wheel(e:WheelEvent){tapCandidate=null;const r=svg.value!.getBoundingClientRect();zoomAt(Math.exp(-e.deltaY*.0015),e.clientX-r.left,e.clientY-r.top);}
const pointers=new Map<number,{x:number;y:number}>();
let tapCandidate:{id:number;x:number;y:number}|null=null;
const contacts=new Set<number>();
function contactDown(e:PointerEvent){contacts.add(e.pointerId);if(contacts.size>1)tapCandidate=null;}
function contactEnd(e:PointerEvent){contacts.delete(e.pointerId);}
function clearGesture(){tapCandidate=null;contacts.clear();pointers.clear();}
function down(e:PointerEvent){
 if(e.button!==0)return;
 tapCandidate=pointers.size===0&&contacts.size===1?{id:e.pointerId,x:e.clientX,y:e.clientY}:null;
 try{svg.value!.setPointerCapture(e.pointerId);}catch{}
 pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
}
function move(e:PointerEvent){
 if(tapCandidate&&Math.hypot(e.clientX-tapCandidate.x,e.clientY-tapCandidate.y)>8)tapCandidate=null;
 const before=pointers.get(e.pointerId);
 if(!before)return;
 const old=[...pointers.values()];
 const next={x:e.clientX,y:e.clientY};
 pointers.set(e.pointerId,next);
 if(old.length===1){
  setCenter(cx.value-(next.x-before.x)*unit.value,cy.value-(next.y-before.y)*unit.value);
  return;
 }
 const now=[...pointers.values()];
 const oldDistance=Math.hypot(old[0].x-old[1].x,old[0].y-old[1].y);
 const distance=Math.hypot(now[0].x-now[1].x,now[0].y-now[1].y);
 const x=(now[0].x+now[1].x)/2,y=(now[0].y+now[1].y)/2;
 const rect=svg.value!.getBoundingClientRect();
 zoomAt(oldDistance>0?distance/oldDistance:1,x-rect.left,y-rect.top,
  x-(old[0].x+old[1].x)/2,y-(old[0].y+old[1].y)/2);
}
function up(e:PointerEvent){
 const tapped=tapCandidate?.id===e.pointerId&&pointers.size===1&&Math.hypot(e.clientX-tapCandidate.x,e.clientY-tapCandidate.y)<=8;
 tapCandidate=null;pointers.delete(e.pointerId);
 try{svg.value!.releasePointerCapture(e.pointerId);}catch{}
 if(tapped)emit('advance');
}
function cancel(e:PointerEvent){tapCandidate=null;pointers.delete(e.pointerId);}
function select(group:typeof groups.value[number]){emit('select',group.map(p=>p.id));if(group.length>1){cx.value=group[0].position[0];cy.value=group[0].position[1];zoomAt(1.7);}}
let observer:ResizeObserver;
onMounted(()=>{observer=new ResizeObserver(([entry])=>{width.value=Math.max(1,entry.contentRect.width);height.value=Math.max(1,entry.contentRect.height);setCenter(cx.value,cy.value);});observer.observe(svg.value!);document.addEventListener('pointerup',contactEnd,true);document.addEventListener('pointercancel',contactEnd,true);window.addEventListener('blur',clearGesture);emit('ready');});
onBeforeUnmount(()=>{observer?.disconnect();document.removeEventListener('pointerup',contactEnd,true);document.removeEventListener('pointercancel',contactEnd,true);window.removeEventListener('blur',clearGesture);});defineExpose({fit,locateMe,zoomToRoute,zoomOut,zoom});
</script>
<template><div class="map-shell local-map"><svg ref="svg" :viewBox="viewBox" class="map-canvas" aria-label="杭州徒步示意地图" @wheel.prevent="wheel" @pointerdown.capture="contactDown" @pointerdown="down" @pointermove="move" @pointerup="up" @pointercancel="cancel" @lostpointercapture="cancel">
<HangzhouBackdrop/>
<polyline v-if="route" class="route-stroke" :points="route.coordinates.map(p=>p.join(',')).join(' ')" fill="none" stroke="#fffdf4" :stroke-width="9*baseUnit" stroke-linecap="round" stroke-linejoin="round"/>
<polyline v-if="route" class="route-stroke" data-testid="route-line" :points="route.coordinates.map(p=>p.join(',')).join(' ')" fill="none" stroke="#7b5cad" :stroke-width="4.5*baseUnit" stroke-linecap="round" stroke-linejoin="round"/>
<polyline v-if="showSelf && self" class="route-stroke" :points="trail" fill="none" stroke="#de772f" :stroke-width="5*baseUnit" stroke-linecap="round" stroke-linejoin="round"/>
<g v-for="poi in visiblePois" :key="poi.id" :transform="'translate('+poi.x+','+poi.y+') scale('+unit+')'" class="poi" :class="{arrived:poi.id===arrivalId}"><circle v-if="poi.id===arrivalId" class="arrival-ring" r="15" fill="none" stroke="#e79735" stroke-width="3"/><circle r="4" :fill="poi.kind==='background'?'#889b7e':'#7159a8'" stroke="white" stroke-width="2"/><text :x="poi.labelLeft?-10:10" :y="poi.id==='start'?-25:-10" :text-anchor="poi.labelLeft?'end':'start'">{{ poi.name }}</text></g>
<g pointer-events="none" aria-hidden="true">
 <line v-for="marker in markers.filter(m=>m.offset)" :key="marker.group[0].id" :x1="marker.group[0].position[0]" :y1="marker.group[0].position[1]" :x2="marker.position[0]" :y2="marker.position[1]" stroke="#607961" stroke-opacity=".65" stroke-width="1.5" stroke-dasharray="3 3" vector-effect="non-scaling-stroke"/>
</g>
<g class="map-labels" pointer-events="none"><g v-for="label in labels" :key="label.id">
<line :x1="label.position[0]" :y1="label.position[1]" :x2="label.mapX" :y2="label.mapY" :stroke="label.own?'#df8a49':'#899e82'" stroke-width="1" stroke-opacity=".65" vector-effect="non-scaling-stroke"/>
<g :transform="'translate('+label.mapX+','+label.mapY+') scale('+unit+')'" :data-owner="label.id"><WalkerLabel :nickname="label.nickname" :distance="label.distance" :seconds="label.seconds" :self="label.own"/></g></g></g>
<g v-for="{group,position} in markers" :key="group.map(p=>p.id).join('-')" :transform="'translate('+position.join(',')+') scale('+unit+')'" class="map-person" role="button" tabindex="0" :aria-label="group.length>1?'查看 '+group.length+' 个模拟人物':'查看模拟人物 '+group[0].id" @pointerdown.stop @click.stop="select(group)" @keydown.enter.prevent="select(group)" @keydown.space.prevent="select(group)">
<rect v-if="group.length===1" x="-14" y="-21" width="28" height="42" rx="4" fill="transparent" pointer-events="all"/><circle v-if="group.length>1" r="19" fill="#285e4a" stroke="white" stroke-width="3"/>
<text v-if="group.length>1" text-anchor="middle" dy="5" fill="white" font-size="14" font-weight="bold">{{ group.length }}</text>
<WalkerSprite v-else :color="['#476f9d','#8466ac','#427e65','#c76b65'][Number(group[0].id.split('-')[1])%4]" :moving="group[0].moving" :variant="Number(group[0].id.split('-')[1])"/>
</g>
<g v-if="showSelf && selfPosition && self" data-testid="self-marker" :transform="'translate('+selfPosition.join(',')+') scale('+unit+')'" role="button" tabindex="0" aria-label="我的人物" class="self-marker" :class="{overtaking}" @pointerdown.stop @click.stop="emit('select',[selfId])" @keydown.enter.prevent="emit('select',[selfId])" @keydown.space.prevent="emit('select',[selfId])">
<circle v-if="overtaking" class="pass-ring" r="30" fill="none" stroke="#f3a24d" stroke-width="3"/><circle r="25" fill="#ed8a3c" opacity=".16" class="self-halo"/><circle r="20" fill="#fff8ec" stroke="#ed8a3c" stroke-width="2.5"/>
<WalkerSprite color="#ed8a3c" :moving="selfActive" :variant="0"/>
<title>{{ self.nickname }} · 我</title></g></svg>
<div class="north" aria-hidden="true">N<span>↑</span></div>
<div class="map-legend"><span><i class="legend-self"/>我的位置</span><span><i class="legend-others"/>模拟山友 {{ walkers.length-1 }} 人</span><span>示意地图</span></div>
</div></template>






