# 第一阶段技术架构
当前基准：[V1.2需求变更](../product/云走标毅线_需求变更记录_V1.2.md)。不接地图API，不需要Key或网络瓦片。

## 技术
Vue 3 + TypeScript + Vite，pnpm管理依赖。地图由SVG原生绘制。测试采用Vitest、Playwright。没有业务后端、数据库或真实同步服务。

## 模块
- src/components/map/HangzhouBackdrop.vue：杭州示意底图。
- src/components/map/MapCanvas.vue：地图视图、手势、人物与标签展示。
- src/services/map/walker-cluster.ts：纯屏幕距离聚合，成员信息不丢失。
- src/domain/route/route-geometry.ts：平面路径累计长度、二分插值。
- src/domain/walking/walking-engine.ts：有效时间到虚拟米数。
- src/composables/use-simulation.ts：单一计时循环，隐藏页面暂停，卸载清理。
- src/services/data/route-loader.ts：路线数据校验与加载。
- src/components/controls/、walkers/：模式选择和人物信息。
- src/pages/MapPage.vue：页面装配。

## 数据
data/routes/schematic/biaoyixian-v1.json：产品示意路线，local坐标，不冒充经纬度。
data/pois/landmarks.json：中文地标和三级标签，全部是示意位置。
data/mock/walkers.json：20个模拟人物初始状态。
数据不在public另存副本。参考截图仅用来描绘形状，不将截图的其他APP界面嵌入网页。

24.57km为虚拟距离，映射为路径0..1进度。全程3/6/9小时，一小时8190/4095/2730虚拟米。按经过时间推进，终点钳制停止。路径图形单位不转换成真实米数。

## 外部依赖
开发安装需要包仓库；运行时底图、路线、地标均本地提供，不请求第三方地图服务。阶段1无需任何账户、API Key或外部业务服务。


## V1.3 实现补充
profile/profile.ts负责昵称校验和本机存储；JoinTrail.vue负责入口；WalkerSprite.vue为人物动画，WalkerLabel.vue为信息标签；label-layout.ts负责按屏幕空间避让人物及其他标签。elapsedSeconds仅累计有效模拟时间，终点停止累计。页面隐藏时暂停计时。

## V1.4：进度持久化
当前覆盖V1.3的身份保存范围：同一个本机身份和路线版本按固定key保存行走距离、模式及有效时间。启动/继续前读取，运行中每秒写入，visibilitychange/pagehide/unmount额外保存。关闭重开恢复暂停态，用户点击继续后才推进。较旧快照不能回退已有进度；存储失败停止自己的移动并显示错误。渲染位置由进度计算，自己的角色ID直接使用profile.id。

## V1.5：惯性行进与反馈
- inertial-walking.ts：恒定减速的解析积分；点击增加速度，3秒内自然停止，抵达终点只累计抵达前的有效时间。
- walking-engine.ts：自动行进按实际有效秒数累加；不再用3/6/9小时限制混合控制旅程的累计时间。
- checkpoints.ts：将data/pois/landmarks.json中沿线标记投影到示意路径，侧栏剩余距离、地图点位、到达触发共用此结果；背景景点不参与。
- overtaking.ts：比较双方前后进度，仅在超过仍移动的山友时产生事件。
- use-simulation.ts：控制方式、瞬时速度、到访记录与事件队列；隐藏、退出、切换控制方式均清零惯性。
- use-arrival-feedback.ts、arrival-sound.ts：到达队列与提示生命周期；Web Audio在用户手势后解锁，双音本地合成，静音立即停止音频，卸载释放。
- TravelControls.vue、ArrivalToast.vue、travel.css：独立的控制/速度显示和地图底部反馈区域，不覆盖人物画布。

原存储key保持兼容，新增可选controlMode、visitedIds、soundEnabled。无字段的旧记录默认自动/声音开启，历史到访由已有进度推定。准备阶段也保存设置。瞬时速度与提示队列不持久化，恢复不补播。不同标签页的混合速度会产生距离更远但用时更短的快照，存储优先保留更远距离，累计时间取较大值、不相加，已到访集合合并，防止回退或重复计时；这不提供真实在线同步。
