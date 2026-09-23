import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { createPlatformLinks, detectExistingPlatformTargets, detectExistingPlatformDirs } from '../src/lib/templates.js'

describe('sync', () => {
  let tmpDir: string

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'harness-sync-'))
    fs.mkdirSync(path.join(tmpDir, '.harness', 'skills'), { recursive: true })
    fs.mkdirSync(path.join(tmpDir, '.harness', 'rules'), { recursive: true })
    fs.mkdirSync(path.join(tmpDir, '.harness', 'agents'), { recursive: true })
  })

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true })
  })

  describe('detectExistingPlatformTargets', () => {
    it('should detect claude-code when .claude exists', () => {
      fs.mkdirSync(path.join(tmpDir, '.claude'), { recursive: true })
      const result = detectExistingPlatformTargets(tmpDir)
      expect(result).toContain('claude-code')
    })

    it('should detect opencode when .opencode exists', () => {
      fs.mkdirSync(path.join(tmpDir, '.opencode'), { recursive: true })
      const result = detectExistingPlatformTargets(tmpDir)
      expect(result).toContain('opencode')
    })

    it('should return empty array when no platforms exist', () => {
      const result = detectExistingPlatformTargets(tmpDir)
      expect(result).toEqual([])
    })

    it('should detect multiple platforms', () => {
      fs.mkdirSync(path.join(tmpDir, '.claude'), { recursive: true })
      fs.mkdirSync(path.join(tmpDir, '.cursor'), { recursive: true })
      fs.mkdirSync(path.join(tmpDir, '.agents'), { recursive: true })
      const result = detectExistingPlatformTargets(tmpDir)
      expect(result).toContain('claude-code')
      expect(result).toContain('cursor')
      expect(result).toContain('codex')
    })

    it('should detect Codex settings before skill links have been created', () => {
      fs.mkdirSync(path.join(tmpDir, '.codex'))
      expect(detectExistingPlatformTargets(tmpDir)).toEqual(['codex'])
      fs.mkdirSync(path.join(tmpDir, '.agents'))
      expect(detectExistingPlatformTargets(tmpDir)).toEqual(['codex'])
    })

    it('should detect file-based platform entries and retain broken links for diagnostics', () => {
      fs.mkdirSync(path.join(tmpDir, '.github'))
      fs.writeFileSync(path.join(tmpDir, '.github', 'copilot-instructions.md'), '@AGENTS.md\n')
      fs.writeFileSync(path.join(tmpDir, 'GEMINI.md'), '@AGENTS.md\n')
      fs.symlinkSync('missing-platform', path.join(tmpDir, '.claude'))
      expect(detectExistingPlatformTargets(tmpDir)).toEqual(['claude-code', 'copilot', 'gemini'])
    })

    it('should ignore a non-directory parent of an unrelated platform entry', () => {
      fs.writeFileSync(path.join(tmpDir, '.github'), 'not a platform directory')
      fs.mkdirSync(path.join(tmpDir, '.agents'))
      expect(detectExistingPlatformTargets(tmpDir)).toEqual(['codex'])
    })
  })

  describe('createPlatformLinks', () => {
    it('should create .claude symlinks for claude-code target', () => {
      const created = createPlatformLinks(tmpDir, ['claude-code'])
      expect(created).toContain('.claude/')
      expect(fs.existsSync(path.join(tmpDir, '.claude', 'skills'))).toBe(true)
      expect(fs.existsSync(path.join(tmpDir, '.claude', 'rules'))).toBe(true)
      expect(fs.existsSync(path.join(tmpDir, '.claude', 'agents'))).toBe(true)
    })

    it('should create .opencode symlinks for opencode target', () => {
      const created = createPlatformLinks(tmpDir, ['opencode'])
      expect(created).toContain('.opencode/')
      expect(fs.existsSync(path.join(tmpDir, '.opencode', 'skills'))).toBe(true)
      expect(fs.existsSync(path.join(tmpDir, '.opencode', 'rules'))).toBe(true)
    })

    it('should create .cursor symlinks for cursor target', () => {
      const created = createPlatformLinks(tmpDir, ['cursor'])
      expect(created).toContain('.cursor/')
      expect(fs.existsSync(path.join(tmpDir, '.cursor', 'rules'))).toBe(true)
    })

    it('should create copilot-instructions.md for copilot target', () => {
      const created = createPlatformLinks(tmpDir, ['copilot'])
      expect(created).toContain('.github/')
      expect(fs.existsSync(path.join(tmpDir, '.github', 'copilot-instructions.md'))).toBe(true)
    })

    it('should create multiple platform links', () => {
      const created = createPlatformLinks(tmpDir, ['claude-code', 'opencode', 'cursor'])
      expect(created).toHaveLength(3)
    })

    it('should be idempotent when run twice', () => {
      createPlatformLinks(tmpDir, ['claude-code'])
      const created = createPlatformLinks(tmpDir, ['claude-code'])
      expect(created).toContain('.claude/')
      expect(fs.existsSync(path.join(tmpDir, '.claude', 'skills'))).toBe(true)
    })
  })

  describe('detectExistingPlatformDirs', () => {
    it('should return paths for existing platform dirs', () => {
      fs.mkdirSync(path.join(tmpDir, '.claude'), { recursive: true })
      const result = detectExistingPlatformDirs(tmpDir, ['claude-code'])
      expect(result).toHaveLength(1)
      expect(result[0]).toBe(path.join(tmpDir, '.claude'))
    })

    it('should return empty when dirs do not exist', () => {
      const result = detectExistingPlatformDirs(tmpDir, ['claude-code'])
      expect(result).toEqual([])
    })
  })

})
