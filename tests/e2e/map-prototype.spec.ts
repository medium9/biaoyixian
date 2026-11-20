import {test,expect,type Page} from '@playwright/test';
async function join(page:Page){await page.goto('/');await expect(page.getByRole('dialog')).toBeVisible();await page.getByLabel('你的昵称',{exact:true}).fill('追风小鹿');await page.getByRole('button',{name:'创建我的徒步身份'}).click();await expect(page.getByRole('dialog')).toHaveCount(0);}
test('昵称注册、确认起点、倒数、自己独立移动与定位',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));const external:string[]=[];page.on('request',r=>{if(!r.url().startsWith('http://127.0.0.1'))external.push(r.url());});
 await join(page);await expect(page.getByTestId('route-line')).toBeVisible();
 const self=page.getByTestId('self-marker');await expect(self).toContainText('追风小鹿 · 我');
 const before=await self.getAttribute('transform');await page.waitForTimeout(250);expect(await self.getAttribute('transform')).toBe(before);
 await page.getByRole('button',{name:'确认起点，出发'}).click();await expect(page.getByRole('status').filter({hasText:'老和云起'})).toBeVisible();await expect(page.getByRole('heading',{name:'正在徒步'})).toBeVisible({timeout:6000});
 const start=await self.getAttribute('transform');await expect.poll(()=>self.getAttribute('transform')).not.toBe(start);
 const map=page.getByLabel('杭州徒步示意地图');const b=await map.boundingBox();await page.mouse.move(b!.x+100,b!.y+150);await page.mouse.down();await page.mouse.move(b!.x+200,b!.y+230);await page.mouse.up();
 await page.getByRole('button',{name:'定位到我'}).click();const view=(await map.getAttribute('viewBox'))!.split(' ').map(Number);const transform=(await self.getAttribute('transform'))!;const [x,y]=transform.match(/translate\(([^)]+)\)/)![1].split(',').map(Number);expect(Math.abs(view[0]+view[2]/2-x)).toBeLessThan(2);expect(Math.abs(view[1]+view[3]/2-y)).toBeLessThan(2);
 await self.press('Enter');await expect(page.getByLabel('人物信息',{exact:true})).toContainText('我的人物');await page.getByRole('button',{name:'关闭人物信息'}).click();
 expect(errors).toEqual([]);expect(external).toEqual([]);
 await page.getByRole('button',{name:'查看全线',exact:true}).click();await page.screenshot({path:'tests/artifacts/desktop-v2.png',fullPage:true});
});
test('刷新保留昵称，模拟山友在出发前移动，放大出现小人',async({page})=>{
 await join(page);const group=page.locator('.map-person').first();const before=await group.getAttribute('transform');await expect.poll(()=>group.getAttribute('transform')).not.toBe(before);
 for(let i=0;i<5;i++)await page.getByRole('button',{name:'放大地图',exact:true}).click();
 expect(await page.locator('.map-person .walker-sprite.walking').count()).toBeGreaterThan(12);await expect(page.getByTestId('self-marker')).toHaveCount(1);expect(await page.locator('.map-labels .walker-label').count()).toBeGreaterThan(0);await expect(page.locator('.map-labels .walker-label').first()).toContainText(/分.*秒.*km/);
 await page.screenshot({path:'tests/artifacts/zoom-v2.png',fullPage:true});
 await page.reload();await expect(page.getByRole('dialog')).toHaveCount(0);await expect(page.getByTestId('self-marker')).toContainText('追风小鹿');
});
test('手机注册与布局，昵称错误可修正',async({page})=>{
 await page.setViewportSize({width:390,height:844});await page.goto('/');await page.screenshot({path:'tests/artifacts/join-v2.png'});
 await page.getByRole('button',{name:'创建我的徒步身份'}).click();await expect(page.getByRole('alert')).toBeVisible();
 await page.getByLabel('你的昵称',{exact:true}).fill('山间小雨');await page.getByRole('button',{name:'创建我的徒步身份'}).click();await expect(page.getByRole('button',{name:'确认起点，出发'})).toBeEnabled();expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBe(390);
 await page.screenshot({path:'tests/artifacts/mobile-v2.png',fullPage:true});
});
test('窄桌面全线与双指平移',async({page})=>{
 await page.setViewportSize({width:800,height:900});await join(page);const map=page.getByLabel('杭州徒步示意地图');await page.getByRole('button',{name:'查看全线',exact:true}).click();const v=(await map.getAttribute('viewBox'))!.split(' ').map(Number);expect(v[0]).toBeLessThan(30);expect(v[0]+v[2]).toBeGreaterThan(1000);
 await map.dispatchEvent('pointerdown',{pointerId:1,clientX:500,clientY:250});await map.dispatchEvent('pointerdown',{pointerId:2,clientX:600,clientY:250});await map.dispatchEvent('pointermove',{pointerId:1,clientX:520,clientY:270});await map.dispatchEvent('pointermove',{pointerId:2,clientX:620,clientY:270});const after=(await map.getAttribute('viewBox'))!.split(' ').map(Number);expect(after[0]).toBeLessThan(v[0]);
});

