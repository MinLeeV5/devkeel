import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import {
  applyLegacyPlatformIgnorePlan,
  ensureGitignoreEntry,
  planLegacyPlatformIgnores,
  removeLegacyPlatformIgnores,
} from '../src/lib/gitignore.js'

describe('gitignore', () => {
  let tmpDir: string

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'harness-test-'))
  })

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true })
  })

  it('should create .gitignore if not exists', () => {
    const changed = ensureGitignoreEntry(tmpDir, 'openspec/')
    expect(changed).toBe(true)
    const content = fs.readFileSync(path.join(tmpDir, '.gitignore'), 'utf-8')
    expect(content).toContain('openspec/')
    expect(content).toContain('# harness runtime')
  })

  it('should append to existing .gitignore', () => {
    fs.writeFileSync(path.join(tmpDir, '.gitignore'), 'node_modules/\n')
    const changed = ensureGitignoreEntry(tmpDir, 'openspec/')
    expect(changed).toBe(true)
    const content = fs.readFileSync(path.join(tmpDir, '.gitignore'), 'utf-8')
    expect(content).toContain('node_modules/')
    expect(content).toContain('openspec/')
  })

  it('should not duplicate existing entry', () => {
    fs.writeFileSync(path.join(tmpDir, '.gitignore'), 'openspec/\n')
    const changed = ensureGitignoreEntry(tmpDir, 'openspec/')
    expect(changed).toBe(false)
  })

  it('should detect entry without trailing slash', () => {
    fs.writeFileSync(path.join(tmpDir, '.gitignore'), 'openspec\n')
    const changed = ensureGitignoreEntry(tmpDir, 'openspec/')
    expect(changed).toBe(false)
  })

  it('should insert after existing harness section header', () => {
    fs.writeFileSync(path.join(tmpDir, '.gitignore'), 'node_modules/\n\n# harness runtime\n.harness/current.yml\n')
    ensureGitignoreEntry(tmpDir, 'openspec/')
    const content = fs.readFileSync(path.join(tmpDir, '.gitignore'), 'utf-8')
    const lines = content.split('\n')
    const headerIdx = lines.indexOf('# harness runtime')
    expect(lines[headerIdx + 1]).toBe('openspec/')
  })

  describe('removeLegacyPlatformIgnores', () => {
    it('should plan cleanup without writing and reject a stale plan', () => {
      const gitignorePath = path.join(tmpDir, '.gitignore')
      fs.writeFileSync(gitignorePath, '.claude/\nnode_modules/\n')

      const plan = planLegacyPlatformIgnores(tmpDir)

      expect(plan).toMatchObject({
        hasChanges: true,
        removedEntries: ['.claude/'],
        updatedContent: 'node_modules/\n',
      })
      expect(fs.readFileSync(gitignorePath, 'utf-8')).toBe(plan.originalContent)

      fs.writeFileSync(gitignorePath, `${plan.originalContent}dist/\n`)
      expect(() => applyLegacyPlatformIgnorePlan(tmpDir, plan)).toThrow('规划后发生变化')
      expect(fs.readFileSync(gitignorePath, 'utf-8')).toContain('dist/')
    })

    it('should remove legacy platform entries and preserve Superpowers entries', () => {
      fs.writeFileSync(
        path.join(tmpDir, '.gitignore'),
        'node_modules/\n.claude/\n.cursor/\n.agents/\n# superpowers SDD scratch (task brief / review package / progress ledger)\n.superpowers/\ndist/\n',
      )
      const removed = removeLegacyPlatformIgnores(tmpDir)
      expect(removed).toEqual(['.claude/', '.cursor/', '.agents/'])
      const content = fs.readFileSync(path.join(tmpDir, '.gitignore'), 'utf-8')
      expect(content).not.toContain('.claude/')
      expect(content).not.toContain('.cursor/')
      expect(content).not.toContain('.agents/')
      expect(content).toContain('.superpowers/')
      expect(content).toContain('superpowers SDD scratch')
      expect(content).toContain('node_modules/')
      expect(content).toContain('dist/')
    })

    it('should handle entries without trailing slash', () => {
      fs.writeFileSync(path.join(tmpDir, '.gitignore'), '.claude\n.agents\n.superpowers\nnode_modules/\n')
      const removed = removeLegacyPlatformIgnores(tmpDir)
      expect(removed).toEqual(['.claude', '.agents'])
      const content = fs.readFileSync(path.join(tmpDir, '.gitignore'), 'utf-8')
      expect(content).toContain('.superpowers\n')
    })

    it('should return empty array when no legacy entries exist', () => {
      fs.writeFileSync(path.join(tmpDir, '.gitignore'), 'node_modules/\ndist/\n')
      const removed = removeLegacyPlatformIgnores(tmpDir)
      expect(removed).toEqual([])
    })

    it('should return empty array when .gitignore does not exist', () => {
      const removed = removeLegacyPlatformIgnores(tmpDir)
      expect(removed).toEqual([])
    })
  })
})
