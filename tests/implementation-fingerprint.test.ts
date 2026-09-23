import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { execFileSync, spawnSync } from 'node:child_process'
import { afterEach, describe, expect, it } from 'vitest'

const scriptPath = path.join(
  process.cwd(),
  'templates',
  'skills',
  'openspec-verify-change',
  'scripts',
  'implementation-fingerprint.mjs',
)

function runGit(cwd: string, ...args: string[]): void {
  execFileSync('git', args, { cwd, stdio: 'ignore' })
}

function writeFile(root: string, relativePath: string, content: string): void {
  const target = path.join(root, relativePath)
  fs.mkdirSync(path.dirname(target), { recursive: true })
  fs.writeFileSync(target, content, 'utf8')
}

function fingerprint(root: string): {
  fingerprint: string
  trackedPaths: string[]
  untracked: Array<{ path: string; digest: string }>
  excludedPaths: string[]
} {
  const output = execFileSync(
    process.execPath,
    [scriptPath, '--change-dir', 'openspec/changes/example'],
    { cwd: root, encoding: 'utf8' },
  )
  return JSON.parse(output)
}

describe('implementation fingerprint', () => {
  const tempDirs: string[] = []

  afterEach(() => {
    for (const tempDir of tempDirs.splice(0)) {
      fs.rmSync(tempDir, { recursive: true, force: true })
    }
  })

  it('is deterministic, excludes closure artifacts, and detects implementation changes', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'harness-fingerprint-'))
    tempDirs.push(root)
    runGit(root, 'init', '-b', 'main')
    runGit(root, 'config', 'user.email', 'harness@example.test')
    runGit(root, 'config', 'user.name', 'DevKeel Test')

    writeFile(root, 'src/app.txt', 'base\n')
    writeFile(root, 'openspec/changes/example/tasks.md', '# Tasks\n')
    runGit(root, 'add', '.')
    runGit(root, 'commit', '-m', 'base')

    writeFile(root, 'src/app.txt', 'changed\n')
    writeFile(root, 'src/new.txt', 'untracked\n')
    const first = fingerprint(root)
    const repeated = fingerprint(root)

    expect(repeated).toEqual(first)
    expect(first.trackedPaths).toContain('src/app.txt')
    expect(first.untracked.map(item => item.path)).toContain('src/new.txt')
    expect(first.excludedPaths).toEqual([
      'openspec/changes/example/retrospective.md',
      'openspec/changes/example/verify.md',
    ])

    writeFile(root, 'openspec/changes/example/verify.md', '# Verify\n')
    writeFile(root, 'openspec/changes/example/retrospective.md', '# Retrospective\n')
    expect(fingerprint(root).fingerprint).toBe(first.fingerprint)

    writeFile(root, 'openspec/changes/example/human-review.html', '<!doctype html>\n')
    expect(fingerprint(root).fingerprint).not.toBe(first.fingerprint)
    fs.unlinkSync(path.join(root, 'openspec/changes/example/human-review.html'))

    writeFile(root, 'src/new.txt', 'untracked changed\n')
    const changed = fingerprint(root)
    expect(changed.fingerprint).not.toBe(first.fingerprint)

    const mismatch = spawnSync(
      process.execPath,
      [
        scriptPath,
        '--change-dir',
        'openspec/changes/example',
        '--expect',
        first.fingerprint,
      ],
      { cwd: root, encoding: 'utf8' },
    )
    expect(mismatch.status).toBe(2)
    expect(mismatch.stderr).toContain('Fingerprint mismatch')
  })
})
