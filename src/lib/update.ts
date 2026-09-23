import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import YAML from 'yaml'
import { readVersions, getBuiltinVersions, type VersionsRecord } from './versions.js'
import { getTemplatesDir } from './templates-dir.js'

export interface UpdateItem {
  category: string
  name: string
  from: string
  to: string
}

export interface LegacyMigrationFileUpdate {
  relativePath: string
  originalContent: string
  updatedContent: string
}

export interface LegacyMigrationError {
  kind: 'source' | 'target-schema'
  relativePath: string
  message: string
}

export interface LegacyMigrationPlan {
  hasChanges: boolean
  fileUpdates: LegacyMigrationFileUpdate[]
  removePaths: string[]
  preservedPaths?: string[]
  errors: LegacyMigrationError[]
}

export interface LegacyMigrationResult {
  changedPaths: string[]
  preservedPaths: string[]
}

export interface LegacyMigrationOptions {
  allowLegacyDebuggingRemoval?: boolean
}

export interface DiscussionMigrationHooks {
  afterAssetsSwitched?: () => void
  beforeVersionsCommit?: () => void
}

export interface DiscussionMigrationResult {
  changedPaths: string[]
  recovered: boolean
}

const LEGACY_SCHEMA_TARGETS: ReadonlyMap<string, string> = new Map([
  ['superpowers-lite', 'full'],
  ['harness-full', 'full'],
  ['harness-lite', 'lite'],
])
const DISCUSSION_SKILL = 'brainstorming'
const LEGACY_DISCUSSION_SKILL_VERSION = '6.0.3'
const DISCUSSION_RETIRED_SKILLS = ['grilling', 'openspec-explore'] as const
const DISCUSSION_COMMAND = '.harness/commands/opsx/explore.md'
const DISCUSSION_JOURNAL = '.harness/.discussion-skill-migration.json'
const DEBUGGING_SKILL = 'systematic-debugging'
const LEGACY_DEBUGGING_SKILL = 'automated-instrumented-debugging'
const THREE_PART_SEMVER = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/u
const LEGACY_RETIRED_MANAGED_SKILLS = [
  'receiving-code-review',
  'openspec-propose',
] as const

const RETIRED_MANAGED_COMMANDS = [
  {
    relativePath: '.harness/commands/opsx/propose.md',
    marker: 'Load and follow the `openspec-propose` skill.',
  },
] as const

const TEMPLATE_RETIRED_MANAGED_SKILLS = [
  'architecture-diagram',
  'human-review',
] as const

const SNAPSHOT_RETIRED_MANAGED_SKILLS = [
  'writing-plans',
  'executing-plans',
  'subagent-driven-development',
  'requesting-code-review',
  'verification-before-completion',
  'finishing-a-development-branch',
  'test-driven-development',
  'using-git-worktrees',
] as const

export const RETIRED_MANAGED_SKILLS = [
  ...DISCUSSION_RETIRED_SKILLS,
  LEGACY_DEBUGGING_SKILL,
  ...LEGACY_RETIRED_MANAGED_SKILLS,
  ...TEMPLATE_RETIRED_MANAGED_SKILLS,
  ...SNAPSHOT_RETIRED_MANAGED_SKILLS,
] as const

const GENERIC_RETIRED_MANAGED_SKILLS = [
  LEGACY_DEBUGGING_SKILL,
  ...LEGACY_RETIRED_MANAGED_SKILLS,
  ...TEMPLATE_RETIRED_MANAGED_SKILLS,
  ...SNAPSHOT_RETIRED_MANAGED_SKILLS,
] as const

interface DiscussionMigrationEntry {
  kind: 'replace' | 'remove'
  target: string
  backup: string
  stage?: string
  originalExisted: boolean
}

interface DiscussionMigrationState {
  version: 1
  phase: 'prepared' | 'assets-switched' | 'versions-committed'
  originalVersionsContent: string
  entries: DiscussionMigrationEntry[]
}

interface SelectorScan {
  fileUpdates: LegacyMigrationFileUpdate[]
  errors: LegacyMigrationError[]
}

const MAX_TEMPORARY_FILE_ATTEMPTS = 16

export function isRetiredManagedSkill(name: string): boolean {
  return (RETIRED_MANAGED_SKILLS as readonly string[]).includes(name)
}

export function isLegacySchema(name: string): boolean {
  return LEGACY_SCHEMA_TARGETS.has(name)
}

export function assertSchemaTargetsAvailable(projectRoot: string, templatesDir: string): void {
  const registered = readVersions(projectRoot)?.schemas ?? {}
  for (const schema of new Set(LEGACY_SCHEMA_TARGETS.values())) {
    const relativePath = `openspec/schemas/${schema}`
    const source = path.join(templatesDir, relativePath)
    if (!fs.existsSync(source)) continue
    const target = resolveSafeProjectPath(projectRoot, relativePath)
    if (!fs.existsSync(target)) continue
    if (isLocalDirectory(target) && (
      Object.prototype.hasOwnProperty.call(registered, schema)
      || treesAreEqual(source, target)
    )) continue
    throw new Error(
      `${relativePath} 与内置 schema 同名且未登记为受管资产；请先重命名自定义 schema 并同步 selector，再重试`,
    )
  }
}

function toRelativePath(projectRoot: string, filePath: string): string {
  return path.relative(projectRoot, filePath).split(path.sep).join('/')
}

function isLocalDirectory(filePath: string): boolean {
  try {
    return fs.lstatSync(filePath).isDirectory()
  } catch {
    return false
  }
}

function collectFilesNamed(dir: string, fileName: string): string[] {
  if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) return []

  const files: string[] = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    const entryPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...collectFilesNamed(entryPath, fileName))
    } else if (entry.isFile() && entry.name === fileName) {
      files.push(entryPath)
    }
  }
  return files
}

function collectSelectorFiles(projectRoot: string): string[] {
  const openspecRoot = path.join(projectRoot, 'openspec')
  const candidates: string[] = []
  const configPath = path.join(openspecRoot, 'config.yaml')

  if (fs.existsSync(configPath)) candidates.push(configPath)

  for (const filePath of collectFilesNamed(path.join(openspecRoot, 'archive'), '.openspec.yaml')) {
    candidates.push(filePath)
  }
  for (const filePath of collectFilesNamed(path.join(openspecRoot, 'changes'), '.openspec.yaml')) {
    candidates.push(filePath)
  }
  return candidates
}

