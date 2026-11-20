import {ref,computed,watch,onUnmounted,type Ref} from 'vue';
import {createArrivalSound} from '../services/audio/arrival-sound';
import type {Checkpoint} from '../domain/route/checkpoints';
import type {OvertakeEvent} from './use-simulation';

export function useArrivalFeedback(arrivals:Ref<Checkpoint[]>,overtake:Ref<OvertakeEvent|null>,soundEnabled:Ref<boolean>){
 const audio=createArrivalSound(),activeArrival=computed(()=>arrivals.value[0]??null);
 const passedNames=ref<string[]>([]);
 let arrivalTimer:ReturnType<typeof setTimeout>|undefined,passTimer:ReturnType<typeof setTimeout>|undefined;
 watch(()=>activeArrival.value?.id,id=>{
  clearTimeout(arrivalTimer);if(!id)return;
  passedNames.value=[];clearTimeout(passTimer);
  if(soundEnabled.value&&!document.hidden)audio.play();
  arrivalTimer=setTimeout(()=>arrivals.value.shift(),4200);
 });
 watch(overtake,event=>{
  if(!event){passedNames.value=[];return;}
  if(activeArrival.value||document.hidden)return;
  passedNames.value=[...new Set([...passedNames.value,...event.names])];
  clearTimeout(passTimer);passTimer=setTimeout(()=>passedNames.value=[],2600);
 });
 watch(soundEnabled,enabled=>{if(!enabled)audio.stop();});
 function unlockSound(){if(soundEnabled.value)audio.unlock();}
 function dismiss(){if(activeArrival.value)arrivals.value.shift();else passedNames.value=[];}
 onUnmounted(()=>{clearTimeout(arrivalTimer);clearTimeout(passTimer);audio.dispose();});
 return {activeArrival,passedNames,unlockSound,dismiss};
}
