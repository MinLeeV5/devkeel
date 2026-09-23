import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import crypto from 'node:crypto'
import { execFileSync } from 'node:child_process'
import YAML from 'yaml'
import * as prompts from '@clack/prompts'
import { detectDeprecatedAssets, removeDeprecatedAssets, copyTemplateSkills, copyTemplateAgents, copyTemplateRules, copyTemplateCommands, copyOpenspecTemplate } from '../src/lib/templates.js'
import { filterManagedVersions, getBuiltinVersions, readVersions, writeVersions } from '../src/lib/versions.js'
import { setTemplatesDir } from '../src/lib/templates-dir.js'
import { cleanAgentsMdSlots } from '../src/lib/agents-md.js'
import {
  applyDiscussionSkillMigration,
  applyLegacyMigrations,
  collectCommitStagePaths,
  detectUpdates,
  isDiscussionSkillMigrationRequired,
  planLegacyMigrations,
} from '../src/lib/update.js'
import { commitHarnessPaths, hasAgentsFrameworkDrift, resolveUpdateOptions, runUpdate, shouldRunUpdate } from '../src/commands/update.js'

const updateTestState = vi.hoisted(() => ({
  templatesDir: '',
}))

vi.mock('../src/lib/templates-cache.js', async (importOriginal) => {
  const original = await importOriginal<typeof import('../src/lib/templates-cache.js')>()
  return {
    ...original,
    ensureTemplatesCache: vi.fn(async () => ({
      cacheDir: updateTestState.templatesDir,
      version: 'test',
    })),
  }
})