function formatParseError(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

function replaceYamlScalarToken(
  originalContent: string,
  range: readonly number[],
  value: string,
): string | null {
  const start = range[0]
  const end = range[1]
  if (typeof start !== 'number' || typeof end !== 'number') return null

  const originalToken = originalContent.slice(start, end)
  let replacement = value
  if (originalToken.startsWith("'")) {
    replacement = `'${value.replace(/'/g, "''")}'`
  } else if (originalToken.startsWith('"')) {
    replacement = JSON.stringify(value)
  }
  return originalContent.slice(0, start) + replacement + originalContent.slice(end)
}

function planYamlSelectorUpdate(
  projectRoot: string,
  filePath: string,
): { update?: LegacyMigrationFileUpdate; error?: LegacyMigrationError } {
  const relativePath = toRelativePath(projectRoot, filePath)
  try {
    const originalContent = fs.readFileSync(filePath, 'utf-8')
    const document = YAML.parseDocument(originalContent, { keepSourceTokens: true })
    if (document.errors.length > 0) {
      return {
        error: {
          kind: 'source',
          relativePath,
          message: document.errors.map(formatParseError).join('; '),
        },
      }
    }

    const parsed = document.toJS() as unknown
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {}
    const selector = (parsed as Record<string, unknown>)['schema']
    const targetSchema = typeof selector === 'string' ? LEGACY_SCHEMA_TARGETS.get(selector) : undefined
    if (!targetSchema) return {}

    const schemaNode = document.get('schema', true) as unknown
    if (!schemaNode || typeof schemaNode !== 'object') {
      return { error: { kind: 'source', relativePath, message: '无法定位 schema 源码范围' } }
    }
    const updatedContent = replaceYamlScalarToken(
      originalContent,
      (schemaNode as { range?: readonly number[] }).range ?? [],
      targetSchema,
    )
    if (updatedContent === null) {
      return { error: { kind: 'source', relativePath, message: '无法定位 schema 源码范围' } }
    }

    return {
      update: {
        relativePath,
        originalContent,
        updatedContent,
      },
    }
  } catch (error) {
    return { error: { kind: 'source', relativePath, message: formatParseError(error) } }
  }
}

function scanSelectors(projectRoot: string): SelectorScan {
  const fileUpdates: LegacyMigrationFileUpdate[] = []
  const errors: LegacyMigrationError[] = []

  for (const filePath of collectSelectorFiles(projectRoot)) {
    const result = planYamlSelectorUpdate(projectRoot, filePath)
    if (result.update) fileUpdates.push(result.update)
    if (result.error) errors.push(result.error)
  }
  return { fileUpdates, errors }
}

function validateSchemaFile(filePath: string, relativePath: string): LegacyMigrationError | null {
  if (!fs.existsSync(filePath)) {
    return { kind: 'target-schema', relativePath, message: `${relativePath} schema 不存在` }
  }

  try {
    const document = YAML.parseDocument(fs.readFileSync(filePath, 'utf-8'))
    if (document.errors.length > 0) {
      return {
        kind: 'target-schema',
        relativePath,
        message: document.errors.map(formatParseError).join('; '),
      }
    }
    document.toJS()
    return null
  } catch (error) {
    return { kind: 'target-schema', relativePath, message: formatParseError(error) }
  }
}

function validateTargetSchema(projectRoot: string, schema: string): LegacyMigrationError | null {
  const filePath = path.join(projectRoot, 'openspec', 'schemas', schema, 'schema.yaml')
  return validateSchemaFile(filePath, toRelativePath(projectRoot, filePath))
}

function validateTemplateTargetSchema(templatesDir: string, schema: string): LegacyMigrationError | null {
  const relativePath = `openspec/schemas/${schema}/schema.yaml`
  return validateSchemaFile(path.join(templatesDir, relativePath), `templates/${relativePath}`)
}

function migrationTargetSchemas(
  plan: Pick<LegacyMigrationPlan, 'fileUpdates' | 'removePaths'>,
): string[] {
  const targets = new Set<string>()
  for (const update of plan.fileUpdates) {
    const selector = (YAML.parse(update.originalContent) as Record<string, unknown>)['schema']
    const target = typeof selector === 'string' ? LEGACY_SCHEMA_TARGETS.get(selector) : undefined
    if (target) targets.add(target)
  }
  for (const [legacy, target] of LEGACY_SCHEMA_TARGETS) {
    if (plan.removePaths.includes(`openspec/schemas/${legacy}`)) targets.add(target)
  }
  return [...targets]
}

function collectManagedRetiredSkills(
  projectRoot: string,
  builtinVersions: VersionsRecord,
  errors: LegacyMigrationError[],
  options: LegacyMigrationOptions,
): { removePaths: string[]; preservedPaths: string[] } {
  const versionsPath = path.join(projectRoot, '.harness', 'versions.yml')
  if (!fs.existsSync(versionsPath)) return { removePaths: [], preservedPaths: [] }

  const existingRetiredSkills = GENERIC_RETIRED_MANAGED_SKILLS.filter((skill) => {
    const skillPath = path.join(projectRoot, '.harness', 'skills', skill)
    return fs.existsSync(skillPath) && fs.statSync(skillPath).isDirectory()
  })
  if (existingRetiredSkills.length === 0) return { removePaths: [], preservedPaths: [] }

  try {
    const document = YAML.parseDocument(fs.readFileSync(versionsPath, 'utf-8'))
    if (document.errors.length > 0) {
      errors.push({
        kind: 'source',
        relativePath: toRelativePath(projectRoot, versionsPath),
        message: document.errors.map(formatParseError).join('; '),
      })
      return { removePaths: [], preservedPaths: [] }
    }

    const versions = document.toJS() as VersionsRecord

    const removePaths: string[] = []
    const preservedPaths: string[] = []

    for (const skill of existingRetiredSkills) {
      const relativePath = `.harness/skills/${skill}`
      if (Object.prototype.hasOwnProperty.call(builtinVersions.skills ?? {}, skill)) continue
      if (skill === LEGACY_DEBUGGING_SKILL) {
        const replacementPath = path.join(
          projectRoot,
          '.harness',
          'skills',
          DEBUGGING_SKILL,
        )
        const wasManaged = Object.prototype.hasOwnProperty.call(
          versions.skills ?? {},
          LEGACY_DEBUGGING_SKILL,
        )
        const replacementIsRegistered = versions.skills?.[DEBUGGING_SKILL]
          === builtinVersions.skills?.[DEBUGGING_SKILL]
        const replacementIsAuthorized = options.allowLegacyDebuggingRemoval
          ?? replacementIsRegistered
        if (!wasManaged || !isLocalDirectory(replacementPath) || !replacementIsAuthorized) {
          preservedPaths.push(relativePath)
          continue
        }
      }
      removePaths.push(relativePath)
    }

    return { removePaths, preservedPaths }
  } catch (error) {
    errors.push({
      kind: 'source',
      relativePath: toRelativePath(projectRoot, versionsPath),
      message: formatParseError(error),
    })
    return { removePaths: [], preservedPaths: [] }
  }
}

function collectManagedRetiredCommands(projectRoot: string): string[] {
  const removePaths: string[] = []
  for (const command of RETIRED_MANAGED_COMMANDS) {
    const filePath = path.join(projectRoot, command.relativePath)
    if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) continue
    if (!fs.readFileSync(filePath, 'utf-8').includes(command.marker)) continue
    removePaths.push(command.relativePath)
  }
  return removePaths
}

