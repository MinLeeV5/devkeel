import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { create } from 'tar'
import { TemplatesFetchError, __test__ } from '../src/lib/templates-cache.js'

const { readMeta, writeMeta, extractTarball, SEMVER_RE, resolveRequestedTemplatesVersion, isUsableCacheDir } = __test__!

describe('templates-cache', () => {
  let tmpDir: string

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'harness-test-cache-'))
  })

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true })
  })

  describe('TemplatesFetchError', () => {
    it('should include original error in message', () => {
      const err = new TemplatesFetchError('npm command not found')
      expect(err.message).toContain('npm command not found')
      expect(err.message).toContain('devkeel-templates')
    })

    it('should include all diagnostic guidance items', () => {
      const err = new TemplatesFetchError('network error')
      expect(err.diagnostic).toContain('npm --version')
      expect(err.diagnostic).toContain('npm config get registry')
      expect(err.diagnostic).toContain('registry.npmjs.org')
      expect(err.diagnostic).toContain('curl -I')
      expect(err.diagnostic).toContain('模板包已发布')
    })

    it('should have name TemplatesFetchError', () => {
      const err = new TemplatesFetchError('test')
      expect(err.name).toBe('TemplatesFetchError')
      expect(err).toBeInstanceOf(Error)
    })

    it('should encode package name in curl URL', () => {
      const err = new TemplatesFetchError('test')
      expect(err.diagnostic).toContain('devkeel-templates')
    })
  })

  describe('SEMVER_RE', () => {
    it('should accept valid semver versions', () => {
      expect(SEMVER_RE.test('1.0.0')).toBe(true)
      expect(SEMVER_RE.test('0.6.1')).toBe(true)
      expect(SEMVER_RE.test('10.20.30')).toBe(true)
      expect(SEMVER_RE.test('1.0.0-alpha.1')).toBe(true)
      expect(SEMVER_RE.test('1.0.0-beta-build.1')).toBe(true)
      expect(SEMVER_RE.test('1.0.0+build.123')).toBe(true)
      expect(SEMVER_RE.test('1.0.0-beta+exp.sha.5114f85')).toBe(true)
    })

    it('should reject invalid version strings', () => {
      expect(SEMVER_RE.test('1.0')).toBe(false)
      expect(SEMVER_RE.test('1')).toBe(false)
      expect(SEMVER_RE.test('')).toBe(false)
      expect(SEMVER_RE.test('v1.0.0')).toBe(false)
      expect(SEMVER_RE.test('1.0.0; rm -rf /')).toBe(false)
      expect(SEMVER_RE.test('1.0.0"')).toBe(false)
      expect(SEMVER_RE.test('$(whoami)')).toBe(false)
      expect(SEMVER_RE.test('1.2.3beta')).toBe(false)
      expect(SEMVER_RE.test('1.2.3-')).toBe(false)
      expect(SEMVER_RE.test('1.2.3+')).toBe(false)
      expect(SEMVER_RE.test('1.2.3..beta')).toBe(false)
      expect(SEMVER_RE.test('1.2.3_beta')).toBe(false)
      expect(SEMVER_RE.test('01.2.3')).toBe(false)
      expect(SEMVER_RE.test('1.02.3')).toBe(false)
    })
  })

  describe('readMeta / writeMeta', () => {
    it('should return null when meta file does not exist', () => {
      const result = readMeta(tmpDir)
      expect(result).toBeNull()
    })

    it('should round-trip meta data correctly', () => {
      const meta = { version: '1.2.3', fetchedAt: '2026-06-15T10:00:00.000Z' }
      writeMeta(meta, tmpDir)

      const result = readMeta(tmpDir)
      expect(result).toEqual(meta)
    })

    it('should return null for corrupted meta file', () => {
      const metaPath = path.join(tmpDir, 'meta.json')
      fs.writeFileSync(metaPath, 'not valid json{{{', 'utf-8')

      const result = readMeta(tmpDir)
      expect(result).toBeNull()
    })

    it('should create cache directory if it does not exist', () => {
      const nested = path.join(tmpDir, 'deep', 'nested', 'dir')
      writeMeta({ version: '1.0.0', fetchedAt: '2026-06-15T00:00:00.000Z' }, nested)

      expect(fs.existsSync(path.join(nested, 'meta.json'))).toBe(true)
    })
  })

  describe('isUsableCacheDir', () => {
    it('should reject another package cached under the same version', () => {
      const cacheDir = path.join(tmpDir, 'wrong-package')
      fs.mkdirSync(cacheDir, { recursive: true })
      fs.writeFileSync(path.join(cacheDir, 'package.json'), JSON.stringify({ name: 'other-templates', version: '1.2.3' }))
      fs.writeFileSync(path.join(cacheDir, 'versions-yml.yml'), 'harness: "1.2.3"\n')

      expect(isUsableCacheDir(cacheDir, '1.2.3')).toBe(false)
    })

    it('should return true when cache directory contains matching package metadata and versions file', () => {
      const cacheDir = path.join(tmpDir, 'cache')
      fs.mkdirSync(cacheDir, { recursive: true })
      fs.writeFileSync(path.join(cacheDir, 'package.json'), JSON.stringify({ name: 'devkeel-templates', version: '1.2.3' }), 'utf-8')
      fs.writeFileSync(path.join(cacheDir, 'versions-yml.yml'), 'harness: "1.2.3"\n', 'utf-8')

      expect(isUsableCacheDir(cacheDir, '1.2.3')).toBe(true)
    })

    it('should return false when cache directory is missing package metadata', () => {
      const cacheDir = path.join(tmpDir, 'cache-missing-package')
      fs.mkdirSync(cacheDir, { recursive: true })
      fs.writeFileSync(path.join(cacheDir, 'versions-yml.yml'), 'harness: "1.2.3"\n', 'utf-8')

      expect(isUsableCacheDir(cacheDir, '1.2.3')).toBe(false)
    })

    it('should return false when package metadata version does not match requested version', () => {
      const cacheDir = path.join(tmpDir, 'cache-wrong-version')
      fs.mkdirSync(cacheDir, { recursive: true })
      fs.writeFileSync(path.join(cacheDir, 'package.json'), JSON.stringify({ name: 'devkeel-templates', version: '1.2.4' }), 'utf-8')
      fs.writeFileSync(path.join(cacheDir, 'versions-yml.yml'), 'harness: "1.2.4"\n', 'utf-8')

      expect(isUsableCacheDir(cacheDir, '1.2.3')).toBe(false)
    })

    it('should return false when cache directory is missing versions file', () => {
      const cacheDir = path.join(tmpDir, 'cache-missing-versions')
      fs.mkdirSync(cacheDir, { recursive: true })
      fs.writeFileSync(path.join(cacheDir, 'package.json'), JSON.stringify({ name: 'devkeel-templates', version: '1.2.3' }), 'utf-8')

      expect(isUsableCacheDir(cacheDir, '1.2.3')).toBe(false)
    })
  })

  describe('resolveRequestedTemplatesVersion', () => {
    it('should return explicit version without npm lookup', () => {
      const version = resolveRequestedTemplatesVersion(
        { version: '1.2.3-beta.1' },
        () => '9.9.9',
        () => '9.9.9-beta.1',
      )

      expect(version).toBe('1.2.3-beta.1')
    })

    it('should return latest stable version when no option is provided', () => {
      const version = resolveRequestedTemplatesVersion(
        {},
        () => '1.2.3',
        () => '9.9.9-beta.1',
      )

      expect(version).toBe('1.2.3')
    })

    it('should reject invalid latest stable version', () => {
      expect(() => resolveRequestedTemplatesVersion(
        {},
        () => '../1.2.3',
        () => '1.2.3-beta.1',
      )).toThrow(TemplatesFetchError)
    })

    it('should return the version assigned to the beta dist-tag', () => {
      const version = resolveRequestedTemplatesVersion(
        { beta: true },
        () => '1.2.3',
        () => '2.0.0',
      )

      expect(version).toBe('2.0.0')
    })

    it('should keep supporting beta prerelease versions assigned to the beta dist-tag', () => {
      const version = resolveRequestedTemplatesVersion(
        { beta: true },
        () => '1.2.3',
        () => '2.0.0-beta.1',
      )

      expect(version).toBe('2.0.0-beta.1')
    })

    it('should reject beta option with explicit version', () => {
      expect(() => resolveRequestedTemplatesVersion(
        { version: '1.2.3', beta: true },
        () => '1.2.3',
        () => '1.2.3-beta.1',
      )).toThrow(TemplatesFetchError)
    })

    it('should reject invalid explicit version', () => {
      expect(() => resolveRequestedTemplatesVersion(
        { version: '1.2.3; rm -rf /' },
        () => '1.2.3',
        () => '1.2.3-beta.1',
      )).toThrow(TemplatesFetchError)
    })

    it('should reject invalid versions returned by the beta dist-tag', () => {
      expect(() => resolveRequestedTemplatesVersion(
        { beta: true },
        () => '1.2.3',
        () => 'beta',
      )).toThrow(TemplatesFetchError)
    })
  })

  describe('extractTarball', () => {
    it('should extract tarball and strip package/ prefix', async () => {
      // 构造一个模拟的 npm tarball
      const sourceDir = path.join(tmpDir, 'source')
      const pkgDir = path.join(sourceDir, 'package')
      fs.mkdirSync(path.join(pkgDir, 'skills', 'test-skill'), { recursive: true })
      fs.mkdirSync(path.join(pkgDir, 'rules'), { recursive: true })
      fs.writeFileSync(path.join(pkgDir, 'skills', 'test-skill', 'SKILL.md'), '# Test Skill', 'utf-8')
      fs.writeFileSync(path.join(pkgDir, 'rules', 'test-rule.md'), '# Test Rule', 'utf-8')
      fs.writeFileSync(path.join(pkgDir, 'versions-yml.yml'), 'harness: "1.0.0"\n', 'utf-8')

      const tarballPath = path.join(tmpDir, 'test.tgz')
      await create(
        { gzip: true, file: tarballPath, cwd: sourceDir },
        ['package'],
      )

      // 解压到目标目录
      const targetDir = path.join(tmpDir, 'extracted')
      await extractTarball(tarballPath, targetDir)

      // 验证 strip: 1 生效，package/ 前缀被剥离
      expect(fs.existsSync(path.join(targetDir, 'skills', 'test-skill', 'SKILL.md'))).toBe(true)
      expect(fs.existsSync(path.join(targetDir, 'rules', 'test-rule.md'))).toBe(true)
      expect(fs.existsSync(path.join(targetDir, 'versions-yml.yml'))).toBe(true)

      // 验证内容正确
      expect(fs.readFileSync(path.join(targetDir, 'skills', 'test-skill', 'SKILL.md'), 'utf-8')).toBe('# Test Skill')
      expect(fs.readFileSync(path.join(targetDir, 'rules', 'test-rule.md'), 'utf-8')).toBe('# Test Rule')
    })

    it('should overwrite existing target directory', async () => {
      // 构造 tarball
      const sourceDir = path.join(tmpDir, 'source2')
      const pkgDir = path.join(sourceDir, 'package')
      fs.mkdirSync(path.join(pkgDir, 'skills'), { recursive: true })
      fs.writeFileSync(path.join(pkgDir, 'skills', 'new-skill.md'), 'new content', 'utf-8')

      const tarballPath = path.join(tmpDir, 'test2.tgz')
      await create(
        { gzip: true, file: tarballPath, cwd: sourceDir },
        ['package'],
      )

      // 预先存在的目标目录
      const targetDir = path.join(tmpDir, 'existing')
      fs.mkdirSync(path.join(targetDir, 'skills'), { recursive: true })
      fs.writeFileSync(path.join(targetDir, 'skills', 'old-file.md'), 'old content', 'utf-8')

      await extractTarball(tarballPath, targetDir)

      // 旧文件应被清除，新文件应存在
      expect(fs.existsSync(path.join(targetDir, 'skills', 'old-file.md'))).toBe(false)
      expect(fs.existsSync(path.join(targetDir, 'skills', 'new-skill.md'))).toBe(true)
      expect(fs.readFileSync(path.join(targetDir, 'skills', 'new-skill.md'), 'utf-8')).toBe('new content')
    })

    it('should clean up .tmp directory on success', async () => {
      const sourceDir = path.join(tmpDir, 'source3')
      const pkgDir = path.join(sourceDir, 'package')
      fs.mkdirSync(pkgDir, { recursive: true })
      fs.writeFileSync(path.join(pkgDir, 'file.txt'), 'data', 'utf-8')

      const tarballPath = path.join(tmpDir, 'test3.tgz')
      await create(
        { gzip: true, file: tarballPath, cwd: sourceDir },
        ['package'],
      )

      const targetDir = path.join(tmpDir, 'target3')
      await extractTarball(tarballPath, targetDir)

      // .tmp 目录应已清理
      expect(fs.existsSync(targetDir + '.tmp')).toBe(false)
      expect(fs.existsSync(targetDir)).toBe(true)
    })
  })
})
