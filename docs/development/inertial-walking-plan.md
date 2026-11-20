# 双模式与地标反馈实施计划

> 执行方式：当前会话按superpowers:executing-plans执行；使用现有目录，不建立额外工程。

**Goal:** 增加可保存的惯性点击行进和一次性地标反馈。
**Architecture:** 纯函数负责惯性积分及地标投影，现有模拟循环维护自己的控制方式，独立组件负责控制与提示，存储向后兼容。
**Tech Stack:** Vue、TypeScript、SVG、浏览器Web Audio，无新增依赖。
**Spec:** ../design/inertial-walking-design.md、../product/云走标毅线_需求变更记录_V1.5.md。

## 约束与审查重点
同一身份同一存档；地标数据只保存在data/pois；用户时间按实际移动累计；路线为示意。重点检查拖动/多指误触、终点越界、旧存档迁移、隐藏页面惯性、声音关闭与提示去重。

## 1. 行进与到访核心
- [ ] 在tests/unit/inertial-walking.test.ts、checkpoints.test.ts和walk-storage.test.ts添加失败用例：密集点击更快，松手3秒停止，分帧一致，到终点时间钳制，多地标跨越且去重，旧记录默认自动，混合模式时间可超过原全程时限。
- [ ] 运行pnpm test确认缺失行为。
- [ ] src/domain/walking/inertial-walking.ts提供boostSpeed(speed)、advanceInertia(walker,speed,seconds)，返回walker/speed；每次+3，上限12，减速4。
- [ ] src/domain/route/checkpoints.ts提供buildCheckpoints(route,landmarks)、crossedCheckpoints(checkpoints,before,after,visited)，按投影里程排序。
- [ ] 更新walking-engine.ts独立累计有效时间、walk-storage.ts兼容controlMode/visitedIds/soundEnabled；运行核心测试。

## 2. 页面控制与反馈
- [ ] 添加tests/e2e/inertial-walking.spec.ts失败用例：切换、连点、停点、拖动/多指不加速、声音开关、到访提示及恢复去重。
- [ ] use-simulation.ts连接两种行进、存储、到访队列；隐藏/离开清零瞬时速度。
- [ ] MapCanvas.vue区分点击与拖动并emit advance，标记点使用统一投影位置；MapPage.vue连接控制和队列。
- [ ] components/controls/TravelControls.vue、components/map/ArrivalToast.vue独立展示控制/反馈；services/audio/arrival-sound.ts负责合成声音及释放；composables/use-arrival-feedback.ts管理队列、音频与计时器。
- [ ] pnpm test、pnpm build、pnpm test:e2e；桌面/手机截图目视验收并记录结果。
