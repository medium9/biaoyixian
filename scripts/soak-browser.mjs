import { chromium, expect } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
const browser=await chromium.launch({channel:'msedge'});
const page=await browser.newPage();
const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.goto('http://127.0.0.1:5173/');
await page.getByLabel('你的昵称',{exact:true}).fill('持续运行检查');
await page.getByRole('button',{name:'创建我的徒步身份'}).click();
await page.getByRole('button',{name:'确认起点，出发'}).click();
await expect(page.getByRole('heading',{name:'正在徒步'})).toBeVisible({timeout:6000});
const client=await page.context().newCDPSession(page);await client.send('Performance.enable');
const started=Date.now(),samples=[];
for(let minute=1;minute<=10;minute++){
 await page.waitForTimeout(Math.max(0,started+minute*60000-Date.now()));
 if(minute%2===0)await page.getByRole('button',{name:'定位到我'}).click();
 else await page.getByRole('button',{name:'查看全线',exact:true}).click();
 const state=await page.evaluate(()=>{
  const key=Object.keys(localStorage).find(k=>k.startsWith('yunzou.walk.v1:'));
  const s=JSON.parse(localStorage.getItem(key));
  return {progressM:s.progressM,elapsedSeconds:s.elapsedSeconds,selfCount:document.querySelectorAll('[data-testid=self-marker]').length,nodes:document.querySelectorAll('*').length};
 });
 const metrics=await client.send('Performance.getMetrics');
 const heap=metrics.metrics.find(m=>m.name==='JSHeapUsedSize').value;
 samples.push({minute,heapBytes:heap,...state});
 if(state.selfCount!==1||!Number.isFinite(state.progressM)||state.progressM<=0||errors.length)throw Error(JSON.stringify({state,errors}));
 console.log(JSON.stringify(samples.at(-1)));
}
await page.reload();await expect(page.getByRole('button',{name:'继续上次行走'})).toBeVisible();
await page.screenshot({path:'tests/artifacts/soak-finish.png'});
mkdirSync('tests/artifacts',{recursive:true});writeFileSync('tests/artifacts/soak-result.json',JSON.stringify({wallSeconds:(Date.now()-started)/1000,samples,errors,restored:true},null,2));
await browser.close();console.log('PASS: 10-minute live run and restoration');

