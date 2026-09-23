import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { execFileSync, execSync } from 'node:child_process'
import * as p from '@clack/prompts'
import {
  filterManagedVersions,
  getBuiltinVersions,
  readVersions,
  type VersionsRecord,
} from '../lib/versions.js'
import { getTemplatesDir, setTemplatesDir, copyDirRecursive, copyTemplateCommands, detectDeprecatedAssets, detectExistingPlatformTargets, removeDeprecatedAssets, readTemplateFile, renderTemplate, updateOpenspecIncremental } from '../lib/templates.js'
import { ensureTemplatesCache, TemplatesFetchError } from '../lib/templates-cache.js'
import { applyDiscussionSkillMigration, applyLegacyMigrations, assertSchemaTargetsAvailable, assertLegacyMigrationPreflight, detectUpdates, isLegacySchema, isDiscussionSkillMigrationRequired, planLegacyMigrations, recoverDiscussionSkillMigration, resolveUpdatePaths, collectCommitStagePaths, RETIRED_MANAGED_SKILLS, writeVersionsAtomically, type LegacyMigrationPlan, type UpdateItem } from '../lib/update.js'
import { createLog } from '../lib/log.js'
import { applyLegacyPlatformIgnorePlan, planLegacyPlatformIgnores } from '../lib/gitignore.js'
import { detectRepositoryType } from '../lib/detect.js'
import { planSkillLinks, skillLinkProblems, syncSkillLinks } from '../lib/skill-distribution.js'
import {
  DOMAIN_AGENTS_TEMPLATE,
  ROOT_AGENTS_TEMPLATE,
  cleanAgentsMdSlots,
  mergeAgentsMdContent,
  restoreAgentsMdSlots,
} from '../lib/agents-md.js'

export interface UpdateOptions {
  force?: boolean
  dryRun?: boolean
  templateVersion?: string
  positionalTemplateVersion?: string
  beta?: boolean
}

export interface ResolvedUpdateOptions {
  force: boolean
  dryRun: boolean
  templateVersion?: string
  beta: boolean
}

export function shouldRunUpdate(
  updates: UpdateItem[],
  migrationPlan: LegacyMigrationPlan,
  gitignoreHasChanges = false,
  agentsFrameworkHasChanges = false,
  profileVersionsHaveChanges = false,
): boolean {
  return updates.length > 0
    || migrationPlan.hasChanges
    || migrationPlan.errors.length > 0
    || gitignoreHasChanges
    || agentsFrameworkHasChanges
    || profileVersionsHaveChanges
}

const DISCUSSION_UPDATE_KEY = 'skills/brainstorming'
const DISCUSSION_COMMAND = 'opsx/explore.md'
const DEBUGGING_SKILL = 'systematic-debugging'
const DEBUGGING_UPDATE_KEY = `skills/${DEBUGGING_SKILL}`
const LEGACY_DEBUGGING_SKILL = 'automated-instrumented-debugging'

function updateKey(update: Pick<UpdateItem, 'category' | 'name'>): string {
  return `${update.category}/${update.name}`
}

function isLocalDirectory(filePath: string): boolean {
  try {
    return fs.lstatSync(filePath).isDirectory()
  } catch {
    return false
  }
}

function cloneVersions(versions: VersionsRecord): VersionsRecord {
  return {
    ...versions,
    skills: { ...(versions.skills ?? {}) },
    agents: { ...(versions.agents ?? {}) },
    rules: { ...(versions.rules ?? {}) },
    schemas: { ...(versions.schemas ?? {}) },
  }
}

export function mergeSuccessfulUpdateVersions(
  current: VersionsRecord,
  builtin: VersionsRecord,
  successfulUpdateKeys: ReadonlySet<string>,
  legacyMigrationApplied: boolean,
  legacyDebuggingMigrationApplied = false,
): VersionsRecord {
  const next = cloneVersions(current)
  for (const key of successfulUpdateKeys) {
    const [category, name] = key.split('/', 2)
    if (category === 'core' && name === 'harness') {
      next.harness = builtin.harness
      continue
    }
    if (!name || !['skills', 'agents', 'rules', 'schemas'].includes(category ?? '')) continue
    const typedCategory = category as 'skills' | 'agents' | 'rules' | 'schemas'
    const version = builtin[typedCategory][name]
    if (version) next[typedCategory][name] = version
  }
  if (legacyMigrationApplied) {
    for (const schema of Object.keys(next.schemas)) {
      if (isLegacySchema(schema)) delete next.schemas[schema]
    }
    for (const skill of RETIRED_MANAGED_SKILLS) {
      if (skill === LEGACY_DEBUGGING_SKILL) continue
      if (!Object.prototype.hasOwnProperty.call(builtin.skills, skill)) delete next.skills[skill]
    }
  }
  if (legacyDebuggingMigrationApplied) delete next.skills[LEGACY_DEBUGGING_SKILL]
  return next
}