function hasLegacyVersionEntries(
  projectRoot: string,
  builtinVersions: VersionsRecord,
  options: LegacyMigrationOptions,
): boolean {
  const versions = readVersions(projectRoot)
  if (!versions) return false
  return [...LEGACY_SCHEMA_TARGETS.keys()].some(schema => (
    Object.prototype.hasOwnProperty.call(versions.schemas ?? {}, schema)
  ))
    || GENERIC_RETIRED_MANAGED_SKILLS.some(skill => (
      Object.prototype.hasOwnProperty.call(versions.skills ?? {}, skill)
      && (
        skill !== LEGACY_DEBUGGING_SKILL
        || (
          isLocalDirectory(path.join(projectRoot, '.harness', 'skills', DEBUGGING_SKILL))
          && (
            options.allowLegacyDebuggingRemoval
            ?? versions.skills?.[DEBUGGING_SKILL]
              === builtinVersions.skills?.[DEBUGGING_SKILL]
          )
        )
      )
    ))
}

export function planLegacyMigrations(
  projectRoot: string,
  options: LegacyMigrationOptions = {},
): LegacyMigrationPlan {
  const selectorScan = scanSelectors(projectRoot)
  const errors = [...selectorScan.errors]
  const builtinVersions = getBuiltinVersions()
  const retiredSkills = collectManagedRetiredSkills(
    projectRoot,
    builtinVersions,
    errors,
    options,
  )
  const removePaths = [
    ...retiredSkills.removePaths,
    ...collectManagedRetiredCommands(projectRoot),
  ]
  const preservedPaths = [...retiredSkills.preservedPaths]
  for (const legacy of [...LEGACY_SCHEMA_TARGETS.keys()]) {
    const legacySchemaPath = path.join(projectRoot, 'openspec', 'schemas', legacy)
    if (fs.existsSync(legacySchemaPath) && fs.statSync(legacySchemaPath).isDirectory()) {
      removePaths.push(`openspec/schemas/${legacy}`)
    }
  }
  for (const schema of migrationTargetSchemas({ fileUpdates: selectorScan.fileUpdates, removePaths })) {
    const targetSchemaError = validateTargetSchema(projectRoot, schema)
    if (targetSchemaError) errors.push(targetSchemaError)
  }

  removePaths.sort()
  preservedPaths.sort()
  return {
    hasChanges: selectorScan.fileUpdates.length > 0
      || removePaths.length > 0
      || hasLegacyVersionEntries(projectRoot, builtinVersions, options),
    fileUpdates: selectorScan.fileUpdates,
    removePaths,
    preservedPaths,
    errors,
  }
}

export function assertLegacyMigrationPreflight(
  plan: LegacyMigrationPlan,
  templatesDir: string,
): void {
  const sourceErrors = plan.errors.filter(error => error.kind === 'source')
  if (sourceErrors.length > 0) {
    const paths = sourceErrors.map(error => error.relativePath).join(', ')
    throw new Error(`legacy migration 预检失败，以下源文件无法解析: ${paths}`)
  }

  if (plan.errors.some(error => error.kind === 'target-schema')) {
    for (const schema of migrationTargetSchemas(plan)) {
      const templateSchemaError = validateTemplateTargetSchema(templatesDir, schema)
      if (templateSchemaError) {
        throw new Error(
          `legacy migration 预检失败，模板目标 schema 无法使用: ${templateSchemaError.relativePath}`,
        )
      }
    }
  }
}

function resolveSafeProjectPath(projectRoot: string, relativePath: string): string {
  if (!relativePath || path.isAbsolute(relativePath)) {
    throw new Error(`legacy migration 不安全路径: ${relativePath || '(empty)'}`)
  }

  const root = path.resolve(projectRoot)
  const resolved = path.resolve(root, relativePath)
  if (resolved === root || !resolved.startsWith(root + path.sep)) {
    throw new Error(`legacy migration 不安全路径: ${relativePath}`)
  }

  let currentPath = root
  for (const segment of path.relative(root, resolved).split(path.sep)) {
    currentPath = path.join(currentPath, segment)
    try {
      if (fs.lstatSync(currentPath).isSymbolicLink()) {
        throw new Error(`legacy migration 不安全路径: ${relativePath}`)
      }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') break
      throw error
    }
  }

  const realRoot = fs.realpathSync(root)
  let existingAncestor = resolved
  while (!fs.existsSync(existingAncestor) && existingAncestor !== root) {
    existingAncestor = path.dirname(existingAncestor)
  }
  if (!fs.existsSync(existingAncestor)) {
    throw new Error(`legacy migration 不安全路径: ${relativePath}`)
  }

  const realAncestor = fs.realpathSync(existingAncestor)
  const relativeRealPath = path.relative(realRoot, realAncestor)
  if (
    path.isAbsolute(relativeRealPath)
    || relativeRealPath === '..'
    || relativeRealPath.startsWith(`..${path.sep}`)
  ) {
    throw new Error(`legacy migration 不安全路径: ${relativePath}`)
  }
  return resolved
}

