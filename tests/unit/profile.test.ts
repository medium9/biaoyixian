import {it,expect,vi} from 'vitest';
import {normalizeNickname,readProfile,saveProfile} from '../../src/domain/profile/profile';
it('昵称去空白、2到12字，拒绝空昵称和控制字符',()=>{expect(normalizeNickname('  山间小鹿  ')).toBe('山间小鹿');for(const x of ['', 'a','abcdefghijklmnop','你好\n世界'])expect(()=>normalizeNickname(x)).toThrow();});
it('本机身份往返及损坏存储恢复',()=>{let value:string|null=null;const storage={getItem:()=>value,setItem:(_k:string,v:string)=>{value=v;}};const p=saveProfile(storage,'山间小鹿');expect(readProfile(storage)).toEqual(p);value='{';expect(readProfile(storage)).toBeNull();});
it('存储不可用返回清晰错误',()=>{expect(()=>saveProfile({setItem(){throw Error('quota')}},'山间小鹿')).toThrow('无法保存');});
it('局域网 HTTP 缺少 randomUUID 时仍可创建并保存不同的本机身份',()=>{
 const getRandomValues=crypto.getRandomValues.bind(crypto);
 vi.stubGlobal('crypto',{getRandomValues});
 try{
  let value:string|null=null;
  const storage={getItem:()=>value,setItem:(_key:string,next:string)=>{value=next;}};
  const first=saveProfile(storage,'  山间小鹿  ');
  expect(readProfile(storage)).toEqual({id:first.id,nickname:'山间小鹿'});
  expect(first.id.length).toBeGreaterThanOrEqual(32);
  const second=saveProfile(storage,'林间清风');
  expect(second.id).not.toBe(first.id);
  expect(readProfile(storage)).toEqual({id:second.id,nickname:'林间清风'});
 }finally{vi.unstubAllGlobals();}
});
it('已有 UUID 身份读取时保留原 ID',()=>{
 const profile={id:'5a29a3d4-dca6-43eb-8b91-6d21fb4d85c0',nickname:'山间小鹿'};
 expect(readProfile({getItem:()=>JSON.stringify(profile)})).toEqual(profile);
});
