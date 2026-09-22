import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { pathToFileURL } from 'node:url'
import { copyOpenspecTemplate } from '../src/lib/templates.js'

describe('OpenSpec privacy', () => {
  let tmpDir: string

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'devkeel-privacy-'))
  })

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true })
  })

  it('should disable upstream telemetry even when the caller enables it', () => {
    copyOpenspecTemplate(path.join(tmpDir, 'openspec'))
    const observationPath = path.join(tmpDir, 'observed.json')
    const requestsPath = path.join(tmpDir, 'requests.txt')
    const preloadPath = path.join(tmpDir, 'observe.mjs')
    fs.writeFileSync(preloadPath, `
      import fs from 'node:fs'
      import path from 'node:path'
      if (path.basename(process.argv[1] ?? '') === 'openspec.js') {
        fs.writeFileSync(${JSON.stringify(observationPath)}, JSON.stringify({
          telemetry: process.env.OPENSPEC_TELEMETRY,
          doNotTrack: process.env.DO_NOT_TRACK,
        }))
        globalThis.fetch = async (url) => {
          fs.appendFileSync(${JSON.stringify(requestsPath)}, String(url) + '\\n')
          throw new Error('Network disabled by the test')
        }
      }
    `)

    const result = spawnSync(process.execPath, [path.join(process.cwd(), 'bin/devkeel.js'), 'openspec', 'list', '--json'], {
      cwd: tmpDir,
      encoding: 'utf-8',
      timeout: 15_000,
      env: {
        ...process.env,
        NODE_OPTIONS: `--import=${pathToFileURL(preloadPath).href}`,
        NODE_ENV: 'production',
        CI: 'false',
        XDG_CONFIG_HOME: path.join(tmpDir, 'config'),
        OPENSPEC_TELEMETRY: '1',
        DO_NOT_TRACK: '0',
      },
    })

    expect(result.status, result.stderr).toBe(0)
    expect(JSON.parse(result.stdout)).toMatchObject({ changes: [] })
    expect(JSON.parse(fs.readFileSync(observationPath, 'utf-8'))).toEqual({ telemetry: '0', doNotTrack: '1' })
    expect(fs.existsSync(requestsPath)).toBe(false)
    expect(result.stderr).not.toContain('anonymous usage stats')
  })
})