function normalizeTemplateVersion(version?: string): string | undefined {
  const trimmed = version?.trim()
  return trimmed ? trimmed : undefined
}

export function resolveUpdateOptions(options: UpdateOptions = {}): ResolvedUpdateOptions {
  const optionVersion = normalizeTemplateVersion(options.templateVersion)
  const positionalVersion = normalizeTemplateVersion(options.positionalTemplateVersion)

  if (optionVersion && positionalVersion && optionVersion !== positionalVersion) {
    throw new Error('不能同时指定不同的模板版本，请只使用位置参数或 --template-version')
  }
  if ((optionVersion || positionalVersion) && options.beta) {
    throw new Error('--beta 不能与指定模板版本同时使用')
  }

  return {
    force: options.force ?? false,
    dryRun: options.dryRun ?? false,
    templateVersion: optionVersion ?? positionalVersion,
    beta: options.beta ?? false,
  }
}

function formatTemplatesFetchMessage(options: ResolvedUpdateOptions): string {
  if (options.templateVersion) return `正在拉取模板 ${options.templateVersion}...`
  if (options.beta) return '正在拉取 beta 渠道模板...'
  return '正在拉取最新模板...'
}

function isGitPathDirty(projectRoot: string, relativePath: string): boolean {
  try {
    return execFileSync(
      'git',
      ['status', '--porcelain=v1', '--', relativePath],
      { cwd: projectRoot, encoding: 'utf-8', stdio: ['ignore', 'pipe', 'ignore'] },
    ).trim().length > 0
  } catch {
    return false
  }
}

function renderAgentsFramework(projectRoot: string): {
  rendered: string
  managedSources: string[]
} {
  const rootSource = renderTemplate(readTemplateFile(ROOT_AGENTS_TEMPLATE), {
    SUBMODULE_SECTION: '',
  })
  const domainSource = readTemplateFile(DOMAIN_AGENTS_TEMPLATE)
  const useDomainTemplate = detectRepositoryType(projectRoot) === 'domain'

  return {
    rendered: useDomainTemplate ? domainSource : rootSource,
    managedSources: [rootSource, domainSource],
  }
}

export function hasAgentsFrameworkDrift(projectRoot: string): boolean {
  const agentsMdPath = path.join(projectRoot, 'AGENTS.md')
  if (!fs.existsSync(agentsMdPath)) return true

  const existing = fs.readFileSync(agentsMdPath, 'utf-8')
  const { rendered: template, managedSources } = renderAgentsFramework(projectRoot)
  const rendered = cleanAgentsMdSlots(mergeAgentsMdContent(template, existing, managedSources), managedSources)
  return existing !== rendered
}

