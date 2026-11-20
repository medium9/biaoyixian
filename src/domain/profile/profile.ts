export interface Profile {id:string;nickname:string}
export const PROFILE_KEY='yunzou.profile.v1';
export function normalizeNickname(value:string):string {
 const name=value.trim();if(/[\u0000-\u001f\u007f]/.test(name)||[...name].length<2||[...name].length>12)throw new Error('昵称请输入2～12个字，不含换行或控制字符。');return name;
}
export function readProfile(storage:Pick<Storage,'getItem'>):Profile|null{try{const value=JSON.parse(storage.getItem(PROFILE_KEY)||'null');if(!value||typeof value.id!=='string'||!value.id||typeof value.nickname!=='string')return null;return {id:value.id,nickname:normalizeNickname(value.nickname)};}catch{return null;}}
export function saveProfile(storage:Pick<Storage,'setItem'>,nickname:string):Profile{const profile={id:crypto.randomUUID(),nickname:normalizeNickname(nickname)};try{storage.setItem(PROFILE_KEY,JSON.stringify(profile));}catch{throw new Error('本机无法保存昵称，请允许浏览器本地存储后重试。');}return profile;}

