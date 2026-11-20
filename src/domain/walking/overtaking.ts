import type {Walker} from '../../types/walker';
export function findOvertaken(before:Walker[],after:Walker[],selfId:string):Walker[] {
 const meBefore=before.find(w=>w.id===selfId),meAfter=after.find(w=>w.id===selfId);
 if(!meBefore||!meAfter||meAfter.progressM<=meBefore.progressM)return [];
 const previous=new Map(before.map(w=>[w.id,w]));
 return after.filter(w=>{
  const old=previous.get(w.id);
  return w.id!==selfId&&old&&w.progressM<24570&&w.progressM>old.progressM&&meBefore.progressM<=old.progressM&&meAfter.progressM>w.progressM;
 });
}