export async function runUpdate(options?: UpdateOptions): Promise<void> {
  const projectRoot = process.cwd()
  const repoType = detectRepositoryType(projectRoot)
  let resolvedOptions: ResolvedUpdateOptions
  try {
    resolvedOptions = resolveUpdateOptions(options)
  } catch (e) {
    p.cancel(e instanceof Error ? e.message : String(e))
    process.exit(1)
  }
  const force = resolvedOptions.force
  const dryRun = resolvedOptions.dryRun

  const log = createLog()
  log.intro('devkeel update')

  const versionsBeforeUpdate = readVersions(projectRoot)
  if (!versionsBeforeUpdate) {
    p.cancel('未找到 .harness/versions.yml，请先执行 devkeel init')
    process.exit(1)
  }

  const skillTargets = detectExistingPlatformTargets(projectRoot)
  const skillProblems = skillLinkProblems(planSkillLinks(projectRoot, skillTargets))
  if (skillProblems.length > 0) {
    p.cancel(skillProblems.join('\n'))
    log.info('技能入口冲突需先通过 devkeel sync 处理；显式选择 --force 会先备份再覆盖')
    process.exitCode = 1
    return
  }

  const s = p.spinner()
  try {
    s.start(formatTemplatesFetchMessage(resolvedOptions))
    const { cacheDir, version } = await ensureTemplatesCache({
      version: resolvedOptions.templateVersion,
      beta: resolvedOptions.beta,
    })
    setTemplatesDir(cacheDir)
    s.stop(`模板缓存就绪 (${version})`)
  } catch (e) {
    if (e instanceof TemplatesFetchError) {
      s.stop('模板拉取失败')
      p.cancel(e.message + '\n\n' + e.diagnostic)
      process.exit(1)
    }
    throw e
  }

  const templatesDir = getTemplatesDir()
  if (repoType === 'main') assertSchemaTargetsAvailable(projectRoot, templatesDir)
  const builtinVersions = filterManagedVersions(
    getBuiltinVersions(templatesDir),
    repoType,
  )
  if (repoType === 'main' && !dryRun) {
    recoverDiscussionSkillMigration(projectRoot, templatesDir)
  }
  const migrationPlan: LegacyMigrationPlan = repoType === 'main'
    ? planLegacyMigrations(projectRoot)
    : { hasChanges: false, fileUpdates: [], removePaths: [], errors: [] }
  if (repoType === 'main') assertLegacyMigrationPreflight(migrationPlan, templatesDir)
  const discussionMigrationRequired = repoType === 'main'
    && isDiscussionSkillMigrationRequired(projectRoot, templatesDir)
  const updates = detectUpdates(projectRoot, force, templatesDir, builtinVersions)
  const debuggingUpdateRequired = updates.some(update => (
    updateKey(update) === DEBUGGING_UPDATE_KEY
  ))
  const gitignorePlan = planLegacyPlatformIgnores(projectRoot)
  const agentsFrameworkHasChanges = hasAgentsFrameworkDrift(projectRoot)
  const profileVersionsHaveChanges = repoType === 'domain'
    && (
      Object.keys(versionsBeforeUpdate.skills ?? {}).length > 0
      || Object.keys(versionsBeforeUpdate.agents ?? {}).length > 0
      || Object.keys(versionsBeforeUpdate.rules ?? {}).length > 0
      || Object.keys(versionsBeforeUpdate.schemas ?? {}).length > 0
    )
  const gitignoreWasDirty = gitignorePlan.hasChanges
    && isGitPathDirty(projectRoot, '.gitignore')
  const hasManagedAssetWork = updates.length > 0
    || migrationPlan.hasChanges
    || migrationPlan.errors.length > 0
    || profileVersionsHaveChanges

  if (!shouldRunUpdate(
    updates,
    migrationPlan,
    gitignorePlan.hasChanges,
    agentsFrameworkHasChanges,
    profileVersionsHaveChanges,
  )) {
    log.success('所有组件已是最新版本')
    log.outro('')
    return
  }

  for (const u of updates) {
    const label = u.category === 'core' ? u.name : `${u.category}/${u.name}`
    log.info(`  ${label}  ${u.from} → ${u.to}  ⬆`)
  }
  if (gitignorePlan.hasChanges) {
    log.info(`  .gitignore 将移除旧版条目: ${gitignorePlan.removedEntries.join(', ')}`)
  }

  if (dryRun) {
    log.outro('dry-run 模式，未执行更新')
    return
  }

  let updateEach = false
  if (!force && updates.some(update => update.category !== 'core')) {
    const selected = await p.select({
      message: '选择更新方式',
      initialValue: 'all',
      options: [
        { value: 'all', label: '全部更新', hint: '直接覆盖所有组件，含本地修改' },
        { value: 'each', label: '逐个确认', hint: '每个组件逐一确认是否更新' },
      ],
    })
    if (p.isCancel(selected)) { p.cancel('已取消'); process.exit(0) }
    updateEach = selected === 'each'
  }

  let updated = 0
  if (updates.some(update => update.category === 'skills')) {
    const skills = syncSkillLinks(projectRoot, skillTargets)
    if (!skills.ok) {
      p.cancel(skills.errors.join('\n'))
      process.exitCode = 1
      return
    }
  }
  let skipped = 0
  const successfulUpdateKeys = new Set<string>()
  let migrationChangedPaths: string[] = []

  if (discussionMigrationRequired) {
    const discussionResult = applyDiscussionSkillMigration(projectRoot, templatesDir)
    migrationChangedPaths.push(...discussionResult.changedPaths)
    successfulUpdateKeys.add(DISCUSSION_UPDATE_KEY)
    updated++
    log.success('  ✔ skills/brainstorming 讨论能力已完成不可分割迁移')
  }

  for (const u of updates) {
    if (u.category === 'core') continue
    if (discussionMigrationRequired && updateKey(u) === DISCUSSION_UPDATE_KEY) continue

    const { sourceDir, targetDir } = resolveUpdatePaths(templatesDir, projectRoot, u)
    if (!sourceDir || !targetDir) continue
    if (!fs.existsSync(sourceDir)) continue

    if (force) {
      copyDirRecursive(sourceDir, targetDir)
      log.success(`  ✔ ${u.category}/${u.name} 已更新`)
      successfulUpdateKeys.add(updateKey(u))
      updated++
      continue
    }

    const conflicts = detectConflicts(sourceDir, targetDir)
    if (
      updateKey(u) === DEBUGGING_UPDATE_KEY
      && fs.existsSync(path.join(
        projectRoot,
        '.harness',
        'skills',
        LEGACY_DEBUGGING_SKILL,
      ))
    ) {
      conflicts.push(`legacy:${LEGACY_DEBUGGING_SKILL}`)
    }

    if (updateEach) {
      const hasConflict = conflicts.length > 0
      const action = await p.select({
        message: hasConflict
          ? `  ${u.category}/${u.name} 本地已修改（${conflicts.length} 个文件），如何处理？`
          : `  ${u.category}/${u.name}  ${u.from} → ${u.to}，是否更新？`,
        initialValue: 'update',
        options: [
          { value: 'update', label: hasConflict ? '覆盖 — 使用最新模板' : '更新' },
          { value: 'skip', label: '跳过' },
        ],
      })
      if (p.isCancel(action)) { p.cancel('已取消'); process.exit(0) }

      if (action === 'update') {
        copyDirRecursive(sourceDir, targetDir)
        log.success(`  ✔ ${u.category}/${u.name} 已${hasConflict ? '覆盖' : '更新'}`)
        successfulUpdateKeys.add(updateKey(u))
        updated++
      } else {
        log.info(`  ↷ ${u.category}/${u.name} 已跳过`)
        skipped++
      }
      continue
    }

    if (conflicts.length === 0) {
      copyDirRecursive(sourceDir, targetDir)
      log.success(`  ✔ ${u.category}/${u.name} 已更新`)
      successfulUpdateKeys.add(updateKey(u))
      updated++
      continue
    }

    copyDirRecursive(sourceDir, targetDir)
    log.success(`  ✔ ${u.category}/${u.name} 已覆盖（${conflicts.length} 个本地修改）`)
    successfulUpdateKeys.add(updateKey(u))
    updated++
  }

  for (const update of updates.filter(update => update.category === 'core')) {
    successfulUpdateKeys.add(updateKey(update))
  }

  const allowLegacyDebuggingRemoval = !debuggingUpdateRequired
    || successfulUpdateKeys.has(DEBUGGING_UPDATE_KEY)
  if (hasManagedAssetWork) {
    const commandsSource = path.join(templatesDir, 'commands')
    if (repoType === 'main' && fs.existsSync(commandsSource)) {
      const commandsTarget = path.join(projectRoot, '.harness', 'commands')
      const shouldSyncDiscussionCommand = successfulUpdateKeys.has(DISCUSSION_UPDATE_KEY)
        && !discussionMigrationRequired
      const excludedCommands = shouldSyncDiscussionCommand
        ? []
        : [DISCUSSION_COMMAND]
      copyTemplateCommands(commandsTarget, excludedCommands)
      log.success('.harness/commands/ 已同步')
    }

    if (repoType === 'main') {
      const openspecDir = path.join(projectRoot, 'openspec')
      if (fs.existsSync(openspecDir)) {
        const migrationResult = updateOpenspecIncremental(openspecDir, {
          allowLegacyDebuggingRemoval,
        })
        migrationChangedPaths.push(...migrationResult.changedPaths)
        log.success('openspec/ 基础配置已同步')
      } else {
        const migrationResult = applyLegacyMigrations(
          projectRoot,
          planLegacyMigrations(projectRoot, { allowLegacyDebuggingRemoval }),
          { allowLegacyDebuggingRemoval },
        )
        migrationChangedPaths.push(...migrationResult.changedPaths)
      }
      if (migrationChangedPaths.length > 0) {
        log.success(`旧受管资产迁移完成（${migrationChangedPaths.length} 项）`)
      }

      const deprecatedAssets = detectDeprecatedAssets(projectRoot)
      if (deprecatedAssets.length > 0) {
        log.warning(`发现 ${deprecatedAssets.length} 个当前脚手架中不存在的产物:`)
        for (const asset of deprecatedAssets) {
          log.info(`  ${asset.relativePath}`)
        }
        if (force) {
          removeDeprecatedAssets(projectRoot, deprecatedAssets)
          log.success(`已删除 ${deprecatedAssets.length} 个废弃产物`)
        } else {
          const confirm = await p.confirm({ message: '这些可能是旧版本的废弃产物，是否删除？' })
          if (!p.isCancel(confirm) && confirm) {
            removeDeprecatedAssets(projectRoot, deprecatedAssets)
            log.success(`已删除 ${deprecatedAssets.length} 个废弃产物`)
          }
        }
      }
    }
  }

  const removedIgnores = applyLegacyPlatformIgnorePlan(projectRoot, gitignorePlan)
  if (removedIgnores.length > 0) {
    log.info(`从 .gitignore 移除旧版条目: ${removedIgnores.join(', ')}`)
  }

  const currentVersions = readVersions(projectRoot)
  if (!currentVersions) throw new Error('更新期间 .harness/versions.yml 丢失或无法解析')
  const legacyDebuggingMigrationApplied = allowLegacyDebuggingRemoval
    && Object.prototype.hasOwnProperty.call(
      currentVersions.skills ?? {},
      LEGACY_DEBUGGING_SKILL,
    )
    && isLocalDirectory(path.join(
      projectRoot,
      '.harness',
      'skills',
      DEBUGGING_SKILL,
    ))
    && !fs.existsSync(path.join(
      projectRoot,
      '.harness',
      'skills',
      LEGACY_DEBUGGING_SKILL,
    ))
  const newVersions = filterManagedVersions(
    mergeSuccessfulUpdateVersions(
      currentVersions,
      builtinVersions,
      successfulUpdateKeys,
      migrationPlan.hasChanges,
      legacyDebuggingMigrationApplied,
    ),
    repoType,
  )
  if (JSON.stringify(newVersions) !== JSON.stringify(currentVersions)) {
    writeVersionsAtomically(projectRoot, newVersions)
    log.success('.harness/versions.yml 已更新')
  }

  if (hasManagedAssetWork || agentsFrameworkHasChanges) {
    const agentsResult = await updateAgentsMd(projectRoot, force)
    if (agentsResult === 'updated') {
      log.success('AGENTS.md 框架内容已更新（用户定制区已保留）')
      updated++
    } else if (agentsResult === 'no-markers') {
      log.warning('AGENTS.md 未更新；下次 update 会再次提示')
      skipped++
    } else if (agentsResult === 'skipped') {
      log.warning('AGENTS.md 未更新；下次 update 会再次提示')
      skipped++
    }
  }

  const gitignorePath = path.join(projectRoot, '.gitignore')
  const gitignoreMatchesPlan = removedIgnores.length > 0
    && fs.existsSync(gitignorePath)
    && fs.readFileSync(gitignorePath, 'utf-8') === gitignorePlan.updatedContent
  const canAutoCommitGitignore = gitignoreMatchesPlan && !gitignoreWasDirty
  if (removedIgnores.length > 0 && !canAutoCommitGitignore) {
    log.warning('.gitignore 在 update 前已有改动或执行期间再次变化，已清理旧条目但不会自动提交')
  }

  const changedPathsForCommit = [
    ...migrationChangedPaths,
    ...(canAutoCommitGitignore ? ['.gitignore'] : []),
  ]
  const stagePaths = hasManagedAssetWork || agentsFrameworkHasChanges
    ? collectCommitStagePaths(projectRoot, changedPathsForCommit)
    : canAutoCommitGitignore ? ['.gitignore'] : []
  await commitChanges(projectRoot, newVersions.harness, stagePaths)

  log.info(`  更新: ${updated}, 跳过: ${skipped}`)
  log.outro('更新完成！')
}

