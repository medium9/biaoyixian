<script setup lang="ts">
import {ref,computed,onUnmounted} from 'vue';
import MapCanvas from '../components/map/MapCanvas.vue';
import ModeSelector from '../components/controls/ModeSelector.vue';
import TravelControls from '../components/controls/TravelControls.vue';
import ArrivalToast from '../components/map/ArrivalToast.vue';
import WalkerInfo from '../components/walkers/WalkerInfo.vue';
import JoinTrail from '../components/onboarding/JoinTrail.vue';
import {readProfile,type Profile} from '../domain/profile/profile';
import {loadRoute} from '../services/data/route-loader';
import {useSimulation} from '../composables/use-simulation';
import {usePresence} from '../composables/use-presence';
import {useArrivalFeedback} from '../composables/use-arrival-feedback';
import {MODES} from '../domain/walking/walking-engine';
import {formatElapsed} from '../utils/format-walk';
import type {WalkingMode} from '../types/walker';
import type {Route} from '../types/route';

let route:Route|null=null;let routeError='';
try{route=loadRoute();}catch(e){routeError=(e as Error).message;}
let storedProfile:Profile|null=null;
try{storedProfile=readProfile(localStorage);}catch{}
const profile=ref<Profile|null>(storedProfile),mode=ref<WalkingMode>('hike'),ready=ref(false);
const selected=ref<string[]>([]),canvas=ref<InstanceType<typeof MapCanvas>>();
const demo=new URLSearchParams(location.search).get('mode')==='demo';
const presence=usePresence(route,()=>profile.value?{...me.value,moving:moving.value}:null,!demo);
const {walkers,running,moving,started,start,restore,storageError,controlMode,setControlMode,tap,speed,soundEnabled,toggleSound,checkpoints,arrivals,overtake}=useSimulation(route,demo,()=>presence.players.value);
if(profile.value){restore(profile.value);mode.value=walkers.value[0].mode;}
const {activeArrival,passedNames,unlockSound,dismiss}=useArrivalFeedback(arrivals,overtake,soundEnabled);
const mapWalkers=computed(()=>[...walkers.value,...presence.players.value]);
const people=computed(()=>mapWalkers.value.filter(w=>selected.value.includes(w.id)));
const me=computed(()=>walkers.value[0]),progress=computed(()=>me.value.progressM/24570*100);
const presenceText=computed(()=>{
 if(demo)return '模拟山友 '+(walkers.value.length-1)+' 人';
 if(!route)return '路线暂不可用';
 if(presence.status.value==='offline')return '连接断开 · 可继续行走';
 if(presence.status.value==='full')return '路线已满 · 等待空位';
 if(presence.status.value==='connecting')return '正在连接同行地图';
 const peers=presence.players.value.length;
 return peers?'在线同行 '+peers+' 人':'已连接 · 等待同行者';
});
const next=computed(()=>checkpoints.find(p=>p.distanceM>me.value.progressM));
const countdown=ref(0);let timer:ReturnType<typeof setInterval>|undefined;
const finished=computed(()=>me.value.progressM>=24570);
const guide=computed(()=>{
 if(!started.value)return {title:'从老和云起出发',text:controlMode.value==='auto'?'选好步调，确认出发后会沿标毅线自动前进。':'确认出发后，连点地图空白处或「点击加速」，停点就会减速。'};
 if(finished.value)return {title:'抵达吴山大观！',text:'你走完了标毅线全程。点「查看全线」，回看一路点亮的山路。'};
 if(!running.value)return {title:'上次的脚步停在这里',text:'点「继续上次行走」从保存的位置接着走。想先看看自己在哪，点「定位到我」。'};
 if(controlMode.value==='tap')return {title:moving.value?'沿山路前进':'按你的节奏前进',text:'连点加速，停点减速。点「定位到我」可回到橙色角色所在的位置。'};
 return {title:'正在'+MODES[me.value.mode].label,text:'角色正沿路线自动前进。点「定位到我」可回到橙色角色所在的位置。'};
});
function join(value:Profile){profile.value=value;restore(value);}
function depart(){
 if(started.value||countdown.value||!profile.value)return;
 unlockSound();countdown.value=3;canvas.value?.locateMe();
 timer=setInterval(()=>{countdown.value--;if(!countdown.value){clearInterval(timer);start(mode.value);}},1000);
}
function resume(){unlockSound();start(me.value.mode);}
function accelerate(){unlockSound();tap();}
function sound(){toggleSound();unlockSound();}
onUnmounted(()=>clearInterval(timer));
</script>

