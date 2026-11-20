import { readdirSync,readFileSync } from 'node:fs';
import { buildRouteIndex } from '../src/domain/route/route-geometry';
const dir='data/routes/schematic';const files=readdirSync(dir).filter(p=>p.endsWith('.json'));
if(!files.length){console.error('未提供产品示意路线，真实路线展示验收尚未完成。');process.exitCode=1;}
for(const file of files){const route=JSON.parse(readFileSync(dir+'/'+file,'utf8').replace(/^\uFEFF/,''));if(route.coordinateSystem!=='local'||route.representation!=='schematic'||!route.sourceReference)throw new Error('数据元信息不完整');buildRouteIndex(route.coordinates);console.log(file+' OK');}


