import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import {
  getRequiredHarnessDirs,
  checkProjectAssets,
  shouldValidateRootAssets,
} from '../src/commands/doctor.js'
import { copyOpenspecTemplate, createPlatformLinks } from '../src/lib/templates.js'

describe('doctor repository profile', () => {
  it('validates OpenSpec and nested submodules for main repositories', () => {
    expect(shouldValidateRootAssets('main')).toBe(true)
    expect(getRequiredHarnessDirs('main')).toEqual([
      'rules',
      'skills',
      'agents',
      'commands',
    ])
  })

  it('does not require root-only assets for domain repositories', () => {
    expect(shouldValidateRootAssets('domain')).toBe(false)
    expect(getRequiredHarnessDirs('domain')).toEqual(['rules', 'skills', 'agents'])
  })
})

describe.sequential('doctor without project configuration', () => {
  const originalCwd = process.cwd()
  let root: string

  beforeEach(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'harness-doctor-'))
    for (const dir of ['skills', 'rules', 'agents']) {
      fs.mkdirSync(path.join(root, '.harness', dir), { recursive: true })
    }
    fs.writeFileSync(path.join(root, 'AGENTS.md'), '<!-- harness:domain-agents -->\n# Domain\n')
    process.chdir(root)
  })

  afterEach(() => {
    process.chdir(originalCwd)
    fs.rmSync(root, { recursive: true, force: true })
  })

  it('should check a standalone domain repository without config or root assets', () => {
    expect(checkProjectAssets(root).some(result => result.status === 'fail')).toBe(false)
    expect(fs.existsSync(path.join(root, '.harness', 'config.yml'))).toBe(false)
    expect(fs.existsSync(path.join(root, 'openspec'))).toBe(false)
  })

  it('should check root assets without requiring config', () => {
    fs.writeFileSync(path.join(root, 'AGENTS.md'), '# Root\n')
    fs.mkdirSync(path.join(root, '.harness', 'commands'))
    copyOpenspecTemplate(path.join(root, 'openspec'))

    expect(checkProjectAssets(root).some(result => result.status === 'fail')).toBe(false)

    expect(fs.existsSync(path.join(root, '.harness', 'config.yml'))).toBe(false)
  })

  it('should repair a missing skill entry using the remaining platform directory', () => {
    createPlatformLinks(root, ['codex'])
    fs.unlinkSync(path.join(root, '.agents', 'skills'))

    expect(checkProjectAssets(root, true).some(result => result.status === 'fail')).toBe(false)

    expect(fs.lstatSync(path.join(root, '.agents', 'skills')).isSymbolicLink()).toBe(true)
    expect(fs.realpathSync(path.join(root, '.agents', 'skills')))
      .toBe(fs.realpathSync(path.join(root, '.harness', 'skills')))
    expect(fs.existsSync(path.join(root, '.harness', 'config.yml'))).toBe(false)
  })

  it.each(['targets: [broken', 'project: { repoType: main }\ntargets: [claude-code]\n'])(
    'should ignore legacy config without parsing or changing it: %s', legacy => {
      const configPath = path.join(root, '.harness', 'config.yml')
      fs.writeFileSync(configPath, legacy)

      expect(checkProjectAssets(root, true).some(result => result.status === 'fail')).toBe(false)

      expect(fs.readFileSync(configPath, 'utf-8')).toBe(legacy)
      expect(fs.existsSync(path.join(root, '.claude'))).toBe(false)
    },
  )
})