function createExclusiveTemporaryFile(filePath: string, mode: number): { filePath: string; fd: number } {
  for (let attempt = 0; attempt < MAX_TEMPORARY_FILE_ATTEMPTS; attempt++) {
    const suffix = crypto.randomBytes(16).toString('hex')
    const temporaryPath = path.join(
      path.dirname(filePath),
      `.${path.basename(filePath)}.legacy-migration-${suffix}`,
    )
    try {
      return { filePath: temporaryPath, fd: fs.openSync(temporaryPath, 'wx', mode) }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error
    }
  }
  throw new Error(`legacy migration 无法创建独占临时文件: ${filePath}`)
}

function writeFileAtomically(filePath: string, content: string): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  const mode = fs.existsSync(filePath) ? fs.statSync(filePath).mode : 0o600
  let temporaryPath: string | null = null
  let temporaryFd: number | null = null

  try {
    const temporaryFile = createExclusiveTemporaryFile(filePath, mode)
    temporaryPath = temporaryFile.filePath
    temporaryFd = temporaryFile.fd
    fs.writeFileSync(temporaryFd, content, { encoding: 'utf-8' })
    fs.closeSync(temporaryFd)
    temporaryFd = null
    fs.renameSync(temporaryPath, filePath)
    temporaryPath = null
  } finally {
    try {
      if (temporaryFd !== null) fs.closeSync(temporaryFd)
    } finally {
      if (temporaryPath !== null && fs.existsSync(temporaryPath)) fs.unlinkSync(temporaryPath)
    }
  }
}

export function writeVersionsAtomically(
  projectRoot: string,
  versions: VersionsRecord,
): void {
  const versionsPath = resolveSafeProjectPath(projectRoot, '.harness/versions.yml')
  writeFileAtomically(
    versionsPath,
    YAML.stringify(versions, {
      lineWidth: 0,
      defaultStringType: 'QUOTE_DOUBLE',
      defaultKeyType: 'PLAIN',
    }),
  )
}

function collectTreeEntries(
  root: string,
  relativePath = '',
): Array<{ relativePath: string; kind: 'directory' | 'file'; content?: Buffer }> {
  const current = relativePath ? path.join(root, relativePath) : root
  const stat = fs.lstatSync(current)
  if (stat.isSymbolicLink()) {
    throw new Error(`discussion migration 不允许符号链接: ${current}`)
  }
  if (stat.isFile()) {
    return [{ relativePath, kind: 'file', content: fs.readFileSync(current) }]
  }
  if (!stat.isDirectory()) {
    throw new Error(`discussion migration 不支持的文件类型: ${current}`)
  }

  const entries: Array<{ relativePath: string; kind: 'directory' | 'file'; content?: Buffer }> = []
  if (relativePath) entries.push({ relativePath, kind: 'directory' })
  for (const entry of fs.readdirSync(current, { withFileTypes: true }).sort((a, b) => (
    a.name.localeCompare(b.name)
  ))) {
    const childRelativePath = relativePath ? path.join(relativePath, entry.name) : entry.name
    entries.push(...collectTreeEntries(root, childRelativePath))
  }
  return entries
}

function treesAreEqual(source: string, target: string): boolean {
  if (!fs.existsSync(source) || !fs.existsSync(target)) return false
  try {
    const sourceEntries = collectTreeEntries(source)
    const targetEntries = collectTreeEntries(target)
    if (sourceEntries.length !== targetEntries.length) return false
    return sourceEntries.every((entry, index) => {
      const targetEntry = targetEntries[index]
      return targetEntry?.relativePath === entry.relativePath
        && targetEntry.kind === entry.kind
        && (entry.kind === 'directory' || entry.content?.equals(targetEntry.content!))
    })
  } catch {
    return false
  }
}

function filesAreEqual(source: string, target: string): boolean {
  if (!fs.existsSync(source) || !fs.existsSync(target)) return false
  try {
    const sourceStat = fs.lstatSync(source)
    const targetStat = fs.lstatSync(target)
    return sourceStat.isFile()
      && targetStat.isFile()
      && fs.readFileSync(source).equals(fs.readFileSync(target))
  } catch {
    return false
  }
}

function copyTreeStrict(source: string, target: string): void {
  const stat = fs.lstatSync(source)
  if (stat.isSymbolicLink()) {
    throw new Error(`discussion migration 模板不允许符号链接: ${source}`)
  }
  if (stat.isFile()) {
    fs.copyFileSync(source, target)
    return
  }
  if (!stat.isDirectory()) {
    throw new Error(`discussion migration 模板包含不支持的文件类型: ${source}`)
  }

  fs.mkdirSync(target)
  for (const entry of fs.readdirSync(source, { withFileTypes: true })) {
    copyTreeStrict(path.join(source, entry.name), path.join(target, entry.name))
  }
}

function validateDiscussionTemplates(templatesDir: string): {
  skillSource: string
  commandSource: string
  skillVersion: string
} {
  const versionsFile = path.join(templatesDir, 'versions-yml.yml')
  const skillSource = path.join(templatesDir, 'skills', DISCUSSION_SKILL)
  const skillFile = path.join(skillSource, 'SKILL.md')
  const referenceFile = path.join(skillSource, 'references', 'openspec-context.md')
  const commandSource = path.join(templatesDir, 'commands', 'opsx', 'explore.md')
  for (const requiredPath of [versionsFile, skillFile, referenceFile, commandSource]) {
    if (!fs.existsSync(requiredPath) || !fs.lstatSync(requiredPath).isFile()) {
      throw new Error(`discussion migration 模板缺少必需文件: ${requiredPath}`)
    }
  }

  let registeredVersion: unknown
  try {
    const versions = YAML.parse(fs.readFileSync(versionsFile, 'utf-8')) as Partial<VersionsRecord>
    registeredVersion = versions?.skills?.[DISCUSSION_SKILL]
  } catch {
    throw new Error('discussion migration 模板版本表无效')
  }
  if (
    typeof registeredVersion !== 'string'
    || !THREE_PART_SEMVER.test(registeredVersion)
  ) {
    throw new Error('discussion migration 模板版本表的 brainstorming 版本必须为三段 semver')
  }

  collectTreeEntries(skillSource)
  const skillContent = fs.readFileSync(skillFile, 'utf-8')
  const frontmatterMatch = skillContent.match(/^---\n([\s\S]*?)\n---(?:\n|$)/)
  if (!frontmatterMatch) {
    throw new Error('discussion migration brainstorming 模板 frontmatter 无效')
  }
  const frontmatter = YAML.parse(frontmatterMatch[1]!) as Record<string, unknown>
  const metadata = frontmatter['metadata'] as Record<string, unknown> | undefined
  if (
    frontmatter['name'] !== DISCUSSION_SKILL
    || metadata?.['author'] !== 'devkeel'
    || String(metadata?.['version']) !== registeredVersion
  ) {
    throw new Error('discussion migration brainstorming 模板 metadata 无效')
  }

  const commandContent = fs.readFileSync(commandSource, 'utf-8')
  if (
    !commandContent.includes('`brainstorming`')
    || !commandContent.includes('`references/openspec-context.md`')
    || commandContent.includes('openspec-explore')
  ) {
    throw new Error('discussion migration explore 命令模板无效')
  }
  return { skillSource, commandSource, skillVersion: registeredVersion }
}

