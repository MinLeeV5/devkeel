# Web 前端规则示例

执行约束见 [对应规则](../../.harness/rules/web-frontend.md)。需要理解规则用法时按对应章节查阅；
以下代码用于说明模式，当前实现以所列源码为准。

## 约定 1: `web/index.html` 只作为 Vite app shell

出处: `web/index.html`, `web/src/main.tsx`, `web/src/App.tsx`

```html
<!-- ✅ 正确：HTML shell -->
<div id="root"></div>
<script type="module" src="/src/main.tsx"></script>
```

## 约定 2: 公共旧 URL 必须集中登记在 `routes.ts`

出处: `web/src/routes.ts`, `web/src/pages/registry.ts`, `web/tests/routes.test.ts`, `web/tests/react-pages.test.ts`

```typescript
// ✅ 正确：当前 React 路由和组件登记成对出现
{ pageId: 'home', routePath: '/', title: 'DevKeel V2' }

'home': lazy(() => import('./home').then((module) => ({ default: module.HomePage })))
```

## 约定 3: 主站页面必须使用 React 状态，不使用页面级 DOM 脚本

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

出处: V2 首页重写决策，`web/page-redirects.ts`，`web/src/interactions/usePageInteractions.ts`

## 约定 5: React 页面必须拆成可读的 section/component

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

## 约定 6: 页面元信息和样式统一通过 `PageFrame`

出处: `web/src/components/PageFrame.tsx`

```tsx
// ✅ 正确
<PageFrame pageId="changelog" title="DevKeel 变更日志" description="" styles={styles}>
  <ChangelogContent />
</PageFrame>
```

## 约定 7: 路由 lazy fallback 不显示全局过渡画面

出处: `web/src/components/RoutePage.tsx`, `web/tests/react-pages.test.ts`

```tsx
// ✅ 正确
<Suspense fallback={null}>
  <Page />
</Suspense>
```

## 约定 8: 页面测试必须覆盖迁移边界和旧脚本回归

出处: `web/tests/react-pages.test.ts`, `web/tests/routes.test.ts`, `web/tests/static-site.test.ts`

## 约定 10: UI 修改遵守现有页面的视觉系统

出处: `web/src/pages/home/CommunitySection.tsx`, `web/src/styles/app.css`, `web/public/v1/sharing.html`

## 约定 12: 不使用类型检查逃逸

出处: `web/tests/react-pages.test.ts`

```tsx
// ❌ 错误
// @ts-nocheck
```

## 约定 13: Web 本地模块导入省略扩展名

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