vi.mock('@clack/prompts', () => ({
  spinner: () => ({ start: vi.fn(), stop: vi.fn() }),
  select: vi.fn(),
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

function createDiscussionTemplatesAt(sourceTemplates: string, version: string): string {
  const dynamicTemplates = fs.mkdtempSync(path.join(os.tmpdir(), 'harness-dynamic-templates-'))
  fs.cpSync(sourceTemplates, dynamicTemplates, { recursive: true })
  const versionsPath = path.join(dynamicTemplates, 'versions-yml.yml')
  const versions = YAML.parse(fs.readFileSync(versionsPath, 'utf-8')) as {
    skills: Record<string, string>
  }
  versions.skills['brainstorming'] = version
  fs.writeFileSync(versionsPath, YAML.stringify(versions), 'utf-8')
  const skillPath = path.join(dynamicTemplates, 'skills', 'brainstorming', 'SKILL.md')
  const skillContent = fs.readFileSync(skillPath, 'utf-8')
    .replace(/(  version: )"[^"]+"/u, `$1"${version}"`)
  fs.writeFileSync(skillPath, skillContent, 'utf-8')
  return dynamicTemplates
}

describe.sequential('runUpdate managed asset distribution', () => {
  const originalCwd = process.cwd()
  const skillName = 'openspec-update-change'
  const skillRelativePath = `skills/${skillName}/SKILL.md`
  const commandRelativePath = 'commands/opsx/update.md'
  let projectDir: string

  beforeEach(() => {
    projectDir = fs.mkdtempSync(path.join(os.tmpdir(), 'harness-update-distribution-'))
    updateTestState.templatesDir = path.join(originalCwd, 'templates')
    setTemplatesDir(updateTestState.templatesDir)

    copyTemplateSkills(path.join(projectDir, '.harness', 'skills'))
    copyTemplateAgents(path.join(projectDir, '.harness', 'agents'))
    copyTemplateRules(path.join(projectDir, '.harness', 'rules'))
    copyTemplateCommands(path.join(projectDir, '.harness', 'commands'))
    copyOpenspecTemplate(path.join(projectDir, 'openspec'))
    fs.mkdirSync(path.join(projectDir, '.agents'))

    const oldVersions = getBuiltinVersions()
    delete oldVersions.skills[skillName]
    writeVersions(projectDir, oldVersions)
    fs.rmSync(path.join(projectDir, '.harness', skillRelativePath), {
      recursive: true,
      force: true,
    })
    fs.rmSync(path.join(projectDir, '.harness', commandRelativePath), { force: true })
    vi.mocked(prompts.confirm).mockReset()
    vi.mocked(prompts.confirm).mockResolvedValue(false)
    vi.mocked(prompts.select).mockReset()
    process.chdir(projectDir)
  })

  afterEach(() => {
    process.chdir(originalCwd)
    fs.rmSync(projectDir, { recursive: true, force: true })
  })

  function installBrainstorming700(): {
    skillPath: string
    legacyContent: string
    commandPath: string
    legacyCommandContent: string
  } {
    copyTemplateSkills(path.join(projectDir, '.harness', 'skills'))
    copyTemplateCommands(path.join(projectDir, '.harness', 'commands'))
    const versions = getBuiltinVersions()
    versions.skills['brainstorming'] = '7.0.0'
    writeVersions(projectDir, versions)
    const skillPath = path.join(
      projectDir,
      '.harness',
      'skills',
      'brainstorming',
      'SKILL.md',
    )
    const legacyContent = fs.readFileSync(skillPath, 'utf-8')
      .replace(`version: "${getBuiltinVersions().skills['brainstorming']}"`, 'version: "7.0.0"')
      .replace(
        /### 对答收敛[\s\S]*?\n### 结论收束/u,
        [
          '### 提问',
          '',
          '只在外部决定会实质改变方向时提问。一轮提出一至三个属于同一决策链、可基于当前信息同时回答的',
          '问题，并给出必要判断依据或推荐；后一个问题依赖前一个答案时拆到下一轮。没有真实未知时不为',
          '满足形式提问。',
          '',
          '### 结论收束',
        ].join('\n'),
      )
    fs.writeFileSync(skillPath, legacyContent, 'utf-8')
    const commandPath = path.join(
      projectDir,
      '.harness',
      'commands',
      'opsx',
      'explore.md',
    )
    const legacyCommandContent = 'legacy brainstorming explore\n'
    fs.writeFileSync(commandPath, legacyCommandContent, 'utf-8')
    return { skillPath, legacyContent, commandPath, legacyCommandContent }
  }

  function writeInterruptedDiscussionRepair(): {
    skillPath: string
    damagedSkillContent: string
    commandPath: string
    damagedCommandContent: string
  } {
    copyTemplateSkills(path.join(projectDir, '.harness', 'skills'))
    copyTemplateCommands(path.join(projectDir, '.harness', 'commands'))
    writeVersions(projectDir, getBuiltinVersions())
    const skillPath = path.join(projectDir, '.harness', 'skills', 'brainstorming')
    const commandPath = path.join(projectDir, '.harness', 'commands', 'opsx', 'explore.md')
    const skillBackup = path.join(
      projectDir,
      '.harness',
      'skills',
      '.brainstorming.discussion-backup-interrupted',
    )
    const commandBackup = path.join(
      projectDir,
      '.harness',
      'commands',
      'opsx',
      '.explore.md.discussion-backup-interrupted',
    )
    const damagedSkillContent = 'damaged brainstorming 8.0.1\n'
    const damagedCommandContent = 'damaged explore command\n'
    fs.writeFileSync(path.join(skillPath, 'SKILL.md'), damagedSkillContent, 'utf-8')
    fs.writeFileSync(commandPath, damagedCommandContent, 'utf-8')
    fs.renameSync(skillPath, skillBackup)
    fs.renameSync(commandPath, commandBackup)
    fs.cpSync(
      path.join(updateTestState.templatesDir, 'skills', 'brainstorming'),
      skillPath,
      { recursive: true },
    )
    fs.copyFileSync(
      path.join(updateTestState.templatesDir, 'commands', 'opsx', 'explore.md'),
      commandPath,
    )
    const originalVersionsContent = fs.readFileSync(
      path.join(projectDir, '.harness', 'versions.yml'),
      'utf-8',
    )
    const entries = [
      {
        kind: 'replace',
        target: '.harness/skills/brainstorming',
        backup: '.harness/skills/.brainstorming.discussion-backup-interrupted',
        stage: '.harness/skills/.brainstorming.discussion-stage-interrupted',
        originalExisted: true,
      },
      {
        kind: 'replace',
        target: '.harness/commands/opsx/explore.md',
        backup: '.harness/commands/opsx/.explore.md.discussion-backup-interrupted',
        stage: '.harness/commands/opsx/.explore.md.discussion-stage-interrupted',
        originalExisted: true,
      },
      {
        kind: 'remove',
        target: '.harness/skills/grilling',
        backup: '.harness/skills/.grilling.discussion-backup-interrupted',
        originalExisted: false,
      },
      {
        kind: 'remove',
        target: '.harness/skills/openspec-explore',
        backup: '.harness/skills/.openspec-explore.discussion-backup-interrupted',
        originalExisted: false,
      },
    ]
    fs.writeFileSync(
      path.join(projectDir, '.harness', '.discussion-skill-migration.json'),
      JSON.stringify({
        version: 1,
        phase: 'assets-switched',
        originalVersionsContent,
        entries,
      }, null, 2) + '\n',
      'utf-8',
    )
    return { skillPath, damagedSkillContent, commandPath, damagedCommandContent }
  }

  function installLegacyDebuggingState(
    registered: boolean,
    keepReplacement = false,
  ): {
    legacyDir: string
    replacementDir: string
  } {
    const skillsRoot = path.join(projectDir, '.harness', 'skills')
    copyTemplateSkills(skillsRoot)
    const replacementDir = path.join(skillsRoot, 'systematic-debugging')
    const legacyDir = path.join(skillsRoot, 'automated-instrumented-debugging')
    fs.cpSync(replacementDir, legacyDir, { recursive: true })
    const legacySkill = path.join(legacyDir, 'SKILL.md')
    fs.writeFileSync(
      legacySkill,
      fs.readFileSync(legacySkill, 'utf-8')
        .replace('name: systematic-debugging', 'name: automated-instrumented-debugging')
        .replace('version: "1.0.1"', 'version: "2.0.0"'),
      'utf-8',
    )
    if (!keepReplacement) fs.rmSync(replacementDir, { recursive: true, force: true })

    const versions = getBuiltinVersions()
    delete versions.skills['systematic-debugging']
    if (registered) versions.skills['automated-instrumented-debugging'] = '2.0.0'
    writeVersions(projectDir, versions)
    return { legacyDir, replacementDir }
  }

  it('should install systematic debugging before removing the registered legacy skill', async () => {
    const { legacyDir, replacementDir } = installLegacyDebuggingState(true)

    await runUpdate({ force: true })

    expect(fs.existsSync(replacementDir)).toBe(true)
    expect(fs.existsSync(legacyDir)).toBe(false)
    expect(readVersions(projectDir)?.skills['systematic-debugging']).toBe('1.0.1')
    expect(readVersions(projectDir)?.skills['automated-instrumented-debugging']).toBeUndefined()
  })

  it('should preserve the legacy skill when the replacement update is skipped', async () => {
    const { legacyDir, replacementDir } = installLegacyDebuggingState(true, true)
    const versions = readVersions(projectDir)!
    versions.schemas['superpowers-lite'] = '14'
    writeVersions(projectDir, versions)
    vi.mocked(prompts.select)
      .mockResolvedValueOnce('each')
      .mockResolvedValueOnce('skip')

    await runUpdate()

    expect(fs.existsSync(replacementDir)).toBe(true)
    expect(fs.existsSync(legacyDir)).toBe(true)
    expect(readVersions(projectDir)?.skills['systematic-debugging']).toBeUndefined()
    expect(readVersions(projectDir)?.skills['automated-instrumented-debugging']).toBe('2.0.0')
    expect(readVersions(projectDir)?.schemas['superpowers-lite']).toBeUndefined()
  })

  it('should preserve an unregistered custom legacy debugging directory', async () => {
    const { legacyDir, replacementDir } = installLegacyDebuggingState(false)
    fs.writeFileSync(path.join(legacyDir, 'custom.md'), 'keep custom debugging notes\n')

    await runUpdate({ force: true })

    expect(fs.existsSync(replacementDir)).toBe(true)
    expect(fs.readFileSync(path.join(legacyDir, 'custom.md'), 'utf-8'))
      .toBe('keep custom debugging notes\n')
    expect(readVersions(projectDir)?.skills['systematic-debugging']).toBe('1.0.1')
    expect(readVersions(projectDir)?.skills['automated-instrumented-debugging']).toBeUndefined()
  })

  it('should restore a newly managed skill command and version key', async () => {
    expect(readVersions(projectDir)?.skills[skillName]).toBeUndefined()
    expect(fs.existsSync(path.join(projectDir, '.harness', skillRelativePath))).toBe(false)
    expect(fs.existsSync(path.join(projectDir, '.harness', commandRelativePath))).toBe(false)

    await runUpdate({ force: true })

    for (const relativePath of [skillRelativePath, commandRelativePath]) {
      expect(fs.readFileSync(path.join(projectDir, '.harness', relativePath), 'utf-8')).toBe(
        fs.readFileSync(path.join(updateTestState.templatesDir, relativePath), 'utf-8'),
      )
    }
    expect(readVersions(projectDir)?.skills[skillName]).toBe(
      getBuiltinVersions().skills[skillName],
    )
    const versionsPath = path.join(projectDir, '.harness', 'versions.yml')
    const content = fs.readFileSync(versionsPath, 'utf-8')
    const builtin = getBuiltinVersions()
    expect(content).toContain(`harness: "${builtin.harness}"`)
    for (const [name, value] of Object.entries(builtin.skills)) {
      expect(content).toContain(`  ${name}: "${value}"`)
    }
    for (const [name, value] of Object.entries(builtin.agents)) {
      expect(content).toContain(`  ${name}: "${value}"`)
    }
    for (const [name, value] of Object.entries(builtin.schemas)) {
      expect(content).toContain(`  ${name}: "${value}"`)
    }
  })

  it('should update a domain repository without redistributing root assets', async () => {
    fs.copyFileSync(
      path.join(updateTestState.templatesDir, 'agents-domain-md.md'),
      path.join(projectDir, 'AGENTS.md'),
    )
    writeVersions(projectDir, getBuiltinVersions())
    const customSkill = path.join(
      projectDir,
      '.harness',
      'skills',
      'frontend-project-check',
      'SKILL.md',
    )
    fs.mkdirSync(path.dirname(customSkill), { recursive: true })
    fs.writeFileSync(customSkill, '---\nname: frontend-project-check\n---\n', 'utf-8')
    const managedSkill = path.join(projectDir, '.harness', skillRelativePath)
    const managedCommand = path.join(projectDir, '.harness', commandRelativePath)
    fs.rmSync(managedSkill, { recursive: true, force: true })
    fs.rmSync(managedCommand, { force: true })

    await runUpdate({ force: true })

    expect(fs.existsSync(managedSkill)).toBe(false)
    expect(fs.existsSync(managedCommand)).toBe(false)
    expect(fs.existsSync(customSkill)).toBe(true)
    expect(readVersions(projectDir)).toEqual(expect.objectContaining({
      skills: {},
      agents: {},
      rules: {},
      schemas: {},
    }))
    expect(fs.readFileSync(path.join(projectDir, 'AGENTS.md'), 'utf-8'))
      .toContain('<!-- harness:domain-agents -->')
  })

  it('should ignore legacy config and preserve a standalone domain repository', async () => {
    const legacyConfig = 'project: { repoType: main }\ntargets: [claude-code]\n'
    fs.writeFileSync(path.join(projectDir, '.harness', 'config.yml'), legacyConfig)
    fs.writeFileSync(
      path.join(projectDir, 'AGENTS.md'),
      fs.readFileSync(
        path.join(updateTestState.templatesDir, 'agents-domain-md.md'),
        'utf-8',
      ),
      'utf-8',
    )

    await runUpdate({ force: true })

    const agents = fs.readFileSync(path.join(projectDir, 'AGENTS.md'), 'utf-8')
    expect(agents).toContain('<!-- harness:domain-agents -->')
    expect(readVersions(projectDir)?.schemas).toEqual({})
    expect(fs.existsSync(path.join(projectDir, '.claude'))).toBe(false)
    expect(fs.readFileSync(path.join(projectDir, '.harness', 'config.yml'), 'utf-8')).toBe(legacyConfig)
  })

  it('should force overwrite managed assets from the beta channel when versions match', async () => {
    copyTemplateSkills(path.join(projectDir, '.harness', 'skills'))
    copyTemplateCommands(path.join(projectDir, '.harness', 'commands'))
    writeVersions(projectDir, getBuiltinVersions())
    const relativePath = 'skills/commit/SKILL.md'
    const targetPath = path.join(projectDir, '.harness', relativePath)
    const templateContent = fs.readFileSync(
      path.join(updateTestState.templatesDir, relativePath),
      'utf-8',
    )
    fs.writeFileSync(targetPath, 'local beta customization\n', 'utf-8')

    await runUpdate({ beta: true, force: true })

    expect(fs.readFileSync(targetPath, 'utf-8')).toBe(templateContent)
    expect(readVersions(projectDir)).toEqual(getBuiltinVersions())
  })

  it('should keep beta force dry-run read-only when versions match', async () => {
    copyTemplateSkills(path.join(projectDir, '.harness', 'skills'))
    copyTemplateCommands(path.join(projectDir, '.harness', 'commands'))
    writeVersions(projectDir, getBuiltinVersions())
    const targetPath = path.join(projectDir, '.harness', 'skills', 'commit', 'SKILL.md')
    fs.writeFileSync(targetPath, 'local beta customization\n', 'utf-8')

    await runUpdate({ beta: true, force: true, dryRun: true })

    expect(fs.readFileSync(targetPath, 'utf-8')).toBe('local beta customization\n')
    expect(readVersions(projectDir)).toEqual(getBuiltinVersions())
  })

  it('should clean legacy gitignore entries and force refresh current managed assets', async () => {
    copyTemplateSkills(path.join(projectDir, '.harness', 'skills'))
    copyTemplateCommands(path.join(projectDir, '.harness', 'commands'))
    writeVersions(projectDir, getBuiltinVersions())
    const commandPath = path.join(projectDir, '.harness', commandRelativePath)
    fs.writeFileSync(commandPath, 'custom command\n', 'utf-8')
    fs.writeFileSync(
      path.join(projectDir, '.gitignore'),
      'node_modules/\n.claude/\n.cursor\n.agents/\n',
      'utf-8',
    )

    await runUpdate({ force: true })

    expect(fs.readFileSync(path.join(projectDir, '.gitignore'), 'utf-8')).toBe('node_modules/\n')
    expect(fs.readFileSync(commandPath, 'utf-8')).toBe(
      fs.readFileSync(path.join(updateTestState.templatesDir, commandRelativePath), 'utf-8'),
    )
  })

  it('should fail before copying assets when source metadata has mixed changes and errors', async () => {
    const configPath = path.join(projectDir, 'openspec', 'config.yaml')
    fs.writeFileSync(configPath, 'schema: superpowers-lite\n', 'utf-8')
    const brokenMetadata = path.join(
      projectDir,
      'openspec',
      'changes',
      'broken',
      '.openspec.yaml',
    )
    fs.mkdirSync(path.dirname(brokenMetadata), { recursive: true })
    fs.writeFileSync(brokenMetadata, 'schema: [unterminated\n', 'utf-8')

    await expect(runUpdate({ force: true })).rejects.toThrow('源文件无法解析')

    expect(fs.readFileSync(configPath, 'utf-8')).toBe('schema: superpowers-lite\n')
    expect(fs.existsSync(path.join(projectDir, '.harness', skillRelativePath))).toBe(false)
    expect(fs.existsSync(path.join(projectDir, '.harness', commandRelativePath))).toBe(false)
  })

  it('should install a valid template schema before migrating a legacy selector', async () => {
    fs.rmSync(path.join(projectDir, 'openspec', 'schemas', 'full'), {
      recursive: true,
      force: true,
    })
    fs.writeFileSync(
      path.join(projectDir, 'openspec', 'config.yaml'),
      'schema: superpowers-lite\n',
      'utf-8',
    )

    await runUpdate({ force: true })

    expect(fs.existsSync(
      path.join(projectDir, 'openspec', 'schemas', 'full', 'schema.yaml'),
    )).toBe(true)
    expect(YAML.parse(fs.readFileSync(
      path.join(projectDir, 'openspec', 'config.yaml'),
      'utf-8',
    ))).toMatchObject({
      schema: 'full',
      context: expect.stringContaining('全局规则'),
    })
  })

  it('should preserve an explicit full root schema during update', async () => {
    fs.writeFileSync(
      path.join(projectDir, 'openspec', 'config.yaml'),
      'schema: full\nproject: legacy-project\n',
      'utf-8',
    )
    await runUpdate({ force: true })

    expect(YAML.parse(fs.readFileSync(
      path.join(projectDir, 'openspec', 'config.yaml'),
      'utf-8',
    ))).toMatchObject({
      schema: 'full',
      project: 'legacy-project',
      context: expect.stringContaining('全局规则'),
    })
  })

  it('should clear old schema version keys and finish migration after one update', async () => {
    const versions = getBuiltinVersions()
    for (const schema of ['lite', 'full']) {
      const legacy = `harness-${schema}`
      versions.schemas[legacy] = versions.schemas[schema]!
      delete versions.schemas[schema]
      fs.renameSync(
        path.join(projectDir, 'openspec', 'schemas', schema),
        path.join(projectDir, 'openspec', 'schemas', legacy),
      )
    }
    writeVersions(projectDir, versions)
    fs.writeFileSync(path.join(projectDir, 'openspec', 'config.yaml'), 'schema: harness-full\n')

    await runUpdate({ force: true })

    expect(readVersions(projectDir)?.schemas).toEqual(getBuiltinVersions().schemas)
    expect(planLegacyMigrations(projectDir).hasChanges).toBe(false)
    const output: string[] = []
    const stdout = vi.spyOn(process.stdout, 'write').mockImplementation(chunk => {
      output.push(String(chunk))
      return true
    })
    vi.mocked(prompts.log.success).mockClear()
    try {
      await runUpdate()
      const messages = output.join('') + vi.mocked(prompts.log.success).mock.calls.flat().join('')
      expect(messages).toContain('所有组件已是最新版本')
    } finally {
      stdout.mockRestore()
    }
  })

  it.each(['lite', 'full'])('should preserve an unregistered custom %s schema before updating any assets', async schema => {
    const versions = readVersions(projectDir)!
    delete versions.schemas[schema]
    writeVersions(projectDir, versions)
    const customPath = path.join(projectDir, 'openspec', 'schemas', schema, 'custom.md')
    fs.writeFileSync(customPath, 'user-owned workflow\n')

    await expect(runUpdate({ force: true })).rejects.toThrow('请先重命名自定义 schema')

    expect(fs.readFileSync(customPath, 'utf-8')).toBe('user-owned workflow\n')
    expect(fs.existsSync(path.join(projectDir, '.harness', skillRelativePath))).toBe(false)
    expect(readVersions(projectDir)).toEqual(versions)
  })

  it('should auto-commit a clean gitignore-only migration', async () => {
    copyTemplateSkills(path.join(projectDir, '.harness', 'skills'))
    copyTemplateCommands(path.join(projectDir, '.harness', 'commands'))
    writeVersions(projectDir, getBuiltinVersions())
    fs.writeFileSync(path.join(projectDir, '.gitignore'), '.claude/\nnode_modules/\n', 'utf-8')
    const template = fs.readFileSync(path.join(updateTestState.templatesDir, 'agents-md.md'), 'utf-8')
      .replace('{{SUBMODULE_SECTION}}', '')
    fs.writeFileSync(
      path.join(projectDir, 'AGENTS.md'),
      cleanAgentsMdSlots(template, [template]),
      'utf-8',
    )
    execFileSync('git', ['init', '-q'], { cwd: projectDir })
    execFileSync('git', ['config', 'user.name', 'DevKeel Test'], { cwd: projectDir })
    execFileSync('git', ['config', 'user.email', 'harness@example.com'], { cwd: projectDir })
    execFileSync('git', ['add', '.'], { cwd: projectDir })
    execFileSync('git', ['commit', '-qm', 'baseline'], { cwd: projectDir })
    vi.mocked(prompts.confirm).mockResolvedValueOnce(true)

    await runUpdate({ force: true })

    expect(execFileSync(
      'git',
      ['show', 'HEAD:.gitignore'],
      { cwd: projectDir, encoding: 'utf-8' },
    )).toBe('node_modules/\n')
    expect(execFileSync(
      'git',
      ['show', '--format=', '--name-only', 'HEAD'],
      { cwd: projectDir, encoding: 'utf-8' },
    ).trim()).toBe('.gitignore')
  })

  it('should preserve but not auto-commit a pre-existing dirty gitignore', async () => {
    copyTemplateSkills(path.join(projectDir, '.harness', 'skills'))
    copyTemplateCommands(path.join(projectDir, '.harness', 'commands'))
    writeVersions(projectDir, getBuiltinVersions())
    const gitignorePath = path.join(projectDir, '.gitignore')
    fs.writeFileSync(gitignorePath, '.claude/\nnode_modules/\n', 'utf-8')
    execFileSync('git', ['init', '-q'], { cwd: projectDir })
    execFileSync('git', ['config', 'user.name', 'DevKeel Test'], { cwd: projectDir })
    execFileSync('git', ['config', 'user.email', 'harness@example.com'], { cwd: projectDir })
    execFileSync('git', ['add', '.'], { cwd: projectDir })
    execFileSync('git', ['commit', '-qm', 'baseline'], { cwd: projectDir })
    fs.appendFileSync(gitignorePath, 'user-pattern/\n', 'utf-8')
    vi.mocked(prompts.confirm).mockResolvedValueOnce(true)

    await runUpdate({ force: true })

    expect(fs.readFileSync(gitignorePath, 'utf-8')).toBe('node_modules/\nuser-pattern/\n')
    expect(execFileSync(
      'git',
      ['show', 'HEAD:.gitignore'],
      { cwd: projectDir, encoding: 'utf-8' },
    )).toBe('.claude/\nnode_modules/\n')
  })

  it('should migrate discussion assets while preserving a skipped component version', async () => {
    const versions = readVersions(projectDir)!
    versions.skills['brainstorming'] = '6.0.3'
    versions.skills['grilling'] = '6.0.3'
    versions.skills['openspec-explore'] = '6.0.3'
    writeVersions(projectDir, versions)
    for (const skill of ['brainstorming', 'grilling', 'openspec-explore']) {
      const skillFile = path.join(projectDir, '.harness', 'skills', skill, 'SKILL.md')
      fs.mkdirSync(path.dirname(skillFile), { recursive: true })
      fs.writeFileSync(skillFile, `legacy ${skill}\n`, 'utf-8')
    }
    fs.writeFileSync(
      path.join(projectDir, '.harness', 'commands', 'opsx', 'explore.md'),
      'legacy explore\n',
    )
    vi.mocked(prompts.select)
      .mockResolvedValueOnce('each')
      .mockResolvedValueOnce('skip')

    await runUpdate()

    expect(readVersions(projectDir)?.skills['brainstorming']).toBe(getBuiltinVersions().skills['brainstorming'])
    expect(readVersions(projectDir)?.skills[skillName]).toBeUndefined()
    expect(fs.existsSync(path.join(projectDir, '.harness', 'skills', 'grilling'))).toBe(false)
    expect(fs.existsSync(path.join(projectDir, '.harness', 'skills', 'openspec-explore'))).toBe(false)
  })

  it('should install the current brainstorming version through the regular managed update path', async () => {
    const { skillPath, commandPath } = installBrainstorming700()
    fs.rmSync(commandPath)
    vi.mocked(prompts.select)
      .mockResolvedValueOnce('each')
      .mockResolvedValueOnce('update')

    await runUpdate()

    expect(readVersions(projectDir)?.skills['brainstorming']).toBe(getBuiltinVersions().skills['brainstorming'])
    expect(fs.readFileSync(skillPath, 'utf-8')).toBe(
      fs.readFileSync(
        path.join(updateTestState.templatesDir, 'skills', 'brainstorming', 'SKILL.md'),
        'utf-8',
      ),
    )
    expect(fs.readFileSync(commandPath, 'utf-8')).toBe(
      fs.readFileSync(
        path.join(updateTestState.templatesDir, 'commands', 'opsx', 'explore.md'),
        'utf-8',
      ),
    )
  })

  it('should preserve brainstorming 7.0.0 when its regular update is skipped', async () => {
    const {
      skillPath,
      legacyContent,
      commandPath,
      legacyCommandContent,
    } = installBrainstorming700()
    vi.mocked(prompts.select)
      .mockResolvedValueOnce('each')
      .mockResolvedValueOnce('skip')

    await runUpdate()

    expect(readVersions(projectDir)?.skills['brainstorming']).toBe('7.0.0')
    expect(fs.readFileSync(skillPath, 'utf-8')).toBe(legacyContent)
    expect(fs.readFileSync(commandPath, 'utf-8')).toBe(legacyCommandContent)
  })

  it('should recover an older interrupted repair before applying a newer template update', async () => {
    const { skillPath, commandPath } = writeInterruptedDiscussionRepair()
    const dynamicTemplates = createDiscussionTemplatesAt(updateTestState.templatesDir, '8.1.0')
    updateTestState.templatesDir = dynamicTemplates
    vi.mocked(prompts.select).mockResolvedValueOnce('all')

    try {
      await runUpdate()

      expect(readVersions(projectDir)?.skills['brainstorming']).toBe('8.1.0')
      expect(fs.readFileSync(path.join(skillPath, 'SKILL.md'), 'utf-8')).toBe(
        fs.readFileSync(
          path.join(dynamicTemplates, 'skills', 'brainstorming', 'SKILL.md'),
          'utf-8',
        ),
      )
      expect(fs.readFileSync(commandPath, 'utf-8')).toBe(
        fs.readFileSync(
          path.join(dynamicTemplates, 'commands', 'opsx', 'explore.md'),
          'utf-8',
        ),
      )
      expect(fs.existsSync(
        path.join(projectDir, '.harness', '.discussion-skill-migration.json'),
      )).toBe(false)
    } finally {
      fs.rmSync(dynamicTemplates, { recursive: true, force: true })
    }
  })

  it('should roll back an interrupted repair before rejecting an invalid target version', async () => {
    const {
      skillPath,
      damagedSkillContent,
      commandPath,
      damagedCommandContent,
    } = writeInterruptedDiscussionRepair()
    const originalVersion = readVersions(projectDir)?.skills['brainstorming']
    const invalidTemplates = createDiscussionTemplatesAt(updateTestState.templatesDir, 'future')
    updateTestState.templatesDir = invalidTemplates

    try {
      await expect(runUpdate()).rejects.toThrow('三段 semver')
      expect(fs.readFileSync(path.join(skillPath, 'SKILL.md'), 'utf-8'))
        .toBe(damagedSkillContent)
      expect(fs.readFileSync(commandPath, 'utf-8')).toBe(damagedCommandContent)
      expect(readVersions(projectDir)?.skills['brainstorming']).toBe(originalVersion)
      expect(fs.existsSync(
        path.join(projectDir, '.harness', '.discussion-skill-migration.json'),
      )).toBe(false)
    } finally {
      fs.rmSync(invalidTemplates, { recursive: true, force: true })
    }
  })

  it('should keep an interrupted repair untouched during dry-run', async () => {
    writeInterruptedDiscussionRepair()
    const originalVersion = readVersions(projectDir)?.skills['brainstorming']
    const dynamicTemplates = createDiscussionTemplatesAt(updateTestState.templatesDir, '8.1.0')
    updateTestState.templatesDir = dynamicTemplates
    const journalPath = path.join(
      projectDir,
      '.harness',
      '.discussion-skill-migration.json',
    )
    const journalContent = fs.readFileSync(journalPath, 'utf-8')

    try {
      await runUpdate({ dryRun: true })

      expect(fs.readFileSync(journalPath, 'utf-8')).toBe(journalContent)
      expect(fs.existsSync(path.join(
        projectDir,
        '.harness',
        'skills',
        '.brainstorming.discussion-backup-interrupted',
      ))).toBe(true)
      expect(readVersions(projectDir)?.skills['brainstorming']).toBe(originalVersion)
    } finally {
      fs.rmSync(dynamicTemplates, { recursive: true, force: true })
    }
  })

  it('should retry AGENTS framework drift after a refused update', async () => {
    copyTemplateSkills(path.join(projectDir, '.harness', 'skills'))
    copyTemplateCommands(path.join(projectDir, '.harness', 'commands'))
    writeVersions(projectDir, getBuiltinVersions())
    const agentsPath = path.join(projectDir, 'AGENTS.md')
    const currentTemplate = fs.readFileSync(
      path.join(updateTestState.templatesDir, 'agents-md.md'),
      'utf-8',
    ).replace('{{SUBMODULE_SECTION}}', '')
    const drifted = currentTemplate.replace('# AGENTS.md — Agent 执行契约', '# AGENTS.md — old framework')
    fs.writeFileSync(agentsPath, drifted, 'utf-8')
    vi.mocked(prompts.confirm).mockResolvedValueOnce(false)

    await runUpdate()

    expect(fs.readFileSync(agentsPath, 'utf-8')).toBe(drifted)
    vi.mocked(prompts.confirm)
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(false)

    await runUpdate()

    expect(fs.readFileSync(agentsPath, 'utf-8')).toBe(cleanAgentsMdSlots(currentTemplate, [currentTemplate]))
  })

  it('should treat a missing AGENTS file as retryable framework drift', async () => {
    copyTemplateSkills(path.join(projectDir, '.harness', 'skills'))
    copyTemplateCommands(path.join(projectDir, '.harness', 'commands'))
    writeVersions(projectDir, getBuiltinVersions())
    const agentsPath = path.join(projectDir, 'AGENTS.md')

    expect(hasAgentsFrameworkDrift(projectDir)).toBe(true)
    await runUpdate()
    expect(fs.existsSync(agentsPath)).toBe(false)
    expect(hasAgentsFrameworkDrift(projectDir)).toBe(true)

    await runUpdate({ force: true })

    expect(fs.existsSync(agentsPath)).toBe(true)
    expect(hasAgentsFrameworkDrift(projectDir)).toBe(false)
  })

  it.each(['main', 'domain'] as const)('preserves docs and every knowledge slot when updating a %s template', async repoType => {
    const docsPath = path.join(projectDir, 'docs', 'testing.md')
    const knowledge = '# Tests\n\nProject-owned verification notes.\n'
    fs.mkdirSync(path.dirname(docsPath), { recursive: true })
    fs.writeFileSync(docsPath, knowledge)
    const templateName = repoType === 'main' ? 'agents-md.md' : 'agents-domain-md.md'
    const template = fs.readFileSync(path.join(updateTestState.templatesDir, templateName), 'utf-8')
      .replace('{{SUBMODULE_SECTION}}', '')
    const slots = ['routing', 'verification', 'project']
    let current = template
    for (const slot of slots) {
      current = current.replace(
        `<!-- harness:user:${slot} -->`,
        `<!-- harness:user:${slot} -->\n${slot}: [Tests](docs/testing.md)\n`,
      )
    }
    const agentsPath = path.join(projectDir, 'AGENTS.md')
    fs.writeFileSync(agentsPath, current.replace('# AGENTS.md', '# Legacy AGENTS.md'))

    await runUpdate({ force: true })

    const cleaned = cleanAgentsMdSlots(current, [template])
    expect(fs.readFileSync(agentsPath, 'utf-8')).toBe(cleaned)
    for (const slot of slots) expect(cleaned).not.toContain(`harness:user:${slot}`)
    expect(fs.readFileSync(docsPath, 'utf-8')).toBe(knowledge)
    expect(hasAgentsFrameworkDrift(projectDir)).toBe(false)

    await runUpdate({ force: true })
    expect(fs.readFileSync(agentsPath, 'utf-8')).toBe(cleaned)
  })
})

describe('deprecated asset detection', () => {
  let tmpDir: string

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'harness-update-test-'))
    copyTemplateSkills(path.join(tmpDir, '.harness', 'skills'))
    copyTemplateCommands(path.join(tmpDir, '.harness', 'commands'))
    fs.mkdirSync(path.join(tmpDir, '.harness', 'agents'), { recursive: true })
    copyTemplateRules(path.join(tmpDir, '.harness', 'rules'))
    writeVersions(tmpDir, getBuiltinVersions())
  })

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true })
  })

  describe('detectDeprecatedAssets', () => {
    it('should detect deprecated skill directories', () => {
      const versions = getBuiltinVersions()
      versions.skills['old-skill'] = '1.0.0'
      writeVersions(tmpDir, versions)

      fs.mkdirSync(path.join(tmpDir, '.harness', 'skills', 'old-skill'), { recursive: true })
      fs.writeFileSync(path.join(tmpDir, '.harness', 'skills', 'old-skill', 'SKILL.md'), '---\nname: old-skill\n---\n')

      const deprecated = detectDeprecatedAssets(tmpDir)

      const names = deprecated.map(d => d.name)
      expect(names).toContain('old-skill')
    })

    it('should not flag user-created assets without harness marker', () => {
      fs.mkdirSync(path.join(tmpDir, '.harness', 'skills', 'my-custom-skill'), { recursive: true })
      fs.writeFileSync(path.join(tmpDir, '.harness', 'skills', 'my-custom-skill', 'SKILL.md'), '---\nname: my-custom-skill\n---\n')

      const deprecated = detectDeprecatedAssets(tmpDir)

      const names = deprecated.map(d => d.name)
      expect(names).not.toContain('my-custom-skill')
    })

    it('should not flag files that exist in templates', () => {
      const deprecated = detectDeprecatedAssets(tmpDir)

      const names = deprecated.map(d => d.name)
      expect(names).not.toContain('commit')
      expect(names).not.toContain('requirement-analysis')
    })

    it('should return empty when all assets match templates', () => {
      const deprecated = detectDeprecatedAssets(tmpDir)

      expect(deprecated).toHaveLength(0)
    })

    it('should handle missing harness directories', () => {
      const emptyDir = fs.mkdtempSync(path.join(os.tmpdir(), 'harness-empty-'))
      try {
        const deprecated = detectDeprecatedAssets(emptyDir)
        expect(deprecated).toHaveLength(0)
      } finally {
        fs.rmSync(emptyDir, { recursive: true, force: true })
      }
    })
  })

  describe('removeDeprecatedAssets', () => {
    it('should remove deprecated files', () => {
      fs.writeFileSync(path.join(tmpDir, '.harness', 'agents', 'stage-reviewer.md'), '')

      const assets = [{ category: 'agents' as const, name: 'stage-reviewer.md', relativePath: '.harness/agents/stage-reviewer.md' }]
      removeDeprecatedAssets(tmpDir, assets)

      expect(fs.existsSync(path.join(tmpDir, '.harness', 'agents', 'stage-reviewer.md'))).toBe(false)
    })

    it('should remove deprecated directories recursively', () => {
      fs.mkdirSync(path.join(tmpDir, '.harness', 'skills', 'old-skill'), { recursive: true })
      fs.writeFileSync(path.join(tmpDir, '.harness', 'skills', 'old-skill', 'SKILL.md'), '')

      const assets = [{ category: 'skills' as const, name: 'old-skill', relativePath: '.harness/skills/old-skill' }]
      removeDeprecatedAssets(tmpDir, assets)

      expect(fs.existsSync(path.join(tmpDir, '.harness', 'skills', 'old-skill'))).toBe(false)
    })

    it('should not fail on already-removed assets', () => {
      const assets = [{ category: 'agents' as const, name: 'nonexistent.md', relativePath: '.harness/agents/nonexistent.md' }]
      expect(() => removeDeprecatedAssets(tmpDir, assets)).not.toThrow()
    })
  })
})

