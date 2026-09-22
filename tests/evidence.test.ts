import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { execFileSync } from 'node:child_process'
import { collectEvidence, writeBaseSnapshot } from '../src/lib/evidence.js'

function git(cwd: string, args: string[]): string {
  return execFileSync('git', args, { cwd, encoding: 'utf-8' }).trim()
}

function commitAll(cwd: string, message: string): void {
  git(cwd, ['add', '.'])
  git(cwd, ['commit', '-q', '-m', message])
}

describe('evidence', () => {
  let tmpDir: string

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'harness-evidence-'))
  })

  afterEach(() => {
    removeTempDir(tmpDir)
  })

  it('should write base snapshot with main and submodule heads', () => {
    const projectRoot = setupProjectWithNestedSubmodule(tmpDir)

    const snapshot = writeBaseSnapshot(projectRoot, 'demo')

    const baseFile = path.join(projectRoot, 'openspec', 'changes', 'demo', '.base-sha')
    const lines = fs.readFileSync(baseFile, 'utf-8').trim().split('\n')
    expect(lines).toEqual([
      snapshot.mainSha,
      `${snapshot.submodules[0]!.sha} modules/sub`,
    ])
  })

  it('should count submodule-only commits as implementation evidence', () => {
    const projectRoot = setupProjectWithNestedSubmodule(tmpDir)
    writeBaseSnapshot(projectRoot, 'demo')

    fs.appendFileSync(path.join(projectRoot, 'modules', 'sub', 'file.txt'), 'two\n')
    commitAll(path.join(projectRoot, 'modules', 'sub'), 'submodule only change')
    fs.writeFileSync(path.join(projectRoot, 'openspec', 'changes', 'demo', 'tasks.md'), '- [x] implement evidence command\n')

    const evidence = collectEvidence(projectRoot, 'demo')

    expect(evidence.main.count).toBe(0)
    expect(evidence.submodules[0]!.count).toBe(1)
    expect(evidence.commitCount).toBe(1)
    expect(evidence.completedTasks).toBe(1)
  })

  it('should treat staged, unstaged, and untracked files as worktree implementation evidence', () => {
    const projectRoot = setupProjectWithRemoteMain(tmpDir)
    writeBaseSnapshot(projectRoot, 'demo')
    fs.appendFileSync(path.join(projectRoot, 'README.md'), 'unstaged change\n')
    fs.writeFileSync(path.join(projectRoot, 'staged.txt'), 'staged change\n')
    git(projectRoot, ['add', 'staged.txt'])
    fs.writeFileSync(path.join(projectRoot, 'untracked.txt'), 'untracked change\n')

    const evidence = collectEvidence(projectRoot, 'demo')

    expect(evidence.commitCount).toBe(0)
    expect(evidence.workingTreeChangeCount).toBe(3)
    expect(evidence.stagedChangeCount).toBe(1)
    expect(evidence.unstagedChangeCount).toBe(1)
    expect(evidence.untrackedChangeCount).toBe(1)
    expect(evidence.hasImplementationEvidence).toBe(true)
    expect(evidence.main.worktreeRoot).toBe(fs.realpathSync(projectRoot))
    expect(evidence.main.branch).toBe('main')
  })

  it('should not count the current change planning artifacts as implementation evidence', () => {
    const projectRoot = setupProjectWithRemoteMain(tmpDir)
    writeBaseSnapshot(projectRoot, 'demo')
    fs.writeFileSync(
      path.join(projectRoot, 'openspec', 'changes', 'demo', 'tasks.md'),
      '- [x] planning only\n',
    )

    const evidence = collectEvidence(projectRoot, 'demo')

    expect(evidence.commitCount).toBe(0)
    expect(evidence.workingTreeChangeCount).toBe(0)
    expect(evidence.hasImplementationEvidence).toBe(false)
    expect(evidence.completedTasks).toBe(1)
  })

  it('should count commits from the linked worktree passed as project root', () => {
    const projectRoot = setupProjectWithRemoteMain(tmpDir)
    const worktreeRoot = path.join(tmpDir, 'feature-worktree')
    git(projectRoot, ['worktree', 'add', '-q', '-b', 'feature-evidence', worktreeRoot])
    writeBaseSnapshot(worktreeRoot, 'demo')
    fs.appendFileSync(path.join(worktreeRoot, 'README.md'), 'worktree implementation\n')
    commitAll(worktreeRoot, 'implement in linked worktree')

    const evidence = collectEvidence(worktreeRoot, 'demo')

    expect(evidence.main.count).toBe(1)
    expect(evidence.commitCount).toBe(1)
    expect(evidence.hasImplementationEvidence).toBe(true)
    expect(evidence.main.worktreeRoot).toBe(fs.realpathSync(worktreeRoot))
    expect(evidence.main.branch).toBe('feature-evidence')
  })

  it('should require base snapshot instead of inferring branch merge-base', () => {
    const projectRoot = setupProjectWithRemoteMain(tmpDir)
    fs.appendFileSync(path.join(projectRoot, 'README.md'), 'change\n')
    commitAll(projectRoot, 'feature change')
    fs.mkdirSync(path.join(projectRoot, 'openspec', 'changes', 'demo'), { recursive: true })
    fs.writeFileSync(path.join(projectRoot, 'openspec', 'changes', 'demo', 'tasks.md'), '- [x] implement evidence command\n')

    const evidence = collectEvidence(projectRoot, 'demo')

    expect(evidence.main.base).toBeNull()
    expect(evidence.main.count).toBe(0)
    expect(evidence.commitCount).toBe(0)
    expect(evidence.warnings).toContain(`base snapshot missing: ${path.join(projectRoot, 'openspec', 'changes', 'demo', '.base-sha')}`)
  })

  it('should not write base snapshot outside a git repository', () => {
    const snapshot = writeBaseSnapshot(tmpDir, 'demo')

    expect(snapshot.mainSha).toBeNull()
    expect(snapshot.warnings).toContain('main repository HEAD unavailable')
    expect(fs.existsSync(path.join(tmpDir, 'openspec', 'changes', 'demo', '.base-sha'))).toBe(false)
  })
})

