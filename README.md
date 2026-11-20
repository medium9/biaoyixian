# 云走标毅线
本地二维杭州示意地图上的虚拟徒步原型。根据用户提供的参考截图绘制底图与紫色路线，无需高德或其他地图服务、API Key。

已实现20人模拟、跑山/徒步/慢走、沿线移动、地图拖动缩放、聚合展开及简单人物信息。路线和地标均为示意，24.57km是虚拟里程。

支持自动行进与惯性点击行进：选择点击行进后，点按地图空白处或“点击加速”，连点加速、松手减速。到达沿线地标有提示音与气泡，超越正在行进的模拟山友有光圈与昵称提示。声音可关闭，行进方式和到访记录保存在本机。

## 启动
需要Node.js 22.12+或兼容更新版本、pnpm 11。
```powershell
pnpm install
pnpm dev
```
打开终端显示的本地地址。首次创建本机昵称，再选择步调并点击“确认起点，出发”。默认徒步模式；橙色人物是自己，其他19人为模拟山友。刷新或关闭重开会保留昵称、模式、行走距离和有效时间，点击“继续上次行走”从原位置恢复，离线不累计。数据仅保存在当前浏览器。默认使用真实的3/6/9小时虚拟全程时长，短时间内移动幅度较小，放大可观察。

## 验证
```powershell
pnpm test
pnpm typecheck
pnpm build
pnpm validate:data
pnpm test:e2e
```
浏览器测试使用本机Microsoft Edge。生产静态文件输出到dist。

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
| data/routes/schematic | 产品示意路线 |
| data/pois | 地标和中文标识 |
| data/mock | 模拟人物和测试数据 |
| public | 公共静态资源 |
| tests | 单元、集成与浏览器测试 |
| scripts | 数据校验与维护脚本 |

## 文档
- [原始PRD V1.0](docs/product/云走标毅线_PRD与Codex开发交接文档_V1.0.md)
- [路线示意化 V1.1（历史）](docs/product/云走标毅线_需求变更记录_V1.1.md)
- [本地地图 V1.2](docs/product/云走标毅线_需求变更记录_V1.2.md)
- [设计方案](docs/design/phase-1-map-design.md)
- [技术架构](docs/technical/phase-1-architecture.md)
- [开发计划](docs/development/phase-1-plan.md)
- [开发进度](docs/development/phase-1-progress.md)


- [交互需求 V1.3](docs/product/云走标毅线_需求变更记录_V1.3.md)


- [当前需求 V1.4：行走记录](docs/product/云走标毅线_需求变更记录_V1.4.md)
- [当前增量 V1.5：双模式与反馈](docs/product/云走标毅线_需求变更记录_V1.5.md)
- [惯性行进设计](docs/design/inertial-walking-design.md)
- [地图与底部操控 V1.6](docs/product/云走标毅线_需求变更记录_V1.6.md)