function discussionVersionsAreCommitted(projectRoot: string, skillVersion: string): boolean {
  const versions = readVersions(projectRoot)
  return versions?.skills?.[DISCUSSION_SKILL] === skillVersion
    && DISCUSSION_RETIRED_SKILLS.every(skill => (
      !Object.prototype.hasOwnProperty.call(versions.skills ?? {}, skill)
    ))
}

function validateDiscussionTargetPaths(projectRoot: string): void {
  for (const relativePath of [
    `.harness/skills/${DISCUSSION_SKILL}`,
    ...DISCUSSION_RETIRED_SKILLS.map(skill => `.harness/skills/${skill}`),
    DISCUSSION_COMMAND,
    DISCUSSION_JOURNAL,
    '.harness/versions.yml',
  ]) {
    resolveSafeProjectPath(projectRoot, relativePath)
  }
}

function installedDiscussionAssetsAreExact(projectRoot: string, templatesDir: string): boolean {
  const { skillSource, commandSource } = validateDiscussionTemplates(templatesDir)
  const skillTarget = resolveSafeProjectPath(projectRoot, `.harness/skills/${DISCUSSION_SKILL}`)
  const commandTarget = resolveSafeProjectPath(projectRoot, DISCUSSION_COMMAND)
  return treesAreEqual(skillSource, skillTarget) && filesAreEqual(commandSource, commandTarget)
}

export function isDiscussionSkillMigrationRequired(
  projectRoot: string,
  templatesDir = getTemplatesDir(),
): boolean {
  validateDiscussionTargetPaths(projectRoot)
  const { skillVersion } = validateDiscussionTemplates(templatesDir)
  const journalPath = resolveSafeProjectPath(projectRoot, DISCUSSION_JOURNAL)
  if (fs.existsSync(journalPath)) return true
  const versions = readVersions(projectRoot)
  const registeredSkills = versions?.skills ?? {}
  const hasRetiredSkill = DISCUSSION_RETIRED_SKILLS.some(skill => (
    Object.prototype.hasOwnProperty.call(registeredSkills, skill)
    || fs.existsSync(resolveSafeProjectPath(projectRoot, `.harness/skills/${skill}`))
  ))
  if (hasRetiredSkill) return true
  if (registeredSkills[DISCUSSION_SKILL] === LEGACY_DISCUSSION_SKILL_VERSION) return true
  if (registeredSkills[DISCUSSION_SKILL] !== skillVersion) return false
  return !installedDiscussionAssetsAreExact(projectRoot, templatesDir)
}

function validateDiscussionState(
  projectRoot: string,
  value: unknown,
): DiscussionMigrationState {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('discussion migration 恢复日志无效')
  }
  const state = value as Partial<DiscussionMigrationState>
  const allowedTargets = new Set([
    `.harness/skills/${DISCUSSION_SKILL}`,
    ...DISCUSSION_RETIRED_SKILLS.map(skill => `.harness/skills/${skill}`),
    DISCUSSION_COMMAND,
  ])
  if (
    state.version !== 1
    || !['prepared', 'assets-switched', 'versions-committed'].includes(state.phase ?? '')
    || typeof state.originalVersionsContent !== 'string'
    || !Array.isArray(state.entries)
    || state.entries.length !== allowedTargets.size
  ) {
    throw new Error('discussion migration 恢复日志无效')
  }

  const seenTargets = new Set<string>()
  for (const entry of state.entries) {
    if (
      !entry
      || !allowedTargets.has(entry.target)
      || seenTargets.has(entry.target)
      || !['replace', 'remove'].includes(entry.kind)
      || typeof entry.backup !== 'string'
      || typeof entry.originalExisted !== 'boolean'
    ) {
      throw new Error('discussion migration 恢复日志无效')
    }
    const expectedKind = entry.target === `.harness/skills/${DISCUSSION_SKILL}`
      || entry.target === DISCUSSION_COMMAND
      ? 'replace'
      : 'remove'
    if (entry.kind !== expectedKind) throw new Error('discussion migration 恢复日志无效')

    const target = resolveSafeProjectPath(projectRoot, entry.target)
    const backup = resolveSafeProjectPath(projectRoot, entry.backup)
    if (
      path.dirname(backup) !== path.dirname(target)
      || !path.basename(backup).startsWith(`.${path.basename(target)}.discussion-backup-`)
    ) {
      throw new Error('discussion migration 恢复日志无效')
    }
    if (entry.kind === 'replace') {
      if (typeof entry.stage !== 'string') throw new Error('discussion migration 恢复日志无效')
      const stage = resolveSafeProjectPath(projectRoot, entry.stage)
      if (
        path.dirname(stage) !== path.dirname(target)
        || !path.basename(stage).startsWith(`.${path.basename(target)}.discussion-stage-`)
      ) {
        throw new Error('discussion migration 恢复日志无效')
      }
    } else if (entry.stage !== undefined) {
      throw new Error('discussion migration 恢复日志无效')
    }
    seenTargets.add(entry.target)
  }
  return state as DiscussionMigrationState
}

function removeMigrationPath(filePath: string): void {
  if (!fs.existsSync(filePath)) return
  fs.rmSync(filePath, { recursive: true, force: true })
}