describe.each([
  { skill: 'architecture-diagram', version: '1.1' },
  { skill: 'human-review', version: '1.0.1' },
])('version-driven retired skill cleanup: $skill', ({ skill, version }) => {
  let projectDir: string

  function writeProjectSkill(content: string, registered = true): void {
    const skillFile = path.join(projectDir, '.harness', 'skills', skill, 'SKILL.md')
    fs.mkdirSync(path.dirname(skillFile), { recursive: true })
    fs.writeFileSync(skillFile, content, 'utf-8')
    writeVersions(projectDir, {
      harness: 'old',
      skills: registered ? { [skill]: version } : {},
      agents: {},
      rules: {},
      schemas: {},
    })
  }

  beforeEach(() => {
    projectDir = fs.mkdtempSync(path.join(os.tmpdir(), 'harness-retired-project-'))
  })

  afterEach(() => {
    fs.rmSync(projectDir, { recursive: true, force: true })
  })

  it('should delete a retired skill directory directly when the version table drops it', () => {
    writeProjectSkill(`---\nname: ${skill}\ndescription: custom\n---\n`, false)

    const plan = planLegacyMigrations(projectDir)
    expect(plan.hasChanges).toBe(true)
    expect(plan.errors).toEqual([])
    expect(plan.removePaths).toEqual([`.harness/skills/${skill}`])
    expect(plan.preservedPaths).toEqual([])

    const result = applyLegacyMigrations(projectDir, plan)
    expect(result.changedPaths).toEqual([`.harness/skills/${skill}`])
    expect(result.preservedPaths).toEqual([])
    expect(fs.existsSync(path.join(projectDir, '.harness', 'skills', skill))).toBe(false)

    writeVersions(projectDir, {
      harness: 'new', skills: {}, agents: {}, rules: {}, schemas: {},
    })
    const secondPlan = planLegacyMigrations(projectDir)
    expect(secondPlan.hasChanges).toBe(false)
    expect(secondPlan.removePaths).toEqual([])
    expect(secondPlan.preservedPaths).toEqual([])
    expect(applyLegacyMigrations(projectDir, secondPlan).changedPaths).toEqual([])
  })

  it('should still delete a retired skill directory after versions.yml has already moved on', () => {
    writeProjectSkill(`---\nname: ${skill}\ndescription: managed snapshot\n---\n`)
    writeVersions(projectDir, {
      harness: 'new', skills: {}, agents: {}, rules: {}, schemas: {},
    })

    const plan = planLegacyMigrations(projectDir)

    expect(plan.hasChanges).toBe(true)
    expect(plan.errors).toEqual([])
    expect(plan.removePaths).toEqual([`.harness/skills/${skill}`])
    expect(plan.preservedPaths).toEqual([])

    const result = applyLegacyMigrations(projectDir, plan)
    expect(result.changedPaths).toEqual([`.harness/skills/${skill}`])
    expect(result.preservedPaths).toEqual([])
    expect(fs.existsSync(path.join(projectDir, '.harness', 'skills', skill))).toBe(false)

    const secondResult = applyLegacyMigrations(projectDir, plan)
    expect(secondResult.changedPaths).toEqual([])
  })

  it('should reject an in-repository skills symlink without deleting its retired-name target', () => {
    writeVersions(projectDir, {
      harness: 'new', skills: {}, agents: {}, rules: {}, schemas: {},
    })
    const vaultSkill = path.join(projectDir, 'vault', skill)
    fs.mkdirSync(vaultSkill, { recursive: true })
    fs.writeFileSync(path.join(vaultSkill, 'SKILL.md'), 'keep\n', 'utf-8')
    fs.symlinkSync(
      path.join(projectDir, 'vault'),
      path.join(projectDir, '.harness', 'skills'),
      process.platform === 'win32' ? 'junction' : 'dir',
    )

    const plan = planLegacyMigrations(projectDir)

    expect(plan.removePaths).toEqual([`.harness/skills/${skill}`])
    expect(() => applyLegacyMigrations(projectDir, plan)).toThrow('不安全路径')
    expect(fs.readFileSync(path.join(vaultSkill, 'SKILL.md'), 'utf-8')).toBe('keep\n')
  })
})

