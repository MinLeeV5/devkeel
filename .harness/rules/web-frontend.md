---
description: "Web 前端规则 — React 页面架构、路由兼容、UI 交互与验证约束"
globs:
  - "web/**/*.{ts,tsx,css,html,json}"
---

# Web 前端规则

本规则适用于 `web/` 全静态文档站与演示页面。保持旧 HTML URL 兼容，主站使用 React 组件、
显式状态和可验证测试；分享幻灯片保留独立静态 HTML。

需要代码示例或出处时，读取 [配套说明](../../docs/examples/web-frontend.md)。

## 约定 1: `web/index.html` 只作为 Vite app shell

`web/index.html` 只能保留 Vite 根节点和入口脚本，不再承载具体页面内容。新增或修改页面时，必须在 `web/src/pages/` 中实现 React 页面。

禁止恢复 `workflow.html`、`stats.html` 等独立页面源码。`scripts/static-site.ts` 从构建后的
app shell 生成 React 页面入口，从生命周期表生成兼容跳转页；不能依赖托管方的 SPA fallback。

`web/public/sharing.html`、`sharing-harness-research.html` 和 `v1/sharing.html` 是独立分享稿，
由 Vite 原样复制到 dist，不经过 React 或 TSX 转换。

## 约定 2: 公共旧 URL 必须集中登记在 `routes.ts`

所有可访问页面路径必须在 `web/src/routes.ts` 的 `PUBLIC_PAGE_PATHS` 中登记。React 页面还必须通过 `PAGE_ROUTES` 维护，并在 `web/src/pages/registry.ts` 注册对应 React component；退场页面的 redirect / gone 生命周期集中维护在 `web/page-redirects.ts`。

新增页面时必须保留旧 `.html` URL 形态，除非任务明确要求改变对外链接契约。

独立分享稿只登记在 `PUBLIC_PAGE_PATHS`，不得加入 `PAGE_ROUTES` 或 `PAGE_COMPONENTS`。
浏览器路由、数据请求、首页链接和兼容跳转必须使用 Vite `BASE_URL`，支持 `/` 与 `/devkeel/`。
页面内相对链接须同时适配主站和 V1 的目录深度。

## 约定 3: 主站页面必须使用 React 状态，不使用页面级 DOM 脚本

主站页面包括:

- `home`
- `changelog`

这些页面禁止使用 `usePageInteractions`、`onAction=`、`data-action`、`innerHTML`、`querySelector` 批量改 DOM 等旧脚本式交互。状态切换、tab、导航、表格、loading、banner、幻灯片等行为必须由 React state、props 和组件渲染完成。

独立分享稿可以使用原生 JavaScript 管理幻灯片状态；脚本必须显式维护唯一的 active slide，
并保留键盘和可访问导航。

## 约定 4: V1 页面是冻结例外

V1 作为历史归档保留源码和旧 URL，构建时继续生成页面；主站导航、页脚和对比区不提供 V1 入口。

以下页面当前不纳入主站 React 化重构范围，除非用户明确点名要求处理:

- `web/src/pages/v1-home.tsx`
- `web/src/pages/v1-capability-inventory.tsx`

这些页面允许暂时保留 `usePageInteractions` 和 capability tab 的 `data-action="showTab(...)"` 逻辑。修改其他 web 页面时，不要顺手迁移、清理或重构这些冻结例外。

V2 `/capability-inventory.html` 已退场，不生成页面，由静态托管返回 404；不得重新加入页面注册。

## 约定 5: React 页面必须拆成可读的 section/component

页面级文件可以保留页面专属样式，但 JSX 结构必须按语义拆分为明确 section/component。长页面至少要让顶层 return 表达页面结构，而不是一整段不可定位的 JSX。

组件拆分优先服务可读性和状态边界，不为了抽象而抽象。

## 约定 6: 页面元信息和样式统一通过 `PageFrame`

所有 React 页面必须使用 `PageFrame` 设置 `pageId`、`title`、`description`、`styles` 和 `externalStyles`。不要在页面组件内直接操作 `document.title`、`meta[name=description]` 或手动插入 `<link>`。独立的 `sharing.html` 直接在 `<head>` 中声明元信息和样式。

