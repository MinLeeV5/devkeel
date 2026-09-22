import fs from 'node:fs'
import path from 'node:path'
import * as p from '@clack/prompts'
import {
  buildDefaultConfig,
  computeOutdatedCategories,
  filterManagedVersions,
  getBuiltinVersions,
  readConfig,
  readVersions,
  resolveRepositoryType,
  writeConfig,
} from '../lib/config.js'
import { detectEnvironment, detectIsSubmodule } from '../lib/detect.js'
import { removeLegacyPlatformIgnores } from '../lib/gitignore.js'
import { copyTemplateSkills, copyTemplateAgents, copyTemplateRules, copyTemplateCommands, createPlatformLinks, copyOpenspecTemplate, readTemplateFile, renderTemplate, ensureGitignore, detectDeprecatedAssets, removeDeprecatedAssets, updateOpenspecIncremental, writeSmartFile, getTemplatesDir, setTemplatesDir, copyDirRecursive, detectExistingPlatformTargets } from '../lib/templates.js'
import { ensureTemplatesCache, TemplatesFetchError } from '../lib/templates-cache.js'
import { applyDiscussionSkillMigration, applyLegacyMigrations, assertSchemaTargetsAvailable, planLegacyMigrations, writeVersionsAtomically } from '../lib/update.js'
import { detectSubmodules } from './submodule.js'
import { createLog } from '../lib/log.js'
import { syncSkillLinks } from '../lib/skill-distribution.js'
import {
  DOMAIN_AGENTS_TEMPLATE,
  ROOT_AGENTS_TEMPLATE,
  mergeAgentsMdContent,
} from '../lib/agents-md.js'

export interface InitOptions {
  name?: string
  targets?: string
  yes?: boolean
  force?: boolean
}

type AgentsWriteResult = 'created' | 'merged' | 'unchanged' | 'preserved'

const DOMAIN_KNOWLEDGE_DIRS = ['skills', 'rules', 'agents'] as const

function ensureDomainKnowledgeDirs(projectRoot: string): void {
  for (const dir of DOMAIN_KNOWLEDGE_DIRS) {
    const dirPath = path.join(projectRoot, '.harness', dir)
    fs.mkdirSync(dirPath, { recursive: true })
    const keepPath = path.join(dirPath, '.gitkeep')
    if (!fs.existsSync(keepPath)) fs.writeFileSync(keepPath, '', 'utf-8')
  }
}

async function writeManagedAgentsMd(
  filePath: string,
  renderedContent: string,
  managedSources: string[],
  options: { nonInteractive: boolean; templateLabel: string },
): Promise<AgentsWriteResult> {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, renderedContent, 'utf-8')
    return 'created'
  }

  const existing = fs.readFileSync(filePath, 'utf-8')
  if (existing === renderedContent) return 'unchanged'

  if (options.nonInteractive) {
    p.log.warn(`检测到已有 AGENTS.md，-y 模式下未改造；请移除 -y 后重新运行以确认合并`)
    return 'preserved'
  }

  const lineCount = existing.split(/\r?\n/).length
  const confirmed = await p.confirm({
    message: `检测到已有 AGENTS.md（${lineCount} 行），是否按${options.templateLabel}改造并合并原有内容？`,
  })
  if (p.isCancel(confirmed) || !confirmed) return 'preserved'

  fs.writeFileSync(
    filePath,
    mergeAgentsMdContent(renderedContent, existing, managedSources),
    'utf-8',
  )
  return 'merged'
}

