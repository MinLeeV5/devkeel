/** Resolve a browser URL within the configured root or project-site prefix. */
export function sitePathname(inputPath: string, base = '/'): string | null {
  const { pathname } = new URL(inputPath || '/', 'http://devkeel.local')
  if (base !== '/' && pathname === base.slice(0, -1)) return '/'
  if (!pathname.startsWith(base)) return null
  const relativePath = `/${pathname.slice(base.length)}`
  return relativePath.length > 1 ? relativePath.replace(/\/$/, '') : relativePath
}

export function siteUrl(sitePath: string, base = '/'): string {
  return `${base}${sitePath.replace(/^\//, '')}`
}