describe('detectUpdates', () => {
  let tmpDir: string

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'harness-detect-updates-'))
    const builtin = getBuiltinVersions()
    writeVersions(tmpDir, builtin)
    copyTemplateSkills(path.join(tmpDir, '.harness', 'skills'))
    copyTemplateCommands(path.join(tmpDir, '.harness', 'commands'))
    fs.mkdirSync(path.join(tmpDir, '.harness', 'agents'), { recursive: true })
    copyTemplateRules(path.join(tmpDir, '.harness', 'rules'))
    for (const schema of ['full', 'lite']) {
      fs.mkdirSync(path.join(tmpDir, 'openspec', 'schemas', schema), { recursive: true })
      fs.writeFileSync(
        path.join(tmpDir, 'openspec', 'schemas', schema, 'schema.yaml'),
        `name: ${schema}\n`,
      )
    }
  })

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true })
  })

  it('should return empty when all up to date', () => {
    const updates = detectUpdates(tmpDir)
    expect(updates).toHaveLength(0)
  })

  it('should include every managed component when force is enabled', () => {
    const builtin = getBuiltinVersions()
    const updates = detectUpdates(tmpDir, true)
    const managedCount = Object.keys(builtin.skills).length
      + Object.keys(builtin.agents).length
      + Object.keys(builtin.rules).length
      + Object.keys(builtin.schemas).length
      + 1

    expect(updates).toHaveLength(managedCount)
    expect(updates).toContainEqual({
      category: 'skills',
      name: 'commit',
      from: `${builtin.skills['commit']} (force)`,
      to: builtin.skills['commit'],
    })
    expect(updates).toContainEqual({
      category: 'core',
      name: 'harness',
      from: `${builtin.harness} (force)`,
      to: builtin.harness,
    })
  })

  it('should limit forced domain updates to the harness core', () => {
    const builtin = filterManagedVersions(getBuiltinVersions(), 'domain')
    writeVersions(tmpDir, builtin)

    expect(detectUpdates(tmpDir, true, undefined, builtin)).toEqual([
      {
        category: 'core',
        name: 'harness',
        from: `${builtin.harness} (force)`,
        to: builtin.harness,
      },
    ])
  })

  it('should detect version mismatch', () => {
    const versions = getBuiltinVersions()
    versions.skills['commit'] = '0.0.1'
    writeVersions(tmpDir, versions)

    const updates = detectUpdates(tmpDir)
    const commitUpdate = updates.find(u => u.name === 'commit')
    expect(commitUpdate).toBeDefined()
    expect(commitUpdate!.from).toBe('0.0.1')
  })

  it('should detect missing target directory when version matches', () => {
    fs.rmSync(path.join(tmpDir, 'openspec', 'schemas', 'full'), { recursive: true })

    const updates = detectUpdates(tmpDir)
    const schemaUpdate = updates.find(u => u.name === 'full')
    expect(schemaUpdate).toBeDefined()
    expect(schemaUpdate!.from).toContain('(files missing)')
  })
})

