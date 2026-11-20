import {it,expect} from 'vitest';
import {findOvertaken} from '../../src/domain/walking/overtaking';
const person=(id:string,progressM:number)=>({id,nickname:id,progressM,mode:'hike' as const,elapsedSeconds:1});
it('按双方前后位置判断真实超越，连续帧不重复，已抵达人物不算',()=>{
 const before=[person('me',10),person('a',11),person('b',12),person('done',24570)];
 const after=[person('me',15),person('a',12),person('b',16),person('done',24570)];
 expect(findOvertaken(before,after,'me').map(p=>p.id)).toEqual(['a']);
 expect(findOvertaken(after,[person('me',17),person('a',13),person('b',18),person('done',24570)],'me')).toEqual([]);
 expect(findOvertaken(before,[person('me',10),person('a',12),person('b',13),person('done',24570)],'me')).toEqual([]);
});
