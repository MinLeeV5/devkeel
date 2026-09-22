# Stats 遥测统计页增强实现计划

> **给 agentic 执行器：** 按 Section 的 `> mode:` 标注选择执行模式——inline/batch 使用 executing-plans 单 session 执行，isolated 使用 subagent-driven-development 逐任务执行。每个任务内严格执行 RED → GREEN → 自检；本计划不授权自动提交，`commit` 仅表示建议的原子提交边界。

**目标：** 完成 stats 页图表精简、项目与用户排序、用户命令明细、最近事件服务端分页及 Email 展示，并用服务端契约测试、React 交互测试和构建证据覆盖全部行为规格。

**架构：** `web/server.ts` 继续作为 JSONL 聚合和分页的唯一服务端边界，`useTelemetryStats` 管理完整快照与独立事件页状态，项目和用户排序保留为浏览器派生状态。`TelemetryTable` 扩展列描述、排序表头和 footer，现有 `DetailTrigger` 继续承载命令明细。

**技术栈：** TypeScript、Hono、React 19、Chart.js 4、Vitest 4、Testing Library、Vite。

## 全局约束

- 每页固定 20 条最近事件；`recentPage` 无效时回退第 1 页，超末页时钳制到末页。
- 不返回全量最近事件，不新增数据库、缓存、依赖或遥测采集字段。
- 交互必须由 React state 驱动，不使用 `data-action`、DOM 查询脚本、`dangerouslySetInnerHTML` 或类型检查逃逸。
- 保持 `/stats.html`、平均耗时 KPI、项目详情和执行结果详情兼容；服务端保留 `commandAvgDuration`。
- 本地 TypeScript import 省略源码扩展名；UI 沿用 stats 页现有变量、badge、table、tooltip 和横向滚动系统。
- 需求与设计依据：`brainstorm.md`、`design.md`、`specs/telemetry-stats-dashboard/spec.md`。

---

## 覆盖矩阵

