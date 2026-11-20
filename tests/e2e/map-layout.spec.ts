import {test,expect} from '@playwright/test';

for(const width of [1440,390]){
 test(`底部集中行进与地图操作，${width}px 下可直接使用`,async({page})=>{
  await page.setViewportSize({width,height:width===390?844:900});
  await page.goto('/');
  await page.getByLabel('你的昵称',{exact:true}).fill('观景山友');
  await page.getByRole('button',{name:'创建我的徒步身份'}).click();
  const map=page.getByLabel('杭州徒步示意地图');
  const bottom=(await map.boundingBox())!;
  for(const name of ['自动行进','点击行进','到达提示音','查看全线','定位到我','放大地图','缩小地图','确认起点，出发']){
   const button=page.getByRole('button',{name,exact:true});
   await expect(button).toBeInViewport();
   expect((await button.boundingBox())!.y).toBeGreaterThanOrEqual(bottom.y+bottom.height-.5);
  }
  await expect(page.getByRole('progressbar',{name:'路线进度'})).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBe(width);
  await page.screenshot({path:`tests/artifacts/bottom-dock-${width}.png`});
 });
}

test('放大时白边、路线及已走路段按同一比例变粗',async({page})=>{
 await page.goto('/');
 await page.getByLabel('你的昵称',{exact:true}).fill('观景山友');
 await page.getByRole('button',{name:'创建我的徒步身份'}).click();
 const strokes=()=>page.locator('.route-stroke').evaluateAll(lines=>lines.map(line=>{
  const stroke=line as SVGGraphicsElement;
  const scale=stroke.getScreenCTM()!.a;
  const css=getComputedStyle(stroke);
  return parseFloat(css.strokeWidth)*(css.vectorEffect==='non-scaling-stroke'?1:scale);
 }));
 const before=await strokes();expect(before).toHaveLength(3);
 await page.getByRole('button',{name:'放大地图'}).click();
 const after=await strokes();
 for(let i=0;i<before.length;i++)expect(after[i]/before[i]).toBeCloseTo(1.4,2);
 await page.getByRole('button',{name:'查看全线'}).click();
 const restored=await strokes();
 for(let i=0;i<before.length;i++)expect(restored[i]).toBeCloseTo(before[i],2);
});

test('近景里两位山友走到同一段路仍各自显示，缩回全线才聚合',async({page})=>{
 await page.setViewportSize({width:1280,height:800});
 await page.clock.install();
 await page.goto('/');
 await page.getByLabel('你的昵称',{exact:true}).fill('观景山友');
 await page.getByRole('button',{name:'创建我的徒步身份'}).click();
 await page.evaluate(()=>{
  const {id}=JSON.parse(localStorage.getItem('yunzou.profile.v1')!);
  localStorage.setItem(`yunzou.walk.v1:${id}:biaoyixian:1.0`,JSON.stringify({profileId:id,routeId:'biaoyixian',routeVersion:'1.0',mode:'hike',progressM:1000,elapsedSeconds:800,started:true}));
 });
 await page.reload();
 await page.getByRole('button',{name:'定位到我'}).click();
 for(let i=0;i<3;i++)await page.getByRole('button',{name:'放大地图'}).click();
 const markers=['walker-2','walker-3'].map(id=>page.getByRole('button',{name:`查看模拟人物 ${id}`,exact:true}));
 for(const marker of markers)await expect(marker.locator('.walker-sprite')).toBeInViewport();
 // 起始相隔200虚拟米，跑山者比慢走者每秒多走约1.52米。
 await page.clock.fastForward(132_000);
 for(const marker of markers)await expect(marker.locator('.walker-sprite')).toBeInViewport();
 const own=page.getByTestId('self-marker');
 const before=await own.getAttribute('transform');
 const [first,second,me]=await Promise.all([...markers.map(marker=>marker.locator('.walker-sprite')),own.locator('circle').nth(1)].map(locator=>locator.boundingBox()));
 expect(first&&second&&me).toBeTruthy();
 for(const [a,b] of [[first!,second!],[first!,me!],[second!,me!]]){
  expect(a.x+a.width<=b.x||b.x+b.width<=a.x||a.y+a.height<=b.y||b.y+b.height<=a.y).toBe(true);
 }
 await page.screenshot({path:'tests/artifacts/walker-encounter.png'});
 await page.mouse.click(second!.x+second!.width/2,second!.y+second!.height/2);
 await expect(page.getByLabel('人物信息',{exact:true})).toContainText('山友 03');
 expect((await own.getAttribute('transform'))?.split(' scale')[0]).toBe(before?.split(' scale')[0]);
 await page.getByRole('button',{name:'查看全线'}).click();
 await expect(page.getByRole('button',{name:/查看 \d+ 个模拟人物/}).first()).toBeVisible();
});

test('放大拖到地图东侧时河水连续，继续拖动不会离开示意区域',async({page})=>{
 await page.setViewportSize({width:1280,height:800});
 await page.goto('/');
 await page.getByLabel('你的昵称',{exact:true}).fill('观景山友');
 await page.getByRole('button',{name:'创建我的徒步身份'}).click();
 const map=page.getByLabel('杭州徒步示意地图');
 await page.getByRole('button',{name:'放大地图'}).click();
 const view=async()=>(await map.getAttribute('viewBox'))!.split(' ').map(Number);
 const initial=await view();
 const bounds=(await map.boundingBox())!;
 async function panEast(){
  await page.mouse.move(bounds.x+bounds.width-75,bounds.y+150);
  await page.mouse.down();
  await page.mouse.move(bounds.x+75,bounds.y+150,{steps:5});
  await page.mouse.up();
 }
 for(let i=0;i<5;i++)await panEast();
 const edge=await view();
 expect(edge[0]).toBeGreaterThan(initial[0]+400);
 await panEast();
 expect(await view()).toEqual(edge);
 const reachesEdge=await map.evaluate((svg:SVGSVGElement)=>{
  const river=svg.querySelector<SVGPathElement>('#qian-river')!;
  const {x,y,width,height}=svg.viewBox.baseVal;
  return Array.from({length:41},(_,i)=>new DOMPoint(x+width-4,y+height*i/40))
   .some(point=>river.isPointInFill(point));
 });
 expect(reachesEdge).toBe(true);
 await page.screenshot({path:'tests/artifacts/map-east-edge.png'});
 await page.getByRole('button',{name:'查看全线'}).click();
 expect((await view())[0]).toBeLessThan(30);
});