describe('discussion skill migration', () => {
  const templatesDir = path.join(process.cwd(), 'templates')
  let tmpDir: string

  function writeLegacyDiscussionState(): string {
    const versions = getBuiltinVersions()
    versions.skills['brainstorming'] = '6.0.3'
    versions.skills['grilling'] = '6.0.3'
    versions.skills['openspec-explore'] = '6.0.3'
    writeVersions(tmpDir, versions)

    const skillRoot = path.join(tmpDir, '.harness', 'skills')
    for (const skill of ['brainstorming', 'grilling', 'openspec-explore']) {
      const skillFile = path.join(skillRoot, skill, 'SKILL.md')
      fs.mkdirSync(path.dirname(skillFile), { recursive: true })
      fs.writeFileSync(skillFile, `legacy ${skill}\n`, 'utf-8')
    }
    fs.writeFileSync(path.join(skillRoot, 'brainstorming', 'extra.md'), 'remove me\n', 'utf-8')
    const command = path.join(tmpDir, '.harness', 'commands', 'opsx', 'explore.md')
    fs.mkdirSync(path.dirname(command), { recursive: true })
    fs.writeFileSync(command, 'legacy explore\n', 'utf-8')
    return fs.readFileSync(path.join(tmpDir, '.harness', 'versions.yml'), 'utf-8')
  }

  function expectNoDiscussionResidue(): void {
    const harnessRoot = path.join(tmpDir, '.harness')
    const pending = fs.readdirSync(harnessRoot, { recursive: true, encoding: 'utf-8' })
      .filter(entry => String(entry).includes('.discussion-'))
    expect(pending).toEqual([])
    expect(fs.existsSync(path.join(harnessRoot, '.discussion-skill-migration.json'))).toBe(false)
  }

  function createManualDiscussionEntries(): Array<Record<string, unknown>> {
    return [
      {
        kind: 'replace',
        target: '.harness/skills/brainstorming',
        backup: '.harness/skills/.brainstorming.discussion-backup-manual',
        stage: '.harness/skills/.brainstorming.discussion-stage-manual',
        originalExisted: true,
      },
      {
        kind: 'replace',
        target: '.harness/commands/opsx/explore.md',
        backup: '.harness/commands/opsx/.explore.md.discussion-backup-manual',
        stage: '.harness/commands/opsx/.explore.md.discussion-stage-manual',
        originalExisted: true,
      },
      {
        kind: 'remove',
        target: '.harness/skills/grilling',
        backup: '.harness/skills/.grilling.discussion-backup-manual',
        originalExisted: true,
      },
      {
        kind: 'remove',
        target: '.harness/skills/openspec-explore',
        backup: '.harness/skills/.openspec-explore.discussion-backup-manual',
        originalExisted: true,
      },
    ]
  }

  function writeManualDiscussionJournal(
    phase: 'prepared' | 'assets-switched',
    originalVersionsContent: string,
    entries: Array<Record<string, unknown>>,
  ): void {
    fs.writeFileSync(
      path.join(tmpDir, '.harness', '.discussion-skill-migration.json'),
      JSON.stringify({ version: 1, phase, originalVersionsContent, entries }, null, 2) + '\n',
    )
  }

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'harness-discussion-migration-'))
  })

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true })
  })

  it('should atomically consolidate both old skills and remove stale brainstorming files', () => {
    writeLegacyDiscussionState()

    const result = applyDiscussionSkillMigration(tmpDir, templatesDir)

    expect(result.changedPaths).toEqual([
      '.harness/skills/brainstorming',
      '.harness/commands/opsx/explore.md',
      '.harness/skills/grilling',
      '.harness/skills/openspec-explore',
    ])
    expect(fs.existsSync(path.join(tmpDir, '.harness', 'skills', 'brainstorming', 'extra.md')))
      .toBe(false)
    for (const relativePath of [
      'skills/brainstorming/SKILL.md',
      'skills/brainstorming/references/openspec-context.md',
      'skills/brainstorming/scripts/openspec-status-snapshot.sh',
      'commands/opsx/explore.md',
    ]) {
      expect(fs.readFileSync(path.join(tmpDir, '.harness', relativePath), 'utf-8')).toBe(
        fs.readFileSync(path.join(templatesDir, relativePath), 'utf-8'),
      )
    }
    expect(fs.existsSync(path.join(tmpDir, '.harness', 'skills', 'grilling'))).toBe(false)
    expect(fs.existsSync(path.join(tmpDir, '.harness', 'skills', 'openspec-explore'))).toBe(false)
    expect(readVersions(tmpDir)?.skills['brainstorming']).toBe(getBuiltinVersions().skills['brainstorming'])
    expect(readVersions(tmpDir)?.skills['grilling']).toBeUndefined()
    expect(readVersions(tmpDir)?.skills['openspec-explore']).toBeUndefined()
    expectNoDiscussionResidue()

    expect(applyDiscussionSkillMigration(tmpDir, templatesDir)).toEqual({
      changedPaths: [],
      recovered: false,
    })
  })

  it('should derive the migration target from the template version registry', () => {
    writeLegacyDiscussionState()
    const dynamicTemplates = createDiscussionTemplatesAt(templatesDir, '7.3.0')

    try {
      expect(detectUpdates(tmpDir, false, dynamicTemplates)).toContainEqual({
        category: 'skills',
        name: 'brainstorming',
        from: '6.0.3',
        to: '7.3.0',
      })

      applyDiscussionSkillMigration(tmpDir, dynamicTemplates)

      expect(readVersions(tmpDir)?.skills['brainstorming']).toBe('7.3.0')
      expect(isDiscussionSkillMigrationRequired(tmpDir, dynamicTemplates)).toBe(false)
    } finally {
      fs.rmSync(dynamicTemplates, { recursive: true, force: true })
    }
  })

  it('should treat a future brainstorming version as a regular managed update', () => {
    writeVersions(tmpDir, getBuiltinVersions())
    copyTemplateSkills(path.join(tmpDir, '.harness', 'skills'))
    copyTemplateCommands(path.join(tmpDir, '.harness', 'commands'))
    const dynamicTemplates = createDiscussionTemplatesAt(templatesDir, '8.1.0')

    try {
      expect(isDiscussionSkillMigrationRequired(tmpDir, dynamicTemplates)).toBe(false)
      expect(detectUpdates(tmpDir, false, dynamicTemplates)).toContainEqual({
        category: 'skills',
        name: 'brainstorming',
        from: getBuiltinVersions().skills['brainstorming'],
        to: '8.1.0',
      })
      expect(applyDiscussionSkillMigration(tmpDir, dynamicTemplates)).toEqual({
        changedPaths: [],
        recovered: false,
      })
      expect(readVersions(tmpDir)?.skills['brainstorming']).toBe(getBuiltinVersions().skills['brainstorming'])
    } finally {
      fs.rmSync(dynamicTemplates, { recursive: true, force: true })
    }
  })

  it('should offer intact discussion assets from 7.1.0 as a regular managed update', () => {
    const versions = getBuiltinVersions()
    versions.skills['brainstorming'] = '7.1.0'
    writeVersions(tmpDir, versions)
    copyTemplateSkills(path.join(tmpDir, '.harness', 'skills'))
    copyTemplateCommands(path.join(tmpDir, '.harness', 'commands'))
    const installedSkill = path.join(
      tmpDir,
      '.harness',
      'skills',
      'brainstorming',
      'SKILL.md',
    )
    fs.writeFileSync(
      installedSkill,
      fs.readFileSync(installedSkill, 'utf-8').replace(`version: "${getBuiltinVersions().skills['brainstorming']}"`, 'version: "7.1.0"'),
      'utf-8',
    )

    expect(isDiscussionSkillMigrationRequired(tmpDir, templatesDir)).toBe(false)
    expect(detectUpdates(tmpDir)).toContainEqual({
      category: 'skills',
      name: 'brainstorming',
      from: '7.1.0',
      to: getBuiltinVersions().skills['brainstorming'],
    })
  })

  it('should repair damaged assets even when the version already matches the template', () => {
    const versions = getBuiltinVersions()
    writeVersions(tmpDir, versions)
    copyTemplateSkills(path.join(tmpDir, '.harness', 'skills'))
    copyTemplateCommands(path.join(tmpDir, '.harness', 'commands'))
    fs.rmSync(path.join(
      tmpDir,
      '.harness',
      'skills',
      'brainstorming',
      'references',
      'openspec-context.md',
    ))
    fs.writeFileSync(
      path.join(tmpDir, '.harness', 'commands', 'opsx', 'explore.md'),
      'damaged\n',
    )

    expect(isDiscussionSkillMigrationRequired(tmpDir, templatesDir)).toBe(true)
    expect(detectUpdates(tmpDir)).toContainEqual({
      category: 'skills',
      name: 'brainstorming',
      from: `${getBuiltinVersions().skills['brainstorming']} (migration required)`,
      to: getBuiltinVersions().skills['brainstorming'],
    })

    applyDiscussionSkillMigration(tmpDir, templatesDir)
    expect(isDiscussionSkillMigrationRequired(tmpDir, templatesDir)).toBe(false)
  })

  it('should restore exact old assets and versions when version commit fails', () => {
    const originalVersions = writeLegacyDiscussionState()

    expect(() => applyDiscussionSkillMigration(tmpDir, templatesDir, {
      beforeVersionsCommit: () => { throw new Error('injected failure') },
    })).toThrow('injected failure')

    expect(fs.readFileSync(path.join(tmpDir, '.harness', 'versions.yml'), 'utf-8'))
      .toBe(originalVersions)
    expect(fs.readFileSync(
      path.join(tmpDir, '.harness', 'skills', 'brainstorming', 'SKILL.md'),
      'utf-8',
    )).toBe('legacy brainstorming\n')
    expect(fs.readFileSync(
      path.join(tmpDir, '.harness', 'skills', 'brainstorming', 'extra.md'),
      'utf-8',
    )).toBe('remove me\n')
    expect(fs.existsSync(path.join(tmpDir, '.harness', 'skills', 'grilling'))).toBe(true)
    expect(fs.existsSync(path.join(tmpDir, '.harness', 'skills', 'openspec-explore'))).toBe(true)
    expect(fs.readFileSync(
      path.join(tmpDir, '.harness', 'commands', 'opsx', 'explore.md'),
      'utf-8',
    )).toBe('legacy explore\n')
    expectNoDiscussionResidue()
  })

  it('should recover an interrupted asset switch and converge on the canonical state', () => {
    const originalVersionsContent = writeLegacyDiscussionState()
    const entries = createManualDiscussionEntries()
    for (const entry of entries) {
      fs.renameSync(path.join(tmpDir, String(entry['target'])), path.join(tmpDir, String(entry['backup'])))
    }
    fs.cpSync(
      path.join(templatesDir, 'skills', 'brainstorming'),
      path.join(tmpDir, '.harness', 'skills', 'brainstorming'),
      { recursive: true },
    )
    fs.copyFileSync(
      path.join(templatesDir, 'commands', 'opsx', 'explore.md'),
      path.join(tmpDir, '.harness', 'commands', 'opsx', 'explore.md'),
    )
    writeManualDiscussionJournal('assets-switched', originalVersionsContent, entries)

    const result = applyDiscussionSkillMigration(tmpDir, templatesDir)

    expect(result.recovered).toBe(true)
    expect(readVersions(tmpDir)?.skills['brainstorming']).toBe(getBuiltinVersions().skills['brainstorming'])
    expect(fs.existsSync(path.join(tmpDir, '.harness', 'skills', 'grilling'))).toBe(false)
    expect(fs.existsSync(path.join(tmpDir, '.harness', 'skills', 'openspec-explore'))).toBe(false)
    expectNoDiscussionResidue()
  })

  it('should clean partial staging recorded before any target switch', () => {
    const originalVersionsContent = writeLegacyDiscussionState()
    const entries = createManualDiscussionEntries()
    const partialStage = path.join(
      tmpDir,
      '.harness',
      'skills',
      '.brainstorming.discussion-stage-manual',
    )
    fs.mkdirSync(partialStage)
    fs.writeFileSync(path.join(partialStage, 'partial.md'), 'partial\n')
    writeManualDiscussionJournal('prepared', originalVersionsContent, entries)

    const result = applyDiscussionSkillMigration(tmpDir, templatesDir)

    expect(result.recovered).toBe(true)
    expect(readVersions(tmpDir)?.skills['brainstorming']).toBe(getBuiltinVersions().skills['brainstorming'])
    expectNoDiscussionResidue()
  })

  it('should reject a symlinked skills parent without touching the external target', () => {
    const versions = getBuiltinVersions()
    versions.skills['brainstorming'] = '6.0.3'
    writeVersions(tmpDir, versions)
    const externalDir = fs.mkdtempSync(path.join(os.tmpdir(), 'harness-discussion-vault-'))
    const marker = path.join(externalDir, 'keep.md')
    fs.writeFileSync(marker, 'keep\n', 'utf-8')
    fs.symlinkSync(
      externalDir,
      path.join(tmpDir, '.harness', 'skills'),
      process.platform === 'win32' ? 'junction' : 'dir',
    )

    try {
      expect(() => applyDiscussionSkillMigration(tmpDir, templatesDir)).toThrow('不安全路径')
      expect(fs.readFileSync(marker, 'utf-8')).toBe('keep\n')
    } finally {
      fs.rmSync(externalDir, { recursive: true, force: true })
    }
  })

  it('should reject invalid source metadata before changing the project', () => {
    const originalVersions = writeLegacyDiscussionState()
    const invalidTemplates = fs.mkdtempSync(path.join(os.tmpdir(), 'harness-invalid-templates-'))
    fs.cpSync(templatesDir, invalidTemplates, { recursive: true })
    fs.writeFileSync(
      path.join(invalidTemplates, 'skills', 'brainstorming', 'SKILL.md'),
      '---\nname: brainstorming\nmetadata:\n  version: 6.0.3\n---\n',
    )

    try {
      expect(() => applyDiscussionSkillMigration(tmpDir, invalidTemplates)).toThrow('metadata 无效')
      expect(fs.readFileSync(path.join(tmpDir, '.harness', 'versions.yml'), 'utf-8'))
        .toBe(originalVersions)
      expect(fs.readFileSync(
        path.join(tmpDir, '.harness', 'skills', 'brainstorming', 'SKILL.md'),
        'utf-8',
      )).toBe('legacy brainstorming\n')
    } finally {
      fs.rmSync(invalidTemplates, { recursive: true, force: true })
    }
  })
})