<template>
 <main class="app trail-app" :inert="!profile">
  <header class="topbar">
   <div class="brand"><span class="brand-icon" aria-hidden="true">山</span><div><h1>云走标毅线</h1><p>老和云起 → 吴山大观</p></div></div>
   <div v-if="profile" class="player-chip"><span aria-hidden="true">{{ profile.nickname.slice(0,1) }}</span><strong>{{ profile.nickname }}</strong></div>
  </header>
  <section class="workspace trail-workspace">
   <MapCanvas ref="canvas" :route="route" :walkers="mapWalkers" :presence-text="presenceText" :self-id="me.id" :self-active="moving" :show-self="!!profile" :checkpoints="checkpoints" :arrival-id="activeArrival?.id" :overtaking="passedNames.length>0" @ready="ready=true" @select="selected=$event" @advance="accelerate"/>
   <section class="trail-dock" aria-label="底部行走与地图操控">
    <div class="dock-inner">
     <div class="dock-summary">
      <div class="dock-guide">
       <h2>{{ guide.title }}</h2>
       <p>{{ guide.text }}</p>
      </div>
      <div class="dock-progress">
       <div class="progress-readout"><strong>{{ (me.progressM/1000).toFixed(2) }} <small>km</small></strong><span>/ 24.57 km · {{ formatElapsed(me.elapsedSeconds) }}</span></div>
       <progress aria-label="路线进度" :value="progress" max="100"/>
      </div>
      <div class="dock-checkpoint">
       <div v-if="activeArrival||passedNames.length" class="dock-feedback"><ArrivalToast :arrival="activeArrival" :passed-names="passedNames" @dismiss="dismiss"/></div>
       <div v-else class="dock-next">
        <span class="dock-waypoint" aria-hidden="true">⚑</span>
        <div><small>{{ finished?'终点':'下一处路标' }}</small><strong>{{ next?.name??'吴山大观' }}</strong></div>
        <span v-if="next" class="waypoint-distance">{{ ((next.distanceM-me.progressM)/1000).toFixed(2) }} km</span>
       </div>
      </div>
     </div>
     <div class="dock-controls">
      <TravelControls :mode="controlMode" :speed="speed" :disabled="!!countdown||!!storageError||finished" :sound-enabled="soundEnabled" @change="setControlMode" @sound="sound"/>
      <ModeSelector v-if="!started&&controlMode==='auto'" v-model="mode" :disabled="!!countdown" compact/>
      <button v-if="!started" class="dock-primary" :disabled="!ready||!route||!!countdown||!!storageError" @click="depart">{{ countdown?'准备出发…':'确认起点，出发' }}</button>
      <button v-else-if="!running&&!finished" class="dock-primary" :disabled="!ready||!route||!!storageError" @click="resume">继续上次行走</button>
      <button v-else-if="controlMode==='tap'&&running" class="dock-primary tap-boost" aria-label="点击加速" @click="accelerate" @keydown="event=>{if(event.repeat)event.preventDefault();}"><span aria-hidden="true">↟</span> 点击加速</button>
      <div class="dock-map-tools" role="group" aria-label="地图操控">
       <button class="dock-locate" aria-label="定位到我" :disabled="!ready||!profile" @click="canvas?.locateMe()">◎ 定位到我</button>
       <button :disabled="!ready||!route" @click="canvas?.fit()">查看全线</button>
       <div class="dock-zoom">
        <button aria-label="缩小地图" :disabled="!ready||!route" @click="canvas?.zoomOut()">−</button>
        <span>{{ (canvas?.zoom??1).toFixed(1) }}×</span>
        <button aria-label="放大地图" :disabled="!ready||!route" @click="canvas?.zoomToRoute()">+</button>
       </div>
      </div>
     </div>
     <div v-if="storageError" class="data-notice" role="alert">{{ storageError }} <button class="secondary" @click="profile&&restore(profile)">重试读取进度</button></div>
     <div v-if="!route" class="data-notice">{{ routeError||'路线尚未加载' }}</div>
     <WalkerInfo :walkers="people" :self-id="me.id" @close="selected=[]"/>
    </div>
   </section>
   <div v-if="countdown" class="countdown-overlay" role="status"><div><small>老和云起 · 准备出发</small><strong :key="countdown">{{ countdown }}</strong><span>即将沿标毅线前进</span></div></div>
  </section>
 </main>
 <JoinTrail v-if="!profile" :demo="demo" @join="join"/>
</template>



