import {test,expect,type Page} from '@playwright/test';
import {buildCheckpoints} from '../../src/domain/route/checkpoints';
import {readFileSync} from 'node:fs';
import type {Route} from '../../src/types/route';
const routeData=JSON.parse(readFileSync(new URL('../../data/routes/schematic/biaoyixian-v1.json',import.meta.url),'utf8'));
const landmarks=JSON.parse(readFileSync(new URL('../../data/pois/landmarks.json',import.meta.url),'utf8'));
const checkpoints=buildCheckpoints(routeData as Route,landmarks);
test.setTimeout(15000);
async function prepare(page:Page,extra:Record<string,unknown>={},entry='/'){
 await page.goto(entry);
 await page.evaluate(extra=>{
  localStorage.setItem('yunzou.profile.v1',JSON.stringify({id:'test-traveler',nickname:'惯性山友'}));
  localStorage.setItem('yunzou.walk.v1:test-traveler:biaoyixian:1.0',JSON.stringify({profileId:'test-traveler',routeId:'biaoyixian',routeVersion:'1.0',mode:'hike',progressM:0,elapsedSeconds:0,started:true,controlMode:'tap',visitedIds:[],soundEnabled:true,...extra}));
 },extra);
 await page.reload();await page.getByRole('button',{name:'继续上次行走'}).click();
}
const read=(page:Page)=>page.evaluate(()=>JSON.parse(localStorage.getItem('yunzou.walk.v1:test-traveler:biaoyixian:1.0')!));
const speed=(page:Page)=>page.getByTestId('travel-speed').getAttribute('data-speed').then(Number);

test('连点加速、松手停止、实际时间停计、切换自动后继续同一进度',async({page})=>{
 await prepare(page);await expect(page.getByRole('button',{name:'点击行进',exact:true})).toHaveAttribute('aria-pressed','true');
 await page.waitForTimeout(300);expect((await read(page)).progressM).toBe(0);
 for(let i=0;i<5;i++){await page.getByRole('button',{name:'点击加速',exact:true}).click();await page.waitForTimeout(100);}
 expect(await speed(page)).toBeGreaterThan(5);
 await expect.poll(()=>speed(page),{timeout:4500}).toBe(0);
 await page.waitForTimeout(1100);const stopped=await read(page);expect(stopped.progressM).toBeGreaterThan(0);expect(stopped.elapsedSeconds).toBeGreaterThan(0);
 await page.waitForTimeout(300);expect(await read(page)).toEqual(stopped);
 await page.getByRole('button',{name:'自动行进',exact:true}).click();
 await expect.poll(async()=>(await read(page)).progressM).toBeGreaterThan(stopped.progressM);
 await page.reload();await expect(page.getByTestId('self-marker')).toHaveCount(1);await expect(page.getByRole('button',{name:'自动行进',exact:true})).toHaveAttribute('aria-pressed','true');
});
test('拖动、多指、取消、人物点击不加速，地图轻点有效',async({page})=>{
 await prepare(page);const map=page.getByLabel('杭州徒步示意地图');const b=(await map.boundingBox())!;
 const x=b.x+50,y=b.y+b.height-70;
 await page.mouse.move(x,y);await page.mouse.down();await page.mouse.move(x+80,y-30);await page.mouse.up();expect(await speed(page)).toBe(0);
 for(const id of [1,2])await map.dispatchEvent('pointerdown',{pointerId:id,clientX:x+id*20,clientY:y,button:0});
 for(const id of [1,2])await map.dispatchEvent('pointerup',{pointerId:id,clientX:x+id*20,clientY:y,button:0});
 await map.dispatchEvent('pointerdown',{pointerId:3,clientX:x,clientY:y,button:0});await map.dispatchEvent('pointercancel',{pointerId:3});
 expect(await speed(page)).toBe(0);await page.getByTestId('self-marker').press('Enter');expect(await speed(page)).toBe(0);await page.getByRole('button',{name:'关闭人物信息'}).click();
 await page.mouse.click(x,y);await expect.poll(()=>speed(page)).toBeGreaterThan(0);
});
test('抵达真实沿线标记显示气泡，到访与声音设置恢复后不重播',async({page})=>{
 await prepare(page,{progressM:checkpoints[0].distanceM-1,elapsedSeconds:100});
 await page.getByRole('button',{name:'到达提示音',exact:true}).click();
 await page.getByRole('button',{name:'点击加速',exact:true}).click();
 await expect(page.getByTestId('arrival-toast')).toContainText('老和山');
 await expect(page.locator('.poi.arrived')).toHaveCount(1);
 expect((await read(page)).visitedIds).toContain('laohe');expect((await read(page)).soundEnabled).toBe(false);
 await page.screenshot({path:'tests/artifacts/inertia-arrival.png',fullPage:true});
 await page.reload();await expect(page.getByTestId('arrival-toast')).toHaveCount(0);await expect(page.getByRole('button',{name:'到达提示音',exact:true})).toHaveAttribute('aria-pressed','false');
 await page.getByRole('button',{name:'继续上次行走'}).click();await page.getByRole('button',{name:'点击加速',exact:true}).click();await page.waitForTimeout(600);await expect(page.getByTestId('arrival-toast')).toHaveCount(0);
});
test('旧记录恢复默认自动，沿途已走过的地标不补播',async({page})=>{
 await prepare(page,{controlMode:undefined,visitedIds:undefined,progressM:5000,elapsedSeconds:5000});
 await expect(page.getByRole('button',{name:'自动行进',exact:true})).toHaveAttribute('aria-pressed','true');
 await expect(page.getByTestId('arrival-toast')).toHaveCount(0);expect((await read(page)).visitedIds).toContain('laohe');
});

