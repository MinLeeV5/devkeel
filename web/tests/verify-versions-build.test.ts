import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import { verifyVersionsBuild } from '../scripts/verify-versions-build'

function writeVersion(root: string, stream: 'cli' | 'templates', fileName: string, content: string): void {
  const streamDir = path.join(root, stream)
  fs.mkdirSync(streamDir, { recursive: true })
  fs.writeFileSync(path.join(streamDir, fileName), content)
}

describe('verifyVersionsBuild', () => {
  let tmpDir: string
  let sourceRoot: string
  let buildRoot: string

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'harness-versions-build-'))
    sourceRoot = path.join(tmpDir, 'public', 'versions')
    buildRoot = path.join(tmpDir, 'dist', 'versions')
    for (const stream of ['cli', 'templates'] as const) {
      writeVersion(sourceRoot, stream, '1.0.0.json', `${stream} source`)
      writeVersion(buildRoot, stream, '1.0.0.json', `${stream} source`)
    }
  })

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true })
  })

  it('should accept identical stream file sets and contents', () => {
    expect(() => verifyVersionsBuild(sourceRoot, buildRoot)).not.toThrow()
  })

  it('should reject a mismatched file set in either stream', () => {
    writeVersion(buildRoot, 'templates', '1.0.1.json', 'unexpected')

    expect(() => verifyVersionsBuild(sourceRoot, buildRoot)).toThrowError(
      /templates.*file set mismatch.*1\.0\.1\.json/,
    )
  })

  it('should reject changed file contents', () => {
    writeVersion(buildRoot, 'cli', '1.0.0.json', 'changed')

    expect(() => verifyVersionsBuild(sourceRoot, buildRoot)).toThrowError(
      /cli[/\\]1\.0\.0\.json.*content mismatch/,
    )
  })
})