function cleanupDiscussionState(projectRoot: string, state: DiscussionMigrationState): void {
  for (const entry of state.entries) {
    removeMigrationPath(resolveSafeProjectPath(projectRoot, entry.backup))
    if (entry.stage) removeMigrationPath(resolveSafeProjectPath(projectRoot, entry.stage))
  }
  removeMigrationPath(resolveSafeProjectPath(projectRoot, DISCUSSION_JOURNAL))
}

function rollbackDiscussionState(projectRoot: string, state: DiscussionMigrationState): void {
  for (const entry of [...state.entries].reverse()) {
    const target = resolveSafeProjectPath(projectRoot, entry.target)
    const backup = resolveSafeProjectPath(projectRoot, entry.backup)
    if (fs.existsSync(backup)) {
      removeMigrationPath(target)
      fs.renameSync(backup, target)
    } else if (!entry.originalExisted) {
      removeMigrationPath(target)
    }
    if (entry.stage) removeMigrationPath(resolveSafeProjectPath(projectRoot, entry.stage))
  }
  const versionsPath = resolveSafeProjectPath(projectRoot, '.harness/versions.yml')
  writeFileAtomically(versionsPath, state.originalVersionsContent)
  removeMigrationPath(resolveSafeProjectPath(projectRoot, DISCUSSION_JOURNAL))
}

function recoverDiscussionMigration(projectRoot: string, templatesDir: string): boolean {
  const journalPath = resolveSafeProjectPath(projectRoot, DISCUSSION_JOURNAL)
  if (!fs.existsSync(journalPath)) return false

  let parsed: unknown
  try {
    parsed = JSON.parse(fs.readFileSync(journalPath, 'utf-8'))
  } catch {
    throw new Error('discussion migration 恢复日志无法解析')
  }
  const state = validateDiscussionState(projectRoot, parsed)
  let installedAssetsAreExact = false
  let skillVersion: string | null = null
  try {
    skillVersion = validateDiscussionTemplates(templatesDir).skillVersion
    installedAssetsAreExact = installedDiscussionAssetsAreExact(projectRoot, templatesDir)
  } catch {
    // A damaged new template must not prevent rollback to the journaled old state.
  }
  const canFinalize = skillVersion !== null
    && discussionVersionsAreCommitted(projectRoot, skillVersion)
    && installedAssetsAreExact
    && DISCUSSION_RETIRED_SKILLS.every(skill => (
      !fs.existsSync(resolveSafeProjectPath(projectRoot, `.harness/skills/${skill}`))
    ))
  if (canFinalize) {
    cleanupDiscussionState(projectRoot, state)
  } else {
    rollbackDiscussionState(projectRoot, state)
  }
  return true
}

export function recoverDiscussionSkillMigration(
  projectRoot: string,
  templatesDir = getTemplatesDir(),
): boolean {
  validateDiscussionTargetPaths(projectRoot)
  return recoverDiscussionMigration(projectRoot, templatesDir)
}

function createDiscussionState(projectRoot: string): DiscussionMigrationState {
  const versionsPath = resolveSafeProjectPath(projectRoot, '.harness/versions.yml')
  if (!fs.existsSync(versionsPath) || !fs.lstatSync(versionsPath).isFile()) {
    throw new Error('discussion migration 需要现有 .harness/versions.yml')
  }
  const token = crypto.randomBytes(16).toString('hex')
  const targets: Array<{ kind: 'replace' | 'remove'; target: string }> = [
    { kind: 'replace', target: `.harness/skills/${DISCUSSION_SKILL}` },
    { kind: 'replace', target: DISCUSSION_COMMAND },
    ...DISCUSSION_RETIRED_SKILLS.map(target => ({
      kind: 'remove' as const,
      target: `.harness/skills/${target}`,
    })),
  ]
  return {
    version: 1,
    phase: 'prepared',
    originalVersionsContent: fs.readFileSync(versionsPath, 'utf-8'),
    entries: targets.map(({ kind, target }) => {
      const fullPath = resolveSafeProjectPath(projectRoot, target)
      const parent = path.dirname(fullPath)
      const base = path.basename(fullPath)
      return {
        kind,
        target,
        backup: toRelativePath(projectRoot, path.join(parent, `.${base}.discussion-backup-${token}`)),
        ...(kind === 'replace'
          ? { stage: toRelativePath(projectRoot, path.join(parent, `.${base}.discussion-stage-${token}`)) }
          : {}),
        originalExisted: fs.existsSync(fullPath),
      }
    }),
  }
}

function stageDiscussionAssets(
  projectRoot: string,
  templatesDir: string,
  state: DiscussionMigrationState,
): void {
  const { skillSource, commandSource } = validateDiscussionTemplates(templatesDir)
  for (const entry of state.entries.filter(entry => entry.kind === 'replace')) {
    const stage = resolveSafeProjectPath(projectRoot, entry.stage!)
    fs.mkdirSync(path.dirname(stage), { recursive: true })
    if (fs.existsSync(stage)) throw new Error(`discussion migration 暂存路径已存在: ${entry.stage}`)
    if (entry.target === `.harness/skills/${DISCUSSION_SKILL}`) {
      copyTreeStrict(skillSource, stage)
      if (!treesAreEqual(skillSource, stage)) {
        throw new Error('discussion migration brainstorming 暂存校验失败')
      }
    } else {
      fs.copyFileSync(commandSource, stage)
      if (!filesAreEqual(commandSource, stage)) {
        throw new Error('discussion migration explore 命令暂存校验失败')
      }
    }
  }
}

function switchDiscussionAssets(projectRoot: string, state: DiscussionMigrationState): void {
  for (const entry of state.entries) {
    const target = resolveSafeProjectPath(projectRoot, entry.target)
    const backup = resolveSafeProjectPath(projectRoot, entry.backup)
    if (fs.existsSync(backup)) throw new Error(`discussion migration 备份路径已存在: ${entry.backup}`)
    if (fs.existsSync(target)) fs.renameSync(target, backup)
    if (entry.kind === 'replace') {
      fs.renameSync(resolveSafeProjectPath(projectRoot, entry.stage!), target)
    }
  }
}

function writeDiscussionJournal(projectRoot: string, state: DiscussionMigrationState): void {
  const journalPath = resolveSafeProjectPath(projectRoot, DISCUSSION_JOURNAL)
  writeFileAtomically(journalPath, JSON.stringify(state, null, 2) + '\n')
}

