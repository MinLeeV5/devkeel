# 数据驱动 Changelog 实现计划

> **给 agentic 执行器：** 按任务顺序执行；每项任务先补失败测试，再实现最小闭环并提交。保留工作区已有的 changelog、文档规则和测试改动，不覆盖用户未提交内容。涉及页面的任务遵循 `ui-fidelity-playbook`，按结构、视觉、交互三轮收敛。

**目标:** 将 CLI 与模板的全部 changelog 条目迁移为独立版本流的 JSON 文件，由 Hono 启动时读取、校验并通过 API 返回，React 页面动态展示数据；构建产物同时包含版本 JSON，并将 `/changelog` skill 更新到 JSON 工作流。

**架构:** `web/public/versions/{cli,templates}/*.json` 是版本内容唯一来源。`web/version-catalog.ts` 在服务启动时读取并生成内存目录，`GET /api/versions` 返回两个独立排序的版本流；React 通过 `useVersionCatalog` 获取目录，由展示组件复用现有双栏、tab、历史归档和更新提示样式。版本正文仅接受受限 Markdown，不渲染原始 HTML。

**技术栈:** TypeScript、Node.js `fs`、Hono、React 19、Vite、Vitest、Testing Library、`react-markdown`、`remark-breaks`。

## 覆盖矩阵

| 来源 | 要求 / 场景 | 覆盖任务 |
|---|---|---|
| Brainstorm UC-01 / UC-02 | CLI 与模板各新增一个 JSON 后，重建并在对应 tab 展示 | 1.1、2.1、3.1、4.1、6.1 |
| Brainstorm UC-03 | 一个条目用 `versions` 表示合并版本并只展示一次 | 1.1、2.1、4.1 |
| Brainstorm UC-04 | 版本内容支持行内代码、链接、强调和换行 | 4.1 |
| Brainstorm UC-05 | 非法 JSON 在启动阶段给出文件级聚合错误，拒绝部分目录 | 1.1、3.1 |
| Brainstorm UC-06 | 网络失败显示可重试错误态 | 4.1 |
| Brainstorm UC-07 | 从 CLI 旧版本访问时切换 CLI tab 并滚动到目标条目 | 4.1 |
| Brainstorm UC-08 | 构建后版本 JSON 与静态资源一起进入 `dist` | 2.1、6.1 |
| Brainstorm 验收 / 最新内容 | 全量迁移 27 个 CLI 条目和 11 个模板条目，保留 CLI `0.8.10` 的 human-review 优化与模板 `1.2.5` 内容 | 2.1、4.1、6.1 |
| Brainstorm 范围边界 | 不增加后台管理、数据库、热更新，不改 V1→V2 静态迁移长文 | 2.1、4.1、6.1 |
| Design 数据契约 | `VersionEntry`、`ChangeGroup`、`VersionCatalogResponse` 与枚举在前后端共享 | 1.1、3.1、4.1 |
| Design 加载器 | 扫描两个流、逐文件解析校验、独立排序、计算 latest、生成可注入的内存目录 | 1.1 |
| Design 服务集成 | 生产只读取 `dist/versions`，开发和测试显式注入 `versionsDir` | 3.1 |
| Design API | `GET /api/versions` 返回稳定 JSON，`Cache-Control: no-store`，请求不重复读磁盘 | 3.1 |
| Design React 模块 | `useVersionCatalog` 管理数据状态，`VersionPanel` 展示流，`InlineMarkdown` 安全渲染正文 | 4.1 |
| Design 可靠性 / 安全 | 启动失败可诊断；Markdown 禁止原始 HTML、脚本协议和任意组件 | 1.1、3.1、4.1 |
| Design 发布流程 | `/changelog` skill 以 JSON 为入口，版本提升到 `3.0.0`，规则不再要求修改 JSX | 5.1 |
| Catalog Spec：双流 / 单文件 | CLI 与模板使用独立目录、独立版本号；单一和合并版本均满足 schema | 1.1、2.1 |
| Catalog Spec：验证 | 缺字段、非法枚举、非法日期和空版本数组均报告文件路径与字段 | 1.1 |
| Catalog Spec：原子加载 | 任一无效文件导致整体启动失败，不暴露部分数据 | 1.1、3.1 |
| Catalog Spec：排序 / latest | 每个流按 `releasedAt.to ?? releasedAt.from` 降序，latest 来自各自首条 | 1.1、2.1 |
| Catalog Spec：API 缓存 | 启动后响应来自内存；修改磁盘不影响当前进程响应 | 3.1 |
| Catalog Spec：构建 | Vite 复制 `public/versions` 到 `dist/versions` 并保持双流目录 | 2.1、6.1 |
| Catalog Spec：全量迁移 | 现有标题、日期、分组、说明、链接、代码标记和合并关系保持语义一致 | 2.1、6.1 |
| Catalog Spec：skill | skill 列出 JSON 路径、schema、校验和 build 流程并提升主版本 | 5.1 |
| UI Spec：成功加载 | 默认模板 tab、两个流的最新版本和独立 tab 内容正确 | 4.1 |
| UI Spec：加载态 | 请求未完成时页面骨架稳定且无假版本号 | 4.1 |
| UI Spec：失败 / 重试 | 错误可见；点击重试重新请求且成功后恢复目录 | 4.1 |
| UI Spec：历史归档 | `archived: true` 条目进入可折叠历史区；无归档流不显示空区 | 2.1、4.1 |
| UI Spec：空分组 | 空 `groups` 保持结构稳定且不生成空标题 | 1.1、4.1 |
| UI Spec：合并版本 / 日期区间 | 多版本 badge 与起止日期区间正确格式化 | 1.1、2.1、4.1 |
| UI Spec：Markdown | 支持允许语法，转义 HTML，拒绝 `javascript:` 等危险 URL | 4.1 |
| UI Spec：更新横幅 | `?from=` 基于 CLI latest 判断，提示时激活 CLI tab 并定位条目 | 4.1 |
| UI Spec：现有契约 | 保留 `/changelog` 路由、双栏布局、tab、历史区、响应式样式和 V1→V2 静态长文 | 4.1、6.1 |
| Out of scope | 后台上传、数据库、运行时热重载、发布后台均不实现 | 全部任务均不包含 |