function removeTempDir(dir: string): void {
  for (let attempt = 0; attempt < 10; attempt++) {
    try {
      fs.rmSync(dir, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 })
      return
    } catch (error) {
      if (attempt === 9) throw error
      sleep(100)
    }
  }
}

function sleep(ms: number): void {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms)
}

function setupProjectWithNestedSubmodule(root: string): string {
  const projectRoot = path.join(root, 'project')
  const submoduleSource = path.join(root, 'sub-source')

  fs.mkdirSync(projectRoot, { recursive: true })
  fs.mkdirSync(submoduleSource, { recursive: true })
  git(projectRoot, ['init', '-q'])
  git(projectRoot, ['config', 'user.email', 'test@example.com'])
  git(projectRoot, ['config', 'user.name', 'Test'])
  git(submoduleSource, ['init', '-q'])
  git(submoduleSource, ['config', 'user.email', 'test@example.com'])
  git(submoduleSource, ['config', 'user.name', 'Test'])

  fs.writeFileSync(path.join(submoduleSource, 'file.txt'), 'one\n')
  commitAll(submoduleSource, 'initial submodule commit')

  fs.writeFileSync(path.join(projectRoot, 'README.md'), 'project\n')
  git(projectRoot, ['add', 'README.md'])
  git(projectRoot, ['commit', '-q', '-m', 'initial project commit'])
  git(projectRoot, ['-c', 'protocol.file.allow=always', 'submodule', 'add', '-q', submoduleSource, 'modules/sub'])
  commitAll(projectRoot, 'add submodule')

  return projectRoot
}

function setupProjectWithRemoteMain(root: string): string {
  const projectRoot = path.join(root, 'upstream-project')
  const remoteRoot = path.join(root, 'remote.git')

  git(root, ['init', '--bare', '-q', remoteRoot])
  fs.mkdirSync(projectRoot, { recursive: true })
  git(projectRoot, ['init', '-q'])
  git(projectRoot, ['config', 'user.email', 'test@example.com'])
  git(projectRoot, ['config', 'user.name', 'Test'])
  git(projectRoot, ['checkout', '-q', '-b', 'main'])
  fs.writeFileSync(path.join(projectRoot, 'README.md'), 'project\n')
  commitAll(projectRoot, 'initial project commit')
  git(projectRoot, ['remote', 'add', 'origin', remoteRoot])
  git(projectRoot, ['push', '-q', '-u', 'origin', 'main'])

  return projectRoot
}