export async function runInit(opts?: InitOptions): Promise<void> {
  const projectRoot = process.cwd()
  const env = detectEnvironment(projectRoot)
  const isSubmodule = detectIsSubmodule(projectRoot)
  const repoType = resolveRepositoryType(readConfig(projectRoot), isSubmodule)

  const log = createLog()
  log.intro('DevKeel v2 项目初始化')

  const s = p.spinner()
  s.start('正在拉取最新模板...')
  try {
    const { cacheDir } = await ensureTemplatesCache()
    setTemplatesDir(cacheDir)
    s.stop('模板缓存就绪')
  } catch (e) {
    if (e instanceof TemplatesFetchError) {
      s.stop('模板拉取失败')
      p.cancel(e.message + '\n\n' + e.diagnostic)
      process.exit(1)
    }
    throw e
  }

  let name: string
  if (opts?.name) {
    name = opts.name
  } else {
    const input = await p.text({
      message: '项目名称？',
      initialValue: env.projectName,
    })
    if (p.isCancel(input)) { p.cancel('已取消'); process.exit(0) }
    name = input as string
  }

  let targets: string[]
  if (opts?.targets) {
    targets = opts.targets.split(',').map(t => t.trim())
  } else {
    const detectedTargets = detectExistingPlatformTargets(projectRoot)
    const input = await p.multiselect({
      message: '目标平台？',
      options: [
        { value: 'claude-code', label: 'Claude Code' },
        { value: 'codex', label: 'Codex CLI' },
        { value: 'cursor', label: 'Cursor' },
        { value: 'copilot', label: 'GitHub Copilot' },
        { value: 'gemini', label: 'Gemini CLI' },
        { value: 'opencode', label: 'OpenCode' },
      ],
      initialValues: detectedTargets.length > 0 ? detectedTargets : undefined,
    })
    if (p.isCancel(input)) { p.cancel('已取消'); process.exit(0) }
    targets = input as string[]
  }

  if (repoType === 'main') assertSchemaTargetsAvailable(projectRoot, getTemplatesDir())
  const skills = syncSkillLinks(projectRoot, targets, { force: opts?.force })
  if (skills.backupPath) log.info(`skills 备份位置: ${skills.backupPath}`)
  if (!skills.ok) {
    p.cancel(skills.errors.join('\n'))
    log.info('确认需覆盖冲突技能入口时，可使用 devkeel init --force；覆盖前会自动备份')
    process.exitCode = 1
    return
  }

  const config = buildDefaultConfig({
    name,
    types: [],
    targets,
    repoType,
  })

  writeConfig(projectRoot, config)
  log.success('.harness/config.yml')

  const initialVersions = readVersions(projectRoot)
  if (repoType === 'main' && initialVersions) {
    const discussionResult = applyDiscussionSkillMigration(projectRoot, getTemplatesDir())
    if (discussionResult.changedPaths.length > 0 || discussionResult.recovered) {
      log.success('讨论能力已完成不可分割迁移')
    }
  }
  const existingVersions = readVersions(projectRoot)
  const builtinVersions = getBuiltinVersions()
  const versions = filterManagedVersions(builtinVersions, repoType)
  const outdated = computeOutdatedCategories(existingVersions, versions)
  let debuggingSkillInstalled = false

  const templateVars = {
    PROJECT_NAME: name,
    PROJECT_TYPES: '',
    TARGETS: targets.join(', '),
  }

  const targetList = targets
  let submoduleSection = ''

  if (repoType === 'domain') {
    ensureDomainKnowledgeDirs(projectRoot)
    log.success('.harness/ 领域知识目录')
  } else if (existingVersions) {
    const templatesDir = getTemplatesDir()
    const skillsTarget = path.join(projectRoot, '.harness', 'skills')
    fs.mkdirSync(skillsTarget, { recursive: true })
    for (const skillName of outdated.skills) {
      if (skillName === 'brainstorming') continue
      const src = path.join(templatesDir, 'skills', skillName)
      if (fs.existsSync(src)) {
        copyDirRecursive(src, path.join(skillsTarget, skillName))
        if (skillName === 'systematic-debugging') debuggingSkillInstalled = true
      }
    }
    log.success(outdated.skills.size > 0
      ? `.harness/skills/ (${outdated.skills.size} 个更新)`
      : '.harness/skills/ (已是最新)')

    if (outdated.agents) {
      copyTemplateAgents(path.join(projectRoot, '.harness', 'agents'))
      log.success('.harness/agents/')
    } else {
      log.success('.harness/agents/ (已是最新)')
    }

    if (outdated.rules) {
      copyTemplateRules(path.join(projectRoot, '.harness', 'rules'))
      log.success('.harness/rules/')
    } else {
      log.success('.harness/rules/ (已是最新)')
    }
  } else {
    copyTemplateSkills(path.join(projectRoot, '.harness', 'skills'))
    debuggingSkillInstalled = fs.existsSync(path.join(
      projectRoot,
      '.harness',
      'skills',
      'systematic-debugging',
    ))
    log.success('.harness/skills/')

    copyTemplateRules(path.join(projectRoot, '.harness', 'rules'))
    log.success('.harness/rules/')

    copyTemplateAgents(path.join(projectRoot, '.harness', 'agents'))
    log.success('.harness/agents/')
  }

  if (repoType === 'main') {
    copyTemplateCommands(
      path.join(projectRoot, '.harness', 'commands'),
      existingVersions ? ['opsx/explore.md'] : [],
    )
    log.success('.harness/commands/')
  }

  let migrationChangedPaths: string[] = []
  const allowLegacyDebuggingRemoval = debuggingSkillInstalled
    || existingVersions?.skills?.['systematic-debugging']
      === versions.skills['systematic-debugging']
  if (repoType === 'domain') {
    log.info('子仓库不初始化 openspec/，变更统一在主仓库 openspec/ 管理')
  } else {
    const openspecDir = path.join(projectRoot, 'openspec')
    if (fs.existsSync(openspecDir)) {
      const migrationResult = updateOpenspecIncremental(openspecDir, {
        allowLegacyDebuggingRemoval,
      })
      migrationChangedPaths = migrationResult.changedPaths
      log.success(outdated.schemas.size > 0
        ? `openspec/ (增量更新: schemas ${[...outdated.schemas].join(', ')})`
        : 'openspec/ (增量更新)')
    } else {
      copyOpenspecTemplate(openspecDir)
      log.success('openspec/')
      const migrationResult = applyLegacyMigrations(
        projectRoot,
        planLegacyMigrations(projectRoot, { allowLegacyDebuggingRemoval }),
        { allowLegacyDebuggingRemoval },
      )
      migrationChangedPaths = migrationResult.changedPaths
    }
  }
  if (migrationChangedPaths.length > 0) {
    log.success(`旧受管资产迁移完成（${migrationChangedPaths.length} 项）`)
  }

  if (repoType === 'main') {
    const deprecatedAssets = detectDeprecatedAssets(projectRoot)
    if (deprecatedAssets.length > 0) {
      log.warning(`发现 ${deprecatedAssets.length} 个当前脚手架中不存在的产物:`)
      for (const asset of deprecatedAssets) {
        log.info(`  ${asset.relativePath}`)
      }
      let shouldClean: boolean
      if (opts?.yes) {
        shouldClean = true
      } else {
        const input = await p.confirm({
          message: '这些可能是旧版本的废弃产物，是否删除？',
        })
        shouldClean = !p.isCancel(input) && !!input
      }
      if (shouldClean) {
        removeDeprecatedAssets(projectRoot, deprecatedAssets)
        log.success(`已删除 ${deprecatedAssets.length} 个废弃产物`)
      }
    }
  }

  const submodules = repoType === 'main' ? detectSubmodules(projectRoot) : []
  if (submodules.length > 0 && !opts?.yes) {
    const selected = await p.multiselect({
      message: '为哪些子模块初始化配置？',
      options: submodules.map(s => ({ value: s.path, label: s.name })),
      required: false,
    })
    if (!p.isCancel(selected)) {
      const selectedPaths = selected as string[]
      if (selectedPaths.length > 0) {
        submoduleSection = '若任务进入以下子项目，必须继续读取对应子项目的 AGENTS.md：\n\n' +
          selectedPaths.map(s => `- ${s}/`).join('\n')

        for (const subPath of selectedPaths) {
          const subFull = path.join(projectRoot, subPath)
          const subEntries = fs.existsSync(subFull)
            ? fs.readdirSync(subFull).filter(e => e !== '.git')
            : []
          if (subEntries.length === 0) {
            log.warning(`${subPath}/ 是空仓库，请先拉取代码（git submodule update --init ${subPath}）`)
            continue
          }

          const subName = path.basename(subPath)
          const subSkills = syncSkillLinks(subFull, targetList)
          if (!subSkills.ok) {
            log.warning(`${subPath}: ${subSkills.errors.join('\n')}`)
            continue
          }
          const subConfig = buildDefaultConfig({
            name: subName,
            types: [],
            targets: targetList,
            repoType: 'domain',
          })
          writeConfig(subFull, subConfig)
          ensureDomainKnowledgeDirs(subFull)
          writeVersionsAtomically(
            subFull,
            filterManagedVersions(builtinVersions, 'domain'),
          )

          const subAgentsMd = readTemplateFile(DOMAIN_AGENTS_TEMPLATE)
          const rootAgentsSource = renderTemplate(readTemplateFile(ROOT_AGENTS_TEMPLATE), {
            SUBMODULE_SECTION: '<!-- 无子项目 -->',
          })
          const agentsResult = await writeManagedAgentsMd(
            path.join(subFull, 'AGENTS.md'),
            subAgentsMd,
            [rootAgentsSource, subAgentsMd],
            { nonInteractive: false, templateLabel: '子仓库领域模板' },
          )
          if (agentsResult === 'preserved') {
            log.info(`${subPath}/AGENTS.md 已按用户选择保留`)
          }

          if (targetList.includes('claude-code') || targetList.includes('cursor')) {
            const subClaudeMd = renderTemplate(readTemplateFile('claude-md.md'), {
              PROJECT_NAME: subName,
              TARGETS: targetList.join(', '),
            })
            writeSmartFile(path.join(subFull, 'CLAUDE.md'), subClaudeMd, '@AGENTS.md')
          }

          removeLegacyPlatformIgnores(subFull)
          createPlatformLinks(subFull, targetList)
          log.success(`${subPath}/ 配置 + 平台链接`)
        }
      }
    }
  }

  const rootAgentsSource = renderTemplate(readTemplateFile(ROOT_AGENTS_TEMPLATE), {
    SUBMODULE_SECTION: '<!-- 无子项目 -->',
  })
  const domainAgentsSource = readTemplateFile(DOMAIN_AGENTS_TEMPLATE)
  const agentsMd = repoType === 'domain'
    ? domainAgentsSource
    : renderTemplate(readTemplateFile(ROOT_AGENTS_TEMPLATE), {
        ...templateVars,
        SUBMODULE_SECTION: submoduleSection || '<!-- 无子项目 -->',
      })
  const agentsResult = await writeManagedAgentsMd(
    path.join(projectRoot, 'AGENTS.md'),
    agentsMd,
    [rootAgentsSource, domainAgentsSource],
    {
      nonInteractive: !!opts?.yes,
      templateLabel: repoType === 'domain' ? '子仓库领域模板' : 'DevKeel 根仓库模板',
    },
  )
  log.success(agentsResult === 'preserved' ? 'AGENTS.md (已保留原文件)' : 'AGENTS.md')

  if (targetList.includes('claude-code') || targetList.includes('cursor')) {
    const claudeMd = renderTemplate(readTemplateFile('claude-md.md'), templateVars)
    writeSmartFile(path.join(projectRoot, 'CLAUDE.md'), claudeMd, '@AGENTS.md')
    log.success('CLAUDE.md')
  }
  if (targetList.includes('gemini')) {
    const geminiMd = readTemplateFile('gemini-md.md')
    writeSmartFile(path.join(projectRoot, 'GEMINI.md'), geminiMd, '@AGENTS.md')
    log.success('GEMINI.md')
  }

  const linkedPlatforms = createPlatformLinks(projectRoot, targetList)
  if (linkedPlatforms.length > 0) {
    log.success(`平台链接: ${linkedPlatforms.join(', ')}`)
  }

  const removedIgnores = removeLegacyPlatformIgnores(projectRoot)
  if (removedIgnores.length > 0) {
    log.info(`从 .gitignore 移除旧版条目: ${removedIgnores.join(', ')}`)
  }

  ensureGitignore(projectRoot)
  log.success('.gitignore')

  const pkgPath = path.join(projectRoot, 'package.json')
  if (fs.existsSync(pkgPath)) {
    log.info('package.json 已存在，跳过')
  } else {
    const pkg = {
      name,
      version: '0.1.0',
      private: true,
      packageManager: 'pnpm@10.11.0',
      scripts: {
        setup: 'git submodule update --remote --init',
      },
    }
    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf-8')
    log.success('package.json')
  }

  writeVersionsAtomically(projectRoot, versions)
  log.success('.harness/versions.yml')

  if (repoType === 'main') {
    const migratable = ['wiki', 'docs'].filter(d => fs.existsSync(path.join(projectRoot, d)))
    if (migratable.length > 0) {
      log.info(`检测到 ${migratable.join('、')}，可运行 devkeel migrate ${migratable.join(' ')} 迁移到 openspec/`)
    }
  }

  log.outro(repoType === 'domain'
    ? '子仓库初始化完成！从主仓库共享能力中调用 /domain-init 和 /verify-init 生成领域资产。'
    : '初始化完成！运行 /domain-init 生成领域规范，然后编辑 AGENTS.md 补充项目路由规则。')
}
