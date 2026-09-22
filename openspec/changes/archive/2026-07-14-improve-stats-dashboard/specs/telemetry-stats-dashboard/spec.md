## ADDED Requirements

### Requirement: 精简统计图表

stats 页面 MUST 将 OpenSpec 命令及调用次数渲染为竖向柱状图，并且 MUST NOT 渲染命令耗时图表；平均耗时 KPI 和其他既有图表 SHALL 保持可用。

#### Scenario: 展示 OpenSpec 命令柱状图
- **WHEN** stats 接口返回至少一个 OpenSpec 命令及调用次数
- **THEN** 页面使用 `bar` 图表并以横轴表示命令、纵轴表示调用次数

#### Scenario: OpenSpec 命令数据为空
- **WHEN** stats 接口返回空的 OpenSpec 命令分布
- **THEN** 页面显示既有“暂无 OpenSpec 数据”空状态且不创建空图表实例

#### Scenario: 不再展示命令耗时图表
- **WHEN** stats 页面完成加载
- **THEN** 版本信息区不包含“命令耗时 (ms)”图表且平均耗时 KPI 仍然存在

### Requirement: 项目列表列与默认顺序

stats 页面 MUST 仅在项目列表中展示 Org、Repo、CLI、模板、事件和最近活跃六列，并且 MUST 默认按事件数降序排列项目。

#### Scenario: 项目列表加载完成
- **WHEN** stats 接口返回多个项目
- **THEN** 项目列表不包含 User 和 Email 列且事件数最多的项目位于最上方

#### Scenario: 项目事件数相同
- **WHEN** 两个项目具有相同事件数
- **THEN** 页面先按最近活跃时间降序、再按稳定项目标识升序确定顺序

### Requirement: 项目列表表头排序

项目列表 MUST 支持通过“事件”和“最近活跃”表头切换排序字段和方向，并且 SHALL 以可见箭头及 `aria-sort` 暴露当前状态。

#### Scenario: 切换到最近活跃排序
- **WHEN** 用户在默认事件数降序状态点击“最近活跃”表头
- **THEN** 项目按最近活跃时间降序排列且该表头报告 descending 状态

#### Scenario: 反转当前排序方向
- **WHEN** 用户再次点击当前排序字段表头
- **THEN** 项目按同一字段升序排列且该表头报告 ascending 状态

#### Scenario: 切换回事件排序
- **WHEN** 用户从最近活跃排序点击“事件”表头
- **THEN** 排序字段切换为事件数并从降序开始

### Requirement: 用户命令使用明细

stats 接口 MUST 为每个用户返回全部命令及准确使用次数，stats 页面 MUST 允许用户点击“最常用命令”查看该明细。

#### Scenario: 服务端聚合用户命令
- **WHEN** 同一用户使用 `openspec` 三次并使用 `update` 一次
- **THEN** 用户摘要包含 `openspec: 3` 和 `update: 1` 且按次数降序排列

#### Scenario: 命令次数相同
- **WHEN** 同一用户的两个命令具有相同使用次数
- **THEN** 命令明细按命令名升序确定稳定顺序

#### Scenario: 点击最常用命令
- **WHEN** 用户点击用户列表中的最常用命令 badge
- **THEN** 页面使用既有详情浮层展示该用户所有命令和对应次数

#### Scenario: 关闭命令详情
- **WHEN** 命令详情已打开且用户再次点击触发器、点击浮层外部或按 Escape
- **THEN** 命令详情关闭并保持表格排序状态

#### Scenario: 命令明细为空
- **WHEN** 用户摘要没有可展示的命令明细
- **THEN** 页面显示 `-` 且不渲染无内容的详情按钮

### Requirement: 用户列表表头排序

用户列表 MUST 默认按事件数降序排列，并且 MUST 支持通过“事件数”和“最近活跃”表头切换排序字段和方向。

#### Scenario: 用户列表默认排序
- **WHEN** stats 接口返回多个用户
- **THEN** 事件数最多的用户位于最上方且“事件数”表头报告 descending 状态

#### Scenario: 按最近活跃排序用户
- **WHEN** 用户点击“最近活跃”表头
- **THEN** 用户列表按最近活跃时间降序排列且当前表头状态同步更新

#### Scenario: 反转用户排序方向
- **WHEN** 用户再次点击当前用户排序字段
- **THEN** 用户列表在不发送网络请求的情况下反转为升序

#### Scenario: 用户排序值相同
- **WHEN** 两个用户的主排序字段值相同
- **THEN** 页面使用另一数值字段降序和稳定用户标识升序确定顺序

### Requirement: 最近事件服务端分页契约

`GET /api/telemetry/stats` MUST 支持 `recentPage` 查询参数，以固定每页 20 条返回按时间降序的最近事件，并且 MUST 返回 `page`、`pageSize`、`totalItems` 和 `totalPages` 分页元数据。

