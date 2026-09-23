import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import * as prompts from '@clack/prompts'
import { runInit } from '../src/commands/init.js'
import { hasAgentsFrameworkDrift } from '../src/commands/update.js'
import { readVersions } from '../src/lib/versions.js'

const testState = vi.hoisted(() => ({
  isSubmodule: false,
  templatesDir: '',
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
  confirm: vi.fn(async () => false),
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

describe.sequential('init AGENTS templates', () => {
  const originalCwd = process.cwd()
  let projectDir: string

  beforeEach(() => {
    projectDir = fs.mkdtempSync(path.join(os.tmpdir(), 'harness-init-agents-'))
    testState.templatesDir = path.join(originalCwd, 'templates')
    testState.isSubmodule = false
    vi.mocked(prompts.confirm).mockReset()
    vi.mocked(prompts.confirm).mockResolvedValue(false)
    vi.mocked(prompts.multiselect).mockReset()
    vi.mocked(prompts.multiselect).mockResolvedValue([])
    process.chdir(projectDir)
  })

  afterEach(() => {
    process.chdir(originalCwd)
    fs.rmSync(projectDir, { recursive: true, force: true })
  })

  it('does not create or modify project npm settings', async () => {
    await runInit({ name: 'public-project', targets: 'codex', yes: true })
    const npmrcPath = path.join(projectDir, '.npmrc')
    expect(fs.existsSync(npmrcPath)).toBe(false)

    const originalSettings = 'registry=https://registry.npmjs.org/\nsave-exact=true\n'
    fs.writeFileSync(npmrcPath, originalSettings)
    await runInit({ name: 'public-project', targets: 'codex', yes: true })
    expect(fs.readFileSync(npmrcPath, 'utf-8')).toBe(originalSettings)
    expect(fs.existsSync(path.join(projectDir, '.harness', 'config.yml'))).toBe(false)
  })

  it('should ignore legacy config when initializing a main repository', async () => {
    fs.mkdirSync(path.join(projectDir, '.harness'))
    const legacy = 'project: { repoType: domain }\ntargets: [claude-code]\n'
    fs.writeFileSync(path.join(projectDir, '.harness', 'config.yml'), legacy)

    await runInit({ name: 'main-project', targets: 'codex', yes: true })

    expect(fs.existsSync(path.join(projectDir, 'openspec'))).toBe(true)
    expect(fs.existsSync(path.join(projectDir, '.agents', 'skills'))).toBe(true)
    expect(fs.existsSync(path.join(projectDir, '.claude'))).toBe(false)
    expect(fs.readFileSync(path.join(projectDir, '.harness', 'config.yml'), 'utf-8')).toBe(legacy)
  })

  it('should retain domain assets during init of a standalone domain checkout', async () => {
    fs.copyFileSync(path.join(testState.templatesDir, 'agents-domain-md.md'), path.join(projectDir, 'AGENTS.md'))

    await runInit({ name: 'standalone-domain', targets: 'codex', yes: true })

    expect(fs.existsSync(path.join(projectDir, 'openspec'))).toBe(false)
    expect(fs.existsSync(path.join(projectDir, '.harness', 'commands'))).toBe(false)
    expect(fs.existsSync(path.join(projectDir, '.harness', 'config.yml'))).toBe(false)
    expect(readVersions(projectDir)?.skills).toEqual({})
    expect(hasAgentsFrameworkDrift(projectDir)).toBe(false)
  })

  it('preserves a custom lite schema and stops before writing project configuration', async () => {
    const schemaDir = path.join(projectDir, 'openspec', 'schemas', 'lite')
    fs.mkdirSync(schemaDir, { recursive: true })
    const customSchema = 'name: lite\nversion: 1\nartifacts: []\n'
    fs.writeFileSync(path.join(schemaDir, 'schema.yaml'), customSchema)

    await expect(runInit({ name: 'custom-project', targets: 'codex', yes: true }))
      .rejects.toThrow('请先重命名自定义 schema')

    expect(fs.readFileSync(path.join(schemaDir, 'schema.yaml'), 'utf-8')).toBe(customSchema)
    expect(fs.existsSync(path.join(projectDir, '.harness', 'config.yml'))).toBe(false)
  })

  it('offers OpenCode during interactive target selection', async () => {
    vi.mocked(prompts.multiselect).mockResolvedValueOnce(['opencode'])

    await runInit({ name: 'opencode-project' })

    expect(prompts.multiselect).toHaveBeenCalledWith(expect.objectContaining({
      message: '目标平台？',
      options: expect.arrayContaining([
        { value: 'opencode', label: 'OpenCode' },
      ]),
    }))
    expect(fs.existsSync(path.join(projectDir, '.opencode', 'skills'))).toBe(true)
  })

  it('uses the domain execution template inside a submodule', async () => {
    testState.isSubmodule = true

    await runInit({ name: 'frontend-domain', targets: 'codex,claude-code', yes: true })

    const agents = fs.readFileSync(path.join(projectDir, 'AGENTS.md'), 'utf-8')
    expect(agents).toContain('<!-- harness:domain-agents -->')
    expect(agents).toContain('项目知识入口')
    expect(agents).toContain('方案获认可且实施获授权后再修改')
    expect(agents).toContain('`docs/` 保存项目知识，`openspec/` 保存任务过程')
    expect(agents).not.toContain('<!-- harness:user:domain -->')
    expect(agents).not.toContain('workflow-routing')
    expect(agents).not.toContain('brainstorming')
    expect(agents).not.toContain('/opsx:')
    expect(agents).not.toContain('Direct / Lite / Full')
    for (const slot of ['routing', 'verification', 'project']) {
      expect(agents).toContain(`<!-- harness:user:${slot} -->`)
      expect(agents).toContain(`<!-- /harness:user:${slot} -->`)
    }
    expect(fs.readFileSync(path.join(projectDir, 'CLAUDE.md'), 'utf-8'))
      .toBe('@AGENTS.md\n')
    expect(fs.existsSync(path.join(projectDir, '.harness', 'config.yml'))).toBe(false)
    expect(readVersions(projectDir)).toEqual(expect.objectContaining({
      skills: {},
      agents: {},
      rules: {},
      schemas: {},
    }))
    for (const dir of ['skills', 'rules', 'agents']) {
      expect(fs.existsSync(path.join(projectDir, '.harness', dir))).toBe(true)
    }
    expect(fs.readdirSync(path.join(projectDir, '.harness', 'skills'))).toEqual([
      '.gitkeep',
    ])
    expect(fs.existsSync(path.join(projectDir, '.harness', 'commands'))).toBe(false)
    expect(fs.existsSync(path.join(projectDir, 'openspec'))).toBe(false)
    expect(hasAgentsFrameworkDrift(projectDir)).toBe(false)
  })

  it('preserves domain assets and does not distribute root assets on repeated init', async () => {
    testState.isSubmodule = true
    const customSkill = path.join(
      projectDir,
      '.harness',
      'skills',
      'frontend-project-check',
      'SKILL.md',
    )
    fs.mkdirSync(path.dirname(customSkill), { recursive: true })
    fs.writeFileSync(customSkill, '---\nname: frontend-project-check\n---\n', 'utf-8')

    await runInit({ name: 'frontend-domain', targets: 'codex', yes: true })
    await runInit({ name: 'frontend-domain', targets: 'codex', yes: true })

    expect(fs.existsSync(customSkill)).toBe(true)
    expect(fs.readdirSync(path.join(projectDir, '.harness', 'skills')).sort()).toEqual([
      '.gitkeep',
      'frontend-project-check',
    ])
    expect(fs.existsSync(path.join(projectDir, '.harness', 'commands'))).toBe(false)
    expect(fs.existsSync(path.join(projectDir, 'openspec'))).toBe(false)
  })

  it('reads, confirms, and merges an existing domain AGENTS file', async () => {
    testState.isSubmodule = true
    const original = '# Frontend Business Rules\n\n- Only use pnpm.\n'
    fs.writeFileSync(path.join(projectDir, 'AGENTS.md'), original, 'utf-8')
    vi.mocked(prompts.confirm).mockResolvedValueOnce(true)

    await runInit({ name: 'frontend-domain', targets: 'codex' })

    expect(prompts.confirm).toHaveBeenCalledWith(expect.objectContaining({
      message: expect.stringContaining('改造并合并'),
    }))
    const agents = fs.readFileSync(path.join(projectDir, 'AGENTS.md'), 'utf-8')
    expect(agents).toContain('<!-- harness:domain-agents -->')
    expect(agents).toContain('# Frontend Business Rules')
    expect(agents).toContain('Only use pnpm.')
  })

  it('keeps an existing AGENTS file unchanged when transformation is declined', async () => {
    testState.isSubmodule = true
    const original = '# Existing Contract\n\nKeep this byte-for-byte.\n'
    fs.writeFileSync(path.join(projectDir, 'AGENTS.md'), original, 'utf-8')

    await runInit({ name: 'frontend-domain', targets: 'codex' })

    expect(fs.readFileSync(path.join(projectDir, 'AGENTS.md'), 'utf-8')).toBe(original)
  })

  it('keeps an existing AGENTS file unchanged in non-interactive mode', async () => {
    testState.isSubmodule = true
    const original = '# Existing Contract\n\nNon-interactive runs must preserve this.\n'
    fs.writeFileSync(path.join(projectDir, 'AGENTS.md'), original, 'utf-8')

    await runInit({ name: 'frontend-domain', targets: 'codex', yes: true })

    expect(prompts.confirm).not.toHaveBeenCalled()
    expect(fs.readFileSync(path.join(projectDir, 'AGENTS.md'), 'utf-8')).toBe(original)
  })

  it('merges an existing root AGENTS file into the root template after confirmation', async () => {
    const original = '# Product Context\n\n- Owns meeting workflows.\n'
    fs.writeFileSync(path.join(projectDir, 'AGENTS.md'), original, 'utf-8')
    vi.mocked(prompts.confirm).mockResolvedValueOnce(true)

    await runInit({ name: 'product-root', targets: 'codex' })

    const agents = fs.readFileSync(path.join(projectDir, 'AGENTS.md'), 'utf-8')
    expect(agents).toContain('# AGENTS.md — Agent 执行契约')
    expect(agents).toContain('# Product Context')
    expect(agents).toContain('Owns meeting workflows.')
  })

  it.each([false, true])('preserves project docs during repeated init (submodule=%s)', async isSubmodule => {
    testState.isSubmodule = isSubmodule
    const docsPath = path.join(projectDir, 'docs', 'project.md')
    const knowledge = '# Project\n\nExisting project knowledge.\n'
    fs.mkdirSync(path.dirname(docsPath), { recursive: true })
    fs.writeFileSync(docsPath, knowledge)

    await runInit({ name: 'knowledge-project', targets: 'codex', yes: true })
    const agentsPath = path.join(projectDir, 'AGENTS.md')
    const agents = fs.readFileSync(agentsPath, 'utf-8')
    for (const slot of ['routing', 'verification', 'project']) {
      expect(agents).toContain(`<!-- harness:user:${slot} -->`)
    }
    const withReference = agents.replace(
      '<!-- harness:user:project -->',
      '<!-- harness:user:project -->\n[Project](docs/project.md)\n',
    )
    fs.writeFileSync(agentsPath, withReference)

    await runInit({ name: 'knowledge-project', targets: 'codex', yes: true })

    expect(fs.readFileSync(agentsPath, 'utf-8')).toBe(withReference)
    expect(fs.readFileSync(docsPath, 'utf-8')).toBe(knowledge)
  })
})
