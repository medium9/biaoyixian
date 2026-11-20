/** 用户手势解锁音频；发声失败不影响行走和视觉反馈。 */
export function createArrivalSound(){
 let context:AudioContext|undefined;
 let active:OscillatorNode[]=[];
 function unlock(){
  try{context??=new AudioContext();if(context.state==='suspended')void context.resume().catch(()=>{});}catch{}
 }
 function stop(){for(const oscillator of active){try{oscillator.stop();}catch{}}active=[];}
 function play(){
  if(!context||context.state!=='running')return;
  const audio=context;
  try{
   [784,1046.5].forEach((frequency,i)=>{
    const oscillator=audio.createOscillator(),gain=audio.createGain(),time=audio.currentTime+i*.16;
    oscillator.type='sine';oscillator.frequency.value=frequency;
    gain.gain.setValueAtTime(0,time);gain.gain.linearRampToValueAtTime(.08,time+.015);gain.gain.exponentialRampToValueAtTime(.001,time+.4);
    oscillator.connect(gain);gain.connect(audio.destination);active.push(oscillator);
    oscillator.onended=()=>{oscillator.disconnect();gain.disconnect();active=active.filter(node=>node!==oscillator);};
    oscillator.start(time);oscillator.stop(time+.42);
   });
  }catch{}
 }
 function dispose(){stop();if(context)void context.close().catch(()=>{});context=undefined;}
 return {unlock,play,stop,dispose};
}
