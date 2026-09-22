---
description: "Web 前端规则 — React 页面架构、路由兼容、UI 交互与验证约束"
globs:
  - "web/**/*.{ts,tsx,css,html,json}"
---

# Web 前端规则

本规则适用于 `web/` 文档站与演示页面。目标是保持旧 HTML URL 兼容，同时让主站实现以 React 组件、显式状态和可验证测试为中心。`v1/sharing.html` 是唯一的独立静态 HTML 例外。

## 约定 1: `web/index.html` 只作为 Vite app shell

`web/index.html` 只能保留 Vite 根节点和入口脚本，不再承载具体页面内容。新增或修改页面时，必须在 `web/src/pages/` 中实现 React 页面。

出处: `web/index.html`, `web/src/main.tsx`, `web/src/App.tsx`

```html
<!-- ✅ 正确：HTML shell -->
<div id="root"></div>
<script type="module" src="/src/main.tsx"></script>
```

禁止恢复 `workflow.html`、`stats.html` 等独立静态 HTML 页面作为源码输入。旧 URL 兼容通过 React router/server fallback 处理。

唯一例外是 `web/public/v1/sharing.html`：它是自包含的 V1 幻灯片页面，由 Vite 原样复制到 `dist/v1/sharing.html`，不经过 React 或 TSX 转换。旧 `/sharing.html` 只保留到该页面的兼容重定向。

## 约定 2: 公共旧 URL 必须集中登记在 `routes.ts`

所有可访问页面路径必须在 `web/src/routes.ts` 的 `PUBLIC_PAGE_PATHS` 中登记。React 页面还必须通过 `PAGE_ROUTES` 维护，并在 `web/src/pages/registry.ts` 注册对应 React component；退场页面的 redirect / gone 生命周期集中维护在 `web/page-redirects.ts`。

出处: `web/src/routes.ts`, `web/src/pages/registry.ts`, `web/tests/routes.test.ts`, `web/tests/react-pages.test.ts`

```typescript
// ✅ 正确：当前 React 路由和组件登记成对出现
{ pageId: 'home', routePath: '/', title: 'DevKeel V2' }

'home': lazy(() => import('./home').then((module) => ({ default: module.HomePage })))
```

新增页面时必须保留旧 `.html` URL 形态，除非任务明确要求改变对外链接契约。

`/v1/sharing.html` 只登记在 `PUBLIC_PAGE_PATHS`，不得加入 `PAGE_ROUTES` 或 `PAGE_COMPONENTS`；服务端应优先返回构建产物中的真实文件。`/sharing.html` 必须通过共享生命周期表跳转到该 V1 页面。

## 约定 3: 主站页面必须使用 React 状态，不使用页面级 DOM 脚本

主站页面包括:

- `home`
- `changelog`

这些页面禁止使用 `usePageInteractions`、`onAction=`、`data-action`、`innerHTML`、`querySelector` 批量改 DOM 等旧脚本式交互。状态切换、tab、导航、表格、loading、banner、幻灯片等行为必须由 React state、props 和组件渲染完成。

`web/public/v1/sharing.html` 不属于 React 主站页面，可以使用页面内的原生 JavaScript 管理幻灯片状态；脚本必须显式维护唯一的 active slide，并保留键盘和可访问导航。

出处: `web/src/pages/home/`, `web/src/pages/changelog.tsx`, `web/public/v1/sharing.html`, `web/tests/react-pages.test.ts`

```tsx
// ✅ 正确：React 状态驱动 UI
<button type="button" onClick={() => setActiveTab('cli')}>CLI</button>
{activeTab === 'cli' ? <CliPanel /> : null}
```

```tsx
// ❌ 错误：页面 action 字符串 + DOM 脚本
<button data-action="switchTab('cli')">CLI</button>
```

## 约定 4: V1 页面是冻结例外

以下页面当前不纳入主站 React 化重构范围，除非用户明确点名要求处理:

- `web/src/pages/v1-home.tsx`
- `web/src/pages/v1-capability-inventory.tsx`

这些页面允许暂时保留 `usePageInteractions` 和 capability tab 的 `data-action="showTab(...)"` 逻辑。修改其他 web 页面时，不要顺手迁移、清理或重构这些冻结例外。

V2 `/capability-inventory.html` 已退场，服务端返回 `410 Gone`；不得把它重新加入 React 路由或页面注册。

出处: V2 首页重写决策，`web/page-redirects.ts`，`web/src/interactions/usePageInteractions.ts`

## 约定 5: React 页面必须拆成可读的 section/component

页面级文件可以保留页面专属样式，但 JSX 结构必须按语义拆分为明确 section/component。长页面至少要让顶层 return 表达页面结构，而不是一整段不可定位的 JSX。

出处: `web/src/pages/home.tsx`, `web/src/pages/changelog.tsx`, `web/src/pages/changelog.tsx`

```tsx
// ✅ 正确：顶层结构可扫描
<PageFrame pageId="home" ...>
  <HomeHero />
  <ComparisonSection />
  <ProgressivePathSection />
  <QuickStartSection />
</PageFrame>
```

组件拆分优先服务可读性和状态边界，不为了抽象而抽象。

## 约定 6: 页面元信息和样式统一通过 `PageFrame`

