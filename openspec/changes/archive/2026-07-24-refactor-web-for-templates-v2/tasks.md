# 实施任务

- [x] **1. 主导航和首页建立 V2 默认心智**
  - **结果：** 主导航提供独立且可正确高亮的“V2 更新”入口，技术分享保留可发现入口但不再占据主导航；首页首屏以“最短、但足够可靠的交付路径”为核心，并通过三个可键盘操作的预设场景切换 Direct、Harness Lite、Harness Full 的推荐理由、持久化方式、共同质量底线和升级条件，不出现自由输入或伪在线路由。
  - **范围：** `web/src/components/MarketingNav.tsx`、`web/src/pages/home.tsx`、`web/src/pages/home/`、相邻首页/导航测试。
  - **验证：** `pnpm --dir web test -- react-pages.test.ts routes.test.ts home-page.test.tsx`；在桌面和移动端浏览器中切换三个场景，确认选中状态、焦点、文字布局和 V2/技术分享入口。

- [x] **2. 工作流页只呈现当前渐进交付模型**
  - **结果：** 工作流页从用户意图开始，统一解释 L0 专项能力、Direct/Lite/Full 路径、当前 Agent 连续实施、邻近验证、路径收尾和原地升级；Hero、主体与 Footer 不再把 Spec → Code → Growth 或任何固定三阶段描述为每次协作的默认流程。
  - **范围：** `web/src/pages/workflow.tsx`、`web/src/pages/workflow/`、工作流相邻测试。
  - **验证：** `pnpm --dir web test -- workflow-docs.test.ts react-pages.test.ts`；浏览器检查工作流主路径、V2 更新深度链接及窄屏阅读顺序。

- [x] **3. 架构页与当前 Templates V2 执行契约一致**
  - **结果：** 架构页准确说明 `.harness/`、`AGENTS.md`、`openspec/` 三个真源、零额外运行时状态、写入授权边界、L0 专项短路和 L1 渐进路由，不再出现已废弃的工具提供方、旧调试能力或固定编排口径；无关领域能力和 CLI 内容不被顺带重写。
  - **范围：** `web/src/pages/architecture.tsx`、架构页相邻测试。
  - **验证：** `pnpm --dir web test -- architecture-page.test.tsx react-pages.test.ts`；浏览器核对架构路由图和移动端长文本布局。

- [x] **4. 最佳实践页成为 V2 操作指南**
  - **结果：** 最佳实践页以目标与验收、Direct 优先、Lite 持久化、Full 风险确认、保护收敛、结果型 Tasks、邻近验证和按需增强为主体；Paseo/Worktree 仍可查阅，但被明确降级为需要隔离时的可选执行环境，Commit 不再被描述为默认收尾动作。
  - **范围：** `web/src/pages/best-practices.tsx`、按语义拆分的页面专属 sections、最佳实践相邻测试。
  - **验证：** `pnpm --dir web test -- best-practices-page.test.tsx react-pages.test.ts`；浏览器确认实践 sections 可扫描、可选隔离附录定位清晰且移动端无横向溢出。

- [x] **5. V2 更新页与 Changelog 提供一致的正式发布事实**
  - **结果：** `/templates-v2.html` 保留现有设计复盘，并补齐当前能力速览、V1 迁移清单、未取消的质量活动说明和正式升级入口；页面以“Templates V2”为品牌，从现有版本目录读取当前稳定版本，加载失败时不回退到可能过期的硬编码版本；Changelog 只保留版本历史和 V2 更新入口，不再维护 OpenSpec + Superpowers + OMC 的旧架构说明。
  - **范围：** `web/src/pages/templates-v2.tsx`、`web/src/pages/templates-v2/`、`web/src/pages/changelog.tsx`、`web/src/pages/changelog/`、`web/src/lib/version-catalog.ts` 及相邻版本/页面测试。
  - **验证：** `pnpm --dir web test -- templates-v2-page.test.tsx changelog-page.test.tsx changelog-data.test.ts version-catalog.test.ts`；在版本目录成功、加载中和失败三种状态下检查 V2 更新页与 Changelog，不出现伪造稳定版本。

- [x] **6. V2 主站切换保持兼容并达到发布质量**
  - **结果：** 所有目标页面共享一致的 V2 术语和演进式视觉层级；React 状态、语义组件、`PageFrame`、无扩展名本地 import 等现有约定保持成立；冻结的 capability、V1、sharing 和 stats 页面源码不被重构，现有公共 `.html` URL 与静态资源继续可访问。
  - **范围：** 目标页面共享样式和测试、`web/src/routes.ts` 的既有路径契约、`web/tests/` 中与 React 页面、路由、server fallback、静态资源和构建直接相关的覆盖。
  - **验证：** `pnpm --dir web test`；`pnpm --dir web build`；启动 Web server 后在桌面和移动端浏览器 smoke `/`、`/index.html`、`/workflow.html`、`/templates-v2.html`、`/architecture.html`、`/best-practices.html`、`/sharing.html`、`/changelog.html`、`/stats.html`、`/capability-inventory.html`、`/v1/index.html`、`/v1/capability-inventory.html`、`/install.md`、`/human-review.css`、`/human-review.js`、`/assets/styles.css`，确认返回成功且目标页面无控制台错误、明显溢出或不可操作状态。