function commitDiscussionVersions(projectRoot: string, skillVersion: string): void {
  const current = readVersions(projectRoot)
  if (!current) throw new Error('discussion migration 无法解析 .harness/versions.yml')
  const next: VersionsRecord = {
    ...current,
    skills: { ...(current.skills ?? {}), [DISCUSSION_SKILL]: skillVersion },
    agents: { ...(current.agents ?? {}) },
    rules: { ...(current.rules ?? {}) },
    schemas: { ...(current.schemas ?? {}) },
  }
  for (const skill of DISCUSSION_RETIRED_SKILLS) delete next.skills[skill]
  writeVersionsAtomically(projectRoot, next)
}

export function applyDiscussionSkillMigration(
  projectRoot: string,
  templatesDir = getTemplatesDir(),
  hooks: DiscussionMigrationHooks = {},
): DiscussionMigrationResult {
  validateDiscussionTargetPaths(projectRoot)
  const recovered = recoverDiscussionSkillMigration(projectRoot, templatesDir)
  const { skillVersion } = validateDiscussionTemplates(templatesDir)
  if (!isDiscussionSkillMigrationRequired(projectRoot, templatesDir)) {
    return { changedPaths: [], recovered }
  }

  const state = createDiscussionState(projectRoot)
  const changedPaths = state.entries
    .filter(entry => entry.kind === 'replace' || entry.originalExisted)
    .map(entry => entry.target)
  try {
    writeDiscussionJournal(projectRoot, state)
    stageDiscussionAssets(projectRoot, templatesDir, state)
    switchDiscussionAssets(projectRoot, state)
    state.phase = 'assets-switched'
    writeDiscussionJournal(projectRoot, state)
    if (!installedDiscussionAssetsAreExact(projectRoot, templatesDir)) {
      throw new Error('discussion migration 安装后校验失败')
    }
    hooks.afterAssetsSwitched?.()
    hooks.beforeVersionsCommit?.()
    commitDiscussionVersions(projectRoot, skillVersion)
    state.phase = 'versions-committed'
    writeDiscussionJournal(projectRoot, state)
    cleanupDiscussionState(projectRoot, state)
    return { changedPaths, recovered }
  } catch (error) {
    if (state.phase !== 'versions-committed') rollbackDiscussionState(projectRoot, state)
    throw error
  }
}

function validateUniquePlanTargets(projectRoot: string, plan: LegacyMigrationPlan): void {
  const targets: Array<{ relativePath: string; canonicalPath: string }> = []
  const relativePaths = [
    ...plan.fileUpdates.map(update => update.relativePath),
    ...plan.removePaths,
  ]

  for (const relativePath of relativePaths) {
    const fullPath = resolveSafeProjectPath(projectRoot, relativePath)
    const canonicalPath = fs.existsSync(fullPath) ? fs.realpathSync(fullPath) : fullPath
    const overlaps = targets.find(target => canonicalPath === target.canonicalPath
      || canonicalPath.startsWith(target.canonicalPath + path.sep)
      || target.canonicalPath.startsWith(canonicalPath + path.sep))
    if (overlaps) {
      throw new Error(
        `legacy migration 计划包含重复操作: ${overlaps.relativePath}, ${relativePath}`,
      )
    }
    targets.push({ relativePath, canonicalPath })
  }
}

function validatePlanBeforeApply(
  projectRoot: string,
  plan: LegacyMigrationPlan,
  options: LegacyMigrationOptions,
): void {
  if (plan.errors.length > 0) {
    const paths = plan.errors.map(error => error.relativePath).join(', ')
    throw new Error(`legacy migration 无法执行，以下文件解析失败: ${paths}`)
  }

  validateUniquePlanTargets(projectRoot, plan)

  for (const schema of migrationTargetSchemas(plan)) {
    const targetSchemaError = validateTargetSchema(projectRoot, schema)
    if (targetSchemaError) {
      throw new Error(`legacy migration 无法执行，目标 schema 解析失败: ${targetSchemaError.relativePath}`)
    }
  }

  const refreshedPlan = planLegacyMigrations(projectRoot, options)
  if (refreshedPlan.errors.length > 0) {
    const paths = refreshedPlan.errors.map(error => error.relativePath).join(', ')
    throw new Error(`legacy migration metadata 解析失败: ${paths}`)
  }
  const plannedFilePaths = new Set(plan.fileUpdates.map(update => update.relativePath))
  const plannedRemovePaths = new Set(plan.removePaths)
  const refreshedFileUpdates = new Map(
    refreshedPlan.fileUpdates.map(update => [update.relativePath, update]),
  )
  const refreshedRemovePaths = new Set(refreshedPlan.removePaths)
  const unexpectedPaths = [
    ...refreshedPlan.fileUpdates
      .map(update => update.relativePath)
      .filter(relativePath => !plannedFilePaths.has(relativePath)),
    ...refreshedPlan.removePaths
      .filter(relativePath => !plannedRemovePaths.has(relativePath)),
  ]
  if (unexpectedPaths.length > 0) {
    throw new Error(`legacy migration 计划已过期: ${unexpectedPaths.join(', ')}`)
  }

  const unauthorizedPaths: string[] = []
  for (const update of plan.fileUpdates) {
    const filePath = resolveSafeProjectPath(projectRoot, update.relativePath)
    if (!fs.existsSync(filePath)) continue
    const currentContent = fs.readFileSync(filePath, 'utf-8')
    if (currentContent === update.updatedContent) continue

    const refreshedUpdate = refreshedFileUpdates.get(update.relativePath)
    if (
      !refreshedUpdate
      || refreshedUpdate.originalContent !== update.originalContent
      || refreshedUpdate.updatedContent !== update.updatedContent
    ) unauthorizedPaths.push(update.relativePath)
  }
  for (const relativePath of plan.removePaths) {
    const fullPath = resolveSafeProjectPath(projectRoot, relativePath)
    if (fs.existsSync(fullPath) && !refreshedRemovePaths.has(relativePath)) {
      unauthorizedPaths.push(relativePath)
    }
  }
  if (unauthorizedPaths.length > 0) {
    throw new Error(`legacy migration 计划包含未授权操作: ${unauthorizedPaths.join(', ')}`)
  }
}

