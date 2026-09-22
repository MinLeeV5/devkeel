import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { execFileSync } from 'node:child_process'
import { detectEnvironment, countDirectoryItems, detectIsSubmodule } from '../src/lib/detect.js'

describe('detect', () => {
  let tmpDir: string

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'harness-detect-'))
  })

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true })
  })

  it('should detect non-git directory', () => {
    const result = detectEnvironment(tmpDir)
    expect(result.isGitRepo).toBe(false)
    expect(result.hasHarness).toBe(false)
  })

  it('should detect git repo', () => {
    fs.mkdirSync(path.join(tmpDir, '.git'))
    const result = detectEnvironment(tmpDir)
    expect(result.isGitRepo).toBe(true)
  })

  it('should detect existing harness', () => {
    fs.mkdirSync(path.join(tmpDir, '.harness'))
    const result = detectEnvironment(tmpDir)
    expect(result.hasHarness).toBe(true)
  })

  it('should detect project name from package.json', () => {
    fs.writeFileSync(path.join(tmpDir, 'package.json'), JSON.stringify({ name: 'my-proj' }))
    const result = detectEnvironment(tmpDir)
    expect(result.projectName).toBe('my-proj')
  })

  it('should fallback to directory name', () => {
    const result = detectEnvironment(tmpDir)
    expect(result.projectName).toBe(path.basename(tmpDir))
  })

  it('should detect existing CLAUDE.md', () => {
    fs.writeFileSync(path.join(tmpDir, 'CLAUDE.md'), '# test')
    const result = detectEnvironment(tmpDir)
    expect(result.existingAssets.some(a => a.path === 'CLAUDE.md')).toBe(true)
  })

  it('should not crash when .agents/rules is a file (broken symlink on Windows)', () => {
    fs.mkdirSync(path.join(tmpDir, '.agents'))
    fs.writeFileSync(path.join(tmpDir, '.agents', 'rules'), '../../.harness/rules')
    const result = detectEnvironment(tmpDir)
    expect(result.existingAssets.some(a => a.path === '.agents/rules/')).toBe(false)
  })

  it('should not crash when .agents/skills is a file (broken symlink on Windows)', () => {
    fs.mkdirSync(path.join(tmpDir, '.agents'))
    fs.writeFileSync(path.join(tmpDir, '.agents', 'skills'), '../../.harness/skills')
    const result = detectEnvironment(tmpDir)
    expect(result.existingAssets.some(a => a.path === '.agents/skills/')).toBe(false)
  })
})

describe('countDirectoryItems', () => {
  let tmpDir: string

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'harness-count-'))
  })

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true })
  })

  it('should return 0 for non-existent path', () => {
    expect(countDirectoryItems(path.join(tmpDir, 'nope'))).toBe(0)
  })

  it('should return 0 when path is a file (broken symlink on Windows)', () => {
    const filePath = path.join(tmpDir, 'not-a-dir')
    fs.writeFileSync(filePath, '../../.harness/rules')
    expect(countDirectoryItems(filePath)).toBe(0)
  })

  it('should count items in a real directory', () => {
    const dir = path.join(tmpDir, 'real')
    fs.mkdirSync(dir)
    fs.writeFileSync(path.join(dir, 'a.md'), '')
    fs.writeFileSync(path.join(dir, 'b.ts'), '')
    expect(countDirectoryItems(dir)).toBe(2)
    expect(countDirectoryItems(dir, '.md')).toBe(1)
  })
})

describe('detectIsSubmodule', () => {
  let tmpDir: string

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'harness-submod-'))
  })

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true })
  })

  it('should return false for non-git directory', () => {
    expect(detectIsSubmodule(tmpDir)).toBe(false)
  })

  it('should return false for a normal git repo that is not a submodule', () => {
    expect(detectIsSubmodule(process.cwd())).toBe(false)
  })

  it('should detect a real local git submodule', () => {
    const source = path.join(tmpDir, 'source')
    const parent = path.join(tmpDir, 'parent')
    fs.mkdirSync(source)
    fs.mkdirSync(parent)
    execFileSync('git', ['init'], { cwd: source, stdio: 'ignore' })
    execFileSync('git', ['config', 'user.email', 'harness-test@example.com'], {
      cwd: source,
    })
    execFileSync('git', ['config', 'user.name', 'DevKeel Test'], { cwd: source })
    fs.writeFileSync(path.join(source, 'README.md'), '# domain\n', 'utf-8')
    execFileSync('git', ['add', 'README.md'], { cwd: source })
    execFileSync('git', ['commit', '-m', 'init'], { cwd: source, stdio: 'ignore' })
    execFileSync('git', ['init'], { cwd: parent, stdio: 'ignore' })
    execFileSync(
      'git',
      ['-c', 'protocol.file.allow=always', 'submodule', 'add', source, 'domain'],
      { cwd: parent, stdio: 'ignore' },
    )

    expect(detectIsSubmodule(path.join(parent, 'domain'))).toBe(true)
  })
})
