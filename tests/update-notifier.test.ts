import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import {
  checkAndNotify,
  readUpdateCache,
  writeUpdateCache,
  isCacheExpired,
  compareVersions,
  formatUpdatePrompt,
} from '../src/lib/update-notifier.js'
import { writeVersions } from '../src/lib/versions.js'

describe('update-notifier', () => {
  let projectRoot: string
  let cachePath: string

  beforeEach(() => {
    projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'harness-update-notifier-'))
    cachePath = path.join(projectRoot, 'cache', 'devkeel-update-check.json')
  })

  afterEach(() => {
    fs.rmSync(projectRoot, { recursive: true, force: true })
  })

  function writeProjectVersion(version: string): void {
    writeVersions(projectRoot, { harness: version, skills: {}, agents: {}, rules: {}, schemas: {} })
  }

  function writeRawCache(content: string): void {
    fs.mkdirSync(path.dirname(cachePath), { recursive: true })
    fs.writeFileSync(cachePath, content)
  }

  describe('writeUpdateCache / readUpdateCache', () => {
    it('should return null when the cache does not exist', () => {
      expect(readUpdateCache(cachePath)).toBeNull()
    })

    it('should round-trip the last check and latest version', () => {
      const cache = { lastCheck: Date.now(), latestVersion: '2.2.0' }
      writeUpdateCache(cache, cachePath)
      expect(readUpdateCache(cachePath)).toEqual(cache)
    })

    it('should accept a legacy cache while ignoring browser notification state', () => {
      const cache = { lastCheck: Date.now(), latestVersion: '2.2.0' }
      writeRawCache(JSON.stringify({ ...cache, notifiedVersion: '2.2.0' }))
      expect(readUpdateCache(cachePath)).toEqual(cache)
    })

    it.each([
      '',
      'not valid json',
      'null',
      JSON.stringify({ lastCheck: 'abc', latestVersion: '2.2.0' }),
      JSON.stringify({ lastCheck: Date.now(), latestVersion: 123 }),
    ])('should return null for an invalid cache: %s', content => {
      writeRawCache(content)
      expect(readUpdateCache(cachePath)).toBeNull()
    })
  })

  describe('isCacheExpired', () => {
    it('should reuse a recent cache', () => {
      expect(isCacheExpired({ lastCheck: Date.now() - 1000, latestVersion: '2.2.0' })).toBe(false)
    })

    it('should expire a cache older than three days', () => {
      expect(isCacheExpired({
        lastCheck: Date.now() - 4 * 24 * 60 * 60 * 1000,
        latestVersion: '2.2.0',
      })).toBe(true)
    })
  })

  describe('compareVersions', () => {
    it.each([
      ['1.0.0', '1.0.0', false],
      ['1.0.0', '1.0.1', true],
      ['1.9.0', '1.10.0', true],
      ['1.10.0', '1.9.0', false],
      ['2.0.0', '1.99.99', false],
      ['1.99.99', '2.0.0', true],
      ['2.1.1-beta.0', '2.1.1', true],
      ['2.1.1', '2.1.1-beta.9', false],
      ['2.2.0-beta.0', '2.1.9', false],
      ['2.1.1-beta.9', '2.1.1-beta.10', true],
      ['2.1.1-beta.10', '2.1.1-beta.2', false],
      ['2.1.1-rc.1', '2.1.1-beta.10', false],
      ['2.1.1+local', '2.1.1+registry', false],
      ['', '1.0.0', false],
      ['1.0.0', '', false],
      ['unknown', '1.0.0', false],
      ['1.0.0', 'latest', false],
    ])('should compare %s against %s as newer=%s', (current, latest, newer) => {
      expect(compareVersions(current, latest)).toBe(newer)
    })
  })

  describe('formatUpdatePrompt', () => {
    it('should identify template versions and the template upgrade command', () => {
      const result = formatUpdatePrompt('2.1.1-beta.0', '2.2.0')
      expect(result).toContain('DevKeel 模板有新版本可用')
      expect(result).toContain('当前模板版本: 2.1.1-beta.0')
      expect(result).toContain('最新模板版本: 2.2.0')
      expect(result).toContain('devkeel update')
      expect(result).not.toContain('https://')
    })
  })

  describe('checkAndNotify', () => {
    it('should return null without project versions', async () => {
      expect(await checkAndNotify(projectRoot, cachePath)).toBeNull()
      expect(fs.existsSync(cachePath)).toBe(false)
    })

    it('should return a terminal prompt and leave a fresh cache unchanged on repeated checks', async () => {
      writeProjectVersion('2.1.1-beta.0')
      writeUpdateCache({ lastCheck: Date.now(), latestVersion: '2.2.0' }, cachePath)
      const cached = fs.readFileSync(cachePath, 'utf-8')

      const first = await checkAndNotify(projectRoot, cachePath)
      const second = await checkAndNotify(projectRoot, cachePath)

      expect(first).toContain('DevKeel 模板有新版本可用')
      expect(first).toContain('2.2.0')
      expect(first).toContain('devkeel update')
      expect(second).toBe(first)
      expect(fs.readFileSync(cachePath, 'utf-8')).toBe(cached)
    })

    it('should show a terminal prompt even when an old client already opened the release page', async () => {
      writeProjectVersion('2.1.1-beta.0')
      writeRawCache(JSON.stringify({
        lastCheck: Date.now(),
        latestVersion: '2.2.0',
        notifiedVersion: '2.2.0',
      }))
      expect(await checkAndNotify(projectRoot, cachePath)).toContain('devkeel update')
    })

    it.each([
      ['2.2.0', '2.2.0'],
      ['2.2.0', '2.1.9'],
      ['2.2.0-beta.1', '2.1.9'],
      ['2.2.0+local', '2.2.0+registry'],
      ['unknown', '2.2.0'],
      ['2.2.0', 'not-a-version'],
    ])('should not advertise an upgrade from %s to %s', async (current, latest) => {
      writeProjectVersion(current)
      writeUpdateCache({ lastCheck: Date.now(), latestVersion: latest }, cachePath)
      expect(await checkAndNotify(projectRoot, cachePath)).toBeNull()
    })
  })
})
