# V1.7 真人同行实施计划

> 执行方式：沿用当前会话与工作目录，按任务顺序验证和修复；使用 superpowers:executing-plans，独立的文档与审查工作可并行。用户已授权接续未提交实现，无需再次审批。本轮不提交、不推送、不发布。

**Goal:** 完成默认真人同行、独立演示入口和同局域网 Node服务的可运行交付，并留下真实验收记录。

**Architecture:** 复用本机行走及 `localStorage` 存档，增加同源轮询与单进程内存房间。开发服务与生产 Node入口复用在线中间件，页面合并本人与远端人物。

**Tech Stack:** Vue 3、TypeScript、Vite、Node HTTP、Vitest、Playwright/Microsoft Edge。

**Spec:** [V1.7需求](../product/云走标毅线_需求变更记录_V1.7.md)、[交互设计](../design/online-walkers-design.md)、[技术说明](../technical/online-walkers.md)。

## 全局约束与审查重点

- 保留当前 `main` 的未提交工作、原始PRD与V1.6，不引入账户、数据库或真实GPS。
- 默认真人模式与 `/?mode=demo` 明确分离；昵称、进度和反馈兼容现有存档。
- 每个浏览器仅使用单个标签页行走，不承诺多标签页同时操作的一致性。
- 关注刷新重复角色、旧连接退出、断网仍可行走、重连更新、关闭后移除。
- 检查非localhost的局域网HTTP昵称创建、同源接口、输入限制、满员和租期。
- 区分开发服务验证、生产 Node验证与两台实体设备实测，未执行项目不得记为通过。

## 1. 检查已有实现与构建

**范围：** `src/pages/MapPage.vue`、`src/components/map/MapCanvas.vue`、`src/composables/use-presence.ts`、`server/`、`vite.config.ts`、`package.json`。

- [x] 阅读当前实现，确认默认入口、演示入口、存档与生产服务边界。
- [x] 执行 `pnpm build`，记录并修复 MapCanvas 标签数据的类型错误，再次构建。
- [x] 执行现有 `pnpm test` 和在线浏览器用例，取得起始验证结果。

## 2. 补齐关键回归并修复

**范围：** `tests/e2e/online-walkers.spec.ts`，以及检查结果涉及的最小实现文件。

- [x] 验证双独立会话互见，在线位置、时间与里程随行走更新。
- [x] 验证刷新后数值保留、暂停恢复、对方仅有一个角色，关闭后角色及其详情移除。
- [x] 验证接口故障期间本机时间、里程持续增加且保存，恢复接口后自动重新加入。
- [x] 检查局域网HTTP的昵称创建与生产入口兼容性，对发现问题增加针对性回归并修复。
- [x] 运行 `pnpm test`、`pnpm typecheck`、`pnpm build`、`pnpm validate:data` 和 `pnpm test:e2e`，记录真实数量与失败原因。

## 3. 生产运行与文档验收

**范围：** `server/index.mjs`、`README.md`、`docs/product/`、`docs/design/`、`docs/technical/`、`docs/development/`。

- [x] 用构建结果启动 `pnpm start`，检查网页、资源、在线接口及监听地址；验证 `HOST`/`PORT` 覆盖。
- [x] 构建后设置 `E2E_PRODUCTION=1`，执行 `pnpm test:e2e tests/e2e/online-walkers.spec.ts`；由配置自行启动 `127.0.0.1:4178` 的 `pnpm start`，完成后清除环境变量，记录能否完成实际局域网地址访问。
- [x] 整理README启动和两设备步骤，明确Node要求、内存房间、非GPS、本机存档及不发布范围。
- [x] 核对文档链接、保留历史需求，填写 [V1.7验收记录](2026-11-21-online-walkers-acceptance.md)，将未执行项明确列出。

