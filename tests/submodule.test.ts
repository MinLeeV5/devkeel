import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { detectSubmodules } from '../src/commands/submodule.js'

describe('detectSubmodules', () => {
  let tmpDir: string

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'harness-submod-'))
  })

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true })
  })

  it('returns empty array when no .gitmodules', () => {
    expect(detectSubmodules(tmpDir)).toEqual([])
  })

  it('parses single submodule', () => {
    fs.writeFileSync(path.join(tmpDir, '.gitmodules'), [
      '[submodule "my-lib"]',
      '  path = libs/my-lib',
      '  url = https://github.com/org/my-lib.git',
      '  branch = main',
    ].join('\n'))

    const result = detectSubmodules(tmpDir)
    expect(result).toHaveLength(1)
    expect(result[0]).toEqual({
      name: 'my-lib',
      path: 'libs/my-lib',
      url: 'https://github.com/org/my-lib.git',
      branch: 'main',
    })
  })

  it('parses multiple submodules', () => {
    fs.writeFileSync(path.join(tmpDir, '.gitmodules'), [
      '[submodule "frontend"]',
      '  path = packages/frontend',
      '  url = git@github.com:org/frontend.git',
      '',
      '[submodule "backend"]',
      '  path = packages/backend',
      '  url = git@github.com:org/backend.git',
      '  branch = develop',
    ].join('\n'))

    const result = detectSubmodules(tmpDir)
    expect(result).toHaveLength(2)
    expect(result[0].name).toBe('frontend')
    expect(result[0].branch).toBeUndefined()
    expect(result[1].name).toBe('backend')
    expect(result[1].branch).toBe('develop')
  })

  it('handles empty .gitmodules', () => {
    fs.writeFileSync(path.join(tmpDir, '.gitmodules'), '')
    expect(detectSubmodules(tmpDir)).toEqual([])
  })
})