describe('legacy migrations', () => {
  const retiredSkills = [
    'automated-instrumented-debugging',
    'receiving-code-review',
  ]
  let tmpDir: string

  function writeFile(relativePath: string, content: string): void {
    const filePath = path.join(tmpDir, relativePath)
    fs.mkdirSync(path.dirname(filePath), { recursive: true })
    fs.writeFileSync(filePath, content, 'utf-8')
  }

  function readYaml(relativePath: string): Record<string, unknown> {
    return YAML.parse(fs.readFileSync(path.join(tmpDir, relativePath), 'utf-8')) as Record<string, unknown>
  }

  function createLegacyProject(): void {
    writeFile('openspec/schemas/full/schema.yaml', 'name: full\nversion: 14\n')
    writeFile('openspec/schemas/superpowers-lite/schema.yaml', 'name: superpowers-lite\nversion: 14\n')
    writeFile('openspec/schemas/custom-flow/schema.yaml', 'name: custom-flow\nversion: 3\n')
    writeFile('openspec/config.yaml', 'schema: superpowers-lite\nproject: keep-me\n')
    writeFile('openspec/changes/active-change/.openspec.yaml', 'schema: superpowers-lite\ncreated: 2026-07-21\n')
    writeFile('openspec/changes/archive/2026-07-20-done/.openspec.yaml', 'schema: superpowers-lite\ncreated: 2026-07-20\n')
    writeFile('openspec/archive/2026-01-01-legacy/.openspec.yaml', 'schema: superpowers-lite\ncreated: 2026-01-01\n')
    writeFile('openspec/changes/custom-change/.openspec.yaml', 'schema: custom-flow\ncreated: 2026-07-19\n')
    writeFile('openspec/changes/archive/2026-07-20-done/tasks.md', 'schema: superpowers-lite\n')

    const versions = getBuiltinVersions()
    for (const skill of retiredSkills) versions.skills[skill] = '6.0.3'
    writeVersions(tmpDir, versions)
    for (const skill of retiredSkills) {
      writeFile(
        `.harness/skills/${skill}/SKILL.md`,
        `---\nname: ${skill}\nmetadata:\n  author: superpowers\n  version: 6.0.3\n---\n`,
      )
    }
    writeFile(
      '.harness/skills/systematic-debugging/SKILL.md',
      '---\nname: systematic-debugging\nmetadata:\n  author: "devkeel"\n  version: 1.0.0\n---\n',
    )
    writeFile('.harness/skills/my-custom-skill/SKILL.md', '---\nname: my-custom-skill\n---\n')
  }

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'harness-legacy-migration-'))
    createLegacyProject()
  })

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true })
  })

  it('should plan selectors and retire managed skill directories directly', () => {
    const plan = planLegacyMigrations(tmpDir)

    expect(plan.hasChanges).toBe(true)
    expect(plan.errors).toEqual([])
    expect(plan.fileUpdates.map(update => update.relativePath)).toEqual([
      'openspec/config.yaml',
      'openspec/archive/2026-01-01-legacy/.openspec.yaml',
      'openspec/changes/active-change/.openspec.yaml',
      'openspec/changes/archive/2026-07-20-done/.openspec.yaml',
    ])
    expect(plan.removePaths).toEqual([
      '.harness/skills/automated-instrumented-debugging',
      '.harness/skills/receiving-code-review',
      'openspec/schemas/superpowers-lite',
    ])
    expect(plan.preservedPaths).toEqual([])
    expect(readYaml('openspec/config.yaml')['schema']).toBe('superpowers-lite')
  })

  it('should apply exact selector migrations and delete retired skill directories', () => {
    const result = applyLegacyMigrations(tmpDir, planLegacyMigrations(tmpDir))

    expect(result.changedPaths).toEqual([
      'openspec/config.yaml',
      'openspec/archive/2026-01-01-legacy/.openspec.yaml',
      'openspec/changes/active-change/.openspec.yaml',
      'openspec/changes/archive/2026-07-20-done/.openspec.yaml',
      '.harness/skills/automated-instrumented-debugging',
      '.harness/skills/receiving-code-review',
      'openspec/schemas/superpowers-lite',
    ])
    expect(result.preservedPaths).toEqual([])
    expect(readYaml('openspec/config.yaml')).toEqual({ schema: 'full', project: 'keep-me' })
    expect(readYaml('openspec/changes/active-change/.openspec.yaml')['schema']).toBe('full')
    expect(readYaml('openspec/changes/archive/2026-07-20-done/.openspec.yaml')['schema']).toBe('full')
    expect(readYaml('openspec/archive/2026-01-01-legacy/.openspec.yaml')['schema']).toBe('full')
    expect(readYaml('openspec/changes/custom-change/.openspec.yaml')['schema']).toBe('custom-flow')
    expect(fs.readFileSync(path.join(tmpDir, 'openspec/changes/archive/2026-07-20-done/tasks.md'), 'utf-8')).toBe('schema: superpowers-lite\n')
    expect(fs.existsSync(path.join(tmpDir, 'openspec/schemas/custom-flow'))).toBe(true)
    expect(fs.existsSync(path.join(tmpDir, '.harness/skills/my-custom-skill'))).toBe(true)
    for (const skill of retiredSkills) {
      expect(fs.existsSync(path.join(tmpDir, '.harness', 'skills', skill))).toBe(false)
    }
    expect(fs.readdirSync(path.join(tmpDir, 'openspec')).some(name => name.includes('.legacy-migration-'))).toBe(false)
  })

  it('should retire the managed propose skill and its thin command together', () => {
    const versions = readVersions(tmpDir)!
    versions.skills['openspec-propose'] = '1.5'
    writeVersions(tmpDir, versions)
    writeFile(
      '.harness/skills/openspec-propose/SKILL.md',
      '---\nname: openspec-propose\nmetadata:\n  version: "1.5"\n---\n',
    )
    writeFile(
      '.harness/commands/opsx/propose.md',
      'Load and follow the `openspec-propose` skill.\n',
    )

    const plan = planLegacyMigrations(tmpDir)
    expect(plan.removePaths).toContain('.harness/skills/openspec-propose')
    expect(plan.removePaths).toContain('.harness/commands/opsx/propose.md')

    applyLegacyMigrations(tmpDir, plan)
    expect(fs.existsSync(path.join(tmpDir, '.harness', 'skills', 'openspec-propose'))).toBe(false)
    expect(fs.existsSync(path.join(tmpDir, '.harness', 'commands', 'opsx', 'propose.md'))).toBe(false)
  })

  it('should replace only the config schema scalar source range', () => {
    const originalConfig = [
      '# keep leading comment',
      "schema : 'superpowers-lite' # keep inline comment",
      'project:  &project',
      '  name: keep-me',
      'copy: *project',
      '',
    ].join('\r\n')
    writeFile('openspec/config.yaml', originalConfig)

    applyLegacyMigrations(tmpDir, planLegacyMigrations(tmpDir))

    expect(fs.readFileSync(path.join(tmpDir, 'openspec/config.yaml'), 'utf-8')).toBe(
      originalConfig.replace("'superpowers-lite'", "'full'"),
    )
  })

  it('should replace only an archived selector scalar source range', () => {
    const relativePath = 'openspec/changes/archive/2026-07-20-done/.openspec.yaml'
    const originalMetadata = [
      '# archived metadata',
      'created: 2026-07-20',
      'schema: "superpowers-lite" # keep workflow comment',
      'metadata: { owner: "team-a", note: "\\u0061" }',
      '',
    ].join('\n')
    writeFile(relativePath, originalMetadata)

    applyLegacyMigrations(tmpDir, planLegacyMigrations(tmpDir))

    expect(fs.readFileSync(path.join(tmpDir, relativePath), 'utf-8')).toBe(
      originalMetadata.replace('"superpowers-lite"', '"full"'),
    )
  })

  it('should skip a prepositioned temporary symlink collision without touching its target', () => {
    const firstRandom = Buffer.alloc(16, 0xaa)
    const nextRandom = Buffer.alloc(16, 0xbb)
    const victimPath = path.join(tmpDir, 'victim.txt')
    const collisionPath = path.join(
      tmpDir,
      'openspec',
      `.config.yaml.legacy-migration-${firstRandom.toString('hex')}`,
    )
    fs.writeFileSync(victimPath, 'keep me\n', 'utf-8')
    fs.symlinkSync(victimPath, collisionPath)
    const randomBytes = vi.spyOn(crypto, 'randomBytes')
      .mockReturnValueOnce(firstRandom)
      .mockReturnValue(nextRandom)
    const plan = planLegacyMigrations(tmpDir)

    try {
      applyLegacyMigrations(tmpDir, plan)

      expect(randomBytes).toHaveBeenCalledTimes(plan.fileUpdates.length + 1)
      expect(readYaml('openspec/config.yaml')['schema']).toBe('full')
      expect(fs.readFileSync(victimPath, 'utf-8')).toBe('keep me\n')
      expect(fs.lstatSync(collisionPath).isSymbolicLink()).toBe(true)
      expect(fs.existsSync(path.join(
        tmpDir,
        'openspec',
        `.config.yaml.legacy-migration-${nextRandom.toString('hex')}`,
      ))).toBe(false)
    } finally {
      randomBytes.mockRestore()
    }
  })

  it('should detect retired skill directories even after versions are current', () => {
    writeVersions(tmpDir, getBuiltinVersions())

    const plan = planLegacyMigrations(tmpDir)

    expect(plan.hasChanges).toBe(true)
    expect(plan.fileUpdates.map(update => update.relativePath)).toContain('openspec/config.yaml')
    expect(plan.removePaths).toContain('openspec/schemas/superpowers-lite')
    expect(plan.removePaths).toContain('.harness/skills/receiving-code-review')
    expect(plan.removePaths).not.toContain('.harness/skills/automated-instrumented-debugging')
    expect(plan.preservedPaths).toContain('.harness/skills/automated-instrumented-debugging')
  })

  it('should delete an unregistered upstream skill that reuses a retired name', () => {
    writeVersions(tmpDir, getBuiltinVersions())
    fs.rmSync(path.join(tmpDir, '.harness/skills/automated-instrumented-debugging'), { recursive: true })
    fs.rmSync(path.join(tmpDir, '.harness/skills/receiving-code-review'), { recursive: true })
    writeFile('.harness/skills/writing-plans/SKILL.md', '---\nname: writing-plans\nmetadata:\n  author: superpowers\n---\n')

    const plan = planLegacyMigrations(tmpDir)
    applyLegacyMigrations(tmpDir, plan)

    expect(plan.removePaths).toContain('.harness/skills/writing-plans')
    expect(fs.existsSync(path.join(tmpDir, '.harness/skills/writing-plans'))).toBe(false)
  })

  it('should resume a partial migration and report only actual changed paths', () => {
    writeFile('openspec/config.yaml', 'schema: full\nproject: keep-me\n')
    writeFile('openspec/changes/active-change/.openspec.yaml', 'schema: full\ncreated: 2026-07-21\n')
    fs.rmSync(path.join(tmpDir, '.harness/skills/automated-instrumented-debugging'), { recursive: true })

    const result = applyLegacyMigrations(tmpDir, planLegacyMigrations(tmpDir))

    expect(result.changedPaths).not.toContain('openspec/config.yaml')
    expect(result.changedPaths).not.toContain('openspec/changes/active-change/.openspec.yaml')
    expect(result.changedPaths).not.toContain('.harness/skills/automated-instrumented-debugging')
    expect(result.changedPaths).toContain('openspec/schemas/superpowers-lite')
  })

  it('should make a second application a no-op', () => {
    const plan = planLegacyMigrations(tmpDir)
    applyLegacyMigrations(tmpDir, plan)
    writeVersions(tmpDir, getBuiltinVersions())

    const secondPlan = planLegacyMigrations(tmpDir)
    const secondResult = applyLegacyMigrations(tmpDir, secondPlan)

    expect(secondPlan.hasChanges).toBe(false)
    expect(secondResult.changedPaths).toEqual([])
    expect(applyLegacyMigrations(tmpDir, plan).changedPaths).toEqual([])
  })

  it('should reject all changes when YAML metadata is damaged', () => {
    writeFile('openspec/changes/active-change/.openspec.yaml', 'schema: [unterminated\n')
    const originalConfig = fs.readFileSync(path.join(tmpDir, 'openspec/config.yaml'), 'utf-8')

    const plan = planLegacyMigrations(tmpDir)

    expect(plan.errors.map(error => error.relativePath)).toEqual([
      'openspec/changes/active-change/.openspec.yaml',
    ])
    expect(() => applyLegacyMigrations(tmpDir, plan)).toThrow('legacy migration')
    expect(fs.readFileSync(path.join(tmpDir, 'openspec/config.yaml'), 'utf-8')).toBe(originalConfig)
    expect(fs.existsSync(path.join(tmpDir, 'openspec/schemas/superpowers-lite'))).toBe(true)
    expect(fs.existsSync(path.join(tmpDir, '.harness/skills/systematic-debugging'))).toBe(true)
  })

  it('should preserve all legacy selectors when the lite target is damaged', () => {
    writeFile('openspec/schemas/lite/schema.yaml', 'name: [unterminated\n')
    writeFile('openspec/schemas/harness-lite/schema.yaml', 'name: harness-lite\n')
    writeFile('openspec/changes/lite-change/.openspec.yaml', 'schema: harness-lite\n')
    const originalConfig = fs.readFileSync(path.join(tmpDir, 'openspec/config.yaml'), 'utf-8')

    const plan = planLegacyMigrations(tmpDir)

    expect(plan.errors.map(error => error.relativePath)).toContain('openspec/schemas/lite/schema.yaml')
    expect(() => applyLegacyMigrations(tmpDir, plan)).toThrow('legacy migration')
    expect(fs.readFileSync(path.join(tmpDir, 'openspec/config.yaml'), 'utf-8')).toBe(originalConfig)
    expect(readYaml('openspec/changes/lite-change/.openspec.yaml')['schema']).toBe('harness-lite')
    expect(fs.existsSync(path.join(tmpDir, 'openspec/schemas/harness-lite'))).toBe(true)
    expect(fs.existsSync(path.join(tmpDir, 'openspec/schemas/superpowers-lite'))).toBe(true)
  })

  it('should keep the old schema when full schema is not parseable', () => {
    writeFile('openspec/schemas/full/schema.yaml', 'name: [unterminated\n')
    const originalConfig = fs.readFileSync(path.join(tmpDir, 'openspec/config.yaml'), 'utf-8')

    const plan = planLegacyMigrations(tmpDir)

    expect(plan.errors.map(error => error.relativePath)).toContain('openspec/schemas/full/schema.yaml')
    expect(() => applyLegacyMigrations(tmpDir, plan)).toThrow('legacy migration')
    expect(fs.readFileSync(path.join(tmpDir, 'openspec/config.yaml'), 'utf-8')).toBe(originalConfig)
    expect(fs.existsSync(path.join(tmpDir, 'openspec/schemas/superpowers-lite'))).toBe(true)
  })

  it('should reject all changes when full schema becomes damaged after planning', () => {
    const plan = planLegacyMigrations(tmpDir)
    const originalConfig = fs.readFileSync(path.join(tmpDir, 'openspec/config.yaml'), 'utf-8')
    writeFile('openspec/schemas/full/schema.yaml', 'name: [unterminated\n')

    expect(() => applyLegacyMigrations(tmpDir, plan)).toThrow('目标 schema 解析失败')
    expect(fs.readFileSync(path.join(tmpDir, 'openspec/config.yaml'), 'utf-8')).toBe(originalConfig)
    expect(fs.existsSync(path.join(tmpDir, 'openspec/schemas/superpowers-lite'))).toBe(true)
    expect(fs.existsSync(path.join(tmpDir, '.harness/skills/systematic-debugging'))).toBe(true)
  })

  it('should reject all changes when a legacy selector appears after planning', () => {
    const plan = planLegacyMigrations(tmpDir)
    const originalConfig = fs.readFileSync(path.join(tmpDir, 'openspec/config.yaml'), 'utf-8')
    writeFile('openspec/changes/late-change/.openspec.yaml', 'schema: superpowers-lite\n')

    expect(() => applyLegacyMigrations(tmpDir, plan)).toThrow('计划已过期')
    expect(fs.readFileSync(path.join(tmpDir, 'openspec/config.yaml'), 'utf-8')).toBe(originalConfig)
    expect(fs.existsSync(path.join(tmpDir, '.harness/skills/systematic-debugging'))).toBe(true)
    expect(fs.existsSync(path.join(tmpDir, 'openspec/schemas/superpowers-lite'))).toBe(true)
  })

  it('should reject all changes when metadata becomes damaged after planning', () => {
    const plan = planLegacyMigrations(tmpDir)
    const originalConfig = fs.readFileSync(path.join(tmpDir, 'openspec/config.yaml'), 'utf-8')
    writeFile('openspec/changes/late-change/.openspec.yaml', 'schema: [unterminated\n')

    expect(() => applyLegacyMigrations(tmpDir, plan)).toThrow('metadata 解析失败')
    expect(fs.readFileSync(path.join(tmpDir, 'openspec/config.yaml'), 'utf-8')).toBe(originalConfig)
    expect(fs.existsSync(path.join(tmpDir, '.harness/skills/systematic-debugging'))).toBe(true)
    expect(fs.existsSync(path.join(tmpDir, 'openspec/schemas/superpowers-lite'))).toBe(true)
  })

  it('should reject an empty removal path without deleting the project root', () => {
    const plan = {
      hasChanges: true,
      fileUpdates: [],
      removePaths: [''],
      errors: [],
    }

    expect(() => applyLegacyMigrations(tmpDir, plan)).toThrow('不安全路径')
    expect(fs.existsSync(tmpDir)).toBe(true)
  })

  it('should reject an absolute removal path inside the project', () => {
    const plan = {
      hasChanges: true,
      fileUpdates: [],
      removePaths: [path.join(tmpDir, '.harness')],
      errors: [],
    }

    expect(() => applyLegacyMigrations(tmpDir, plan)).toThrow('不安全路径')
    expect(fs.existsSync(path.join(tmpDir, '.harness'))).toBe(true)
  })

  it('should reject a managed-name skill path that escapes through a symlink or junction', () => {
    const externalSkills = fs.mkdtempSync(path.join(os.tmpdir(), 'harness-external-skills-'))
    try {
      fs.rmSync(path.join(tmpDir, '.harness', 'skills'), { recursive: true, force: true })
      const externalSkill = path.join(externalSkills, 'receiving-code-review')
      fs.mkdirSync(externalSkill, { recursive: true })
      fs.writeFileSync(
        path.join(externalSkill, 'SKILL.md'),
        '---\nname: receiving-code-review\nmetadata:\n  author: superpowers\n---\n',
      )
      fs.symlinkSync(
        externalSkills,
        path.join(tmpDir, '.harness', 'skills'),
        process.platform === 'win32' ? 'junction' : 'dir',
      )
      const plan = planLegacyMigrations(tmpDir)

      expect(plan.removePaths).toContain('.harness/skills/receiving-code-review')
      expect(() => applyLegacyMigrations(tmpDir, plan)).toThrow('不安全路径')
      expect(fs.existsSync(externalSkill)).toBe(true)
    } finally {
      fs.rmSync(externalSkills, { recursive: true, force: true })
    }
  })

  it('should preserve an unregistered legacy debugging skill after planning metadata changes', () => {
    const plan = planLegacyMigrations(tmpDir)
    const customSkill = '---\nname: automated-instrumented-debugging\nmetadata:\n  author: custom\n---\n'
    writeVersions(tmpDir, getBuiltinVersions())
    writeFile('.harness/skills/automated-instrumented-debugging/SKILL.md', customSkill)
    expect(() => applyLegacyMigrations(tmpDir, plan)).toThrow('未授权操作')
    expect(fs.readFileSync(
      path.join(tmpDir, '.harness/skills/automated-instrumented-debugging/SKILL.md'),
      'utf-8',
    )).toBe(customSkill)
    expect(readYaml('openspec/config.yaml')['schema']).toBe('superpowers-lite')
  })

  it('should reject a forged removal path inside the project', () => {
    applyLegacyMigrations(tmpDir, planLegacyMigrations(tmpDir))
    writeFile('custom-dir/keep.txt', 'keep\n')
    const plan = {
      hasChanges: true,
      fileUpdates: [],
      removePaths: ['custom-dir'],
      errors: [],
    }

    expect(() => applyLegacyMigrations(tmpDir, plan)).toThrow('未授权操作')
    expect(fs.existsSync(path.join(tmpDir, 'custom-dir/keep.txt'))).toBe(true)
  })

  it('should reject a forged file update inside the project', () => {
    applyLegacyMigrations(tmpDir, planLegacyMigrations(tmpDir))
    writeFile('notes.txt', 'keep\n')
    const plan = {
      hasChanges: true,
      fileUpdates: [{
        relativePath: 'notes.txt',
        originalContent: 'keep\n',
        updatedContent: 'overwritten\n',
      }],
      removePaths: [],
      errors: [],
    }

    expect(() => applyLegacyMigrations(tmpDir, plan)).toThrow('未授权操作')
    expect(fs.readFileSync(path.join(tmpDir, 'notes.txt'), 'utf-8')).toBe('keep\n')
  })

  it('should reject duplicate file updates that target the same path', () => {
    const plan = planLegacyMigrations(tmpDir)
    const configUpdate = plan.fileUpdates.find(update => update.relativePath === 'openspec/config.yaml')!
    plan.fileUpdates.push({
      relativePath: 'openspec/./config.yaml',
      originalContent: configUpdate.updatedContent,
      updatedContent: configUpdate.originalContent,
    })

    expect(() => applyLegacyMigrations(tmpDir, plan)).toThrow('重复操作')
    expect(fs.readFileSync(path.join(tmpDir, 'openspec/config.yaml'), 'utf-8')).toBe(configUpdate.originalContent)
  })
})

