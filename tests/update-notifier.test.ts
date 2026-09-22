import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { __test__ } from '../src/lib/update-notifier.js'
import { readVersions } from '../src/lib/config.js'

const {
  readUpdateCache,
  writeUpdateCache,
  isCacheExpired,
  compareVersions,
  formatUpdatePrompt,
  shouldOpenBrowser,
} = __test__!

describe('update-notifier', () => {
  describe('readUpdateCache', () => {
    let originalEnvHome: string | undefined
    let fakeHome: string

    beforeEach(() => {
      originalEnvHome = process.env['HOME']
      fakeHome = fs.mkdtempSync(path.join(os.tmpdir(), 'harness-update-notifier-'))
      process.env['HOME'] = fakeHome
    })

    afterEach(() => {
      fs.rmSync(fakeHome, { recursive: true, force: true })
      if (originalEnvHome === undefined) {
        delete process.env['HOME']
      } else {
        process.env['HOME'] = originalEnvHome
      }
    })

    it('should return null when cache file does not exist', () => {
      const result = readUpdateCache()
      expect(result).toBeNull()
    })
  })

  describe('writeUpdateCache / readUpdateCache', () => {
    let tmpCacheFile: string
    let originalEnvHome: string | undefined

    beforeEach(() => {
      originalEnvHome = process.env['HOME']
      const fakeHome = fs.mkdtempSync(path.join(os.tmpdir(), 'harness-update-notifier-'))
      process.env['HOME'] = fakeHome
      tmpCacheFile = fakeHome
    })

    afterEach(() => {
      if (tmpCacheFile) {
        fs.rmSync(tmpCacheFile, { recursive: true, force: true })
      }
      if (originalEnvHome === undefined) {
        delete process.env['HOME']
      } else {
        process.env['HOME'] = originalEnvHome
      }
    })

    it('should round-trip cache data', () => {
      const cache = {
        lastCheck: Date.now(),
        latestVersion: '1.0.2',
      }
      writeUpdateCache(cache)
      const loaded = readUpdateCache()
      expect(loaded).not.toBeNull()
      expect(loaded!.lastCheck).toBe(cache.lastCheck)
      expect(loaded!.latestVersion).toBe('1.0.2')
    })

    it('should round-trip cache with notifiedVersion', () => {
      const cache = {
        lastCheck: Date.now(),
        latestVersion: '1.0.2',
        notifiedVersion: '1.0.1',
      }
      writeUpdateCache(cache)
      const loaded = readUpdateCache()
      expect(loaded).not.toBeNull()
      expect(loaded!.notifiedVersion).toBe('1.0.1')
    })

    it('should return null when cache file is corrupt', () => {
      const cachePath = path.join(process.env['HOME']!, '.harness', 'cache', 'devkeel-update-check.json')
      fs.mkdirSync(path.dirname(cachePath), { recursive: true })
      fs.writeFileSync(cachePath, 'not valid json', 'utf-8')
      const result = readUpdateCache()
      expect(result).toBeNull()
    })

    it('should return null when lastCheck is not a number', () => {
      const cachePath = path.join(process.env['HOME']!, '.harness', 'cache', 'devkeel-update-check.json')
      fs.mkdirSync(path.dirname(cachePath), { recursive: true })
      fs.writeFileSync(cachePath, JSON.stringify({ lastCheck: 'abc', latestVersion: '1.0.0' }), 'utf-8')
      const result = readUpdateCache()
      expect(result).toBeNull()
    })

    it('should return null when latestVersion is not a string', () => {
      const cachePath = path.join(process.env['HOME']!, '.harness', 'cache', 'devkeel-update-check.json')
      fs.mkdirSync(path.dirname(cachePath), { recursive: true })
      fs.writeFileSync(cachePath, JSON.stringify({ lastCheck: Date.now(), latestVersion: 123 }), 'utf-8')
      const result = readUpdateCache()
      expect(result).toBeNull()
    })

    it('should return null when cache file is empty', () => {
      const cachePath = path.join(process.env['HOME']!, '.harness', 'cache', 'devkeel-update-check.json')
      fs.mkdirSync(path.dirname(cachePath), { recursive: true })
      fs.writeFileSync(cachePath, '', 'utf-8')
      const result = readUpdateCache()
      expect(result).toBeNull()
    })
  })

  describe('isCacheExpired', () => {
    it('should return false when cache is less than 3 days old', () => {
      const cache = { lastCheck: Date.now() - 1000, latestVersion: '1.0.2' }
      expect(isCacheExpired(cache)).toBe(false)
    })

    it('should return true when cache is more than 3 days old', () => {
      const cache = { lastCheck: Date.now() - 4 * 24 * 60 * 60 * 1000, latestVersion: '1.0.2' }
      expect(isCacheExpired(cache)).toBe(true)
    })

    it('should return false for exactly 0ms age', () => {
      const cache = { lastCheck: Date.now(), latestVersion: '1.0.2' }
      expect(isCacheExpired(cache)).toBe(false)
    })
  })

  describe('compareVersions', () => {
    it('should return false when versions are the same', () => {
      expect(compareVersions('1.0.0', '1.0.0')).toBe(false)
    })

    it('should return true when versions are different', () => {
      expect(compareVersions('1.0.0', '1.0.1')).toBe(true)
    })

    it('should return true when current is empty', () => {
      expect(compareVersions('', '1.0.0')).toBe(true)
    })
  })

  describe('formatUpdatePrompt', () => {
    it('should contain both version strings', () => {
      const result = formatUpdatePrompt('1.0.0', '1.0.1')
      expect(result).toContain('1.0.0')
      expect(result).toContain('1.0.1')
    })

    it('should contain the update command hint', () => {
      const result = formatUpdatePrompt('1.0.0', '1.0.1')
      expect(result).toContain('devkeel update')
    })

    it('should contain the new version notice text', () => {
      const result = formatUpdatePrompt('1.0.0', '1.0.1')
      expect(result).toContain('DevKeel 有新版本可用')
    })
  })

  describe('shouldOpenBrowser', () => {
    it('should return true when cache is null', () => {
      expect(shouldOpenBrowser(null, '1.0.2')).toBe(true)
    })

    it('should return false when notifiedVersion matches latestVersion', () => {
      const cache = { lastCheck: Date.now(), latestVersion: '1.0.2', notifiedVersion: '1.0.2' }
      expect(shouldOpenBrowser(cache, '1.0.2')).toBe(false)
    })

    it('should return true when notifiedVersion differs from latestVersion', () => {
      const cache = { lastCheck: Date.now(), latestVersion: '1.0.2', notifiedVersion: '1.0.1' }
      expect(shouldOpenBrowser(cache, '1.0.2')).toBe(true)
    })

    it('should return true when notifiedVersion is undefined', () => {
      const cache = { lastCheck: Date.now(), latestVersion: '1.0.2' }
      expect(shouldOpenBrowser(cache, '1.0.2')).toBe(true)
    })
  })

  describe('checkAndNotify', () => {
    let originalCwd: string
    let originalEnvHome: string | undefined
    let fakeHome: string
    let tmpDir: string

    beforeEach(() => {
      originalCwd = process.cwd()
      originalEnvHome = process.env['HOME']
      tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'harness-update-notifier-'))
      fakeHome = fs.mkdtempSync(path.join(os.tmpdir(), 'harness-notifier-home-'))
      process.env['HOME'] = fakeHome
    })

    afterEach(() => {
      process.chdir(originalCwd)
      fs.rmSync(tmpDir, { recursive: true, force: true })
      fs.rmSync(fakeHome, { recursive: true, force: true })
      if (originalEnvHome === undefined) {
        delete process.env['HOME']
      } else {
        process.env['HOME'] = originalEnvHome
      }
    })

    it('should return null when project is not initialized', async () => {
      process.chdir(tmpDir)
      const { checkAndNotify } = await import('../src/lib/update-notifier.js')
      const result = await checkAndNotify()
      expect(result).toBeNull()
    })

    it('should return prompt string when cache has newer version', async () => {
      process.chdir(originalCwd)
      const cachePath = path.join(fakeHome, '.harness', 'cache', 'devkeel-update-check.json')
      fs.mkdirSync(path.dirname(cachePath), { recursive: true })
      fs.writeFileSync(cachePath, JSON.stringify({
        lastCheck: Date.now(),
        latestVersion: '99.99.99',
      }), 'utf-8')
      const { checkAndNotify } = await import('../src/lib/update-notifier.js')
      const result = await checkAndNotify()
      expect(result).not.toBeNull()
      expect(result).toContain('99.99.99')
      expect(result).toContain('devkeel update')
    })

    it('should return null when cache version matches current', async () => {
      process.chdir(originalCwd)
      const { readVersions } = await import('../src/lib/config.js')
      const versions = readVersions(originalCwd)
      if (!versions) return
      const cachePath = path.join(fakeHome, '.harness', 'cache', 'devkeel-update-check.json')
      fs.mkdirSync(path.dirname(cachePath), { recursive: true })
      fs.writeFileSync(cachePath, JSON.stringify({
        lastCheck: Date.now(),
        latestVersion: versions.harness,
      }), 'utf-8')
      const { checkAndNotify } = await import('../src/lib/update-notifier.js')
      const result = await checkAndNotify()
      expect(result).toBeNull()
    })
  })
})