| 来源 | 需求点 | 任务 |
|------|--------|------|
| brainstorm 验收标准 #1 / spec「展示 OpenSpec 命令柱状图」 | OpenSpec 使用竖向 bar，横轴命令、纵轴次数 | 2.1 |
| spec「OpenSpec 命令数据为空」 | 空分布保留空状态且不创建 Chart | 2.1 |
| brainstorm 验收标准 #1 / spec「不再展示命令耗时图表」 | 移除耗时图但保留平均耗时 KPI | 2.1 |
| brainstorm 验收标准 #2 / spec「项目列表加载完成」 | 项目仅六列且默认事件数降序 | 1.2、3.1、3.3 |
| spec「项目事件数相同」 | 项目使用最近活跃和稳定标识 tie-breaker | 1.2、3.3 |
| spec「切换到最近活跃排序」 | 项目按最近活跃降序并同步 aria-sort | 3.3 |
| spec「反转当前排序方向」 | 再次点击项目当前字段切换升序 | 3.3 |
| spec「切换回事件排序」 | 项目切回事件字段时从降序开始 | 3.3 |
| brainstorm 验收标准 #3 / spec「用户列表默认排序」 | 用户默认事件数降序并报告状态 | 3.3 |
| spec「按最近活跃排序用户」 | 用户可切换最近活跃降序 | 3.3 |
| spec「反转用户排序方向」 | 用户当前字段再次点击本地反转 | 3.3 |
| spec「用户排序值相同」 | 用户使用另一数值字段与稳定标识 tie-breaker | 3.3 |
| brainstorm 验收标准 #4 / spec「服务端聚合用户命令」 | 服务端返回完整命令与准确次数 | 1.2 |
| spec「命令次数相同」 | 命令次数相同时按命令名升序 | 1.2 |
| spec「点击最常用命令」 | badge 打开完整命令次数浮层 | 3.3 |
| spec「关闭命令详情」 | 再次点击、外部点击、Escape 关闭且保留排序 | 3.3 |
| spec「命令明细为空」 | 空明细显示 `-` 且无按钮 | 3.3 |
| brainstorm 验收标准 #5 / spec「默认请求第一页」 | stats 默认返回第 1 页最多 20 条和元数据 | 1.1 |
| spec「请求第二页」 | 21 条事件的第 2 页返回一条及正确总数 | 1.1 |
| spec「计算可展示事件总数」 | totalItems 只统计有效数字时间戳，totalEvents 不变 | 1.1 |
| spec「非法页码」 | 非整数、非正数、非安全整数回退第 1 页 | 1.1 |
| spec「页码超过末页」 | 正整数超末页钳制到末页 | 1.1 |
| spec「没有最近事件」 | 空数据固定返回第 1/1 页和空数组 | 1.1 |
| spec「遥测文件包含损坏行」 | 损坏 JSONL 行不阻断其余事件分页 | 1.1 |
| brainstorm 验收标准 #6 / spec「展示分页状态」 | 展示当前/总页、首末页、邻近页码与 aria-current | 4.1 |
| spec「首页分页边界」 | 首页禁用上一页并按总页数控制下一页 | 4.1 |
| spec「末页分页边界」 | 末页禁用下一页且允许返回上一页 | 4.1 |
| spec「分页加载中」 | 保留当前行、区域 busy、按钮禁用 | 4.1 |
| spec「分页请求失败」 | 保留最后成功页、显示错误并恢复操作 | 4.2 |
| spec「快速连续切页」 | 旧响应不得覆盖较新页 | 4.2 |
| spec「旧服务端缺少分页元数据」 | 前端降级为单页而不崩溃 | 4.2 |
| brainstorm 验收标准 #7 / spec「展示完整 Email 信息」 | 响应映射 userEmail，表格显示并保留 title | 1.1、3.1 |
| spec「Email 过长」 | Email 使用省略样式且不撑破布局 | 3.2 |
| spec「Email 缺失」 | 缺失 Email 显示 `-` 且无空交互 | 3.1 |
| spec「使用键盘操作新增交互」 | 排序、命令详情、分页使用语义按钮和状态 | 3.3、4.1 |
| spec「窄屏展示」 | 表格横向滚动、分页换行、Email 限宽 | 3.2、5.1 |
| spec「保持旧 URL 和既有详情」 | `/stats.html`、项目详情、执行结果详情回归 | 5.1 |
| brainstorm 验收标准 #8 / design §验证策略 | 定向测试、web 全量测试和 build 通过 | 5.1 |
| design §架构概览/运行边界 | 服务端聚合、Hook 请求、Dashboard 排序、Table 渲染职责分离 | 1.1、1.2、3.3、4.1 |
| design §方案对比 | stats 接口分页、客户端摘要排序、复用 DetailTrigger、仅移除耗时图 UI | 1.1、2.1、3.3、4.1 |
| design §关键时序 | 初始/刷新替换全快照，分页只提交事件状态 | 4.1 |
| design §失败路径 | 页码规范化、失败保留、请求竞态隔离 | 1.1、4.2 |
| design §服务端聚合 | 常量、页码解析、命令数组、项目默认顺序、Email 映射 | 1.1、1.2 |
| design §前端状态与表格 | 独立排序、列描述、分页 footer、纯派生排序 | 3.1、3.3、4.1 |
| design §API 契约 | 保留数组形态并新增 CommandUsage/Pagination 字段 | 1.1、1.2 |
| design §UI 状态矩阵 | initial/empty/error/selected/page loading 变体 | 3.1、3.2、3.3、4.1、4.2 |
| design §数据设计 | 同次文件快照、确定性命令数组、服务端页码权威 | 1.1、1.2、4.1 |
| design §性能与资源 | 响应最多 20 条、浏览器仅排序摘要、分页不重建图表 | 1.1、3.3、4.1 |
| design §可靠性与恢复 | 请求可重试、损坏行隔离、页码随数据收缩钳制 | 1.1、4.2 |
| design §安全与隐私 | Email 只做既有字段映射、React 文本渲染、不写新日志 | 1.1、3.1、5.1 |
| design §兼容与迁移 | 新字段向后兼容，旧服务端前端降级，无不可逆迁移 | 2.1、4.2、5.1 |
| design §风险：全文件扫描 | 数据库、缓存、索引优化 out of scope；本期只限制响应体 | 1.1（边界断言） |
| brainstorm Out of Scope | 采集 schema、身份定义、其他页面、全局主题均不修改 | 5.1（diff 审计） |

---

## 1. 服务端统计契约