所有 React 页面必须使用 `PageFrame` 设置 `pageId`、`title`、`description`、`styles` 和 `externalStyles`。不要在页面组件内直接操作 `document.title`、`meta[name=description]` 或手动插入 `<link>`。独立的 `sharing.html` 直接在 `<head>` 中声明元信息和样式。

出处: `web/src/components/PageFrame.tsx`

```tsx
// ✅ 正确
<PageFrame pageId="changelog" title="DevKeel 变更日志" description="" styles={styles}>
  <ChangelogContent />
</PageFrame>
```

## 约定 7: 路由 lazy fallback 不显示全局过渡画面

页面 lazy chunk 加载期间不显示全屏 loading 或过渡页。`RoutePage` 的 `Suspense` fallback 应保持 `null`，避免导航时出现一闪而过的全局画面。

出处: `web/src/components/RoutePage.tsx`, `web/tests/react-pages.test.ts`

```tsx
// ✅ 正确
<Suspense fallback={null}>
  <Page />
</Suspense>
```

如需改善切换体感，优先考虑预加载 chunk 或缩小单页 bundle，而不是恢复全局 loading 画面。

## 约定 8: 页面测试必须覆盖迁移边界和旧脚本回归

涉及 web 页面结构、交互或路由的改动，必须补充或更新 `web/tests/react-pages.test.ts`、`web/tests/routes.test.ts` 或更接近的 web 测试。测试要覆盖:

- `PAGE_ROUTES` 中的路由都能映射到 React component
- 不引入 `legacy-pages`、`?raw`、`dangerouslySetInnerHTML`
- 主站页面不回退到 `data-action` / DOM 初始化脚本
- `v1/sharing.html` 是唯一静态 HTML，并且不进入 React route/component registry
- `v1/sharing.html` 的 active slide、进度、点选和键盘导航仍可用
- 页面关键 section/component 仍存在
- 旧 URL 兼容不被破坏

出处: `web/tests/react-pages.test.ts`, `web/tests/routes.test.ts`, `web/tests/server.test.ts`

## 约定 9: 验证顺序从 web 局部到全仓

完成 web 改动前，优先运行最小相关验证，再扩大到全仓:

```bash
pnpm --dir web test
pnpm --dir web build
pnpm test
pnpm build
```

涉及旧 URL、静态资源或 server fallback 时，还要 smoke 当前路径及生命周期状态：

- `/`
- `/index.html`
- `/workflow.html`、`/architecture.html`、`/best-practices.html`、`/templates-v2.html` 返回目标章节 `302`
- `/sharing.html` 返回 `/v1/sharing.html` 的 `302`
- `/changelog.html`
- `/stats.html` 与 `/v1/stats.html` 返回 `410`
- `/capability-inventory.html` 返回 `410`
- `/v1/index.html`
- `/v1/sharing.html`
- `/v1/capability-inventory.html`
- `/install.md`
- `/human-review.css`
- `/human-review.js`
- `/assets/styles.css`

## 约定 10: UI 修改遵守现有页面的视觉系统

主站页面已经形成多个页面级视觉系统。修改 UI 时应先识别目标页面已有样式变量、组件密度和交互模式，再在局部做一致性调整。

通用要求:

- 按页面现有设计风格修，不引入无关全局主题重写
- 文字不得溢出按钮、卡片、表格或固定尺寸元素
- 图片必须有响应式宽度和明确居中/对齐策略
- 使用真实图片资产时放在 `web/public/assets/`，页面中用 `./assets/...` 引用
- 不为短暂状态添加突兀的全屏视觉层；导航切换默认无 fallback

出处: `web/src/pages/home/CommunitySection.tsx`, `web/src/styles/app.css`, `web/public/v1/sharing.html`

## 约定 11: 资产和静态文件位置固定

构建后需要原样访问的静态资源放在 `web/public/`。根目录的 `web/install.md`、`web/human-review.css`、`web/human-review.js` 是开发期源文件；需要被 server 静态访问的副本在 `web/public/`。

新增图片、样式或下载资源时，必须确认:

- 开发 server 可访问
- `pnpm --dir web build` 后 dist 可访问
- 旧 URL smoke 不受影响

## 约定 12: 不使用类型检查逃逸

`web/src/pages/` 禁止新增 `@ts-nocheck`、`eslint-disable` 或类似生成代码逃逸。大段页面迁移也必须保持 TypeScript 可检查。

出处: `web/tests/react-pages.test.ts`

```tsx
// ❌ 错误
// @ts-nocheck
```

## 约定 13: Web 本地模块导入省略扩展名

`web/` 的 TypeScript/TSX 由 Vite、tsx 和 `moduleResolution: "bundler"` 解析。本地模块的静态 import、type import、re-export 和动态 import 都必须省略 `.js`、`.ts`、`.tsx` 等源码扩展名。

出处: `web/tsconfig.json`, `web/tests/import-specifiers.test.ts`

```tsx
// ✅ 正确
import { PageFrame } from '../components/PageFrame'
const page = lazy(() => import('./home'))
```

```tsx
// ❌ 错误
import { PageFrame } from '../components/PageFrame.js'
import { PageFrame } from '../components/PageFrame.tsx'
```

以下内容不属于本规则的本地 TypeScript module specifier，保留实际后缀:

- `.js` 源文件之间由 Node.js ESM 直接解析的 import
- `./human-review.js` 等静态资源 URL
- `chart.js/auto` 等 package specifier
