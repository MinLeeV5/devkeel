import path from 'node:path'
import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Plugin, ResolvedConfig } from 'vite'

import { PAGE_REDIRECTS } from '../page-redirects'
import { sitePathname, siteUrl } from '../site-paths'
import { PAGE_ROUTES, resolvePageRoute } from '../src/routes'
import { loadVersionCatalog } from '../version-catalog'

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[character]!)
}

function redirectHtml(target: string): string {
  const escaped = escapeHtml(target)
  return `<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="refresh" content="0;url=${escaped}">
<title>页面已迁移 — DevKeel</title></head>
<body><p>页面已迁移，<a href="${escaped}">前往当前内容</a>。</p></body></html>`
}

export function createStaticPages(shell: string, base: string): Record<string, string> {
  const pages: Record<string, string> = {}
  for (const route of PAGE_ROUTES) {
    if (route.routePath === '/' || route.routePath === '/index.html') continue
    pages[route.routePath.slice(1)] = shell.replace(/<title>.*?<\/title>/s, `<title>${escapeHtml(route.title)}</title>`)
  }
  for (const [source, target] of Object.entries(PAGE_REDIRECTS)) {
    pages[source.slice(1)] = redirectHtml(siteUrl(target, base))
  }
  pages['404.html'] = shell.replace(/<title>.*?<\/title>/s, '<title>页面不存在 — DevKeel</title>')
  return pages
}

function redirectBareBase(request: IncomingMessage, response: ServerResponse, base: string): boolean {
  const url = new URL(request.url ?? '/', 'http://devkeel.local')
  if (base === '/' || url.pathname !== base.slice(0, -1)) return false
  response.statusCode = 302
  response.setHeader('Location', `${base}${url.search}`)
  response.end()
  return true
}

/** Build-only data and real .html entries; no application server is shipped. */
export function staticSite(): Plugin {
  let config: ResolvedConfig
  const catalog = (): string => JSON.stringify(loadVersionCatalog(path.join(config.publicDir, 'versions')))

  return {
    name: 'devkeel-static-site',
    configResolved(resolved) {
      config = resolved
      if (!/^\/(?:[^?#\\]*\/)?$/.test(config.base) || config.base.startsWith('//')) {
        throw new Error('Web base must be an absolute path such as / or /devkeel/')
      }
    },
    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        if (redirectBareBase(request, response, config.base)) return
        const pathname = sitePathname(request.url ?? '/', config.base)
        if (pathname === '/versions/index.json') {
          try {
            const data = catalog()
            response.setHeader('Content-Type', 'application/json; charset=utf-8')
            response.setHeader('Cache-Control', 'no-store')
            response.end(data)
          } catch (error) {
            next(error)
          }
          return
        }
        const target = PAGE_REDIRECTS[pathname as keyof typeof PAGE_REDIRECTS]
        if (target) {
          response.setHeader('Content-Type', 'text/html; charset=utf-8')
          response.end(redirectHtml(siteUrl(target, config.base)))
          return
        }
        if (resolvePageRoute(request.url ?? '/', config.base)) {
          request.url = siteUrl('/index.html', config.base)
        }
        next()
      })
    },
    configurePreviewServer(server) {
      server.middlewares.use((request, response, next) => {
        if (!redirectBareBase(request, response, config.base)) next()
      })
    },
    generateBundle: {
      order: 'post',
      handler(_options, bundle) {
        const shell = bundle['index.html']
        if (!shell || shell.type !== 'asset') throw new Error('Missing built index.html')
        for (const [fileName, source] of Object.entries(createStaticPages(String(shell.source), config.base))) {
          this.emitFile({ type: 'asset', fileName, source })
        }
        this.emitFile({ type: 'asset', fileName: 'versions/index.json', source: catalog() })
        this.emitFile({ type: 'asset', fileName: '.nojekyll', source: '' })
      },
    },
  }
}
