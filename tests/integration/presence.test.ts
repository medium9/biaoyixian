import {createServer,type Server} from 'node:http';
import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest';
import {createPresenceMiddleware} from '../../server/presence.mjs';

type Player={id:string;nickname:string;mode:string;progressM:number;elapsedSeconds:number;moving:boolean;source:string};
type Payload=ReturnType<typeof participant>;
type Reply={players?:Player[];error?:string};

function participant(number:number){
 return {
  token:number.toString(16).padStart(64,'0'),
  connection:number.toString(16).padStart(32,'0'),
  routeId:'biaoyixian',routeVersion:'1.0',
  player:{nickname:`山友${number}`,mode:'hike',progressM:12.5,elapsedSeconds:34.75,moving:true},
 };
}

describe('真人同行 HTTP 合约',()=>{
 let server:Server;
 let baseUrl:string;
 let now:number;

 beforeEach(async()=>{
  now=100_000;
  vi.spyOn(Date,'now').mockImplementation(()=>now);
  const presence=createPresenceMiddleware();
  server=createServer((req,res)=>void presence(req,res,()=>{
   res.writeHead(404,{'Content-Type':'application/json'}).end('{"error":"not_found"}');
  }));
  await new Promise<void>((resolve,reject)=>{
   server.once('error',reject);
   server.listen(0,'127.0.0.1',()=>resolve());
  });
  const address=server.address();
  if(!address||typeof address==='string')throw Error('Expected a TCP listener');
  baseUrl=`http://127.0.0.1:${address.port}`;
 });

 afterEach(async()=>{
  vi.restoreAllMocks();
  server?.closeAllConnections();
  if(server?.listening)await new Promise<void>((resolve,reject)=>server.close(error=>error?reject(error):resolve()));
 });

 async function send(payload:unknown,options:{path?:string;method?:string;headers?:Record<string,string>;rawBody?:string}={}){
  const method=options.method??'POST';
  const response=await fetch(baseUrl+(options.path??'/api/presence'),{
   method,
   headers:{'Content-Type':'application/json',Origin:baseUrl,...options.headers},
   body:method==='GET'||method==='HEAD'?undefined:options.rawBody??JSON.stringify(payload),
   signal:AbortSignal.timeout(3000),
  });
  return {status:response.status,headers:response.headers,body:await response.json() as Reply};
 }

 it('独立浏览器互见，返回最新里程、时间与动作且不泄露身份凭据',async()=>{
  const a=participant(1),b=participant(2);
  const joined=await send(a);
  expect(joined.status).toBe(200);
  expect(joined.body).toEqual({players:[]});
  expect(joined.headers.get('cache-control')).toBe('no-store');

  const onB=await send(b);
  expect(onB.status).toBe(200);
  expect(onB.body.players).toEqual([{
   id:expect.stringMatching(/^online-[0-9a-f]{32}$/),nickname:'山友1',mode:'hike',
   progressM:12.5,elapsedSeconds:34.75,moving:true,source:'online',
  }]);
  const onA=await send(a);
  const bId=onA.body.players![0].id;
  b.player={nickname:'山间小雨',mode:'run',progressM:321.5,elapsedSeconds:123.25,moving:false};
  await send(b);
  const updated=await send(a);
  expect(updated.body.players).toEqual([{
   id:bId,nickname:'山间小雨',mode:'run',progressM:321.5,elapsedSeconds:123.25,moving:false,source:'online',
  }]);
  for(const snapshot of [onB.body,onA.body,updated.body]){
   const json=JSON.stringify(snapshot);
   for(const secret of [a.token,a.connection,b.token,b.connection])expect(json).not.toContain(secret);
   expect(json).not.toContain('"token"');
   expect(json).not.toContain('"connection"');
  }
 });

 it('刷新使用同一身份，新连接不重复，旧页面的退出不删除新连接',async()=>{
  const original=participant(1),observer=participant(2);
  await send(original);
  const before=await send(observer);
  const id=before.body.players![0].id;
  const refreshed={...original,connection:'f'.repeat(32),player:{...original.player,progressM:25,elapsedSeconds:45}};
  expect((await send(refreshed)).body.players).toHaveLength(1);
  await send({...original,leave:true});
  const after=await send(observer);
  expect(after.body.players).toEqual([{
   id,nickname:'山友1',mode:'hike',progressM:25,elapsedSeconds:45,moving:true,source:'online',
  }]);
  await send({...refreshed,leave:true});
  expect((await send(observer)).body.players).toEqual([]);
 });

 it('退出立即移除人物，重复退出也成功',async()=>{
  const a=participant(1),observer=participant(2);
  await send(a);
  expect((await send(observer)).body.players).toHaveLength(1);
  const {player,...identity}=a;
  const left=await send({...identity,leave:true});
  expect(left.status).toBe(200);
  expect(left.body).toEqual({players:[]});
  expect((await send(observer)).body.players).toEqual([]);
  expect((await send({...identity,leave:true})).status).toBe(200);
 });

 it('无心跳人物在 7.5 秒边界过期，不提前移除',async()=>{
  await send(participant(1));
  now+=7499;
  expect((await send(participant(2))).body.players).toHaveLength(1);
  now+=1;
  expect((await send(participant(2))).body.players).toEqual([]);
 });

 it('有效心跳延长在线时间，过期从最后一次上报计算',async()=>{
  const a=participant(1),observer=participant(2);
  await send(a);
  now+=7000;
  await send(a);
  now+=500;
  expect((await send(observer)).body.players).toHaveLength(1);
  now+=7000;
  expect((await send(observer)).body.players).toEqual([]);
 });

 it('到达终点的上报始终显示停止',async()=>{
  const a=participant(1);
  await send({...a,player:{...a.player,progressM:24570,moving:true}});
  expect((await send(participant(2))).body.players![0]).toMatchObject({progressM:24570,moving:false});
 });

 it.each([
  ['路线 ID',{routeId:'another-route'}],
  ['路线版本',{routeVersion:'2.0'}],
  ['身份 token',{token:'invalid'}],
  ['连接标识',{connection:'invalid'}],
 ])('拒绝非法%s且不加入房间',async(_label,changes)=>{
  const invalid=await send({...participant(1),...changes});
  expect(invalid.status).toBe(400);
  expect(invalid.body).toEqual({error:'request'});
  expect((await send(participant(2))).body.players).toEqual([]);
 });

 it.each([
  ['过短昵称',{nickname:'山'}],
  ['过长昵称',{nickname:'山'.repeat(13)}],
  ['昵称控制字符',{nickname:'山\n友'}],
  ['负里程',{progressM:-1}],
  ['超出路线里程',{progressM:24571}],
  ['非数值里程',{progressM:'10'}],
  ['非有限里程',{progressM:null}],
  ['负累计时间',{elapsedSeconds:-1}],
  ['超限累计时间',{elapsedSeconds:9007199254740992}],
  ['非数值累计时间',{elapsedSeconds:'10'}],
  ['未知步调',{mode:'fly'}],
  ['非布尔动作状态',{moving:'true'}],
 ])('拒绝%s且保留上次有效状态',async(_label,changes)=>{
  const a=participant(1);
  await send(a);
  const invalid=await send({...a,player:{...a.player,...changes}});
  expect(invalid.status).toBe(400);
  expect(invalid.body).toEqual({error:'player'});
  expect((await send(participant(2))).body.players![0]).toMatchObject({
   nickname:'山友1',mode:'hike',progressM:12.5,elapsedSeconds:34.75,moving:true,
  });
 });

 it('接受首尾空白并按 Unicode 字符数校验昵称',async()=>{
  const a=participant(1);
  await send({...a,player:{...a.player,nickname:`  ${'🌲'.repeat(12)}  `}});
  expect((await send(participant(2))).body.players![0].nickname).toBe('🌲'.repeat(12));
 });

 it('拒绝非 POST、跨源和错误内容类型',async()=>{
  const a=participant(1);
  const get=await send(a,{method:'GET'});
  expect(get.status).toBe(405);
  expect(get.headers.get('allow')).toBe('POST');
  expect(get.body).toEqual({error:'method'});
  const crossOrigin=await send(a,{headers:{Origin:'https://unrelated.example'}});
  expect(crossOrigin.status).toBe(403);
  expect(crossOrigin.body).toEqual({error:'origin'});
  const wrongType=await send(a,{headers:{'Content-Type':'text/plain'}});
  expect(wrongType.status).toBe(415);
  expect(wrongType.body).toEqual({error:'type'});
  expect((await send(participant(2))).body.players).toEqual([]);
 });

 it('拒绝损坏 JSON 和超过 2 KiB 的请求',async()=>{
  for(const rawBody of ['{invalid',JSON.stringify({...participant(1),padding:'x'.repeat(2048)})]){
   const rejected=await send(null,{rawBody});
   expect(rejected.status).toBe(400);
   expect(rejected.body).toEqual({error:'request'});
  }
  expect((await send(participant(2))).body.players).toEqual([]);
 });

 it('带查询参数仍由 API 处理，其他路径交给静态服务',async()=>{
  expect((await send(participant(1),{path:'/api/presence?refresh=1'})).status).toBe(200);
  const fallback=await send(participant(2),{path:'/assets/app.js',method:'GET'});
  expect(fallback.status).toBe(404);
  expect(fallback.body).toEqual({error:'not_found'});
 });

 it('最多容纳 100 人，已有用户能更新，退出和过期都会释放空位',async()=>{
  let last:Awaited<ReturnType<typeof send>>|undefined;
  for(let number=1;number<=100;number++){
   last=await send(participant(number));
   expect(last.status).toBe(200);
  }
  expect(last!.body.players).toHaveLength(99);
  const outsider=participant(101);
  const full=await send(outsider);
  expect(full.status).toBe(429);
  expect(full.body).toEqual({error:'room_full'});
  const existing=participant(1);
  existing.player.progressM=100;
  const update=await send(existing);
  expect(update.status).toBe(200);
  expect(update.body.players).toHaveLength(99);
  await send({...participant(2),leave:true});
  const joined=await send(outsider);
  expect(joined.status).toBe(200);
  expect(joined.body.players).toHaveLength(99);
  expect(joined.body.players!.find(player=>player.nickname==='山友1')!.progressM).toBe(100);
  now+=7499;
  expect((await send(participant(102))).status).toBe(429);
  now+=1;
  const afterExpiry=await send(participant(102));
  expect(afterExpiry.status).toBe(200);
  expect(afterExpiry.body.players).toEqual([]);
 });
});