describe('collectCommitStagePaths', () => {
  let tmpDir: string

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'harness-stage-paths-'))
  })

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true })
  })

  it('should return empty when nothing relevant exists', () => {
    expect(collectCommitStagePaths(tmpDir)).toEqual([])
  })

  it('should include .harness and AGENTS.md when present', () => {
    fs.mkdirSync(path.join(tmpDir, '.harness'), { recursive: true })
    fs.writeFileSync(path.join(tmpDir, 'AGENTS.md'), '# agents')

    const paths = collectCommitStagePaths(tmpDir)
    expect(paths).toContain('.harness')
    expect(paths).toContain('AGENTS.md')
  })

  it('should stage only openspec base files and schemas, not changes/specs/archive', () => {
    fs.mkdirSync(path.join(tmpDir, 'openspec', 'schemas', 'superpowers-lite'), { recursive: true })
    fs.mkdirSync(path.join(tmpDir, 'openspec', 'changes', 'wip-change'), { recursive: true })
    fs.mkdirSync(path.join(tmpDir, 'openspec', 'specs', 'feat'), { recursive: true })
    fs.mkdirSync(path.join(tmpDir, 'openspec', 'archive', '2026-01-01-old'), { recursive: true })
    for (const file of ['config.yaml']) {
      fs.writeFileSync(path.join(tmpDir, 'openspec', file), '')
    }
    fs.writeFileSync(path.join(tmpDir, 'openspec', 'changes', 'wip-change', 'tasks.md'), 'in progress')

    const paths = collectCommitStagePaths(tmpDir)
    expect(paths).toContain('openspec/config.yaml')
    expect(paths).toContain('openspec/schemas')
    expect(paths.every(p => !p.startsWith('openspec/changes'))).toBe(true)
    expect(paths.every(p => !p.startsWith('openspec/specs'))).toBe(true)
    expect(paths.every(p => !p.startsWith('openspec/archive'))).toBe(true)
  })

  it('should not stage openspec when only changes/ exist without base files', () => {
    fs.mkdirSync(path.join(tmpDir, 'openspec', 'changes', 'wip-change'), { recursive: true })
    fs.writeFileSync(path.join(tmpDir, 'openspec', 'changes', 'wip-change', 'tasks.md'), 'in progress')

    const paths = collectCommitStagePaths(tmpDir)
    expect(paths.every(p => !p.startsWith('openspec'))).toBe(true)
  })

  it('should stage only metadata files actually changed by legacy migration', () => {
    const migratedMetadata = 'openspec/changes/wip-change/.openspec.yaml'
    const unrelatedMetadata = 'openspec/changes/other-change/.openspec.yaml'
    const userArtifact = 'openspec/changes/wip-change/tasks.md'
    for (const relativePath of [migratedMetadata, unrelatedMetadata, userArtifact]) {
      const filePath = path.join(tmpDir, relativePath)
      fs.mkdirSync(path.dirname(filePath), { recursive: true })
      fs.writeFileSync(filePath, relativePath)
    }

    const paths = collectCommitStagePaths(tmpDir, [migratedMetadata, userArtifact])

    expect(paths).toContain(migratedMetadata)
    expect(paths).not.toContain(unrelatedMetadata)
    expect(paths).not.toContain(userArtifact)
    expect(paths).not.toContain('openspec/changes')
  })

  it('should stage gitignore only when the update reports changing it', () => {
    fs.writeFileSync(path.join(tmpDir, '.gitignore'), 'node_modules/\n')

    expect(collectCommitStagePaths(tmpDir)).not.toContain('.gitignore')
    expect(collectCommitStagePaths(tmpDir, ['.gitignore'])).toContain('.gitignore')
  })
})