function detectConflicts(sourceDir: string, targetDir: string): string[] {
  if (!fs.existsSync(targetDir)) return []

  const conflicts: string[] = []
  const sourceFiles = collectFiles(sourceDir)

  for (const relPath of sourceFiles) {
    const targetFile = path.join(targetDir, relPath)
    const sourceFile = path.join(sourceDir, relPath)
    if (!fs.existsSync(targetFile)) continue

    const sourceHash = hashFile(sourceFile)
    const targetHash = hashFile(targetFile)
    if (sourceHash !== targetHash) {
      conflicts.push(relPath)
    }
  }

  return conflicts
}

function hashFile(filePath: string): string {
  const content = fs.readFileSync(filePath)
  return crypto.createHash('sha256').update(content).digest('hex')
}

function collectFiles(dir: string, prefix = ''): string[] {
  if (!fs.existsSync(dir)) return []
  const results: string[] = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const rel = path.join(prefix, entry.name)
    if (entry.isDirectory()) {
      results.push(...collectFiles(path.join(dir, entry.name), rel))
    } else {
      results.push(rel)
    }
  }
  return results
}

async function updateAgentsMd(
  projectRoot: string,
  force: boolean,
): Promise<'updated' | 'unchanged' | 'no-markers' | 'skipped'> {
  const agentsMdPath = path.join(projectRoot, 'AGENTS.md')
  const { rendered: template, managedSources } = renderAgentsFramework(projectRoot)
  if (!fs.existsSync(agentsMdPath)) {
    if (!force) {
      const confirm = await p.confirm({ message: 'AGENTS.md 缺失，是否用当前模板创建？' })
      if (p.isCancel(confirm) || !confirm) return 'skipped'
    }
    fs.writeFileSync(agentsMdPath, cleanAgentsMdSlots(template, managedSources), 'utf-8')
    return 'updated'
  }

  const existing = fs.readFileSync(agentsMdPath, 'utf-8')
  const rendered = cleanAgentsMdSlots(mergeAgentsMdContent(template, existing, managedSources), managedSources)

  if (existing === rendered) return 'unchanged'

  if (restoreAgentsMdSlots(existing, managedSources) === null) {
    if (!force) {
      const confirm = await p.confirm({
        message: 'AGENTS.md 无法按模板定位定制内容，是否用当前模板改造并完整保留原文？',
      })
      if (p.isCancel(confirm) || !confirm) return 'no-markers'
    }
    fs.writeFileSync(agentsMdPath, rendered, 'utf-8')
    return 'updated'
  }

  if (!force) {
    const confirm = await p.confirm({ message: 'AGENTS.md 框架内容有更新，是否应用？（用户定制区会保留）' })
    if (p.isCancel(confirm) || !confirm) return 'skipped'
  }

  fs.writeFileSync(agentsMdPath, rendered, 'utf-8')
  return 'updated'
}