> mode: batch

- [x] **1.1 最近事件分页、边界与 Email 响应**
  1. RED：扩展 `web/tests/server.test.ts`，写入 21 条逆序可识别事件及 Email，新增 `should paginate recent telemetry events with metadata and email`，断言默认页 20 条、第 2 页 1 条、时间倒序、`userEmail` 与 `{ page: 2, pageSize: 20, totalItems: 21, totalPages: 2 }`。
  2. RED：同文件新增非法页码参数表（`0`、`-1`、`1.5`、`abc`、超安全整数）、超末页、空文件、无时间戳和损坏 JSONL 场景；先运行定向测试，预期因 `recentEventsPagination` 缺失或仍固定首页而失败。
  3. GREEN：修改 `web/server.ts`，定义 `RECENT_EVENTS_PAGE_SIZE = 20`、`RecentEventsPagination`、`parseRecentPage(value): number`；路由读取 `c.req.query('recentPage')`，`readTelemetryStats(telemetryFile, requestedPage)` 基于有效数字时间戳集合计算 `totalItems/totalPages/page` 后切片。
  4. GREEN：最近事件映射加入 `userEmail: event.git?.userEmail`，`emptyTelemetryStats()` 始终返回第 1/1 页分页元数据；保持 `totalEvents`、`commandAvgDuration` 与其他字段语义不变。
  5. 自检：确认页大小无法被查询参数放大、正整数超末页被钳制、损坏行继续跳过、响应每页不超过 20 条。
  > test: pnpm --dir web test -- server.test.ts
  > commit: feat(stats): 增加最近事件服务端分页与邮箱响应

- [x] **1.2 用户命令明细与项目确定性默认顺序**
  1. RED：在 `web/tests/server.test.ts` 新增同一用户 `openspec` 三次、`update` 一次以及相同次数命令的聚合场景，断言 `commands` 为 `{ command, count }[]`，先按次数降序再按命令名升序，并保留 `topCommand`。
  2. RED：新增三个项目的事件数/最近活跃乱序与 tie 场景，断言服务端默认按 eventCount 降序、lastSeen 降序、稳定项目标识升序；运行测试确认当前 lastSeen 默认顺序失败。
  3. GREEN：修改 `web/server.ts` 的用户响应映射，输出排序后的 `commands` 数组；提取或内联明确的命令比较与项目摘要比较规则，不修改用户身份 key 和遥测采集。
  4. 自检：命令计数总和等于用户 eventCount，项目摘要仍保留既有字段，旧调用方可忽略新增字段。
  > test: pnpm --dir web test -- server.test.ts
  > commit: feat(stats): 返回用户命令明细并稳定项目顺序

组尾验证：运行 `pnpm --dir web test -- server.test.ts`，预期新增及既有 server 测试全部通过。

## 2. 图表精简

> mode: batch

- [x] **2.1 OpenSpec 竖向柱状图与耗时图移除**
  1. RED：创建 `web/tests/stats-charts.test.tsx`，mock `chart.js/auto` 构造器并渲染 `StatsCharts`；断言 OpenSpec 配置 `type === 'bar'`、`options.indexAxis` 为 `x` 或未设置、labels/data 对齐，且页面不存在“命令耗时 (ms)”。
  2. RED：增加空 OpenSpec 分布场景，断言出现“暂无 OpenSpec 数据”且 Chart 构造器没有收到 OpenSpec 空配置；同时断言 StatsPage 的“平均耗时” KPI 仍存在。
  3. GREEN：修改 `web/src/pages/stats/StatsCharts.tsx`，移除 `commandAvgDuration` 的 UI 消费、duration keys/card/empty icon，OpenSpec 调用不再传横向参数；保留 `TelemetryChartStats` 对兼容字段的可选声明或仅让多余响应被忽略。
  4. 自检：CLI 版本、模板版本仍为柱状图，每日趋势与成功/失败图不变，canvas effect 仍在卸载时 destroy。
  > test: pnpm --dir web test -- stats-charts.test.tsx stats-page.test.tsx
  > commit: feat(stats): 精简版本图表并竖向展示 openspec 命令

## 3. 表格结构、视觉与排序交互

> mode: batch

