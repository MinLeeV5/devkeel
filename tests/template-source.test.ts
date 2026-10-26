import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import {
  DEFAULT_TEMPLATE_PACKAGE,
  hasTemplateSourceChanged,
  readTemplateSource,
  readUserTemplateSource,
  resolveTemplateSource,
  templateRegistryArgs,
  templateSourceKey,
  writeTemplateSource,
} from '../src/lib/template-source.js'

describe('template-source', () => {
  let tmpDir: string
  let projectRoot: string
  let homeDir: string

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'harness-template-source-'))
    projectRoot = path.join(tmpDir, 'project')
    homeDir = path.join(tmpDir, 'home')
    fs.mkdirSync(projectRoot, { recursive: true })
    fs.mkdirSync(homeDir, { recursive: true })
  })

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true })
  })

  function writeProjectSource(source: Record<string, string>): void {
    const file = path.join(projectRoot, '.harness', 'template-source.json')
    fs.mkdirSync(path.dirname(file), { recursive: true })
    fs.writeFileSync(file, JSON.stringify(source), 'utf-8')
  }

  function writeUserSource(source: Record<string, string>): void {
    const file = path.join(homeDir, '.harness', 'template-source.json')
    fs.mkdirSync(path.dirname(file), { recursive: true })
    fs.writeFileSync(file, JSON.stringify(source), 'utf-8')
  }

  describe('readTemplateSource', () => {
    it('should return null when the project source file does not exist', () => {
      expect(readTemplateSource(projectRoot)).toBe(null)
    })

    it('should read partial source and normalize its registry', () => {
      writeProjectSource({ registry: 'https://registry.example.test///' })
      expect(readTemplateSource(projectRoot)).toEqual({ registry: 'https://registry.example.test/' })
    })

    it('should reject malformed saved source data', () => {
      writeProjectSource({ packageName: '../templates' })
      expect(() => readTemplateSource(projectRoot)).toThrow('template-source.json 无效')
    })

    it('should reject empty source and registry credentials', () => {
      writeProjectSource({})
      expect(() => readTemplateSource(projectRoot)).toThrow('template-source.json 无效')
      writeProjectSource({ registry: 'https://user:secret@registry.example.test/' })
      expect(() => readTemplateSource(projectRoot)).toThrow('template-source.json 无效')
    })
  })

  describe('readUserTemplateSource', () => {
    it('should return null when the user source file does not exist', () => {
      expect(readUserTemplateSource(homeDir)).toBe(null)
    })

    it('should read package-only or registry-only user configuration', () => {
      writeUserSource({ packageName: '@acme/templates' })
      expect(readUserTemplateSource(homeDir)).toEqual({ packageName: '@acme/templates' })
      writeUserSource({ registry: 'https://registry.example.test' })
      expect(readUserTemplateSource(homeDir)).toEqual({ registry: 'https://registry.example.test/' })
    })
  })

  describe('resolveTemplateSource', () => {
    it('should resolve each field in flag, project, user, and npm default order', () => {
      writeProjectSource({ packageName: '@project/templates' })
      writeUserSource({ packageName: '@user/templates', registry: 'https://user.example.test/' })

      expect(resolveTemplateSource(projectRoot, {}, homeDir)).toEqual({
        packageName: '@project/templates', registry: 'https://user.example.test/',
        configuredRegistry: 'https://user.example.test/',
        projectConfig: { packageName: '@project/templates' },
      })
      expect(resolveTemplateSource(projectRoot, { templatePackage: '@flag/templates' }, homeDir)).toEqual({
        packageName: '@flag/templates', registry: 'https://user.example.test/',
        configuredRegistry: 'https://user.example.test/',
        projectConfig: { packageName: '@flag/templates' },
      })
      expect(resolveTemplateSource(projectRoot, { templateRegistry: 'https://flag.example.test' }, homeDir)).toEqual({
        packageName: '@project/templates', registry: 'https://flag.example.test/',
        configuredRegistry: 'https://flag.example.test/',
        projectConfig: { packageName: '@project/templates', registry: 'https://flag.example.test/' },
      })
    })

    it('should keep inherited user values out of projectConfig and use npm defaults when absent', () => {
      writeUserSource({ packageName: 'user-templates' })
      const npm = path.join(tmpDir, process.platform === 'win32' ? 'npm.cmd' : 'npm')
      const script = process.platform === 'win32'
        ? `@echo https://registry.example.test/\r\n`
        : '#!/bin/sh\nprintf "%s\\n" "https://registry.example.test/"\n'
      fs.writeFileSync(npm, script, 'utf-8')
      if (process.platform !== 'win32') fs.chmodSync(npm, 0o755)
      const previousPath = process.env['PATH']
      process.env['PATH'] = `${tmpDir}${path.delimiter}${previousPath ?? ''}`
      try {
        expect(resolveTemplateSource(projectRoot, {}, homeDir)).toEqual({
          packageName: 'user-templates', registry: 'https://registry.example.test/',
        })
      } finally {
        process.env['PATH'] = previousPath
      }
    })

    it('should use npm scoped registry configuration for a scoped package', () => {
      const npm = path.join(tmpDir, process.platform === 'win32' ? 'npm.cmd' : 'npm')
      const script = process.platform === 'win32'
        ? '@if "%~3"=="@acme:registry" (echo https://scoped.example.test/) else (echo https://general.example.test/)\r\n'
        : '#!/bin/sh\nif [ "$3" = "@acme:registry" ]; then printf "%s\\n" "https://scoped.example.test/"; else printf "%s\\n" "https://general.example.test/"; fi\n'
      fs.writeFileSync(npm, script, 'utf-8')
      if (process.platform !== 'win32') fs.chmodSync(npm, 0o755)
      const previousPath = process.env['PATH']
      process.env['PATH'] = `${tmpDir}${path.delimiter}${previousPath ?? ''}`
      try {
        expect(resolveTemplateSource(projectRoot, { templatePackage: '@acme/templates' }, homeDir)).toEqual({
          packageName: '@acme/templates', registry: 'https://scoped.example.test/',
          projectConfig: { packageName: '@acme/templates' },
        })
      } finally {
        process.env['PATH'] = previousPath
      }
    })

    it('should reject invalid explicit package names and registries', () => {
      expect(() => resolveTemplateSource(projectRoot, { templatePackage: '../templates' }, homeDir)).toThrow('模板包名')
      expect(() => resolveTemplateSource(projectRoot, { templateRegistry: 'https://u:p@registry.example.test' }, homeDir)).toThrow('模板 registry')
      expect(() => resolveTemplateSource(projectRoot, { templateRegistry: 'file:///tmp/registry' }, homeDir)).toThrow('模板 registry')
    })
  })

  describe('writeTemplateSource', () => {
    it('should persist only explicit project configuration and no-op without it', () => {
      const inherited = { packageName: 'user-templates', registry: 'https://npm.example.test/' }
      writeTemplateSource(projectRoot, inherited)
      expect(readTemplateSource(projectRoot)).toBe(null)

      writeTemplateSource(projectRoot, { ...inherited, projectConfig: { packageName: '@acme/templates' } })
      expect(readTemplateSource(projectRoot)).toEqual({ packageName: '@acme/templates' })
    })
  })

  describe('templateSourceKey and change detection', () => {
    it('should fingerprint package and normalized registry identity', () => {
      const source = { packageName: DEFAULT_TEMPLATE_PACKAGE, registry: 'https://registry.example.test/' }
      expect(templateSourceKey(source)).toMatch(/^[a-f0-9]{64}$/)
      expect(templateSourceKey(source)).toBe(templateSourceKey({ ...source }))
      expect(templateSourceKey(source)).not.toBe(templateSourceKey({ ...source, registry: 'https://other.example.test/' }))
      expect(templateSourceKey(source)).not.toBe(templateSourceKey({ ...source, packageName: '@acme/templates' }))
    })

    it('should recheck legacy defaults only for a configured registry or changed source fingerprint', () => {
      const source = { packageName: DEFAULT_TEMPLATE_PACKAGE, registry: 'https://registry.example.test/' }
      expect(hasTemplateSourceChanged(undefined, source)).toBe(false)
      expect(hasTemplateSourceChanged(undefined, { ...source, configuredRegistry: source.registry })).toBe(true)
      expect(hasTemplateSourceChanged(templateSourceKey(source), source)).toBe(false)
      expect(hasTemplateSourceChanged('old-key', source)).toBe(true)
    })
  })

  describe('templateRegistryArgs', () => {
    it('should include general and scoped registry arguments for scoped packages', () => {
      expect(templateRegistryArgs({ packageName: '@acme/templates', registry: 'https://registry.example.test/' })).toEqual([
        '--registry=https://registry.example.test/',
        '--@acme:registry=https://registry.example.test/',
      ])
    })
  })
})
