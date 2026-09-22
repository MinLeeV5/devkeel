## ADDED Requirements

### Requirement: V1 与 V2 服务端数据隔离
服务端 MUST 使用独立路由和独立 JSONL 文件接收及统计 V1、V2 事件：V1 接口只能读写
`telemetry.jsonl`，V2 接口只能读写 `telemetry-v2.jsonl`，任一版本的数据不得出现在另一版本的
stats 响应中。

#### Scenario: 接收 V2 事件
- **WHEN** 调用方向 `POST /api/telemetry/v2` 提交合法的 V2 payload
- **THEN** 服务端只向 `telemetry-v2.jsonl` 追加该事件并返回成功

#### Scenario: 拒绝无效 V2 事件
- **WHEN** V2 payload 缺少契约版本、必要字段或字段类型不合法
- **THEN** 服务端返回 400 且不修改 V1 或 V2 文件

#### Scenario: 分别读取 V1 与 V2 stats
- **WHEN** V1 和 V2 文件包含可区分的事件
- **THEN** `GET /api/telemetry/stats` 只聚合 V1，`GET /api/telemetry/v2/stats` 只聚合 V2

#### Scenario: V2 文件包含损坏行
- **WHEN** `telemetry-v2.jsonl` 同时包含损坏行和合法事件
- **THEN** V2 stats 跳过损坏行并继续聚合合法事件，且不回读 V1 作为补偿

#### Scenario: V2 最近事件分页
- **WHEN** 调用方请求 `GET /api/telemetry/v2/stats` 并提供 `recentPage`
- **THEN** V2 stats MUST 按与 V1 相同的每页 20 条、时间倒序、页码校验和钳制语义返回最近事件及分页元数据

### Requirement: 按项目和 change 聚合 schema
V2 stats MUST 以稳定项目身份与 change name 的组合标识唯一 change，并 SHALL 为每个 change
保留最新有效 schema；schema 分布 MUST 按唯一 change 的当前 schema 计数，而不是按事件数计数。

#### Scenario: 同一 change 重复上报
- **WHEN** 同一项目的同名 change 上报多个事件且当前 schema 相同
- **THEN** V2 stats 的 change 总数和 schema 分布只计数一次，change 明细的事件数准确累加

#### Scenario: 跨项目同名 change
- **WHEN** 两个不同项目分别上报同一个 change name
- **THEN** V2 stats 保留两个 change 明细并分别计数

#### Scenario: Git 仓库身份缺失
- **WHEN** change 事件没有完整 `org/repo` 但有稳定 projectId
- **THEN** V2 stats 使用 projectId 区分项目并保留该 change

#### Scenario: 项目身份或 change name 缺失
- **WHEN** V2 事件没有可用项目身份或没有 change name
- **THEN** 事件参与通用 V2 事件统计但不进入 change 总数、schema 分布或 change 列表

#### Scenario: schema 随事件更新
- **WHEN** 同一 change 的较新事件携带不同的有效 schema
- **THEN** change 明细和 schema 分布使用时间最新的 schema 且该 change 仍只计数一次

### Requirement: 统计 Lite 升级 Full change
V2 stats MUST 统计当前 schema 为 `full` 且明确记录
`promotedFrom: "lite"` 的唯一 change 数量，并 SHALL 在 change 明细中保留该升级来源。

#### Scenario: Lite 原地升级为 Full
- **WHEN** 同一项目 change 的最终 schema 为 `full` 且任一有效上下文证明其来自 `lite`
- **THEN** 该 change 在 Full schema 分布中计数一次、在 Lite→Full 数量中计数一次，并显示升级标识

#### Scenario: 直接创建 Full
- **WHEN** change 的最终 schema 为 `full` 但没有 Lite promotion 证据
- **THEN** 该 change 只计入 Full schema 分布且不计入 Lite→Full 数量

#### Scenario: 重复升级事件
- **WHEN** 同一个升级 change 上报多个带 promotion 信息的事件
- **THEN** Lite→Full 数量仍只增加一次

### Requirement: 固定 change 首次上报负责人
V2 stats SHALL 将每个 change 按有效时间最早的 V2 事件中的 Git 姓名和邮箱定义为负责人；
如果该最早事件缺少身份，负责人字段 MUST 保持为空且不得从后续事件推断或补写。

#### Scenario: 首次事件包含 Git 身份
- **WHEN** change 的最早 V2 事件包含 Git 姓名和邮箱
- **THEN** change 明细返回该姓名和邮箱，后续不同用户事件不改变负责人

