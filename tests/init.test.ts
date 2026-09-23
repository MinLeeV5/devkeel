import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { getBuiltinVersions, readVersions, writeVersions } from '../src/lib/versions.js'
import { runInit } from '../src/commands/init.js'

const testState = vi.hoisted(() => ({
  isSubmodule: false,
  templatesDir: '',
  confirm: vi.fn(async () => false),
}))

vi.mock('../src/lib/templates-cache.js', async (importOriginal) => {
  const original = await importOriginal<typeof import('../src/lib/templates-cache.js')>()
  return {
    ...original,
    ensureTemplatesCache: vi.fn(async () => ({
      cacheDir: testState.templatesDir,
      version: 'test',
    })),
  }
})

vi.mock('../src/lib/detect.js', async (importOriginal) => {
  const original = await importOriginal<typeof import('../src/lib/detect.js')>()
  return {
    ...original,
    detectRepositoryType: (root: string) => testState.isSubmodule ? 'domain' : original.detectRepositoryType(root),
  }
})

vi.mock('@clack/prompts', () => ({
  spinner: () => ({ start: vi.fn(), stop: vi.fn() }),
  text: vi.fn(),
  multiselect: vi.fn(async () => []),
  confirm: testState.confirm,
  isCancel: vi.fn(() => false),
  cancel: vi.fn(),
  intro: vi.fn(),
  outro: vi.fn(),
  log: {
    success: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}))

describe.sequential('runInit legacy migration', () => {
  const retiredSkills = [
    'grilling',
    'openspec-explore',
    'automated-instrumented-debugging',
    'receiving-code-review',
    'architecture-diagram',
  ]
  const originalCwd = process.cwd()
  const customizedRetiredSkill = 'writing-plans'
  const customizedRetiredContent = '---\nname: writing-plans\ndescription: locally customized\n---\n'
  let tmpDir: string

  function createLegacyManagedSkills(): void {
    const versions = getBuiltinVersions()
    delete versions.skills['openspec-update-change']
    delete versions.skills['systematic-debugging']
    versions.skills['brainstorming'] = '6.0.3'
    const brainstormingRoot = path.join(tmpDir, '.harness', 'skills', 'brainstorming')
    fs.mkdirSync(brainstormingRoot, { recursive: true })
    fs.writeFileSync(path.join(brainstormingRoot, 'SKILL.md'), 'legacy brainstorming\n', 'utf-8')
    fs.writeFileSync(path.join(brainstormingRoot, 'extra.md'), 'remove me\n', 'utf-8')
    for (const skill of retiredSkills) {
      versions.skills[skill] = '6.0.3'
      const skillFile = path.join(tmpDir, '.harness', 'skills', skill, 'SKILL.md')
      fs.mkdirSync(path.dirname(skillFile), { recursive: true })
      fs.writeFileSync(
        skillFile,
        `---\nname: ${skill}\nmetadata:\n  author: superpowers\n---\n`,
        'utf-8',
      )
    }
    versions.skills[customizedRetiredSkill] = '6.0.3'
    const customizedFile = path.join(
      tmpDir,
      '.harness',
      'skills',
      customizedRetiredSkill,
      'SKILL.md',
    )
    fs.mkdirSync(path.dirname(customizedFile), { recursive: true })
    fs.writeFileSync(customizedFile, customizedRetiredContent, 'utf-8')
    versions.schemas['superpowers-lite'] = '14'
    writeVersions(tmpDir, versions)
  }

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'harness-init-migration-'))
    testState.templatesDir = path.join(originalCwd, 'templates')
    testState.isSubmodule = false
    testState.confirm.mockClear()
    testState.confirm.mockResolvedValue(false)
    createLegacyManagedSkills()
    process.chdir(tmpDir)
  })

  afterEach(() => {
    process.chdir(originalCwd)
    fs.rmSync(tmpDir, { recursive: true, force: true })
  })

  function expectRetiredAssetsRemoved(): void {
    const versions = readVersions(tmpDir)
    for (const skill of retiredSkills) {
      expect(fs.existsSync(path.join(tmpDir, '.harness', 'skills', skill))).toBe(false)
      expect(versions?.skills[skill]).toBeUndefined()
    }
    expect(fs.existsSync(path.join(
      tmpDir,
      '.harness',
      'skills',
      customizedRetiredSkill,
    ))).toBe(false)
    expect(versions?.skills[customizedRetiredSkill]).toBeUndefined()
    expect(versions?.schemas['superpowers-lite']).toBeUndefined()
    expect(versions?.skills['brainstorming']).toBe(getBuiltinVersions().skills['brainstorming'])
    for (const relativePath of [
      'skills/brainstorming/SKILL.md',
      'skills/brainstorming/references/openspec-context.md',
      'skills/brainstorming/scripts/openspec-status-snapshot.sh',
      'commands/opsx/explore.md',
    ]) {
      expect(fs.readFileSync(path.join(tmpDir, '.harness', relativePath), 'utf-8')).toBe(
        fs.readFileSync(path.join(testState.templatesDir, relativePath), 'utf-8'),
      )
    }
    expect(fs.existsSync(path.join(
      tmpDir,
      '.harness',
      'skills',
      'brainstorming',
      'extra.md',
    ))).toBe(false)
  }

  function expectUpdateAssetsDistributed(): void {
    for (const relativePath of [
      'skills/openspec-update-change/SKILL.md',
      'commands/opsx/update.md',
    ]) {
      const installedPath = path.join(tmpDir, '.harness', relativePath)
      const templatePath = path.join(testState.templatesDir, relativePath)
      expect(fs.existsSync(installedPath)).toBe(true)
      expect(fs.readFileSync(installedPath, 'utf-8')).toBe(
        fs.readFileSync(templatePath, 'utf-8'),
      )
    }
  }

  it('should preserve domain assets without distributing or migrating root assets', async () => {
    testState.isSubmodule = true

    await runInit({ name: 'legacy-submodule', targets: 'codex' })

    expect(fs.readFileSync(path.join(
      tmpDir,
      '.harness',
      'skills',
      customizedRetiredSkill,
      'SKILL.md',
    ), 'utf-8')).toBe(customizedRetiredContent)
    expect(fs.existsSync(path.join(
      tmpDir,
      '.harness',
      'skills',
      'openspec-update-change',
    ))).toBe(false)
    expect(fs.existsSync(path.join(
      tmpDir,
      '.harness',
      'commands',
      'opsx',
      'update.md',
    ))).toBe(false)
    expect(readVersions(tmpDir)).toEqual(expect.objectContaining({
      skills: {},
      agents: {},
      rules: {},
      schemas: {},
    }))
    expect(fs.existsSync(path.join(tmpDir, 'openspec'))).toBe(false)
  })

  it('should install update assets in a fresh project without versions.yml', async () => {
    fs.rmSync(path.join(tmpDir, '.harness'), { recursive: true, force: true })

    await runInit({ name: 'fresh-project', targets: 'codex' })

    expectUpdateAssetsDistributed()
    expect(readVersions(tmpDir)?.skills['openspec-update-change']).toBe('2.0')
  })

  it('should migrate an existing project that does not have openspec yet', async () => {
    await runInit({ name: 'legacy-project', targets: 'codex' })

    expectRetiredAssetsRemoved()
    expectUpdateAssetsDistributed()
    expect(fs.existsSync(path.join(
      tmpDir,
      'openspec',
      'schemas',
      'full',
      'schema.yaml',
    ))).toBe(true)
  })
})
