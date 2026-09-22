# 变更 Brainstorm

## 目标

为 Harness Templates V2 建立与 V1 完全隔离的遥测采集和统计链路，使维护者可以在
`/stats.html` 查看按项目、change 和 schema 聚合的 V2 数据，识别每个 change 使用的 schema
以及从 `lite` 原地升级为 `full` 的情况；原 V1 数据继续从独立入口访问。

## 现状与问题

- CLI 的 `src/lib/telemetry.ts` 只向 `POST /api/telemetry` 上报，服务端把事件追加到
  `telemetry.jsonl`，`GET /api/telemetry/stats` 和 `/stats.html` 共同消费这份 V1 数据。
- 当前事件包含 CLI、模板版本、Git 身份和 OpenSpec 原始参数，但没有稳定的 `changeName`、
  `schemaName` 或 Lite→Full 升级语义；无法可靠按 change 去重或统计 schema 路由结果。
- OpenSpec change 的 schema 事实源是 change 下的 `.openspec.yaml`。按当前工作流，Lite→Full
  原地升级还会在 `brainstorm.md` 保留 `<!-- harness:lite-to-full-promotion -->`，可作为升级来源的
  明确信号。
- 现有项目列表按仓库聚合，用户列表按 Git 用户聚合，但没有 change 维度；现有项目表也不再
  表达 change 负责人。

## 核心用例

| 角色/调用方 | 触发场景 | 预期结果 | 关键边界 |
|---|---|---|---|
| Templates V2 CLI | 用户运行任一 Harness 命令 | 只向 V2 endpoint 上报 V2 事件，不向 V1 endpoint 或 V1 文件写入 | opt-out、CI 禁用、超时和失败静默语义保持不变 |
| OpenSpec 工作流 | 命令可关联到一个 change | 事件携带项目、change、当前 schema 和 Lite→Full 来源 | 无法可靠解析 change 或 schema 时字段为空，不猜测 |
| 维护者 | 查看 `/stats.html` | 看到 V2 KPI、schema 分布、升级数量和 change 列表 | V1 事件不得混入任何 V2 聚合 |
| 维护者 | 多个项目存在同名 change | 每个项目分别展示并计数 | 去重键为项目身份与 change name，不跨项目合并 |
| 维护者 | 查看 change 负责人 | 展示该 change 首次 V2 上报事件中的 Git 姓名和邮箱 | 首次事件取不到身份时保持空值，不从后续事件补写或推断 |
| V1 使用者 | 访问 `/v1/stats.html` | 继续查看原 V1 统计和事件 | 原 `/api/telemetry`、`/api/telemetry/stats` 和 `telemetry.jsonl` 语义保持不变 |
| 新部署或空数据环境 | V2 尚无事件 | `/stats.html` 正常显示 V2 空态和 0 值 | 不回读或迁移 V1 历史数据 |

## 范围与验收

| 范围 | 内容 |
|---|---|
| In Scope | V2 CLI 事件契约与独立 endpoint；OpenSpec change/schema/升级上下文采集；V2 独立 JSONL 和 stats API；按项目+change 去重聚合；schema 与 Lite→Full 指标；V2 change 列表、表头排序/分类；`/stats.html` 切换 V2；新增 `/v1/stats.html` V1 入口及双向导航；相关单元、服务端契约和页面交互测试 |
| Out of Scope | V1 历史数据回填或迁移；向 V1/V2 双写；业务负责人配置、LDAP 或其他组织系统接入；修改 OpenSpec schema 路由规则；建立数据库、鉴权或新的数据保留策略；发布部署和生产数据清理 |

- [ ] Templates V2 CLI 的默认地址为 `POST /api/telemetry/v2`，可通过独立的 V2 环境变量覆盖，
  且不会使用 V1 endpoint 作为回退或双写目标。
- [ ] 服务端分别以 `telemetry.jsonl` 和 `telemetry-v2.jsonl` 接收 V1/V2 数据；两个 POST 与
  stats API 的读取、校验和响应互不串流。
- [ ] 可识别 change 的 V2 OpenSpec 事件上报 `changeName`、`schemaName` 和升级来源；不可识别时
  安全省略这些字段，普通 Harness 事件仍可成功上报。
- [ ] V2 stats 以“项目身份 + change name”为唯一 change，重复事件不会增加 change 数量；不同
  项目的同名 change 分别保留。
- [ ] V2 stats 返回各 schema 的唯一 change 数、Lite→Full 升级 change 数及 change 明细；升级
  change 当前 schema 为 `full`，并明确标识来源为 `lite`。
- [ ] change 负责人固定取首次 V2 事件的 Git 姓名/邮箱；首次缺失时 API 和页面保持空值。
- [ ] `/stats.html` 只请求并展示 V2 stats；`/v1/stats.html` 继续请求并展示 V1 stats，两个页面有
  清晰入口可互相切换。