#### Scenario: 首次事件没有 Git 身份
- **WHEN** change 的最早 V2 事件没有 Git 姓名和邮箱但后续事件包含身份
- **THEN** change 明细的负责人姓名和邮箱仍为空

#### Scenario: 事件到达顺序与时间顺序不同
- **WHEN** 较晚写入文件的事件具有更早的有效时间戳
- **THEN** V2 stats 使用时间戳最早的事件确定负责人，并以文件顺序处理时间相同的稳定决胜

### Requirement: V2 change 列表与排序
`/stats.html` MUST 展示按项目区分的唯一 change 列表，至少包含项目、change、当前 schema、
Lite→Full 状态、负责人、事件数和最近活跃；项目、负责人、schema、事件数和最近活跃表头
MUST 支持排序并以可见状态和 `aria-sort` 暴露结果。

#### Scenario: 展示 change 明细
- **WHEN** V2 stats 返回 Lite、直接 Full 和 Lite→Full 三类 change
- **THEN** 页面逐行展示其项目、change、schema、升级标识、负责人、事件数和最近活跃

#### Scenario: 负责人缺失
- **WHEN** change 明细没有负责人姓名或邮箱
- **THEN** 页面使用空值占位展示且不生成虚假身份

#### Scenario: 文本表头排序
- **WHEN** 用户点击项目、负责人或 schema 表头
- **THEN** 页面按对应文本字段稳定排序且首次选择使用升序

#### Scenario: 数值表头排序
- **WHEN** 用户点击事件数或最近活跃表头
- **THEN** 页面按对应数值字段稳定排序且首次选择使用降序

#### Scenario: 反转排序方向
- **WHEN** 用户再次点击当前 change 排序表头
- **THEN** 页面在不发起网络请求的情况下反转排序方向并同步箭头与 `aria-sort`

#### Scenario: change 数据为空
- **WHEN** V2 stats 没有可展示的 change
- **THEN** 页面显示 change 列表空态且 schema 和升级指标显示为 0

### Requirement: V2 schema 与升级指标
`/stats.html` MUST 展示唯一 change 总数、按当前 schema 的唯一 change 分布以及 Lite→Full
change 数量，所有指标 SHALL 使用 V2 stats 的 change 聚合而非事件次数。

#### Scenario: 展示 schema 分布
- **WHEN** V2 stats 包含两个 Lite change、一个直接 Full 和一个 Lite→Full change
- **THEN** 页面显示 Lite 为 2、Full 为 2、总 change 为 4、Lite→Full 为 1

#### Scenario: V2 无 change 数据
- **WHEN** V2 文件不存在或事件均没有有效 change 身份
- **THEN** 页面显示总 change 与 Lite→Full 均为 0，并提供 schema 数据空态

## MODIFIED Requirements

### Requirement: React 页面与现有行为兼容
stats 页面 MUST 使用 React state 驱动排序、详情和分页交互；`/stats.html` MUST 请求并展示 V2
stats，`/v1/stats.html` MUST 请求并展示原 V1 stats，两个页面 MUST 提供清晰的双向切换入口。
V1 页面 SHALL 保持现有 KPI、图表、项目详情、用户命令详情、最近事件和执行结果详情行为。

#### Scenario: 打开默认 stats URL
- **WHEN** 用户通过 `/stats.html` 打开页面
- **THEN** 页面只请求 `/api/telemetry/v2/stats`、清晰标识 V2 并提供进入 V1 stats 的链接

#### Scenario: 打开 V1 stats URL
- **WHEN** 用户通过 `/v1/stats.html` 打开页面
- **THEN** 页面只请求 `/api/telemetry/stats`、清晰标识 V1、保持既有统计交互并提供返回 V2 的链接

#### Scenario: 使用键盘操作新增交互
- **WHEN** 键盘用户聚焦排序表头、命令详情、版本入口或分页按钮并执行操作
- **THEN** 页面通过语义化链接或按钮完成相同行为并暴露当前状态

#### Scenario: 窄屏展示
- **WHEN** 任一 stats 页面在窄屏窗口展示长表格和分页
- **THEN** 表格保持横向可滚动、分页允许换行且 Email 和 change 字段不撑破布局

#### Scenario: 保持 V1 既有详情
- **WHEN** 用户在 `/v1/stats.html` 操作项目详情、命令明细或命令执行结果
- **THEN** 既有详情浮层和分页交互继续正常工作
