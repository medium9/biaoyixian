import {test,expect,chromium,type Page} from '@playwright/test';

async function join(page:Page,name:string){
 await page.goto('/');
 await page.getByLabel('你的昵称',{exact:true}).fill(name);
 await page.getByRole('button',{name:'创建我的徒步身份'}).click();
}
const readWalk=(page:Page)=>page.evaluate(()=>{
 const key=Object.keys(localStorage).find(key=>key.startsWith('yunzou.walk.v1:'))!;
 return JSON.parse(localStorage.getItem(key)!);
});
function readStats(text:string){
 const match=text.match(/(?:(\d+)时)?(\d+)分(\d+)秒.*?([\d.]+) km/)!;
 return {seconds:Number(match[1]??0)*3600+Number(match[2])*60+Number(match[3]),km:Number(match[4])};
}

test('两个独立浏览器互见，位置时间里程同步，刷新续走不重复，退出移除',async({browser})=>{
 const firstContext=await browser.newContext();
 const secondContext=await browser.newContext();
 const errors:string[]=[];
 try{
  const a=await firstContext.newPage(),b=await secondContext.newPage();
  for(const page of [a,b])page.on('pageerror',error=>errors.push(error.message));
  await join(a,'西湖小鹿');
  await expect(a.getByTestId('presence-status')).toHaveText('已连接 · 等待同行者',{timeout:12000});
  await expect(a.locator('.map-person')).toHaveCount(0);
  await join(b,'山间小雨');
  const onA=a.getByRole('button',{name:'查看在线山友 山间小雨',exact:true});
  const onB=b.getByRole('button',{name:'查看在线山友 西湖小鹿',exact:true});
  await expect(onA).toBeVisible();await expect(onB).toBeVisible();
  await onA.press('Enter');
  const info=a.getByLabel('人物信息',{exact:true});
  await expect(info).toContainText('00分00秒 · 0.00 km');
  await b.getByRole('button',{name:'点击行进',exact:true}).click();
  await b.getByRole('button',{name:'确认起点，出发'}).click();
  const boost=b.getByRole('button',{name:'点击加速',exact:true});
  await expect(boost).toBeVisible();
  const position=await onA.getAttribute('transform');
  for(let i=0;i<12;i++){await boost.click();await b.waitForTimeout(100);}
  await expect.poll(()=>onA.getAttribute('transform')).not.toBe(position);
  await expect.poll(async()=>readStats((await info.textContent())!).seconds).toBeGreaterThan(0);
  await expect.poll(async()=>readStats((await info.textContent())!).km).toBeGreaterThan(0);
  await expect(info).toContainText('在线山友');
  await expect.poll(()=>b.getByTestId('travel-speed').getAttribute('data-speed').then(Number),{timeout:6000}).toBe(0);
  // Wait for the final stopped frame to reach the browser save.
  await b.waitForTimeout(1100);
  const saved=await readWalk(b);
  const token=await b.evaluate(()=>localStorage.getItem('yunzou.presence.v1'));
  await b.screenshot({path:'tests/artifacts/online-walker-b.png',fullPage:true});
  await a.screenshot({path:'tests/artifacts/online-walker-a.png',fullPage:true});
  await b.reload();
  await expect(b.getByRole('button',{name:'继续上次行走'})).toBeVisible();
  expect((await readWalk(b)).progressM).toBe(saved.progressM);
  expect((await readWalk(b)).elapsedSeconds).toBe(saved.elapsedSeconds);
  expect(await b.evaluate(()=>localStorage.getItem('yunzou.presence.v1'))).toBe(token);
  await expect(onB).toBeVisible();
  await expect(onA).toHaveCount(1);
  await expect(a.getByTestId('presence-status')).toHaveText('在线同行 1 人');
  await b.getByRole('button',{name:'继续上次行走'}).click();
  await b.getByRole('button',{name:'自动行进',exact:true}).click();
  await expect.poll(async()=>(await readWalk(b)).progressM).toBeGreaterThan(saved.progressM);
  await expect.poll(async()=>readStats((await info.textContent())!).seconds).toBeGreaterThan(Math.floor(saved.elapsedSeconds));
  await b.close();
  await expect(onA).toHaveCount(0,{timeout:12000});
  await expect(info).toHaveCount(0);
  expect(errors).toEqual([]);
 }finally{await firstContext.close();await secondContext.close();}
});

test('真实断网仍累计行走，租期移除，恢复后双方重新互见',async({browser})=>{
 const firstContext=await browser.newContext(),secondContext=await browser.newContext();
 try{
  const a=await firstContext.newPage(),b=await secondContext.newPage();
  await join(a,'守候山友');await join(b,'断线山友');
  const onA=a.getByRole('button',{name:'查看在线山友 断线山友',exact:true});
  const onB=b.getByRole('button',{name:'查看在线山友 守候山友',exact:true});
  await expect(onA).toBeVisible();await expect(onB).toBeVisible();
  await b.getByRole('button',{name:'确认起点，出发'}).click();
  await expect(b.getByRole('heading',{name:'正在徒步'})).toBeVisible();
  await secondContext.setOffline(true);
  await expect(b.getByTestId('presence-status')).toHaveText('连接断开 · 可继续行走');
  const before=await readWalk(b);
  await expect.poll(async()=>(await readWalk(b)).progressM).toBeGreaterThan(before.progressM);
  await expect.poll(async()=>(await readWalk(b)).elapsedSeconds).toBeGreaterThan(before.elapsedSeconds);
  await expect(onA).toHaveCount(0,{timeout:12000});
  await secondContext.setOffline(false);
  await expect(onB).toBeVisible();await expect(onA).toBeVisible();
  await expect(b.getByTestId('presence-status')).toHaveText('在线同行 1 人');
  await expect(onA).toHaveCount(1);
  await onA.press('Enter');
  await expect.poll(async()=>readStats((await a.getByLabel('人物信息',{exact:true}).textContent())!).seconds).toBeGreaterThan(Math.floor(before.elapsedSeconds));
  await expect.poll(async()=>readStats((await a.getByLabel('人物信息',{exact:true}).textContent())!).km).toBeGreaterThan(before.progressM/1000);
 }finally{await firstContext.close();await secondContext.close();}
});

test('生产服务在普通 HTTP 地址也能创建身份并让两个会话互见',async({baseURL})=>{
 test.skip(process.env.E2E_PRODUCTION!=='1','普通 HTTP 地址由生产 Node 服务验收');
 const browser=await chromium.launch({channel:'msedge',args:['--host-resolver-rules=MAP biaoyixian.test 127.0.0.1','--no-proxy-server']});
 try{
  const url=baseURL!.replace('127.0.0.1','biaoyixian.test');
  const first=await browser.newContext({baseURL:url}),second=await browser.newContext({baseURL:url});
  const a=await first.newPage(),b=await second.newPage();
  await a.goto('/');
  expect(await a.evaluate(()=>window.isSecureContext)).toBe(false);
  expect(await a.evaluate(()=>typeof crypto.randomUUID)).toBe('undefined');
  await join(a,'清风山友');await join(b,'明月山友');
  await expect(a.getByRole('button',{name:'查看在线山友 明月山友',exact:true})).toBeVisible();
  await expect(b.getByRole('button',{name:'查看在线山友 清风山友',exact:true})).toBeVisible();
 }finally{await browser.close();}
});
