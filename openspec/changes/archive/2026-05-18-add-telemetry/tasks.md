# CLI Telemetry 实现计划

> **给 agentic 执行器：** 使用 superpowers:subagent-driven-development
> 按任务逐个实现本计划。

**目标：** 新增遥测服务（静态托管 + API）和 CLI 遥测模块，实现匿名使用统计。

**架构：** `web/server.ts` 为 Hono 服务，提供静态文件托管和 POST /api/telemetry（JSONL 存储）。CLI 侧新增 `src/lib/telemetry.ts`，各命令 fire-and-forget 上报。

**技术栈：** Hono、Node.js 20 原生 fetch、crypto.randomUUID()、JSONL

---

## 1. 遥测服务端

- [x] **1.1 初始化 web 服务依赖**
  1. 创建 `web/package.json`（name: `devkeel-web`, type: module, scripts: start/dev）
  2. 创建 `web/tsconfig.json`（ESM, node20 target）
  3. 运行 `cd web && pnpm add hono @hono/node-server && pnpm add -D typescript`
  4. 将 `web/data/` 加入 `.gitignore`
  > commit: chore(web): 初始化 web 服务依赖

- [x] **1.2 实现静态文件托管**
  1. 实现：`web/server.ts` — Hono app，使用 `serveStatic` 托管当前目录下的静态文件
  2. 验证：`cd web && pnpm dev`，浏览器访问 `http://localhost:3000` 确认能看到 index.html
  > commit: feat(web): 静态文件托管替代 nginx

- [x] **1.3 实现遥测 API 端点**
  1. 实现：`web/server.ts` — 新增 `POST /api/telemetry`，校验 JSON body，追加写入 `data/telemetry.jsonl`
  2. 验证：`curl -X POST http://localhost:3000/api/telemetry -H 'Content-Type: application/json' -d '{"command":"init","success":true}'` 确认 200 + 文件写入
  > commit: feat(web): 遥测数据接收与 JSONL 存储

## 2. CLI 遥测模块

- [x] **2.1 创建 telemetry 模块骨架与 opt-out 逻辑**
  1. 写测试：`tests/telemetry.test.ts` — 验证 `isTelemetryEnabled()` 在 `HARNESS_NO_TELEMETRY=1` 和 `CI=true` 时返回 false
  2. 实现：`src/lib/telemetry.ts` — 导出 `isTelemetryEnabled(): boolean`
  3. 验证：`pnpm vitest run tests/telemetry.test.ts`
  > commit: feat(telemetry): 新增遥测模块骨架与 opt-out 检测

- [x] **2.2 实现项目 ID 生成与持久化**
  1. 写测试：`tests/telemetry.test.ts` — 验证 `getOrCreateProjectId()` 首次生成 UUID 写入 config，二次读取返回相同值
  2. 实现：`src/lib/telemetry.ts` — 导出 `getOrCreateProjectId(projectRoot: string): string`
  3. 扩展：`src/lib/config.ts` — HarnessConfig 接口新增可选 `telemetry?: { id?: string }`
  4. 验证：`pnpm vitest run tests/telemetry.test.ts`
  > commit: feat(telemetry): 实现匿名项目 ID 生成与持久化

- [x] **2.3 实现 getGitInfo() 获取 git 上下文**
  1. 写测试：`tests/telemetry.test.ts` — 验证 `getGitInfo()` 从 git repo 中提取 remoteUrl/org/repo/userName/userEmail
  2. 实现：`src/lib/telemetry.ts` — 通过 `execSync('git config user.name')` 等命令获取信息，从 remote URL 解析 org/repo
  3. 验证：`pnpm vitest run tests/telemetry.test.ts`
  > commit: feat(telemetry): 获取项目 git 上下文信息

- [x] **2.4 实现 track() 函数**
  1. 写测试：`tests/telemetry.test.ts` — 验证 `track()` 在 enabled 时调用 fetch，disabled 时不调用
  2. 实现：`src/lib/telemetry.ts` — 导出 `track(command, meta): void`，fire-and-forget fetch 到 `POST /api/telemetry`
  3. 验证：`pnpm vitest run tests/telemetry.test.ts`
  > commit: feat(telemetry): 实现 fire-and-forget 事件上报

## 3. 命令层集成

- [x] **3.1 init 命令埋点**
  1. 实现：`src/commands/init.ts` — 在 runInit 开始记录时间戳，结束时调用 `track("init", { success, durationMs })`
  2. 验证：`pnpm lint`
  > commit: feat(telemetry): init 命令接入遥测

- [x] **3.2 其余命令埋点**
  1. 实现：`src/commands/update.ts`、`doctor.ts`、`setup.ts`、`submodule.ts`、`migrate.ts` — 同模式接入 track
  2. 验证：`pnpm lint`
  > commit: feat(telemetry): 全部命令接入遥测

## 4. 统计面板

- [x] **4.1 实现统计 API 端点**
  1. 实现：`web/server.ts` — 新增 `GET /api/telemetry/stats`，读取 JSONL 文件并聚合：按命令分布、按日统计、skill 热度、活跃项目数
  2. 验证：写入几条测试数据后 `curl http://localhost:3000/api/telemetry/stats` 确认返回 JSON
  > commit: feat(web): 遥测统计 API 端点

- [x] **4.2 实现统计面板页面**
  1. 创建：`web/stats.html` — 引入 Chart.js CDN，fetch `/api/telemetry/stats` 渲染图表
  2. 图表：命令调用饼图、每日趋势折线图、skill 热度柱状图、活跃项目数卡片、项目列表表格（org/repo/user/最近活跃时间）
  3. 风格：与现有 web/ 页面一致（可复用 index.html 的 header/nav）
  4. 验证：浏览器访问 `http://localhost:3000/stats.html` 确认图表正常渲染
  > commit: feat(web): 遥测统计面板页面

## 5. 质量验证

- [x] **5.1 完整测试 + lint 通过**
  1. 运行：`pnpm test`
  2. 运行：`pnpm lint`
  3. 确认所有测试绿色
  > commit: test(telemetry): 补充边界场景测试

---
## 下一步

在新会话中粘贴以下命令：

/opsx:continue add-telemetry