export function applyLegacyMigrations(
  projectRoot: string,
  plan: LegacyMigrationPlan,
  options: LegacyMigrationOptions = {},
): LegacyMigrationResult {
  validatePlanBeforeApply(projectRoot, plan, options)
  const changedPaths: string[] = []

  for (const update of plan.fileUpdates) {
    const filePath = resolveSafeProjectPath(projectRoot, update.relativePath)
    if (!fs.existsSync(filePath)) continue
    if (fs.readFileSync(filePath, 'utf-8') === update.updatedContent) continue
    writeFileAtomically(filePath, update.updatedContent)
    changedPaths.push(update.relativePath)
  }

  const legacySchemaPaths = new Set(
    [...LEGACY_SCHEMA_TARGETS.keys()].map(schema => `openspec/schemas/${schema}`),
  )
  for (const relativePath of plan.removePaths) {
    if (legacySchemaPaths.has(relativePath)) continue
    const fullPath = resolveSafeProjectPath(projectRoot, relativePath)
    if (!fs.existsSync(fullPath)) continue
    fs.rmSync(fullPath, { recursive: true, force: true })
    changedPaths.push(relativePath)
  }

  for (const [legacy, target] of LEGACY_SCHEMA_TARGETS) {
    const legacySchemaRelativePath = `openspec/schemas/${legacy}`
    if (!plan.removePaths.includes(legacySchemaRelativePath)) continue
    const legacySchemaPath = resolveSafeProjectPath(projectRoot, legacySchemaRelativePath)
    const rescan = scanSelectors(projectRoot)
    const targetSchemaError = validateTargetSchema(projectRoot, target)
    if (
      fs.existsSync(legacySchemaPath)
      && !targetSchemaError
      && rescan.errors.length === 0
      && rescan.fileUpdates.length === 0
    ) {
      fs.rmSync(legacySchemaPath, { recursive: true, force: true })
      changedPaths.push(legacySchemaRelativePath)
    }
  }

  return { changedPaths, preservedPaths: [...(plan.preservedPaths ?? [])] }
}

export function resolveUpdatePaths(
  templatesDir: string,
  projectRoot: string,
  u: { category: string; name: string },
): { sourceDir: string | null; targetDir: string | null } {
  switch (u.category) {
    case 'skills':
      return {
        sourceDir: path.join(templatesDir, 'skills', u.name),
        targetDir: path.join(projectRoot, '.harness', 'skills', u.name),
      }
    case 'agents':
      return {
        sourceDir: path.join(templatesDir, 'agents'),
        targetDir: path.join(projectRoot, '.harness', 'agents'),
      }
    case 'rules':
      return {
        sourceDir: path.join(templatesDir, 'rules'),
        targetDir: path.join(projectRoot, '.harness', 'rules'),
      }
    case 'schemas':
      return {
        sourceDir: path.join(templatesDir, 'openspec', 'schemas', u.name),
        targetDir: path.join(projectRoot, 'openspec', 'schemas', u.name),
      }
    default:
      return { sourceDir: null, targetDir: null }
  }
}

export function detectUpdates(
  projectRoot: string,
  force = false,
  templatesDir = getTemplatesDir(),
  builtinVersions = getBuiltinVersions(templatesDir),
): UpdateItem[] {
  const current = readVersions(projectRoot)
  if (!current) return []

  const builtin = builtinVersions
  const updates: UpdateItem[] = []

  const categories = ['skills', 'agents', 'rules', 'schemas'] as const

  for (const category of categories) {
    const currentMap = (current[category] ?? {}) as Record<string, string>
    const builtinMap = (builtin[category] ?? {}) as Record<string, string>
    for (const [name, version] of Object.entries(builtinMap)) {
      const currentVersion = currentMap[name]
      if (force || !currentVersion || currentVersion !== version) {
        const from = force && currentVersion === version
          ? `${currentVersion} (force)`
          : currentVersion ?? '(missing)'
        updates.push({ category, name, from, to: version })
        continue
      }
      const { targetDir } = resolveUpdatePaths(templatesDir, projectRoot, { category, name })
      if (targetDir && !fs.existsSync(targetDir)) {
        updates.push({ category, name, from: version + ' (files missing)', to: version })
      }
    }
  }

  if (
    builtin.skills?.[DISCUSSION_SKILL]
    &&
    isDiscussionSkillMigrationRequired(projectRoot, templatesDir)
    && !updates.some(update => update.category === 'skills' && update.name === DISCUSSION_SKILL)
  ) {
    const currentVersion = current.skills?.[DISCUSSION_SKILL] ?? '(missing)'
    const { skillVersion } = validateDiscussionTemplates(templatesDir)
    updates.push({
      category: 'skills',
      name: DISCUSSION_SKILL,
      from: `${currentVersion} (migration required)`,
      to: skillVersion,
    })
  }

  if (force || current.harness !== builtin.harness) {
    const from = force && current.harness === builtin.harness
      ? `${current.harness} (force)`
      : current.harness
    updates.push({ category: 'core', name: 'harness', from, to: builtin.harness })
  }

  return updates
}

export function collectCommitStagePaths(
  projectRoot: string,
  migrationChangedPaths: string[] = [],
): string[] {
  const paths: string[] = []
  if (fs.existsSync(path.join(projectRoot, '.harness'))) {
    paths.push('.harness')
  }
  if (fs.existsSync(path.join(projectRoot, 'AGENTS.md'))) {
    paths.push('AGENTS.md')
  }
  const openspecRoot = path.join(projectRoot, 'openspec')
  if (fs.existsSync(openspecRoot)) {
    if (fs.existsSync(path.join(openspecRoot, 'config.yaml'))) {
      paths.push('openspec/config.yaml')
    }
    if (fs.existsSync(path.join(openspecRoot, 'schemas'))) {
      paths.push('openspec/schemas')
    }
  }

  for (const relativePath of migrationChangedPaths) {
    if (relativePath === '.gitignore') {
      if (fs.existsSync(path.join(projectRoot, relativePath))) paths.push(relativePath)
      continue
    }
    if (!/^openspec\/(?:changes|archive)\/.+\/\.openspec\.yaml$/.test(relativePath)) continue
    if (!fs.existsSync(path.join(projectRoot, relativePath))) continue
    paths.push(relativePath)
  }
  return [...new Set(paths)]
}
