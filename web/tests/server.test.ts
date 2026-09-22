import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import webPackageJson from '../package.json'
import cliPackageJson from '../../package.json'
import templatesPackageJson from '../../templates/package.json'
import { createServerApp, parseServerArguments } from '../server'

const SOURCE_VERSIONS_DIR = fileURLToPath(new URL('../public/versions', import.meta.url))

function writeVersionEntry(
  versionsDir: string,
  stream: 'cli' | 'templates',
  version: string,
  releasedAt: string,
): void {
  const streamDir = path.join(versionsDir, stream)
  fs.mkdirSync(streamDir, { recursive: true })
  fs.writeFileSync(
    path.join(streamDir, `${version}.json`),
    JSON.stringify({
      versions: [version],
      releasedAt: { from: releasedAt },
      title: `${stream} ${version}`,
      archived: false,
      groups: [],
    }),
  )
}

function seedVersionCatalog(versionsDir: string, cliVersion = '9.0.0', templateVersion = '8.0.0'): void {
  writeVersionEntry(versionsDir, 'cli', cliVersion, '2026-07-02T09:00:00+08:00')
  writeVersionEntry(versionsDir, 'templates', templateVersion, '2026-07-01T09:00:00+08:00')
}

describe('web server', () => {
  let tmpDir: string
  let staticRoot: string

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'harness-web-'))
    staticRoot = path.join(tmpDir, 'dist')
    fs.mkdirSync(path.join(staticRoot, 'assets'), { recursive: true })
    fs.writeFileSync(path.join(staticRoot, 'index.html'), '<!doctype html><div id="root"></div>')
    fs.writeFileSync(path.join(staticRoot, 'assets', 'app.js'), 'console.log("ok")')
  })

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true })
  })

  it('should serve built static assets from the configured dist directory', async () => {
    const app = createServerApp({ staticRoot, version: '0.1.0', versionsDir: SOURCE_VERSIONS_DIR })

    const res = await app.request('http://localhost/assets/app.js')

    expect(res.status).toBe(200)
    expect(await res.text()).toBe('console.log("ok")')
    expect(res.headers.get('content-type')).toContain('text/javascript')
  })

  it('redirects retired V2 detail routes to home chapters', async () => {
    const app = createServerApp({ staticRoot, version: '0.1.0', versionsDir: SOURCE_VERSIONS_DIR })

    const res = await app.request('http://localhost/workflow.html')

    expect(res.status).toBe(302)
    expect(res.headers.get('location')).toBe('/#progressive-path')
  })

  it('serves the current sharing page before the React fallback', async () => {
    fs.writeFileSync(path.join(staticRoot, 'sharing.html'), '<!doctype html><title>Current sharing deck</title>')
    const app = createServerApp({ staticRoot, version: '0.1.0', versionsDir: SOURCE_VERSIONS_DIR })

    const res = await app.request('http://localhost/sharing.html')

    expect(res.status).toBe(200)
    expect(await res.text()).toContain('Current sharing deck')
    expect(res.headers.get('content-type')).toContain('text/html')
  })

  it('serves the archived V1 sharing page before the React fallback', async () => {
    fs.mkdirSync(path.join(staticRoot, 'v1'), { recursive: true })
    fs.writeFileSync(path.join(staticRoot, 'v1', 'sharing.html'), '<!doctype html><title>V1 sharing deck</title>')
    const app = createServerApp({ staticRoot, version: '0.1.0', versionsDir: SOURCE_VERSIONS_DIR })

    const res = await app.request('http://localhost/v1/sharing.html')

    expect(res.status).toBe(200)
    expect(await res.text()).toContain('V1 sharing deck')
    expect(res.headers.get('content-type')).toContain('text/html')
  })

  it('returns gone for the retired V2 capability inventory', async () => {
    const app = createServerApp({ staticRoot, version: '0.1.0', versionsDir: SOURCE_VERSIONS_DIR })

    const res = await app.request('http://localhost/capability-inventory.html')

    expect(res.status).toBe(410)
    expect(await res.text()).toBe('')
  })

  it('should keep API routes available beside the static bundle', async () => {
    const app = createServerApp({ staticRoot, version: '0.1.0', versionsDir: SOURCE_VERSIONS_DIR })

    const res = await app.request('http://localhost/api/version')

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ latest: '0.1.0' })
  })

  it('should serve an explicitly configured version catalog from memory with no-store', async () => {
    const versionsDir = path.join(tmpDir, 'versions')
    seedVersionCatalog(versionsDir)
    const app = createServerApp({ staticRoot, version: '0.1.0', versionsDir })

    const firstResponse = await app.request('http://localhost/api/versions')
    const firstCatalog = await firstResponse.json()
    expect(firstResponse.status).toBe(200)
    expect(firstResponse.headers.get('content-type')).toContain('application/json')
    expect(firstResponse.headers.get('cache-control')).toBe('no-store')
    expect(firstCatalog).toMatchObject({
      cli: { latest: '9.0.0' },
      templates: { latest: '8.0.0' },
    })

    writeVersionEntry(versionsDir, 'cli', '10.0.0', '2026-07-03T09:00:00+08:00')
    const cachedResponse = await app.request('http://localhost/api/versions')
    expect(await cachedResponse.json()).toEqual(firstCatalog)
  })

  it('should prefer staticRoot versions and allow an explicit directory to override them', async () => {
    const builtVersionsDir = path.join(staticRoot, 'versions')
    const explicitVersionsDir = path.join(tmpDir, 'explicit-versions')
    seedVersionCatalog(builtVersionsDir, '3.0.0', '4.0.0')
    seedVersionCatalog(explicitVersionsDir, '5.0.0', '6.0.0')

    const builtApp = createServerApp({ staticRoot, version: '0.1.0' })
    const builtCatalog = await (await builtApp.request('http://localhost/api/versions')).json()
    expect(builtCatalog).toMatchObject({ cli: { latest: '3.0.0' }, templates: { latest: '4.0.0' } })

    const explicitApp = createServerApp({
      staticRoot,
      version: '0.1.0',
      versionsDir: explicitVersionsDir,
    })
    const explicitCatalog = await (await explicitApp.request('http://localhost/api/versions')).json()
    expect(explicitCatalog).toMatchObject({ cli: { latest: '5.0.0' }, templates: { latest: '6.0.0' } })
  })

  it('should load public versions only when their source directory is explicit', async () => {
    const app = createServerApp({
      staticRoot,
      version: '0.1.0',
      versionsDir: SOURCE_VERSIONS_DIR,
    })

    const catalog = await (await app.request('http://localhost/api/versions')).json()

    expect(catalog).toMatchObject({
      cli: { latest: cliPackageJson.version },
      templates: { latest: templatesPackageJson.version },
    })
  })

  it('should require built versions by default instead of silently reading public sources', () => {
    expect(() => createServerApp({ staticRoot, version: '0.1.0' })).toThrowError(
      /dist[/\\]versions.*directory cannot be inspected/,
    )
  })

  it('should reject an invalid version directory while creating the app', () => {
    const versionsDir = path.join(tmpDir, 'broken-versions')
    seedVersionCatalog(versionsDir)
    fs.writeFileSync(path.join(versionsDir, 'cli', 'broken.json'), '{')

    expect(() => createServerApp({ staticRoot, versionsDir })).toThrowError(/broken\.json.*invalid JSON/)
  })

  it('does not expose telemetry collection or statistics', async () => {
    const app = createServerApp({ staticRoot, versionsDir: SOURCE_VERSIONS_DIR })
    for (const endpoint of ['/api/telemetry', '/api/telemetry/v2', '/api/telemetry/stats', '/api/telemetry/v2/stats']) {
      expect((await app.request(endpoint)).status).toBe(404)
      expect((await app.request(endpoint, { method: 'POST', body: '{}' })).status).toBe(404)
    }
    expect(fs.existsSync(path.join(tmpDir, 'data'))).toBe(false)
  })

  it('retires both versions of the stats page', async () => {
    const app = createServerApp({ staticRoot, versionsDir: SOURCE_VERSIONS_DIR })
    for (const pathname of ['/stats.html', '/v1/stats.html']) {
      expect((await app.request(pathname)).status).toBe(410)
    }
  })
})