- [x] **3.1 项目六列与最近事件 Email 结构**
  1. RED：扩展 `web/tests/stats-page.test.tsx` fixture，加入多个项目/用户、`commands`、事件 `userEmail` 与分页元数据；为每张 `<table>` 增加可按标题查询的 accessible name 后，断言项目表头精确为 Org/Repo/CLI/模板/事件/最近活跃。
  2. RED：断言最近事件表在“用户”旁包含 Email，完整地址位于单元格文本和 `title`，单元格具有 `truncate`；缺失 Email 显示 `-` 且不是详情按钮。
  3. GREEN：修改 `web/src/pages/stats.tsx` 的项目 headers/render row 删除 User、Email 单元格；最近事件 headers/render row 加入 Email，并以 `formatText`、`truncate` 和 `title` 渲染；给表格设置 `aria-label={title}`。
  4. 自检：loading/empty 行 `colSpan` 随列数正确，项目详情、执行结果详情和其余单元格顺序未错位。
  > test: pnpm --dir web test -- stats-page.test.tsx
  > commit: feat(stats): 调整项目列并展示事件邮箱

- [x] **3.2 排序、分页与 Email 的现有视觉系统适配**
  1. 设计对齐：执行前读取并遵循 `.harness/skills/ui-fidelity-playbook/SKILL.md`；本任务无外部设计稿，以现有 stats 页面变量、表格密度、按钮 focus 样式和窄屏横向滚动为设计事实，先结构、再视觉、后状态，不扩大全局主题。
  2. RED：在 `web/tests/stats-page.test.tsx` 断言排序按钮具有专用 class、当前方向指示可见；分页区域具有 navigation label、busy/selected/disabled 语义 class；Email 仍使用既有 `truncate`。
  3. GREEN：在 `web/src/pages/stats.tsx` 的页面级 styles 中新增 `.sort-button`、`.sort-indicator`、`.pagination`、`.pagination-button`、selected/disabled/focus-visible 状态，全部复用 `--color-*`、`--radius`、`--transition`。
  4. GREEN：增加 `@media (max-width: 640px)` 的分页换行与紧凑间距；不取消 `.table-wrapper` 横向滚动，Email 最大宽度沿用 100px/150px。
  5. 自检：按钮文字不溢出、排序箭头不改变表头高度、disabled 对比度可辨、无全屏 loading 或新增图片资产。
  > test: pnpm --dir web test -- stats-page.test.tsx react-pages.test.ts
  > commit: style(stats): 对齐排序与分页交互视觉

- [x] **3.3 项目/用户排序和用户命令详情交互**
  1. RED：在 `web/tests/stats-page.test.tsx` 使用 `within()` 分别查询项目表和用户表，断言默认 eventCount 降序、主值 tie 时按 lastSeen/稳定标识排序；点击最近活跃、再次点击、切回事件后逐次断言行顺序与 `aria-sort`。
  2. RED：断言排序点击不增加 fetch 次数；点击最常用命令后浮层按次数/命令名展示全部 `命令: N 次`，再次点击、外部点击、Escape 均关闭；空 `commands` 行无详情按钮。
  3. GREEN：修改 `web/src/pages/stats.tsx`，加入 `SortKey`、`SortDirection`、`SortState`、`sortTelemetryRows(rows, state, identityFields)` 与切换函数；项目和用户各自 `useState({ key: 'eventCount', direction: 'desc' })` 并以复制数组派生排序结果。
  4. GREEN：把表头改为列描述 `{ label, sortKey? }`；可排序 `<th>` 渲染语义化按钮、箭头和 `aria-sort`，非排序列保持纯文本。
  5. GREEN：为用户行解析 `commands` 数组并生成确定性详情文本，复用 `DetailCell`/`DetailTrigger`；无有效命令时显示 `-`。
  6. 自检：排序不原地修改 API 数组、两张表状态互不影响、详情关闭后排序不重置、缺失数值按 0 处理。
  > test: pnpm --dir web test -- stats-page.test.tsx
  > commit: feat(stats): 增加表头排序与用户命令详情

组尾验证：运行 `pnpm --dir web test -- stats-charts.test.tsx stats-page.test.tsx react-pages.test.ts`，预期结构、视觉语义和交互测试全部通过。

## 4. 最近事件分页状态与恢复

