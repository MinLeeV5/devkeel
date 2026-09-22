export const PAGE_REDIRECTS = {
  '/architecture.html': '/#how-it-works',
  '/best-practices.html': '/#progressive-path',
  '/templates-v2.html': '/#why-v2',
  '/workflow.html': '/#progressive-path',
} as const

export const GONE_PAGE_PATHS = ['/capability-inventory.html', '/stats.html', '/v1/stats.html'] as const

export function resolvePageRedirect(inputPath: string): string | null {
  const pathname = normalizePathname(inputPath)
  return PAGE_REDIRECTS[pathname as keyof typeof PAGE_REDIRECTS] ?? null
}

export function isGonePage(inputPath: string): boolean {
  const pathname = normalizePathname(inputPath)
  return GONE_PAGE_PATHS.includes(pathname as (typeof GONE_PAGE_PATHS)[number])
}

function normalizePathname(inputPath: string): string {
  const url = inputPath.startsWith('http://') || inputPath.startsWith('https://')
    ? new URL(inputPath)
    : new URL(inputPath || '/', 'http://harness.local')

  const pathname = url.pathname || '/'
  if (pathname !== '/' && pathname.endsWith('/')) {
    return pathname.slice(0, -1)
  }
  return pathname
}