async function commitChanges(
  projectRoot: string,
  version: string,
  stagePaths: string[],
): Promise<void> {
  if (stagePaths.length === 0) return

  try {
    execSync('git rev-parse --is-inside-work-tree', { cwd: projectRoot, stdio: 'ignore' })
  } catch {
    return
  }

  const confirm = await p.confirm({ message: '是否提交本次 update 的变更？' })
  if (p.isCancel(confirm) || !confirm) return

  try {
    const committed = commitHarnessPaths(
      projectRoot,
      `chore(devkeel): update DevKeel templates to ${version}`,
      stagePaths,
    )
    if (committed) p.log.success(`已提交变更 (DevKeel ${version})`)
  } catch {
    p.log.warn('自动提交失败，请手动执行 git add 和 git commit')
  }
}

export function commitHarnessPaths(
  projectRoot: string,
  message: string,
  stagePaths: string[],
): boolean {
  if (stagePaths.length === 0) return false

  const scopedPaths = [
    ...stagePaths,
    ':(exclude).harness/skills-state.json',
    ':(exclude).harness/skills-backups',
  ]
  execFileSync('git', ['add', '--', ...scopedPaths], { cwd: projectRoot, stdio: 'ignore' })
  const stagedHarnessPaths = execFileSync(
    'git',
    ['diff', '--cached', '--name-only', '--', ...scopedPaths],
    { cwd: projectRoot, encoding: 'utf-8' },
  ).trim()
  if (!stagedHarnessPaths) return false

  execFileSync(
    'git',
    ['commit', '--only', '-m', message, '--', ...scopedPaths],
    { cwd: projectRoot, stdio: 'ignore' },
  )
  return true
}
