import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { readVersions, writeVersions, getBuiltinVersions, computeOutdatedCategories, filterManagedVersions } from '../src/lib/versions.js'
import templatesPackageJson from '../templates/package.json'

describe('versions', () => {
  let tmpDir: string

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'harness-test-'))
  })

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true })
  })

  describe('repository profiles', () => {
    it('keeps only the harness core version for domain repositories', () => {
      const builtin = getBuiltinVersions()
      const domain = filterManagedVersions(builtin, 'domain')
      const main = filterManagedVersions(builtin, 'main')

      expect(domain).toEqual({
        harness: builtin.harness,
        skills: {},
        agents: {},
        rules: {},
        schemas: {},
      })
      expect(main).toEqual(builtin)
      expect(main).not.toBe(builtin)
    })
  })

  describe('versions', () => {
    it('should round-trip versions through YAML', () => {
      const versions = getBuiltinVersions()
      writeVersions(tmpDir, versions)
      const loaded = readVersions(tmpDir)

      expect(loaded).not.toBeNull()
      expect(loaded!.harness).toBe(versions.harness)
      expect(loaded!.skills['commit']).toBe(versions.skills['commit'])
    })

    it('should write versions with quoted string values', () => {
      const versions = getBuiltinVersions()
      writeVersions(tmpDir, versions)
      const versionsPath = path.join(tmpDir, '.harness', 'versions.yml')
      const content = fs.readFileSync(versionsPath, 'utf-8')

      expect(content).toContain(`harness: "${versions.harness}"`)
      for (const [name, value] of Object.entries(versions.skills)) {
        expect(content).toContain(`  ${name}: "${value}"`)
      }
      for (const [name, value] of Object.entries(versions.agents)) {
        expect(content).toContain(`  ${name}: "${value}"`)
      }
      for (const [name, value] of Object.entries(versions.rules)) {
        expect(content).toContain(`  ${name}: "${value}"`)
      }
      for (const [name, value] of Object.entries(versions.schemas)) {
        expect(content).toContain(`  ${name}: "${value}"`)
      }
    })

    it('should return null when versions.yml does not exist', () => {
      expect(readVersions(tmpDir)).toBeNull()
    })

    it('should have all expected builtin versions', () => {
      const versions = getBuiltinVersions()
      expect(versions.harness).toBe(templatesPackageJson.version)
      expect(Object.keys(versions.skills).length).toBeGreaterThanOrEqual(12)
      expect(versions.schemas['full']).toBe('24')
      expect(versions.schemas['lite']).toBe('7')
      expect(versions.schemas['superpowers-lite']).toBeUndefined()
      expect(versions.skills['systematic-debugging']).toBe('1.0.1')
      expect(versions.skills['automated-instrumented-debugging']).toBeUndefined()
      expect(versions.skills['brainstorming']).toBe('8.0.3')
      expect(versions.skills['workflow-routing']).toBe('1.0.2')
      expect(versions.skills['grilling']).toBeUndefined()
      expect(versions.skills['requirement-analysis']).toBe('3.0.1')
      expect(versions.skills['technical-design']).toBe('3.0.1')
      expect(versions.skills['human-review']).toBe('1.0.1')
      for (const retired of [
        'writing-plans',
        'executing-plans',
        'subagent-driven-development',
        'requesting-code-review',
        'verification-before-completion',
        'finishing-a-development-branch',
        'test-driven-development',
        'using-git-worktrees',
        'architecture-diagram',
      ]) {
        expect(versions.skills[retired]).toBeUndefined()
      }
      expect(versions.skills['openspec-new-change']).toBe('2.2')
      expect(versions.skills['openspec-propose']).toBeUndefined()
      expect(versions.skills['openspec-ff-change']).toBe('2.0')
      expect(versions.skills['openspec-explore']).toBeUndefined()
      expect(versions.skills['openspec-onboard']).toBe('2.2')
      expect(versions.skills['openspec-continue-change']).toBe('2.1')
      expect(versions.skills['openspec-update-change']).toBe('2.0')
      expect(versions.skills['openspec-apply-change']).toBe('3.1')
      expect(versions.skills['openspec-archive-change']).toBe('3.2')
      expect(versions.skills['openspec-bulk-archive-change']).toBe('2.1')
      expect(versions.skills['openspec-sync-specs']).toBe('2.1')
      expect(versions.skills['openspec-verify-change']).toBe('3.2')
      expect(versions.skills['receiving-code-review']).toBeUndefined()
    })
  })

  describe('computeOutdatedCategories', () => {
    it('should mark all categories as outdated when current is null', () => {
      const builtin = getBuiltinVersions()
      const result = computeOutdatedCategories(null, builtin)

      expect(result.skills.size).toBe(Object.keys(builtin.skills).length)
      expect(result.agents).toBe(true)
      expect(result.rules).toBe(true)
      expect(result.schemas.size).toBe(Object.keys(builtin.schemas).length)
    })

    it('should return empty sets when versions match', () => {
      const builtin = getBuiltinVersions()
      const result = computeOutdatedCategories(builtin, builtin)

      expect(result.skills.size).toBe(0)
      expect(result.agents).toBe(false)
      expect(result.rules).toBe(false)
      expect(result.schemas.size).toBe(0)
    })

    it('should detect outdated skills individually', () => {
      const builtin = getBuiltinVersions()
      const current = { ...builtin, skills: { ...builtin.skills, commit: '0.9.0' } }
      const result = computeOutdatedCategories(current, builtin)

      expect(result.skills.has('commit')).toBe(true)
      expect(result.skills.size).toBe(1)
    })

    it('should detect new skills as outdated', () => {
      const builtin = getBuiltinVersions()
      const current = { ...builtin, skills: {} }
      const result = computeOutdatedCategories(current, builtin)

      expect(result.skills.size).toBe(Object.keys(builtin.skills).length)
    })

    it('should detect outdated schemas', () => {
      const builtin = getBuiltinVersions()
      const current = { ...builtin, schemas: { 'full': '1' } }
      const result = computeOutdatedCategories(current, builtin)

      expect(result.schemas.has('full')).toBe(true)
    })
  })
})