## Task 1: 建立版本目录契约与加载器

> mode: batch

- [x] **1.1 用测试锁定 JSON schema、校验错误、双流排序与 latest 计算**

  1. 新建 `web/tests/version-catalog.test.ts`，先覆盖：单版本与合并版本通过；空 `versions`、未知 `type`、非法 `releasedAt`、缺失 `title` 均返回包含源文件路径和字段名的错误；多个坏文件一次性聚合；CLI 与模板分别按 `releasedAt.to ?? releasedAt.from` 降序；两个流分别计算 latest；`groups: []` 合法。
  2. 运行该测试并确认因模块不存在而失败。
  3. 新建 `web/src/lib/version-catalog.ts`，导出 `VersionStream`、`ChangeType`、`VersionEntry`、`ChangeGroup`、`VersionCatalogResponse`、`validateVersionEntry(value, sourcePath)` 和版本 / 日期格式化所需的纯函数。字段必须与 design 一致：`versions`、`releasedAt.from/to`、`title`、`archived`、`groups[].type/label/items[].name/description`。
  4. 新建 `web/version-catalog.ts`，实现 `loadVersionCatalog(versionsDir: string): VersionCatalogResponse`：只扫描 `cli/*.json` 和 `templates/*.json`，按文件收集解析及 schema 错误，任一错误存在时抛出一条带全部文件明细的异常；无错误时独立排序、计算 latest 并返回不可变目录快照。
  5. 再运行定向测试，确认所有契约、聚合错误、排序和空分组用例通过。

  > test: `pnpm --dir web exec vitest run tests/version-catalog.test.ts`
  > commit: `feat: 建立 changelog 版本目录契约与加载器`

## Task 2: 迁移全部 CLI 与模板版本数据

> mode: isolated

