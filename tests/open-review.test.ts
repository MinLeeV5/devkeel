import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { openReview, resolveReviewTarget } from '../src/lib/open-review.js'

describe('open-review', () => {
  let tmpDir: string

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'harness-open-review-'))
  })

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true })
  })

  describe('resolveReviewTarget', () => {
    it('should resolve html path to file URL', () => {
      const htmlPath = path.join(tmpDir, 'human review.html')
      fs.writeFileSync(htmlPath, '<!DOCTYPE html><html></html>', 'utf-8')

      const result = resolveReviewTarget(htmlPath)

      expect(result.ok).toBe(true)
      expect(result.path).toBe(htmlPath)
      expect(result.url).toContain('file://')
      expect(result.url).toContain('human%20review.html')
    })

    it('should return error when path is empty', () => {
      const result = resolveReviewTarget('   ')

      expect(result.ok).toBe(false)
      expect(result.error).toContain('请指定')
    })

    it('should return error when file does not exist', () => {
      const htmlPath = path.join(tmpDir, 'missing.html')
      const result = resolveReviewTarget(htmlPath)

      expect(result.ok).toBe(false)
      expect(result.path).toBe(htmlPath)
      expect(result.error).toContain('HTML 文件不存在')
    })

    it('should return error when path is a directory', () => {
      const result = resolveReviewTarget(tmpDir)

      expect(result.ok).toBe(false)
      expect(result.path).toBe(tmpDir)
      expect(result.error).toContain('路径不是文件')
    })
  })

  describe('openReview', () => {
    it('should open resolved file URL', async () => {
      const htmlPath = path.join(tmpDir, 'human-review.html')
      fs.writeFileSync(htmlPath, '<!DOCTYPE html><html></html>', 'utf-8')
      let commandSeen = ''
      let argsSeen: string[] = []

      const result = await openReview(htmlPath, {
        platform: 'linux',
        runner: async (command, args) => {
          commandSeen = command
          argsSeen = args
        },
      })

      expect(result.ok).toBe(true)
      expect(commandSeen).toBe('xdg-open')
      expect(argsSeen).toHaveLength(1)
      expect(argsSeen[0]).toContain('human-review.html')
    })

    it('should return error when open command fails', async () => {
      const htmlPath = path.join(tmpDir, 'human-review.html')
      fs.writeFileSync(htmlPath, '<!DOCTYPE html><html></html>', 'utf-8')

      const result = await openReview(htmlPath, {
        runner: async () => {
          throw new Error('xdg-open missing')
        },
      })

      expect(result.ok).toBe(false)
      expect(result.path).toBe(htmlPath)
      expect(result.error).toBe('xdg-open missing')
    })
  })
})
