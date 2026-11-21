# 云走标毅线
本地二维杭州示意地图上的虚拟徒步原型。根据用户提供的参考截图绘制底图与紫色路线，无需高德或其他地图服务、API Key。

默认进入真人同行地图：访问同一个服务的用户可看到彼此的昵称、虚拟位置、累计行走时间和里程。无需密码，昵称身份和个人进度仍保存在当前浏览器。路线和地标均为示意，24.57km是虚拟里程，不读取真实GPS。

支持跑山/徒步/慢走、自动行进与惯性点击行进、地图拖动缩放、聚合展开和人物信息。选择点击行进后，点按地图空白处或“点击加速”，连点加速、松手减速。到达沿线地标有提示音与气泡，超越正在行进的山友有光圈与昵称提示。声音可关闭，行进方式和到访记录保存在本机。打开 `/?mode=demo` 可体验自己加19位模拟山友的演示，该模式不加入在线房间。

## 启动与两设备同行

需要 Node.js 22.12+ 或兼容更新版本、pnpm 11。在作为主机的电脑运行：

```powershell
pnpm install
pnpm build
pnpm start
```

Node 服务默认监听 `0.0.0.0:4173`，同时提供网页和 `/api/presence`。主机可打开 `http://localhost:4173/`；手机和另一台电脑需与主机连接同一局域网，并打开 `http://主机的局域网IP:4173/`，例如 `http://192.168.1.10:4173/`。两台设备必须访问同一主机、同一端口，分别创建昵称；`localhost` 只指当前设备，不能用于访问另一台电脑。`0.0.0.0` 是监听地址，不是手机访问地址。若访问失败，检查主机防火墙是否允许该端口及局域网是否开启设备隔离。

首次创建本机昵称，再选择步调并点击“确认起点，出发”。橙色人物是自己；没有其他用户时显示“已连接 · 等待同行者”。刷新或关闭重开会保留昵称、模式、行走距离和有效时间，点击“继续上次行走”从原位置恢复。关闭或隐藏页面不补算时间；同步断开时，保持页面可见仍可本地行走，恢复连接后重新分享当前进度。自动行进对应3/6/9小时虚拟全程时长，短时间内移动幅度较小，放大可观察。

个人数据按浏览器来源保存：更换浏览器、设备、主机地址或端口不会自动迁移存档，清除浏览器数据会丢失本机身份和进度。请在同一浏览器中使用单个标签页行走；多标签页同时操作同一份进度不在本轮支持范围。双人验证请使用两台设备、不同浏览器或独立浏览器会话。

在 PowerShell 中可覆盖监听地址和端口：

```powershell
$env:HOST = '0.0.0.0'
$env:PORT = '4180'
pnpm start
```

本机开发运行 `pnpm dev`，打开终端显示的地址；默认仅监听 `127.0.0.1`，开发服务也包含在线接口。生产运行必须保留并启动 Node 服务，不能只发布 `dist` 静态文件。运行文件包括 `dist/`、`server/` 和 `data/routes/schematic/biaoyixian-v1.json`，使用 `pnpm start` 时还需 `package.json`。本轮仅完成本地运行与验收，不发布、不推送。

在线房间只保存在一个 Node 进程的内存中，最多100位在线身份；约800毫秒轮询一次，7.5秒未续约会过期。服务重启后在线列表清空，打开的页面会自动重新加入；个人进度仍从本机读取。没有账号登录、跨设备存档或多服务器共享房间。

## 验证

```powershell
pnpm test
pnpm typecheck
pnpm build
pnpm validate:data
pnpm test:e2e
```
浏览器测试使用本机 Microsoft Edge。`pnpm build` 包含类型检查并输出前端文件到 `dist`，生产入口为 `server/index.mjs`。本轮实际执行结果见 [V1.7 验收记录](docs/development/2026-11-21-online-walkers-acceptance.md)。

生产服务定向浏览器验收可在完成构建后重复执行：

```powershell
$env:E2E_PRODUCTION = '1'
pnpm test:e2e tests/e2e/online-walkers.spec.ts
Remove-Item Env:E2E_PRODUCTION
```

该模式由 Playwright自行启动 `pnpm start`，绑定 `127.0.0.1:4178`，不复用已有服务；默认浏览器回归使用开发服务 `127.0.0.1:5173`。两种模式均串行运行，避免在线房间中的测试身份相互干扰。

## 目录
| 目录 | 用途 |
|---|---|
| docs/product | PRD原文、需求版本变更 |
| docs/design | 地图与交互设计 |
| docs/technical | 技术架构 |
| docs/development | 计划、进度与验收 |
| src/pages、components | 页面与地图/人物/控制组件 |
| src/domain、composables | 移动、路径算法与状态 |
| src/services、types、styles | 数据服务、聚合、类型和样式 |
| server | 同源在线房间接口与生产静态文件服务 |
| data/routes/schematic | 产品示意路线 |
| data/pois | 地标和中文标识 |
| data/mock | 模拟人物和测试数据 |
| public | 公共静态资源 |
| tests | 单元、集成与浏览器测试 |
| scripts | 数据校验与维护脚本 |

## 文档

- [当前增量 V1.7：真人同行](docs/product/云走标毅线_需求变更记录_V1.7.md)
- [真人同行交互设计](docs/design/online-walkers-design.md)
- [真人同行技术说明](docs/technical/online-walkers.md)
- [V1.7 开发计划](docs/development/2026-11-21-online-walkers-plan.md)
- [V1.7 验收记录](docs/development/2026-11-21-online-walkers-acceptance.md)
- [原始PRD V1.0](docs/product/云走标毅线_PRD与Codex开发交接文档_V1.0.md)
- [路线示意化 V1.1（历史）](docs/product/云走标毅线_需求变更记录_V1.1.md)
- [本地地图 V1.2](docs/product/云走标毅线_需求变更记录_V1.2.md)
- [设计方案](docs/design/phase-1-map-design.md)
- [阶段1架构与历史增量](docs/technical/phase-1-architecture.md)
- [开发计划](docs/development/phase-1-plan.md)
- [开发进度](docs/development/phase-1-progress.md)
- [交互需求 V1.3](docs/product/云走标毅线_需求变更记录_V1.3.md)
- [V1.4：行走记录](docs/product/云走标毅线_需求变更记录_V1.4.md)
- [V1.5：双模式与反馈](docs/product/云走标毅线_需求变更记录_V1.5.md)
- [惯性行进设计](docs/design/inertial-walking-design.md)
- [地图与底部操控 V1.6](docs/product/云走标毅线_需求变更记录_V1.6.md)

