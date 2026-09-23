import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { build, createServer, preview } from 'vite'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { GONE_PAGE_PATHS, PAGE_REDIRECTS } from '../page-redirects'
import { staticSite } from '../scripts/static-site'
import { PUBLIC_PAGE_PATHS } from '../src/routes'
import { loadVersionCatalog } from '../version-catalog'

const WEB_ROOT = fileURLToPath(new URL('..', import.meta.url))

describe('static deployment', () => {
  let temporaryRoot: string

  beforeEach(() => {
    temporaryRoot = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'harness-static-site-')))
  })
  afterEach(() => {
    fs.rmSync(temporaryRoot, { recursive: true, force: true })
  })

  it.each(['/', '/devkeel/'])('builds directly accessible current and V1 pages at %s', async (base) => {
    await build({
      root: WEB_ROOT,
      base,
      logLevel: 'silent',
      build: { outDir: temporaryRoot, emptyOutDir: true },
    })

    for (const pagePath of PUBLIC_PAGE_PATHS) {
      const fileName = pagePath === '/' ? 'index.html' : pagePath.slice(1)
      expect(fs.existsSync(path.join(temporaryRoot, fileName)), pagePath).toBe(true)
    }
    for (const fileName of ['index.html', 'changelog.html', 'v1/index.html', 'v1/architecture.html', '404.html']) {
      const html = fs.readFileSync(path.join(temporaryRoot, fileName), 'utf8')
      expect(html).toContain(`src="${base}assets/`)
      for (const match of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
        if (!match[1].startsWith(base)) continue
        expect(fs.existsSync(path.join(temporaryRoot, match[1].slice(base.length))), match[1]).toBe(true)
      }
    }
    for (const [source, target] of Object.entries(PAGE_REDIRECTS)) {
      const html = fs.readFileSync(path.join(temporaryRoot, source.slice(1)), 'utf8')
      expect(html).toContain(`http-equiv="refresh" content="0;url=${base}${target.slice(1)}"`)
      expect(html).toContain(`href="${base}${target.slice(1)}"`)
    }
    for (const gone of GONE_PAGE_PATHS) {
      expect(fs.existsSync(path.join(temporaryRoot, gone.slice(1)))).toBe(false)
    }
    expect(JSON.parse(fs.readFileSync(path.join(temporaryRoot, 'versions/index.json'), 'utf8')))
      .toEqual(loadVersionCatalog(path.join(WEB_ROOT, 'public/versions')))
    expect(fs.readFileSync(path.join(temporaryRoot, 'install.md'), 'utf8'))
      .toBe(fs.readFileSync(path.join(WEB_ROOT, 'install.md'), 'utf8'))
    expect(fs.existsSync(path.join(temporaryRoot, '.nojekyll'))).toBe(true)
    for (const runtimePath of ['server.ts', 'node_modules', 'package.json', 'api']) {
      expect(fs.existsSync(path.join(temporaryRoot, runtimePath))).toBe(false)
    }
    const server = await preview({
      root: WEB_ROOT, base, logLevel: 'silent', build: { outDir: temporaryRoot },
      preview: { port: 0, host: '127.0.0.1' },
    })
    try {
      const address = server.httpServer.address()
      if (!address || typeof address === 'string') throw new Error('Missing preview server address')
      const origin = `http://127.0.0.1:${address.port}`
      if (base !== '/') {
        const redirect = await fetch(`${origin}${base.slice(0, -1)}?from=bookmark`, { redirect: 'manual' })
        expect(redirect.status).toBe(302)
        expect(redirect.headers.get('location')).toBe(`${base}?from=bookmark`)
      }
      expect((await fetch(`${origin}${base}v1/index.html`)).status).toBe(200)
      expect((await fetch(`${origin}${base}does-not-exist.html`)).status).toBe(404)
    } finally {
      await new Promise<void>((resolve, reject) => server.httpServer.close((error) => error ? reject(error) : resolve()))
    }
  }, 30_000)

  it.each(['/', '/devkeel/'])('serves the catalog and deep pages in development at %s without Hono', async (base) => {
    const server = await createServer({
      root: WEB_ROOT, base, logLevel: 'silent',
      server: { port: 0, host: '127.0.0.1' },
    })
    try {
      await server.listen()
      const address = server.httpServer!.address()
      if (!address || typeof address === 'string') throw new Error('Missing development server address')
      const origin = `http://127.0.0.1:${address.port}`
      if (base !== '/') {
        const redirect = await fetch(`${origin}${base.slice(0, -1)}?from=bookmark`, { redirect: 'manual' })
        expect(redirect.status).toBe(302)
        expect(redirect.headers.get('location')).toBe(`${base}?from=bookmark`)
      }
      const catalogResponse = await fetch(`${origin}${base}versions/index.json`)
      expect(catalogResponse.status).toBe(200)
      expect(catalogResponse.headers.get('content-type')).toContain('application/json')
      expect(await catalogResponse.json()).toEqual(loadVersionCatalog(path.join(WEB_ROOT, 'public/versions')))
      for (const page of ['changelog.html', 'v1/index.html']) {
        const response = await fetch(`${origin}${base}${page}`)
        expect(response.status).toBe(200)
        expect(await response.text()).toContain('id="root"')
      }
      const redirect = await fetch(`${origin}${base}workflow.html`)
      expect(await redirect.text()).toContain(`url=${base}#progressive-path`)
      expect((await fetch(`${origin}${base}does-not-exist.html`)).status).toBe(404)
      expect((await fetch(`${origin}${base}api/versions`)).status).toBe(404)
    } finally {
      await server.close()
    }
  }, 30_000)

  it('rejects invalid version data instead of publishing a partial catalog', async () => {
    fs.writeFileSync(path.join(temporaryRoot, 'index.html'), '<html><head><title>Fixture</title></head><body></body></html>')
    await expect(build({
      root: temporaryRoot, configFile: false, logLevel: 'silent', plugins: [staticSite()],
    })).rejects.toThrow(/Invalid changelog version catalog/)
  })
})
