import {it,expect} from 'vitest';
import {normalizeNickname,readProfile,saveProfile} from '../../src/domain/profile/profile';
it('昵称去空白、2到12字，拒绝空昵称和控制字符',()=>{expect(normalizeNickname('  山间小鹿  ')).toBe('山间小鹿');for(const x of ['', 'a','abcdefghijklmnop','你好\n世界'])expect(()=>normalizeNickname(x)).toThrow();});
it('本机身份往返及损坏存储恢复',()=>{let value:string|null=null;const storage={getItem:()=>value,setItem:(_k:string,v:string)=>{value=v;}};const p=saveProfile(storage,'山间小鹿');expect(readProfile(storage)).toEqual(p);value='{';expect(readProfile(storage)).toBeNull();});
it('存储不可用返回清晰错误',()=>{expect(()=>saveProfile({setItem(){throw Error('quota')}},'山间小鹿')).toThrow('无法保存');});