- [x] **2.1 将页面内 38 个版本条目逐一迁移为 JSON，并建立完整性回归测试**

  1. 新建 `web/tests/changelog-data.test.ts`，写入明确的迁移清单：模板 11 个条目 `1.2.5` 至 `1.0.0`，CLI 27 个条目 `0.8.10` 至 `0.1`；断言文件数量、各流 latest、文件名唯一、版本集合、合并版本数组和归档标记。单独断言模板 `1.2.5` 存在最新版本说明，CLI `0.8.10` 包含 human-review 优化内容。
  2. 运行测试并确认因 `web/public/versions` 尚不存在而失败。
  3. 新建 `web/public/versions/templates/*.json` 与 `web/public/versions/cli/*.json`。每个当前页面的展示条目对应一个文件；合并展示沿用一个文件和有序 `versions` 数组，不把 CLI / 模板版本合成同一文件。日期使用 ISO 8601，页面已有日期保持不变，缺少时间的条目用对应内容的 Git author timestamp 补齐。
  4. 将现有 JSX 中的标题、日期区间、分类、名称、描述、链接、行内代码和合并关系按语义迁移；把 `<code>` 改为反引号、`<a>` 改为 Markdown 链接、`<br>` 改为换行。不得在 JSON 中保留 HTML。V1→V2 迁移长文继续留在 React 页面，不进入版本 JSON。
  5. 对全目录运行加载器测试和迁移完整性测试，确认 38 个历史条目全部可解析、两个流 independently sorted，且独立批准基线能检测每个历史 group/item 的 type、label、顺序或内容突变，同时允许后续新增合法 JSON 与更新 latest。CLI `0.8.5 ~ 0.8.6` 原性能分组是有意的 `perf → refactor` schema 归一化例外，label 保持 `优化`，公共 schema 不增加 `perf`。

  > test: `pnpm --dir web exec vitest run tests/version-catalog.test.ts tests/changelog-data.test.ts`
  > commit: `feat: 迁移全部 changelog 版本数据`

## Task 3: 在 Hono 中提供启动时版本目录 API

> mode: batch

- [x] **3.1 启动时加载目录并实现 `GET /api/versions`**

  1. 扩展 `web/tests/server.test.ts`：使用临时 `versionsDir` 启动应用，断言 API 返回 CLI / 模板 latest 和 entries；响应包含 `Cache-Control: no-store`；启动后修改临时 JSON 不改变本进程后续响应；非法文件使 `createApp` 抛出含文件路径的聚合错误；显式 `versionsDir`、生产 `staticRoot/versions` 和开发显式选择 `public/versions` 均有覆盖，且默认不得回退源码。
  2. 运行定向测试并确认 API 404、`ServerOptions` 缺字段等预期失败。
  3. 修改 `web/server.ts`：给 `ServerOptions` 增加 `versionsDir?: string`；显式目录优先，否则只读取 `staticRoot/versions` 并在缺失时失败；`pnpm dev:server` 显式选择仓库 `web/public/versions`。在创建应用时调用一次 `loadVersionCatalog`，随后注册 `GET /api/versions` 并返回同一内存对象和 `no-store` 响应头。
  4. 保持现有静态文件、SPA fallback、端口监听和测试入口行为不变；目录无效时让启动失败并原样保留可诊断错误，不降级为空数据。
  5. 重跑加载器与 server 测试，确认请求阶段不执行文件读取且现有 server 用例无回归。

  > test: `pnpm --dir web exec vitest run tests/version-catalog.test.ts tests/server.test.ts`
  > commit: `feat: 提供 changelog 版本目录 API`

## Task 4: 将 React Changelog 改为数据驱动展示

> mode: isolated

- [x] **4.1 按结构、视觉、交互三轮替换内联版本 JSX，并补齐浏览器态测试**

  1. 在 `web/package.json` 和锁文件中加入运行依赖 `react-markdown`、`remark-breaks`，以及测试依赖 `@testing-library/react`、`jsdom`。新建 `web/tests/changelog-page.test.tsx`，先写失败用例：默认模板 tab；切换 CLI tab；两个 latest 独立显示；加载态无硬编码 latest；失败态和重试；归档展开；无归档时不显示空区；合并 badge 与日期区间；空分组；Markdown 允许语法；HTML 被转义；危险 URL 不可点击；`?from=` 提示后切到 CLI 并定位；V1→V2 静态迁移区仍存在。
  2. **结构轮：** 新建 `web/src/pages/changelog/useVersionCatalog.ts`，导出 `{ data, isLoading, error, reload }`；新建 `web/src/pages/changelog/VersionPanel.tsx`，接收一个流的 entries 并拆分当前 / `archived` 历史；新建 `web/src/pages/changelog/InlineMarkdown.tsx`，封装受限 Markdown；修改 `web/src/pages/changelog.tsx`，删除 38 个版本条目的内联 JSX，保留页面壳、tab、侧栏和 V1→V2 静态迁移长文。
  3. **视觉轮：** 复用现有 `.version-section`、版本 badge、双栏、分类标题、历史折叠和响应式 class；让单版本 / 合并版本、单日期 / 日期区间、空分组都使用稳定 DOM；只做数据接入必要的 CSS 调整，不重设色板、字体、间距体系或移动端断点。
  4. **安全内容轮：** `InlineMarkdown` 仅开放段落 / 文本、强调、行内代码、安全链接和换行；不启用 raw HTML；外链保留现有新窗口行为和安全 `rel`；过滤 `javascript:`、`data:` 等危险协议。版本名称和描述均通过该组件渲染。
  5. **交互轮：** 首次请求显示稳定 loading skeleton；错误显示诊断文案与重试按钮；成功后更新两个 latest、tab 内容和归档区。更新横幅的 `?from=` 始终显示到 CLI latest；数据就绪后自动激活 CLI tab 并滚到 CLI 最新条目，横幅正文不再承担点击导航。请求重试不得重复绑定事件或丢失当前 tab。
  6. 调整现有 `web/tests/react-pages.test.ts` 的源码契约断言，使其验证路由和页面结构而不依赖被删除的硬编码版本正文；运行 jsdom 组件测试和既有 React 页面测试。

  > test: `pnpm --dir web exec vitest run tests/changelog-page.test.tsx tests/react-pages.test.ts`
  > commit: `refactor: 将 changelog 页面改为数据驱动`