> mode: batch

- [x] **4.1 分页请求、控件与加载状态**
  1. RED：在 `web/tests/stats-page.test.tsx` mock 两页响应，断言首页上一页禁用、下一页可用、页码 1 为 `aria-current`；点击第 2 页时请求 `/api/telemetry/stats?recentPage=2`，旧行在 pending 期间保留且分页 navigation 为 busy、按钮禁用。
  2. RED：resolve 第 2 页后断言只更新最近事件行、当前页切为 2、下一页禁用、上一页可用；为 8+ 页元数据断言首末页、当前页邻近页码和省略号 token。
  3. GREEN：修改 `web/src/pages/stats.tsx` 的 `TelemetryStats` 类型，加入 `CommandUsage`、`RecentEventsPagination`；`useTelemetryStats` 分离完整 `data` 与 `recentEvents/pagination` 状态，初始/刷新替换全快照，`loadRecentPage(page)` 只提交事件页字段。
  4. GREEN：实现 `Pagination` 与页码 token 生成函数，作为 `TelemetryTable` 可选 footer；使用服务端响应 page 为权威位置，加载时保留 rows 并禁用控件。
  5. 自检：只有一页或空数据时显示明确第 1/1 页状态，刷新使用当前服务端页码，分页不重置项目/用户排序或重建图表数据。
  > test: pnpm --dir web test -- stats-page.test.tsx
  > commit: feat(stats): 增加最近事件分页控件与状态

- [x] **4.2 分页失败、竞态和旧服务端降级**
  1. RED：在 `web/tests/stats-page.test.tsx` 使用可控 Promise 构造页 2/页 3 乱序响应，断言页 3 先成功后页 2 返回不会覆盖；构造拒绝响应，断言旧行和旧页码保留、错误可见且按钮恢复。
  2. RED：增加缺失 `recentEventsPagination` 的旧响应，断言前端降级 `{ page: 1, pageSize: 20, totalItems: recentEvents.length, totalPages: 1 }`；模拟数据收缩时服务端返回钳制页，断言 UI 接受返回页。
  3. GREEN：在 `useTelemetryStats` 中加入递增 request id/ref，仅最新请求可提交状态和 loading；失败只更新错误状态，不清空最后成功数据；用 `normalizeRecentEventsPagination` 处理旧响应。
  4. 自检：initial error 仍显示既有 `-` KPI，分页错误不影响图表/排序，过期请求的 finally 不会错误解除较新请求的 busy 状态。
  > test: pnpm --dir web test -- stats-page.test.tsx
  > commit: fix(stats): 隔离分页竞态并保留失败前数据

组尾验证：运行 `pnpm --dir web test -- stats-page.test.tsx`，预期分页主流程、边界、失败、竞态及兼容测试全部通过。

## 5. 全量验证与完成审计

> mode: inline

- [~] **5.1 执行自动化、构建、视觉检查和范围审计**
  1. 运行定向测试 `pnpm --dir web test -- server.test.ts stats-charts.test.tsx stats-page.test.tsx react-pages.test.ts`，预期全部通过且无未处理异步告警。
  2. 运行 `pnpm --dir web test`，预期 web 全量测试通过；运行 `pnpm --dir web build`，预期 TypeScript、Vite 和 versions build 验证全部通过。
  3. 运行 `npx devkeel@latest openspec validate improve-stats-dashboard --type change --strict --json`，预期 change 1/1 valid。
  4. 按 `ui-fidelity-playbook` 的 QA 清单启动 stats 页，检查桌面与 ≤640px 窄屏：OpenSpec 竖向柱、无耗时图、六列项目表、排序箭头/focus、命令浮层、分页换行和 Email 省略/title。
  5. 使用 `git diff --check`、`git status --short` 和限定路径 diff 审计，确认未修改遥测采集 schema、身份逻辑、其他页面、全局主题、依赖或服务端耗时字段；逐条回填本文件任务状态。
  > 延迟验证：自动化、构建、OpenSpec strict、deep review 与范围审计已通过；浏览器运行时未提供可用浏览器，桌面/≤640px 真实页面 QA 待补。
  > test: pnpm --dir web test && pnpm --dir web build
  > commit: chore(stats): 完成统计页增强验证与任务记录
