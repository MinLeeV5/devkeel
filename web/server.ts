import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { loadVersionCatalog } from './version-catalog'
import { isGonePage, resolvePageRedirect } from './page-redirects'

export interface ServerOptions {
  staticRoot?: string
  version?: string
  versionsDir?: string
}

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DEFAULT_STATIC_ROOT = path.join(__dirname, 'dist')
const SOURCE_VERSIONS_DIR = path.join(__dirname, 'public', 'versions')
const MIME_TYPES: Record<string, string> = {
  '.css': 'text/css; charset=utf-8',
  '.gif': 'image/gif',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
}

export function createServerApp(options: ServerOptions = {}): Hono {
  const app = new Hono()
  const staticRoot = options.staticRoot ?? DEFAULT_STATIC_ROOT
  const versionCatalog = loadVersionCatalog(resolveVersionsDir(options, staticRoot))

  app.get('/api/version', (c) => {
    const version = process.env.HARNESS_VERSION ?? options.version ?? readVersionFromFile(__dirname)
    if (!version) {
      return c.json({ error: 'version not available' }, 500)
    }
    return c.json({ latest: version })
  })

  app.get('/api/versions', (c) => {
    c.header('Cache-Control', 'no-store')
    return c.json(versionCatalog)
  })

  app.all('/api/*', (c) => c.notFound())

  app.get('*', (c) => {
    const pathname = new URL(c.req.url).pathname
    const redirect = resolvePageRedirect(pathname)
    if (redirect) return c.redirect(redirect, 302)
    if (isGonePage(pathname)) return c.body(null, 410)

    const staticFile = resolveStaticFile(staticRoot, pathname)
    if (staticFile) return fileResponse(staticFile)

    if (hasNonHtmlExtension(pathname)) {
      return c.notFound()
    }

    const indexFile = path.join(staticRoot, 'index.html')
    if (!fs.existsSync(indexFile)) {
      return c.text(`static bundle not found: ${indexFile}`, 500)
    }
    return fileResponse(indexFile)
  })

  return app
}

function resolveVersionsDir(options: ServerOptions, staticRoot: string): string {
  if (options.versionsDir) return options.versionsDir
  return path.join(staticRoot, 'versions')
}

export function parseServerArguments(args: readonly string[]): ServerOptions {
  return args.includes('--source-versions') ? { versionsDir: SOURCE_VERSIONS_DIR } : {}
}

export function startServer(options: ServerOptions = {}): void {
  const port = Number(process.env.PORT) || 3000
  const app = createServerApp(options)
  serve({ fetch: app.fetch, port }, (info) => {
    console.log(`Server running at http://localhost:${info.port}`)
  })
}

function readVersionFromFile(baseDir: string): string | undefined {
  const versionFile = path.join(baseDir, 'version.json')
  if (!fs.existsSync(versionFile)) return undefined
  try {
    return JSON.parse(fs.readFileSync(versionFile, 'utf-8')).version
  } catch {
    return undefined
  }
}

function resolveStaticFile(staticRoot: string, pathname: string): string | null {
  const relativePath = pathname === '/' ? 'index.html' : decodeURIComponent(pathname).replace(/^\/+/, '')
  const normalizedPath = path.normalize(relativePath)
  if (normalizedPath.startsWith('..') || path.isAbsolute(normalizedPath)) return null

  const filePath = path.join(staticRoot, normalizedPath)
  const relativeToRoot = path.relative(staticRoot, filePath)
  if (relativeToRoot.startsWith('..') || path.isAbsolute(relativeToRoot)) return null
  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) return null
  return filePath
}

function fileResponse(filePath: string): Response {
  const contentType = MIME_TYPES[path.extname(filePath)] ?? 'application/octet-stream'
  return new Response(fs.readFileSync(filePath), {
    headers: { 'content-type': contentType },
    status: 200,
  })
}

function hasNonHtmlExtension(pathname: string): boolean {
  const ext = path.extname(pathname)
  return Boolean(ext && ext !== '.html')
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : ''
if (invokedPath === fileURLToPath(import.meta.url)) {
  startServer(parseServerArguments(process.argv.slice(2)))
}