describe('update execution decision', () => {
  it('should run when migration work exists even if component versions are current', () => {
    expect(shouldRunUpdate([], {
      hasChanges: true,
      fileUpdates: [],
      removePaths: ['openspec/schemas/superpowers-lite'],
      errors: [],
    })).toBe(true)
  })

  it('should run when only legacy gitignore cleanup remains', () => {
    expect(shouldRunUpdate([], {
      hasChanges: false,
      fileUpdates: [],
      removePaths: [],
      errors: [],
    }, true)).toBe(true)
  })

  it('should run when only stale legacy version keys remain', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'harness-stale-versions-'))
    try {
      const versions = getBuiltinVersions()
      versions.schemas['superpowers-lite'] = '14'
      for (const skill of ['automated-instrumented-debugging', 'receiving-code-review']) {
        versions.skills[skill] = '6.0.3'
      }
      writeVersions(tmpDir, versions)

      const plan = planLegacyMigrations(tmpDir)

      expect(plan).toMatchObject({
        hasChanges: true,
        fileUpdates: [],
        removePaths: [],
        errors: [],
      })
      expect(shouldRunUpdate([], plan)).toBe(true)
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true })
    }
  })

  it('should surface an error-only migration plan without changing project files', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'harness-migration-errors-'))
    try {
      writeVersions(tmpDir, getBuiltinVersions())
      const metadataPath = path.join(tmpDir, 'openspec', 'changes', 'broken', '.openspec.yaml')
      fs.mkdirSync(path.dirname(metadataPath), { recursive: true })
      fs.writeFileSync(metadataPath, 'schema: [unterminated\n', 'utf-8')
      const originalContent = fs.readFileSync(metadataPath, 'utf-8')

      const plan = planLegacyMigrations(tmpDir)

      expect(plan.hasChanges).toBe(false)
      expect(plan.errors.map(error => error.relativePath)).toEqual([
        'openspec/changes/broken/.openspec.yaml',
      ])
      expect(shouldRunUpdate([], plan)).toBe(true)
      expect(() => applyLegacyMigrations(tmpDir, plan)).toThrow(
        'openspec/changes/broken/.openspec.yaml',
      )
      expect(fs.readFileSync(metadataPath, 'utf-8')).toBe(originalContent)
      expect(fs.existsSync(path.join(tmpDir, 'openspec', 'schemas'))).toBe(false)
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true })
    }
  })
})

describe('commitHarnessPaths', () => {
  let tmpDir: string

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'harness-commit-paths-'))
    execFileSync('git', ['init', '-q'], { cwd: tmpDir })
    execFileSync('git', ['config', 'user.name', 'DevKeel Test'], { cwd: tmpDir })
    execFileSync('git', ['config', 'user.email', 'harness@example.com'], { cwd: tmpDir })
    fs.mkdirSync(path.join(tmpDir, 'openspec', 'changes', 'demo'), { recursive: true })
    fs.writeFileSync(path.join(tmpDir, 'openspec', 'config.yaml'), 'schema: superpowers-lite\n')
    fs.writeFileSync(path.join(tmpDir, 'openspec', 'changes', 'demo', 'tasks.md'), 'old task\n')
    fs.writeFileSync(path.join(tmpDir, '.gitignore'), 'node_modules/\n')
    execFileSync('git', ['add', '.'], { cwd: tmpDir })
    execFileSync('git', ['commit', '-qm', 'baseline'], { cwd: tmpDir })
  })

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true })
  })

  it('commits only harness paths while preserving unrelated staged artifacts', () => {
    fs.writeFileSync(path.join(tmpDir, 'openspec', 'config.yaml'), 'schema: full\n')
    fs.writeFileSync(path.join(tmpDir, 'openspec', 'changes', 'demo', 'tasks.md'), 'user task\n')
    execFileSync('git', ['add', '--', 'openspec/changes/demo/tasks.md'], { cwd: tmpDir })

    expect(commitHarnessPaths(
      tmpDir,
      'chore(harness): update managed paths',
      ['openspec/config.yaml'],
    )).toBe(true)

    const committed = execFileSync(
      'git',
      ['show', '--format=', '--name-only', 'HEAD'],
      { cwd: tmpDir, encoding: 'utf-8' },
    ).trim().split('\n')
    expect(committed).toEqual(['openspec/config.yaml'])
    expect(execFileSync(
      'git',
      ['diff', '--cached', '--name-only'],
      { cwd: tmpDir, encoding: 'utf-8' },
    ).trim()).toBe('openspec/changes/demo/tasks.md')
    expect(execFileSync(
      'git',
      ['show', 'HEAD:openspec/changes/demo/tasks.md'],
      { cwd: tmpDir, encoding: 'utf-8' },
    )).toBe('old task\n')
  })

  it('can commit a clean gitignore migration as its only path', () => {
    fs.writeFileSync(path.join(tmpDir, '.gitignore'), 'node_modules/\ndist/\n')

    expect(commitHarnessPaths(
      tmpDir,
      'chore(harness): clean legacy gitignore entries',
      ['.gitignore'],
    )).toBe(true)

    expect(execFileSync(
      'git',
      ['show', '--format=', '--name-only', 'HEAD'],
      { cwd: tmpDir, encoding: 'utf-8' },
    ).trim()).toBe('.gitignore')
  })
})

describe('resolveUpdateOptions', () => {
  it('should use option template version when positional version is missing', () => {
    const options = resolveUpdateOptions({ templateVersion: '1.2.3' })

    expect(options.templateVersion).toBe('1.2.3')
  })

  it('should use positional template version', () => {
    const options = resolveUpdateOptions({ positionalTemplateVersion: '1.2.3-beta.1' })

    expect(options.templateVersion).toBe('1.2.3-beta.1')
  })

  it('should allow matching positional and option template versions', () => {
    const options = resolveUpdateOptions({
      positionalTemplateVersion: '1.2.3',
      templateVersion: '1.2.3',
    })

    expect(options.templateVersion).toBe('1.2.3')
  })

  it('should reject conflicting positional and option template versions', () => {
    expect(() => resolveUpdateOptions({
      positionalTemplateVersion: '1.2.3',
      templateVersion: '1.2.4',
    })).toThrow('不能同时指定不同的模板版本')
  })

  it('should reject beta option with explicit template version', () => {
    expect(() => resolveUpdateOptions({
      templateVersion: '1.2.3',
      beta: true,
    })).toThrow('--beta 不能与指定模板版本同时使用')
  })
})
