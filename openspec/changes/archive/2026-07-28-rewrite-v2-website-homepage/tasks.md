# 实施任务

- [x] **1. V2 首页成为单篇工程文章与唯一核心叙事**
  - **结果：** Hero、六章正文、桌面侧栏/移动章节导航和收尾 CTA 形成一条从理解到采用的阅读路径；痛点与版本化竞品星级表先建立选型背景，再推导 Harness V2 的项目知识、渐进治理与反馈回路答案。
  - **范围：** `web/src/pages/home.tsx`、`web/src/pages/home/`、首页样式与相邻渲染测试。
  - **验证：** `pnpm --dir web test -- home-page.test.tsx react-pages.test.ts`；浏览器在桌面和移动视口检查章节定位、表格横向滚动、键盘焦点和正文布局。

- [x] **2. 两张图与现有项目改造叙事准确连接真实能力**
  - **结果：** 渐进路径图一次展示专项 Skill、Direct、Lite、Full 的分流和升级；项目改造图展示 `devkeel init → domain-init → verify-init` 与 `AGENTS.md`、`.harness/`、`openspec/`、代码/测试反馈的关系；自包含 architecture-diagram HTML+SVG 设计源与首页响应式内联 SVG 语义一致。
  - **范围：** `openspec/changes/rewrite-v2-website-homepage/diagrams/`、`web/src/pages/home/` 图表与项目改造组件、相邻测试。
  - **验证：** 直接打开两份图表设计源确认无重叠和中文标签；浏览器检查首页 SVG 在桌面/移动端可读，且 title/desc 或等价文本可被查询。

- [x] **3. 快速开始与社区入口以最短路径促成采用**
  - **结果：** 首屏“快速开始”跳到首页末章；默认 Agent 入口清晰可复制/访问安装文档，手动 init/doctor 命令按需展开，`domain-init`、`verify-init` 顺序和确认边界明确；飞书群二维码在快速开始后以紧凑支持卡片保留。
  - **范围：** `web/src/pages/home/QuickStartSection.tsx`、`web/src/pages/home/CommunitySection.tsx`、首页交互状态与测试。
  - **验证：** `pnpm --dir web test -- home-page.test.tsx`；浏览器操作主 CTA、手动入口和二维码区域，确认移动端无溢出。

- [x] **4. V2 页面退场与 V1/工具页边界保持兼容**
  - **结果：** `/workflow.html`、`/architecture.html`、`/best-practices.html`、`/templates-v2.html` 跳到首页对应锚点；V2 capability inventory 删除；`/sharing.html` 跳到 `/v1/sharing.html` 且 V1 导航继续引用技术分享；V1 全部页面、Changelog 和直达 Stats 保持可用，Stats 不从 V2 公开入口露出。
  - **范围：** `web/src/components/MarketingNav.tsx`、`web/src/routes.ts`、页面注册、`web/server.ts`、`web/public/v1/`、相关 V1 静态/React 页面与路由测试。
  - **验证：** `pnpm --dir web test -- routes.test.ts server.test.ts react-pages.test.ts stats-page.test.tsx changelog-page.test.tsx`；启动服务后检查所有新旧 URL 的响应、跳转目标和 V1 导航。

- [x] **5. V2 单页切换达到发布前质量**
  - **结果：** 目标源码只保留一份当前 V2 核心事实，未引入页面级 DOM 脚本、类型逃逸或无关回退；相关测试、完整 Web 测试和构建通过，桌面/移动关键路径无控制台错误、明显溢出或不可操作状态。
  - **范围：** `web/tests/`、受影响页面和共享样式；仅修复与本次改动直接相关的问题。
  - **验证：** `pnpm --dir web test`；`pnpm --dir web build`；浏览器 smoke `/`、`/index.html`、旧 V2 详情 URL、`/changelog.html`、`/stats.html`、`/v1/index.html`、`/v1/stats.html`、`/v1/capability-inventory.html`、`/v1/sharing.html`、`/sharing.html` 和 `/install.md`。
