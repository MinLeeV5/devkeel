import { sitePathname, siteUrl } from './site-paths'

export const PAGE_REDIRECTS = {
  '/architecture.html': '/#how-it-works',
  '/best-practices.html': '/#progressive-path',
  '/templates-v2.html': '/#why-v2',
  '/workflow.html': '/#progressive-path',
} as const

export const GONE_PAGE_PATHS = ['/capability-inventory.html', '/stats.html', '/v1/stats.html'] as const

export function resolvePageRedirect(inputPath: string, base = '/'): string | null {
  const pathname = sitePathname(inputPath, base)
  const target = PAGE_REDIRECTS[pathname as keyof typeof PAGE_REDIRECTS]
  return target ? siteUrl(target, base) : null
}

export function isGonePage(inputPath: string, base = '/'): boolean {
  const pathname = sitePathname(inputPath, base)
  return GONE_PAGE_PATHS.includes(pathname as (typeof GONE_PAGE_PATHS)[number])
}