## Task 5: 同步 `/changelog` skill 与文档规则

> mode: inline

- [x] **5.1 将发布说明工作流升级为 JSON 单文件入口**

  1. 更新 `.harness/skills/changelog/SKILL.md` 的 frontmatter：版本提升为 `3.0.0`，`globs` 覆盖 `web/public/versions/cli/*.json`、`web/public/versions/templates/*.json`、加载器、API 与 React 展示文件。
  2. 重写 skill 流程：先识别 CLI 或模板流及其独立版本号，再只新增该流的一个 JSON；记录 schema、合并版本用法、Git author timestamp、受限 Markdown、human-review 变更归类、目录校验、API 测试和 build 验证。删除“直接编辑 `web/src/pages/changelog.tsx`”作为版本发布步骤。
  3. 更新 `.harness/rules/documentation.md`，把 changelog 来源指向双流 JSON；保留 V1→V2 静态迁移区由 React 维护的例外说明。
  4. 用检索验证 skill / rule 不再把 JSX 当作版本条目主数据，并确认 skill 主版本为 3。

  > test: `rg -n 'version: 3\.0\.0|public/versions/(cli|templates)|human-review|pnpm --dir web build' .harness/skills/changelog/SKILL.md .harness/rules/documentation.md && ! rg -n '直接编辑.*changelog\.tsx|changelog\.tsx.*唯一' .harness/skills/changelog/SKILL.md .harness/rules/documentation.md`
  > commit: `docs: 升级 changelog JSON 发布工作流`

## Task 6: 验证构建产物与迁移闭环

> mode: batch

- [x] **6.1 执行全量测试、构建和 dist 数据一致性检查**

  1. 运行 `web` 全部 Vitest 用例，确认加载器、数据、server、React 页面以及现有回归测试全部通过。
  2. 运行生产构建，确认 TypeScript 与 Vite 无错误，且 build 内置确定性校验逐流比较 `web/dist/versions` 与 `web/public/versions` 的文件集合和内容；历史基线至少包含 CLI 27 个、Templates 11 个 JSON，后续版本可继续增加。
  3. 从生产 `dist` 启动 Hono 测试实例，请求 `/api/versions` 与 `/changelog`，确认 API latest 分别为 CLI `0.8.10`、模板 `1.2.5`，页面能加载 SPA 入口。
  4. 运行 JSON / Markdown 安全回归，确认源码不再内联 38 个版本 section，CLI `0.8.10` 的 human-review 优化仍可通过 API 查到，V1→V2 静态迁移区仍在页面源码。
  5. 检查最终 diff，只保留本 change 涉及的版本数据、API、页面、测试、skill / rule 与 OpenSpec 文件；不得提交 `web/dist` 或其他生成产物。

  > test: `pnpm --dir web test && pnpm --dir web build && test "$(find web/dist/versions/cli -name '*.json' | wc -l | tr -d ' ')" = 27 && test "$(find web/dist/versions/templates -name '*.json' | wc -l | tr -d ' ')" = 11 && diff -qr web/public/versions web/dist/versions`
  > commit: `test: 验证 changelog 数据迁移与构建产物`