## 约定 7: 路由 lazy fallback 不显示全局过渡画面

页面 lazy chunk 加载期间不显示全屏 loading 或过渡页。`RoutePage` 的 `Suspense` fallback 应保持 `null`，避免导航时出现一闪而过的全局画面。

如需改善切换体感，优先考虑预加载 chunk 或缩小单页 bundle，而不是恢复全局 loading 画面。

## 约定 8: 页面测试必须覆盖迁移边界和旧脚本回归

涉及 web 页面结构、交互或路由的改动，必须补充或更新 `web/tests/react-pages.test.ts`、`web/tests/routes.test.ts` 或更接近的 web 测试。测试要覆盖:

- `PAGE_ROUTES` 中的路由都能映射到 React component
- 不引入 `legacy-pages`、`?raw`、`dangerouslySetInnerHTML`
- 主站页面不回退到 `data-action` / DOM 初始化脚本
- 独立分享稿不进入 React route/component registry
- `v1/sharing.html` 的 active slide、进度、点选和键盘导航仍可用
- 页面关键 section/component 仍存在
- 旧 URL 兼容不被破坏，V1 页面可直达但主站没有入口
- 根路径和 `/devkeel/` 构建均生成真实页面、正确资源链接和 `versions/index.json`

## 约定 9: 验证顺序从 web 局部到全仓

完成 web 改动前，优先运行最小相关验证，再扩大到全仓:

```bash
pnpm --dir web test
pnpm --dir web build
pnpm test
pnpm build
```

涉及页面入口、前缀或静态资源时，还要在普通静态文件服务器上 smoke 以下路径（带部署前缀）：

- `/`
- `/index.html`
- `/workflow.html`、`/architecture.html`、`/best-practices.html`、`/templates-v2.html` 返回 HTML 跳转页
- `/sharing.html`、`/sharing-harness-research.html` 返回当前分享稿
- `/changelog.html`
- `/stats.html`、`/v1/stats.html`、`/capability-inventory.html` 与未知路径返回 404
- `/v1/index.html`
- `/v1/sharing.html`
- `/v1/capability-inventory.html`
- `/install.md`
- `/assets/styles.css`
- `/versions/index.json`

测试和构建不依赖 Hono；静态版本目录校验失败必须阻断构建，不能发布不完整数据。

## 约定 10: UI 修改遵守现有页面的视觉系统

主站页面已经形成多个页面级视觉系统。修改 UI 时应先识别目标页面已有样式变量、组件密度和交互模式，再在局部做一致性调整。

通用要求:

- 按页面现有设计风格修，不引入无关全局主题重写
- 文字不得溢出按钮、卡片、表格或固定尺寸元素
- 图片必须有响应式宽度和明确居中/对齐策略
- 使用真实图片资产时放在 `web/public/assets/`，页面中用 `./assets/...` 引用
- 不为短暂状态添加突兀的全屏视觉层；导航切换默认无 fallback

## 约定 11: 资产和静态文件位置固定

构建后需要原样访问的静态资源放在 `web/public/`。`web/install.md` 是安装指南源文件，
`web/public/install.md` 必须与它一致。版本正文放在 `public/versions/{cli,templates}/`，
`dist/versions/index.json` 只由构建生成，不手工维护。

新增图片、样式或下载资源时，必须确认:

- 开发 server 可访问
- `pnpm --dir web build` 后 dist 可访问
- 旧 URL smoke 不受影响

## 约定 12: 不使用类型检查逃逸

`web/src/pages/` 禁止新增 `@ts-nocheck`、`eslint-disable` 或类似生成代码逃逸。大段页面迁移也必须保持 TypeScript 可检查。

## 约定 13: Web 本地模块导入省略扩展名

`web/` 的 TypeScript/TSX 由 Vite、tsx 和 `moduleResolution: "bundler"` 解析。本地模块的静态 import、type import、re-export 和动态 import 都必须省略 `.js`、`.ts`、`.tsx` 等源码扩展名。

以下内容不属于本规则的本地 TypeScript module specifier，保留实际后缀:

- `.js` 源文件之间由 Node.js ESM 直接解析的 import
- `./assets/styles.css` 等静态资源 URL
- `chart.js/auto` 等 package specifier