test('展开小人可用鼠标点击查看时间距离',async({page})=>{await join(page);for(let i=0;i<3;i++)await page.getByRole('button',{name:'放大地图',exact:true}).click();const candidates=page.locator('.map-person').filter({has:page.locator('.walker-sprite')});const bounds=await page.getByLabel('杭州徒步示意地图').boundingBox();let clicked=false;for(const item of await candidates.all()){const box=await item.boundingBox();if(box&&box.x>bounds!.x+20&&box.x+box.width<bounds!.x+bounds!.width-20&&box.y>bounds!.y+90&&box.y+box.height<bounds!.y+bounds!.height-90){await page.mouse.click(box.x+box.width/2,box.y+box.height/2);clicked=true;break;}}expect(clicked).toBe(true);await expect(page.getByLabel('人物信息',{exact:true})).toContainText(/分.*秒/);});

test('起点密集人物的信息标签互不遮挡人物',async({page})=>{await join(page);await page.getByRole('button',{name:'定位到我'}).click();const overlap=await page.evaluate(()=>{const cards=[...document.querySelectorAll('.map-labels rect')].map(e=>e.getBoundingClientRect());const bodies=[...document.querySelectorAll('.walker-sprite')].map(e=>e.getBoundingClientRect());const intersects=(a:DOMRect,b:DOMRect)=>a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top;return cards.some(c=>bodies.some(b=>intersects(c,b)))||cards.some((c,i)=>cards.slice(i+1).some(b=>intersects(c,b)));});expect(overlap).toBe(false);await page.screenshot({path:'tests/artifacts/labels-v2.png',fullPage:true});});
test('关闭重开恢复同一身份的行走记录，离线不累计且不会重复创建',async({page,context})=>{
 await join(page);await page.getByRole('button',{name:'确认起点，出发'}).click();await expect(page.getByRole('heading',{name:'正在徒步'})).toBeVisible({timeout:6000});
 const read=()=>page.evaluate(()=>{const key=Object.keys(localStorage).find(k=>k.startsWith('yunzou.walk.v1:'))!;return JSON.parse(localStorage.getItem(key)!);});
 await expect.poll(async()=>(await read()).elapsedSeconds).toBeGreaterThan(1);
 const profile=await page.evaluate(()=>JSON.parse(localStorage.getItem('yunzou.profile.v1')!));await page.close();
 const reopened=await context.newPage();await reopened.goto('/');await expect(reopened.getByRole('button',{name:'继续上次行走'})).toBeVisible();await expect(reopened.getByTestId('self-marker')).toHaveCount(1);
 const snapshot=await reopened.evaluate(()=>{const key=Object.keys(localStorage).find(k=>k.startsWith('yunzou.walk.v1:'))!;return JSON.parse(localStorage.getItem(key)!);});expect(snapshot.profileId).toBe(profile.id);expect(snapshot.progressM).toBeGreaterThan(0);
 const position=await reopened.getByTestId('self-marker').getAttribute('transform');await reopened.waitForTimeout(1100);expect(await reopened.getByTestId('self-marker').getAttribute('transform')).toBe(position);
 await reopened.getByRole('button',{name:'继续上次行走'}).click();await expect.poll(async()=>reopened.evaluate(()=>{const key=Object.keys(localStorage).find(k=>k.startsWith('yunzou.walk.v1:'))!;return JSON.parse(localStorage.getItem(key)!).elapsedSeconds;})).toBeGreaterThan(snapshot.elapsedSeconds);
 expect(await reopened.evaluate(()=>Object.keys(localStorage).filter(k=>k.startsWith('yunzou.walk.v1:')).length)).toBe(1);
 await reopened.reload();await expect(reopened.getByRole('button',{name:'继续上次行走'})).toBeVisible();await expect(reopened.getByTestId('self-marker')).toHaveCount(1);
});
test('恢复已完成记录不会误回起点，也不能重复出发',async({page})=>{await join(page);await page.evaluate(()=>{const p=JSON.parse(localStorage.getItem('yunzou.profile.v1')!);localStorage.setItem('yunzou.walk.v1:'+p.id+':biaoyixian:1.0',JSON.stringify({profileId:p.id,routeId:'biaoyixian',routeVersion:'1.0',mode:'hike',progressM:24570,elapsedSeconds:21600,started:true}));});await page.reload();await expect(page.getByRole('heading',{name:'抵达吴山大观！'})).toBeVisible();await expect(page.getByRole('button',{name:'继续上次行走'})).toHaveCount(0);await expect(page.getByRole('button',{name:'确认起点，出发'})).toHaveCount(0);});