- [ ] change 列表至少展示项目、change、schema、升级状态、负责人、事件数和最近活跃，并支持
  按项目、负责人、schema、事件数或最近活跃的表头排序。
- [ ] V1 服务端契约和既有统计行为通过回归测试；V2 payload 拒绝无效版本/必要字段且损坏 JSONL
  行不会阻断其余统计。

## 架构与影响概览

```mermaid
flowchart LR
    C1[旧版 CLI] -->|V1 事件| P1[POST /api/telemetry]
    P1 --> F1[telemetry.jsonl]
    F1 --> G1[GET /api/telemetry/stats]
    G1 --> U1[/v1/stats.html]

    C2[Templates V2 CLI] -->|V2 事件| P2[POST /api/telemetry/v2]
    P2 --> F2[telemetry-v2.jsonl]
    F2 --> G2[GET /api/telemetry/v2/stats]
    G2 --> U2[/stats.html]
```

| 区域/模块 | 当前职责或行为 | 本次影响 |
|---|---|---|
| `src/lib/telemetry.ts` | 组装通用 V1 事件并发送 | 定义 V2 契约、独立 endpoint 和 change 上下文，不保留 V1 发送路径 |
| `src/commands/openspec.ts` | 代理 OpenSpec 并上报原始命令信息 | 在命令完成后解析 change 并读取当前 schema/升级标记 |
| `web/server.ts` | 接收 V1、读取单文件并聚合 V1 stats | 保持 V1 路由，新增隔离的 V2 接收、文件和聚合契约 |
| `web/src/pages/stats.tsx` | `/stats.html` 展示 V1 统计 | 支持 V2 change 指标与列表，并把 V1 复用为独立页面模式 |
| Web 路由与注册表 | 仅注册 `/stats.html` | 新增 `/v1/stats.html`，提供 V1/V2 双向入口 |
| 测试 | 覆盖 V1 基础采集、聚合、分页与表格 | 增加 V2 隔离、上下文解析、去重、升级、负责人和双页面契约 |

## 方案方向与取舍

- V2 使用独立 `HARNESS_TELEMETRY_V2_URL`；不继承 `HARNESS_TELEMETRY_URL`，避免已有 V1
  自定义地址接收到 V2 payload。
- V2 事件显式携带契约版本，并使用结构化 change 上下文，而不是由服务端解析
  `openspecArgs`。CLI 离事实源最近，且可在 archive 后通过已归档 change 回读 selector 和标记。
- change 聚合键优先使用 `org/repo + changeName`；仓库身份缺失时使用稳定 `projectId +
  changeName`。没有项目身份或 change name 的事件参与通用事件统计，但不进入 change 列表。
- schema 分布按 change 的最新有效状态计数；升级 change 归入当前 `full`，另以
  `promotedFrom: lite` 统计升级数量，避免一个 change 在 schema 总数中重复计数。
- `/stats.html` 成为 V2 默认视图；`/v1/stats.html` 复用既有 V1 展示能力而非复制聚合逻辑。

## 约束、风险与决策

| 类型 | 约束或风险 | 决策或应对 |
|---|---|---|
| 数据隔离 | 路由分开但误用同一文件仍会污染 | V1/V2 在路由、文件名、读取函数和测试 fixture 四层隔离，并增加交叉污染反例 |
| 兼容 | 已发布 V1 CLI 和 V1 stats 仍在使用 | 原 V1 POST/GET、文件和响应字段保持不变；只把默认页面入口调整为 V2 |
| 迁移 | V1 事件不足以可靠还原 schema 和升级 | 不回填；V2 页面明确从 V2 事件开始统计 |
| 解析 | OpenSpec 命令形态多样，archive 后 active 路径消失 | 只覆盖可判定的 `--change`、new/archive 等命令形态，并按 active/archived change 顺序读取；无法判定时省略上下文 |
| 身份 | Git 用户可能为空、变更或不是业务 owner | 按用户确认将首次事件 Git 身份定义为负责人；为空时保持空，不接入外部身份源 |
| 隐私 | 姓名和邮箱属于用户信息 | 不新增 V1 已采集范围之外的身份字段，不写日志，不使用 HTML 注入，测试只用虚构身份 |
| 性能 | JSONL 聚合仍需全文件扫描 | 延续当前规模假设；本次不引入数据库、缓存或索引，后续由实际容量证据触发优化 |
| 外部契约 | CLI、服务端和页面需协调发布 | 使用新版本路由并保留 V1 回退入口；上线顺序为服务端先支持 V2，再发布 Templates V2 CLI |

## 流程选择

本变更新增由独立发布的 CLI 消费的 V2 API 和可观察数据契约，同时需要服务端、存储与页面协调
发布，错误切换会造成遥测丢失或数据污染，符合外部契约协调与回滚成本条件。Agent 建议使用
`full`；用户确认 V2 页面入口和负责人语义后，同意按 Full change 推进。