#### Scenario: 默认请求第一页
- **WHEN** 调用方未提供 `recentPage`
- **THEN** 接口返回第 1 页、`pageSize` 为 20，并最多包含最新的 20 条可展示事件

#### Scenario: 请求第二页
- **WHEN** 存在 21 条具有有效时间戳的事件且调用方请求 `recentPage=2`
- **THEN** 接口返回第 2 页的一条事件、`totalItems` 为 21、`totalPages` 为 2

#### Scenario: 计算可展示事件总数
- **WHEN** 遥测文件同时包含有效时间戳事件和缺失时间戳事件
- **THEN** `totalItems` 只统计具有有效数字时间戳的事件且 `totalEvents` 保持既有语义

#### Scenario: 非法页码
- **WHEN** `recentPage` 缺失、非整数、非正数或超出安全整数范围
- **THEN** 接口使用第 1 页而不返回错误

#### Scenario: 页码超过末页
- **WHEN** 调用方请求的正整数页码大于 `totalPages`
- **THEN** 接口将页码钳制到末页并返回该页数据

#### Scenario: 没有最近事件
- **WHEN** 遥测文件不存在或不包含具有有效时间戳的事件
- **THEN** 接口返回空 `recentEvents`、`page=1`、`pageSize=20`、`totalItems=0` 和 `totalPages=1`

#### Scenario: 遥测文件包含损坏行
- **WHEN** 遥测文件中的部分 JSONL 行无法解析
- **THEN** 接口跳过损坏行并使用其余有效事件生成分页响应

### Requirement: 最近事件分页交互

stats 页面 MUST 为最近事件提供上一页、下一页和可选页码控件，并且 MUST 使用服务端返回的页码作为权威分页位置。

#### Scenario: 展示分页状态
- **WHEN** 最近事件存在两页或更多页
- **THEN** 页面展示当前页、总页数、首末页及当前页附近页码，当前页按钮具有 `aria-current="page"`

#### Scenario: 首页分页边界
- **WHEN** 当前页为第 1 页
- **THEN** 上一页按钮禁用且下一页按钮在存在后续页时可用

#### Scenario: 末页分页边界
- **WHEN** 当前页为最后一页
- **THEN** 下一页按钮禁用且上一页按钮在存在前一页时可用

#### Scenario: 分页加载中
- **WHEN** 页面正在请求另一页最近事件
- **THEN** 当前事件行保持可见、分页区域报告 busy 状态且分页按钮暂时禁用

#### Scenario: 分页请求失败
- **WHEN** 另一页请求返回失败或网络异常
- **THEN** 页面保留最后一次成功的事件行和页码、显示错误信息并恢复分页按钮以便重试

#### Scenario: 快速连续切页
- **WHEN** 较早页请求在较新页请求之后才返回
- **THEN** 页面丢弃较早响应并保持较新请求对应的事件页

#### Scenario: 旧服务端缺少分页元数据
- **WHEN** stats 响应包含 `recentEvents` 但不包含 `recentEventsPagination`
- **THEN** 页面降级为第 1 页共 1 页且仍可展示事件而不崩溃

### Requirement: 最近事件 Email 展示

stats 接口 MUST 将事件的 `git.userEmail` 映射为最近事件的 `userEmail`，stats 页面 MUST 在用户列旁展示 Email 列。

#### Scenario: 展示完整 Email 信息
- **WHEN** 最近事件包含用户 Email
- **THEN** Email 单元格显示该地址、应用截断样式并通过 `title` 保留完整值

#### Scenario: Email 过长
- **WHEN** Email 超出单元格最大宽度
- **THEN** 页面以省略号处理视觉溢出且用户仍可从 `title` 获取完整地址

#### Scenario: Email 缺失
- **WHEN** 最近事件没有用户 Email
- **THEN** Email 单元格显示 `-` 且不产生空的详情交互

### Requirement: React 页面与现有行为兼容

stats 页面 MUST 使用 React state 驱动新增排序、详情和分页交互，并且 SHALL 保持 `/stats.html`、现有 KPI、项目详情和命令执行结果详情行为兼容。

#### Scenario: 使用键盘操作新增交互
- **WHEN** 键盘用户聚焦排序表头、命令详情或分页按钮并执行操作
- **THEN** 页面通过语义化按钮完成相同行为并暴露当前状态

#### Scenario: 窄屏展示
- **WHEN** 页面在窄屏窗口展示长表格和分页
- **THEN** 表格保持横向可滚动、分页允许换行且 Email 不撑破布局

#### Scenario: 保持旧 URL 和既有详情
- **WHEN** 用户通过 `/stats.html` 打开页面并操作项目详情或命令执行结果
- **THEN** 路由和既有详情浮层继续正常工作
