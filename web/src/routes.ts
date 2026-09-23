import { sitePathname } from '../site-paths'

export type PageId =
  | 'home'
  | 'changelog'
  | 'v1-architecture'
  | 'v1-best-practices'
  | 'v1-home'
  | 'v1-workflow'
  | 'v1-capability-inventory'

export { GONE_PAGE_PATHS, isGonePage, PAGE_REDIRECTS, resolvePageRedirect } from '../page-redirects'

export interface PageRoute {
  pageId: PageId
  routePath: string
  title: string
}

export const PUBLIC_PAGE_PATHS = [
  '/',
  '/index.html',
  '/workflow.html',
  '/templates-v2.html',
  '/architecture.html',
  '/best-practices.html',
  '/sharing.html',
  '/sharing-harness-research.html',
  '/changelog.html',
  '/v1/index.html',
  '/v1/workflow.html',
  '/v1/architecture.html',
  '/v1/best-practices.html',
  '/v1/sharing.html',
  '/v1/capability-inventory.html',
] as const

export const PAGE_ROUTES: readonly PageRoute[] = [
  { pageId: 'home', routePath: '/', title: 'DevKeel V2 — 让现有项目成为 Agent-ready 工程环境' },
  { pageId: 'home', routePath: '/index.html', title: 'DevKeel V2 — 让现有项目成为 Agent-ready 工程环境' },
  { pageId: 'changelog', routePath: '/changelog.html', title: 'DevKeel 变更日志' },
  { pageId: 'v1-home', routePath: '/v1/index.html', title: 'DevKeel v1' },
  { pageId: 'v1-workflow', routePath: '/v1/workflow.html', title: '工作流分解 — DevKeel' },
  { pageId: 'v1-architecture', routePath: '/v1/architecture.html', title: 'DevKeel — 架构设计' },
  { pageId: 'v1-best-practices', routePath: '/v1/best-practices.html', title: 'DevKeel — 最佳实践' },
  { pageId: 'v1-capability-inventory', routePath: '/v1/capability-inventory.html', title: 'DevKeel v1 能力清单' },
] as const

export function resolvePageRoute(inputPath: string, base = '/'): PageRoute | null {
  const pathname = sitePathname(inputPath, base)
  return PAGE_ROUTES.find((route) => route.routePath === pathname) ?? null
}