test('出发准备阶段也保存控制方式和静音设置',async({page})=>{
 await page.goto('/');await page.getByLabel('你的昵称',{exact:true}).fill('准备中的山友');await page.getByRole('button',{name:'创建我的徒步身份'}).click();
 await page.getByRole('button',{name:'点击行进',exact:true}).click();await page.getByRole('button',{name:'到达提示音',exact:true}).click();
 await page.reload();await expect(page.getByRole('button',{name:'点击行进',exact:true})).toHaveAttribute('aria-pressed','true');await expect(page.getByRole('button',{name:'到达提示音',exact:true})).toHaveAttribute('aria-pressed','false');await expect(page.getByRole('button',{name:'确认起点，出发'})).toBeVisible();
});

test('第二指按人物或按住期间滚轮缩放均不误加速',async({page})=>{
 await prepare(page);const map=page.getByLabel('杭州徒步示意地图'),person=page.getByTestId('self-marker');
 await map.dispatchEvent('pointerdown',{pointerId:1,pointerType:'touch',button:0,clientX:450,clientY:300});
 await person.dispatchEvent('pointerdown',{pointerId:2,pointerType:'touch',button:0,clientX:800,clientY:200});
 await map.dispatchEvent('pointerup',{pointerId:1,pointerType:'touch',button:0,clientX:450,clientY:300});
 await person.dispatchEvent('pointerup',{pointerId:2,pointerType:'touch',button:0,clientX:800,clientY:200});
 expect(await speed(page)).toBe(0);
 await map.dispatchEvent('pointerdown',{pointerId:3,button:0,clientX:450,clientY:300});await map.dispatchEvent('wheel',{deltaY:-100,clientX:450,clientY:300});await map.dispatchEvent('pointerup',{pointerId:3,button:0,clientX:450,clientY:300});expect(await speed(page)).toBe(0);
});

test('底部加速操作区独立于地图人物画布',async({page})=>{
 await prepare(page);for(const width of [1280,390]){await page.setViewportSize({width,height:844});const map=(await page.getByLabel('杭州徒步示意地图').boundingBox())!,button=(await page.getByRole('button',{name:'点击加速',exact:true}).boundingBox())!;expect(button.y).toBeGreaterThanOrEqual(map.y+map.height);}
});

