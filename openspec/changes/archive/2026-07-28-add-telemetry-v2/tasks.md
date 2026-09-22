# 实现任务

<!-- harness:full-tasks-reconciled -->

- [x] **1. Templates V2 CLI 只发送版本化 V2 事件**
  - **来源：** design「V2 客户端事件」；`specs/cli-telemetry` 的「V2 遥测链路隔离」「Track command execution」
  - **结果：** 所有启用遥测的 Harness 命令生成 `schemaVersion: 2` 的结构化事件，默认或 override 均只请求 V2 endpoint；opt-out、项目 ID、Git/版本信息、超时和静默失败行为保持可用。
  - **范围：** `src/lib/telemetry.ts`、`tests/telemetry.test.ts`
  - **约束：** 只接受 `HARNESS_TELEMETRY_V2_URL`；不得读取 V1 endpoint override、双写或网络失败后回退 V1。
  - **本地验证：** `npm test -- tests/telemetry.test.ts`

- [x] **2. OpenSpec 事件携带可证明的 change/schema/升级上下文**
  - **来源：** design「change 上下文解析」；`specs/cli-telemetry` 的「上报 OpenSpec change 上下文」
  - **结果：** 已知 change 型参数能够解析 active 与 archived change 的 selector 和 promotion 标记，Lite、直接 Full、Lite→Full 分别产生准确上下文；不可判定或损坏输入只省略字段，不改变命令退出结果。
  - **范围：** `src/commands/openspec.ts`、必要的邻近纯函数/类型、`tests/telemetry.test.ts` 或新增聚焦 OpenSpec telemetry 测试
  - **约束：** 不用“唯一 active change”或服务端解析原始 args 猜测；只读取目标 change 的 `.openspec.yaml` 和 `brainstorm.md`。
  - **本地验证：** `npm test -- tests/telemetry.test.ts tests/openspec-telemetry.test.ts`

- [x] **3. 服务端提供互不串流的 V1/V2 接收与统计契约**
  - **来源：** design「V2 服务端接口与存储」「V2 change 聚合」；`specs/telemetry-stats-dashboard` 的「V1 与 V2 服务端数据隔离」「按项目和 change 聚合 schema」「统计 Lite 升级 Full change」「固定 change 首次上报负责人」
  - **结果：** V2 POST 严格校验并只追加 `telemetry-v2.jsonl`；V2 stats 只读取该文件，返回通用统计、最近事件分页、唯一 change、schema 分布、Lite→Full 数量和稳定负责人；V1 四周契约保持原状。
  - **范围：** `web/server.ts`、`web/tests/server.test.ts`
  - **约束：** change 以项目身份+名称去重；schema 取最新有效事件；负责人取最早有效时间事件且首次缺失不补写；损坏行跳过；不得以 V1 数据补偿 V2 空态。
  - **本地验证：** `pnpm --dir web exec vitest run tests/server.test.ts`

- [x] **4. `/stats.html` 与 `/v1/stats.html` 分别绑定 V2/V1 数据源**
  - **来源：** design「页面状态与路由」「兼容、迁移、发布与回滚」；`specs/telemetry-stats-dashboard` 的「React 页面与现有行为兼容」
  - **结果：** 默认 stats route 清晰标识并只请求 V2，新增 V1 route 只请求原 API、保留原 KPI/图表/项目/用户/事件交互；两个页面提供可键盘访问的双向切换入口。
  - **范围：** `web/src/routes.ts`、`web/src/pages/registry.ts`、`web/src/pages/stats.tsx`、相关 route/React 测试
  - **约束：** `/stats.html` 路径保持；V1 endpoint/响应不改；窄屏和现有详情/分页恢复行为不退化。
  - **本地验证：** `pnpm --dir web exec vitest run tests/routes.test.ts tests/react-pages.test.ts tests/stats-page.test.tsx`

- [x] **5. V2 stats 展示 schema、升级指标和可排序 change 列表**
  - **来源：** design「V2 change 聚合」「页面状态与路由」；`specs/telemetry-stats-dashboard` 的「V2 change 列表与排序」「V2 schema 与升级指标」
  - **结果：** V2 页面显示唯一 change 总数、schema change 分布、Lite→Full 数量，并逐项目展示 change、当前 schema、升级状态、负责人、事件数和最近活跃；文本和数值表头按约定默认方向稳定排序，空值和空态清晰。
  - **范围：** `web/src/pages/stats.tsx`、按需调整 `web/src/pages/stats/StatsCharts.tsx`、`web/tests/stats-page.test.tsx`、`web/tests/stats-charts.test.tsx`
  - **约束：** 指标基于唯一 change 而非事件次数；负责人缺失显示占位，不推断身份；排序只使用 React 派生状态且同步箭头与 `aria-sort`。
  - **本地验证：** `pnpm --dir web exec vitest run tests/stats-page.test.tsx tests/stats-charts.test.tsx`

## Final Verification

| 检查 | 命令或操作 | 覆盖目标 | 必需性 |
|------|------------|----------|--------|
| OpenSpec 严格校验 | `npx devkeel@latest openspec validate add-telemetry-v2 --type change --strict --json` | Full artifacts 与 delta specs 格式、一致性 | required |
| CLI 遥测聚焦测试 | `npm test -- tests/telemetry.test.ts tests/openspec-telemetry.test.ts` | V2 payload/endpoint 隔离、change 上下文、失败边界 | required |
| CLI 类型检查 | `npm run lint` | CLI 与共享类型完整性 | required |
| 服务端与 stats 页面测试 | `pnpm --dir web exec vitest run tests/server.test.ts tests/routes.test.ts tests/react-pages.test.ts tests/stats-page.test.tsx tests/stats-charts.test.tsx` | V1/V2 数据隔离、聚合、路由、列表、排序、可访问性和回归 | required |
| Web 类型与生产构建 | `pnpm --dir web build` | React/服务端 TypeScript 与静态 bundle | required |
| 部署后烟雾检查 | 服务端先上线后，用测试项目依次产生 Lite、直接 Full、Lite→Full 事件；比较两个 JSONL 行数并打开 `/stats.html`、`/v1/stats.html` | 真实部署顺序、无双写、两页面数据源与升级展示 | optional |