test('真实超过模拟山友时出现光圈与昵称反馈，刷新不重播',async({page})=>{
 await prepare(page,{progressM:695,elapsedSeconds:100},'/?mode=demo');
 for(let i=0;i<12;i++){await page.getByRole('button',{name:'点击加速',exact:true}).click();await page.waitForTimeout(100);}
 await expect(page.getByTestId('overtake-toast')).toContainText('山友 02');
 await expect(page.locator('.self-marker .pass-ring')).toHaveCount(1);
 await page.getByRole('button',{name:'定位到我'}).click();
 await page.screenshot({path:'tests/artifacts/inertia-overtake.png',fullPage:true});
 await page.reload();await expect(page.getByTestId('overtake-toast')).toHaveCount(0);
});

test('手机点按与键盘加速可用，隐藏再返回不残留惯性',async({page})=>{
 await page.setViewportSize({width:390,height:844});await prepare(page);
 await page.getByRole('button',{name:'点击加速',exact:true}).press('Enter');
 await expect.poll(()=>speed(page)).toBeGreaterThan(0);
 await page.evaluate(()=>{
  Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});document.dispatchEvent(new Event('visibilitychange'));
 });
 await page.waitForTimeout(200);const saved=await read(page);
 await page.evaluate(()=>{delete (document as unknown as {hidden?:boolean}).hidden;document.dispatchEvent(new Event('visibilitychange'));});
 expect(await speed(page)).toBe(0);await page.waitForTimeout(1200);expect((await read(page)).elapsedSeconds).toBe(saved.elapsedSeconds);
 await page.getByLabel('杭州徒步示意地图').dispatchEvent('pointerdown',{pointerId:1,pointerType:'touch',button:0,clientX:80,clientY:270});
 await page.getByLabel('杭州徒步示意地图').dispatchEvent('pointerup',{pointerId:1,pointerType:'touch',button:0,clientX:80,clientY:270});
 await expect.poll(()=>speed(page)).toBeGreaterThan(0);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBe(390);
 await page.locator('.workspace').evaluate(e=>e.scrollTop=0);
 await page.screenshot({path:'tests/artifacts/inertia-mobile.png',fullPage:true});
});

for(const soundEnabled of [true,false])test(soundEnabled?'开启提示音时抵达产生实际音频信号':'关闭提示音时抵达仍有气泡但无声音',async({page})=>{
 await page.addInitScript(()=>{
  // 在真实音频图中旁路采样，保留生产音频的创建、调度与播放。
  const original=AudioContext.prototype.createGain;
  (window as unknown as {heard:boolean}).heard=false;
  AudioContext.prototype.createGain=function(){
   const gain=original.call(this),analyser=this.createAnalyser(),mute=original.call(this);
   mute.gain.value=0;gain.connect(analyser);analyser.connect(mute);mute.connect(this.destination);
   const data=new Float32Array(analyser.fftSize);
   const timer=setInterval(()=>{analyser.getFloatTimeDomainData(data);if(data.some(value=>Math.abs(value)>.0001))(window as unknown as {heard:boolean}).heard=true;},10);
   setTimeout(()=>clearInterval(timer),5000);return gain;
  };
 });
 await prepare(page,{progressM:checkpoints[0].distanceM-.2,elapsedSeconds:100,soundEnabled});
 await page.getByRole('button',{name:'点击加速',exact:true}).click();
 await expect(page.getByTestId('arrival-toast')).toBeVisible();
 if(soundEnabled)await expect.poll(()=>page.evaluate(()=>(window as unknown as {heard:boolean}).heard)).toBe(true);
 else{await page.waitForTimeout(700);expect(await page.evaluate(()=>(window as unknown as {heard:boolean}).heard)).toBe(false);}
});
