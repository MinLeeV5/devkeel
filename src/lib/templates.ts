import fs from 'node:fs'
import path from 'node:path'
import YAML from 'yaml'
import { readVersions } from './versions.js'
import { getTemplatesDir } from './templates-dir.js'
import { syncSkillLinks } from './skill-distribution.js'
import {
  applyLegacyMigrations,
  assertSchemaTargetsAvailable,
  isRetiredManagedSkill,
  planLegacyMigrations,
  type LegacyMigrationOptions,
  type LegacyMigrationResult,
} from './update.js'

export { getTemplatesDir, setTemplatesDir } from './templates-dir.js'

export function copyTemplateSkills(targetDir: string): void {
  const source = path.join(getTemplatesDir(), 'skills')
  copyDirRecursive(source, targetDir)
}

export function copyTemplateAgents(targetDir: string): void {
  const source = path.join(getTemplatesDir(), 'agents')
  copyDirRecursive(source, targetDir)
}

export function copyTemplateRules(targetDir: string): void {
  const source = path.join(getTemplatesDir(), 'rules')
  copyDirRecursive(source, targetDir)
}

export function copyTemplateCommands(
  targetDir: string,
  excludedRelativePaths: readonly string[] = [],
): void {
  const source = path.join(getTemplatesDir(), 'commands')
  if (!fs.existsSync(source)) return
  const excluded = new Set(excludedRelativePaths.map(relativePath => (
    relativePath.split(path.sep).join('/')
  )))
  copyDirRecursiveFiltered(source, targetDir, excluded)
}

function copyDirRecursiveFiltered(
  source: string,
  target: string,
  excluded: ReadonlySet<string>,
  prefix = '',
): void {
  fs.mkdirSync(target, { recursive: true })
  for (const entry of fs.readdirSync(source, { withFileTypes: true })) {
    const relativePath = prefix ? `${prefix}/${entry.name}` : entry.name
    if (excluded.has(relativePath)) continue
    const src = path.join(source, entry.name)
    const dest = path.join(target, entry.name)
    if (entry.isDirectory()) {
      copyDirRecursiveFiltered(src, dest, excluded, relativePath)
    } else {
      fs.copyFileSync(src, dest)
    }
  }
}

export function createPlatformLinks(projectRoot: string, targets: string[]): string[] {
  if (!syncSkillLinks(projectRoot, targets).ok) return []
  const created: string[] = []
  const harnessSkills = path.join(projectRoot, '.harness', 'skills')
  const harnessRules = path.join(projectRoot, '.harness', 'rules')
  const harnessAgents = path.join(projectRoot, '.harness', 'agents')
  const harnessCommands = path.join(projectRoot, '.harness', 'commands')

  if (targets.includes('claude-code')) {
    const claudeDir = path.join(projectRoot, '.claude')
    fs.mkdirSync(claudeDir, { recursive: true })
    ensureSymlink(harnessRules, path.join(claudeDir, 'rules'), true)
    ensureSymlink(harnessAgents, path.join(claudeDir, 'agents'), true)
    if (fs.existsSync(harnessCommands)) {
      ensureSymlink(harnessCommands, path.join(claudeDir, 'commands'), true)
    }
    created.push('.claude/')
  }

  if (targets.includes('copilot')) {
    const ghDir = path.join(projectRoot, '.github')
    fs.mkdirSync(ghDir, { recursive: true })
    const instructionsPath = path.join(ghDir, 'copilot-instructions.md')
    if (!fs.existsSync(instructionsPath)) {
      fs.writeFileSync(instructionsPath, '@AGENTS.md\n', 'utf-8')
    }
    created.push('.github/')
  }

  if (targets.includes('cursor')) {
    const cursorDir = path.join(projectRoot, '.cursor')
    fs.mkdirSync(cursorDir, { recursive: true })
    ensureSymlink(harnessRules, path.join(cursorDir, 'rules'))
    created.push('.cursor/')
  }

  if (targets.includes('codex')) {
    const agentsDir = path.join(projectRoot, '.agents')
    fs.mkdirSync(agentsDir, { recursive: true })
    ensureSymlink(harnessRules, path.join(agentsDir, 'rules'), true)
    ensureSymlink(harnessAgents, path.join(agentsDir, 'agents'), true)
    if (fs.existsSync(harnessCommands)) {
      ensureSymlink(harnessCommands, path.join(agentsDir, 'commands'), true)
    }
    created.push('.agents/')
  }

  if (targets.includes('opencode')) {
    const opencodeDir = path.join(projectRoot, '.opencode')
    fs.mkdirSync(opencodeDir, { recursive: true })
    ensureSymlink(harnessSkills, path.join(opencodeDir, 'skills'))
    ensureSymlink(harnessRules, path.join(opencodeDir, 'rules'))
    ensureSymlink(harnessAgents, path.join(opencodeDir, 'agents'))
    if (fs.existsSync(harnessCommands)) {
      ensureSymlink(harnessCommands, path.join(opencodeDir, 'commands'))
    }
    created.push('.opencode/')
  }

  return created
}

export function isDirectorySafe(p: string): boolean {
  return fs.existsSync(p) && fs.statSync(p).isDirectory()
}

function ensureSymlink(target: string, linkPath: string, preserveExisting = false): void {
  if (preserveExisting && fs.lstatSync(linkPath, { throwIfNoEntry: false })) return
  if (fs.existsSync(linkPath)) {
    const stat = fs.lstatSync(linkPath)
    if (stat.isSymbolicLink() || stat.isDirectory()) return
    fs.unlinkSync(linkPath)
  }
  const rel = path.relative(path.dirname(linkPath), target)
  fs.symlinkSync(rel, linkPath)
}

export function copyOpenspecTemplate(targetDir: string): void {
  const source = path.join(getTemplatesDir(), 'openspec')
  copyDirRecursive(source, targetDir)
  for (const sub of ['changes', 'specs', 'archive']) {
    const dir = path.join(targetDir, sub)
    fs.mkdirSync(dir, { recursive: true })
    const gitkeep = path.join(dir, '.gitkeep')
    if (!fs.existsSync(gitkeep)) fs.writeFileSync(gitkeep, '', 'utf-8')
  }
}

export function readTemplateFile(relativePath: string): string {
  return fs.readFileSync(path.join(getTemplatesDir(), relativePath), 'utf-8')
}

export function renderTemplate(content: string, vars: Record<string, string>): string {
  let result = content
  for (const [key, value] of Object.entries(vars)) {
    result = result.replaceAll(`{{${key}}}`, value)
  }
  return result
}

export function copyTemplateFile(templateName: string, targetPath: string): void {
  const source = path.join(getTemplatesDir(), templateName)
  fs.copyFileSync(source, targetPath)
}

export function ensureGitignore(projectRoot: string): void {
  const templateContent = fs.readFileSync(path.join(getTemplatesDir(), 'gitignore'), 'utf-8')
  const entries = templateContent.split('\n').filter(l => l.trim() && !l.startsWith('#'))
  const targetPath = path.join(projectRoot, '.gitignore')

  if (fs.existsSync(targetPath)) {
    const existing = fs.readFileSync(targetPath, 'utf-8')
    const missing = entries.filter(e => !existing.includes(e))
    if (missing.length > 0) {
      const suffix = (existing.endsWith('\n') ? '' : '\n') + '\n# Harness managed\n' + missing.join('\n') + '\n'
      fs.writeFileSync(targetPath, existing + suffix, 'utf-8')
    }
  } else {
    fs.writeFileSync(targetPath, templateContent, 'utf-8')
  }
}

export function copyDirRecursive(source: string, target: string): void {
  if (!fs.existsSync(source)) return
  fs.mkdirSync(target, { recursive: true })
  for (const entry of fs.readdirSync(source, { withFileTypes: true })) {
    const src = path.join(source, entry.name)
    const dest = path.join(target, entry.name)
    if (entry.isDirectory()) {
      copyDirRecursive(src, dest)
    } else {
      fs.copyFileSync(src, dest)
    }
  }
}

export function copyDirMissing(source: string, target: string): void {
  if (!fs.existsSync(source)) return
  fs.mkdirSync(target, { recursive: true })
  for (const entry of fs.readdirSync(source, { withFileTypes: true })) {
    const src = path.join(source, entry.name)
    const dest = path.join(target, entry.name)
    if (entry.isDirectory()) {
      copyDirMissing(src, dest)
    } else if (!fs.existsSync(dest)) {
      fs.copyFileSync(src, dest)
    }
  }
}

const PLATFORM_DIR_MAP: Record<string, string> = {
  'claude-code': '.claude',
  'copilot': '.github',
  'cursor': '.cursor',
  'codex': '.agents',
  'opencode': '.opencode',
}

export function detectExistingPlatformDirs(projectRoot: string, targets: string[]): string[] {
  const existing: string[] = []
  for (const target of targets) {
    const dirName = PLATFORM_DIR_MAP[target]
    if (dirName) {
      const fullPath = path.join(projectRoot, dirName)
      if (fs.existsSync(fullPath)) {
        existing.push(fullPath)
      }
    }
  }
  return existing
}

const PLATFORM_DETECT_PATHS: Record<string, string[]> = {
  'claude-code': ['.claude'],
  'codex': ['.agents', '.codex'],
  'cursor': ['.cursor'],
  'copilot': ['.github/copilot-instructions.md'],
  'gemini': ['GEMINI.md'],
  'opencode': ['.opencode'],
}

export function detectExistingPlatformTargets(projectRoot: string): string[] {
  const detected: string[] = []
  for (const [target, paths] of Object.entries(PLATFORM_DETECT_PATHS)) {
    if (paths.some(relPath => {
      try {
        return !!fs.lstatSync(path.join(projectRoot, relPath), { throwIfNoEntry: false })
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'ENOTDIR') return false
        throw error
      }
    })) {
      detected.push(target)
    }
  }
  return detected
}

export function cleanLegacyStageFiles(projectRoot: string): string[] {
  const deleted: string[] = []
  const dirsToScan = [
    path.join(projectRoot, '.harness', 'skills'),
    path.join(projectRoot, '.harness', 'agents'),
  ]
  for (const dir of dirsToScan) {
    if (!fs.existsSync(dir)) continue
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.isFile() && /^stage-.*\.md$/.test(entry.name)) {
        const filePath = path.join(dir, entry.name)
        fs.unlinkSync(filePath)
        deleted.push(path.relative(projectRoot, filePath))
      }
    }
  }
  return deleted
}

export interface DeprecatedAsset {
  category: 'skills' | 'agents' | 'rules'
  name: string
  relativePath: string
}

function isHarnessGenerated(projectRoot: string, category: string, entryName: string): boolean {
  const versions = readVersions(projectRoot)
  if (!versions) return false
  const key = entryName.replace(/\.md$/, '')
  const categoryVersions = versions[category as keyof typeof versions]
  if (typeof categoryVersions === 'object' && categoryVersions !== null) {
    return key in categoryVersions
  }
  return false
}

export function detectDeprecatedAssets(
  projectRoot: string,
): DeprecatedAsset[] {
  const templatesDir = getTemplatesDir()
  const deprecated: DeprecatedAsset[] = []

  const categories = ['skills', 'agents', 'rules'] as const
  for (const category of categories) {
    const projectDir = path.join(projectRoot, '.harness', category)
    const templateDir = path.join(templatesDir, category)
    if (!fs.existsSync(projectDir) || !fs.existsSync(templateDir)) continue

    const templateEntries = new Set(
      fs.readdirSync(templateDir).filter(e => e !== '.gitkeep'),
    )
    const projectEntries = fs.readdirSync(projectDir).filter(e => e !== '.gitkeep')

    for (const entry of projectEntries) {
      if (!templateEntries.has(entry)) {
        // Retired managed skills are removed by the version-driven migration path.
        // Anything left here is customized or user-installed and must be preserved.
        if (category === 'skills' && isRetiredManagedSkill(entry)) continue
        if (!isHarnessGenerated(projectRoot, category, entry)) continue
        deprecated.push({
          category,
          name: entry,
          relativePath: `.harness/${category}/${entry}`,
        })
      }
    }
  }

  return deprecated
}

export function removeDeprecatedAssets(projectRoot: string, assets: DeprecatedAsset[]): void {
  for (const asset of assets) {
    const fullPath = path.join(projectRoot, asset.relativePath)
    if (!fs.existsSync(fullPath)) continue
    const stat = fs.statSync(fullPath)
    if (stat.isDirectory()) {
      fs.rmSync(fullPath, { recursive: true, force: true })
    } else {
      fs.unlinkSync(fullPath)
    }
  }
}

function stripComments(text: string): string {
  return text.replace(/<!--[\s\S]*?-->/g, '').replace(/\s+/g, ' ').trim()
}

export function hasUserContent(filePath: string, renderedTemplate: string): boolean {
  if (!fs.existsSync(filePath)) return false
  const existing = fs.readFileSync(filePath, 'utf-8')
  return stripComments(existing) !== stripComments(renderedTemplate)
}

export function writeSmartFile(
  filePath: string,
  renderedContent: string,
  directive?: string,
): void {
  if (!hasUserContent(filePath, renderedContent)) {
    fs.writeFileSync(filePath, renderedContent, 'utf-8')
    return
  }
  if (!directive) return
  const existing = fs.readFileSync(filePath, 'utf-8')
  if (existing.includes(directive)) return
  fs.writeFileSync(filePath, directive + '\n\n' + existing, 'utf-8')
}

export function extractUserSlots(content: string): Map<string, string> {
  const slots = new Map<string, string>()
  const regex = /<!-- harness:user:(\S+) -->\n([\s\S]*?)<!-- \/harness:user:\1 -->/g
  let match
  while ((match = regex.exec(content)) !== null) {
    slots.set(match[1]!, match[2]!)
  }
  return slots
}

export function fillUserSlots(content: string, slots: Map<string, string>): string {
  return content.replace(
    /<!-- harness:user:(\S+) -->\n[\s\S]*?<!-- \/harness:user:\1 -->/g,
    (fullMatch, slotName: string) => {
      const userContent = slots.get(slotName)
      if (userContent !== undefined) {
        return `<!-- harness:user:${slotName} -->\n${userContent}<!-- /harness:user:${slotName} -->`
      }
      return fullMatch
    },
  )
}

export function extractFrameworkContent(content: string): string {
  return content.replace(
    /<!-- harness:user:\S+ -->\n[\s\S]*?<!-- \/harness:user:\S+ -->/g,
    '',
  ).trim()
}

function syncManagedOpenspecContext(source: string, target: string): boolean {
  const templateContent = fs.readFileSync(source, 'utf-8')
  const templateDocument = YAML.parseDocument(templateContent, { keepSourceTokens: true })
  if (templateDocument.errors.length > 0) {
    throw new Error(
      `OpenSpec config 模板解析失败: ${templateDocument.errors.map(error => error.message).join('; ')}`,
    )
  }

  const managedContext = templateDocument.get('context')
  const templateContextNode = templateDocument.get('context', true) as unknown
  const templateContextRange = (
    templateContextNode && typeof templateContextNode === 'object'
      ? (templateContextNode as { range?: readonly number[] }).range
      : undefined
  )
  const templateContextStart = templateContextRange?.[0]
  const templateContextEnd = templateContextRange?.[1]
  if (
    typeof managedContext !== 'string'
    || typeof templateContextStart !== 'number'
    || typeof templateContextEnd !== 'number'
  ) {
    throw new Error('OpenSpec config 模板缺少有效的 context 字符串')
  }

  const originalContent = fs.readFileSync(target, 'utf-8')
  const targetDocument = YAML.parseDocument(originalContent, { keepSourceTokens: true })
  if (targetDocument.errors.length > 0) {
    throw new Error(
      `openspec/config.yaml 解析失败: ${targetDocument.errors.map(error => error.message).join('; ')}`,
    )
  }
  const parsedTarget = targetDocument.toJS() as unknown
  if (!parsedTarget || typeof parsedTarget !== 'object' || Array.isArray(parsedTarget)) {
    throw new Error('openspec/config.yaml 必须是 YAML 对象')
  }
  if (targetDocument.get('context') === managedContext) return false

  const targetContextNode = targetDocument.get('context', true) as unknown
  const targetContextRange = (
    targetContextNode && typeof targetContextNode === 'object'
      ? (targetContextNode as { range?: readonly number[] }).range
      : undefined
  )
  const targetContextStart = targetContextRange?.[0]
  const targetContextEnd = targetContextRange?.[1]
  const templateContextToken = templateContent.slice(templateContextStart, templateContextEnd)
  const lineEnding = originalContent.includes('\r\n') ? '\r\n' : '\n'
  const renderedContextToken = lineEnding === '\n'
    ? templateContextToken
    : templateContextToken.replace(/\n/g, lineEnding)
  let updatedContent: string

  if (
    YAML.isScalar(targetContextNode)
    && typeof targetContextStart === 'number'
    && typeof targetContextEnd === 'number'
    && targetContextEnd > targetContextStart
  ) {
    updatedContent = originalContent.slice(0, targetContextStart)
      + renderedContextToken
      + originalContent.slice(targetContextEnd)
  } else if (!targetDocument.has('context') && !/(?:^|\r?\n)\.\.\.\s*$/.test(originalContent)) {
    const contentWithLineEnding = originalContent.endsWith('\n')
      ? originalContent
      : originalContent + lineEnding
    updatedContent = contentWithLineEnding
      + lineEnding
      + `context: ${renderedContextToken}`
  } else {
    targetDocument.set('context', managedContext)
    updatedContent = targetDocument.toString()
  }

  fs.writeFileSync(target, updatedContent, 'utf-8')
  return true
}

export function updateOpenspecIncremental(
  openspecDir: string,
  legacyMigrationOptions: LegacyMigrationOptions = {},
): LegacyMigrationResult {
  const templatesDir = getTemplatesDir()
  const projectRoot = path.dirname(openspecDir)
  assertSchemaTargetsAvailable(projectRoot, templatesDir)
  const templateOpenspec = path.join(templatesDir, 'openspec')

  const templateSchemas = path.join(templateOpenspec, 'schemas')
  if (fs.existsSync(templateSchemas)) {
    const schemasDir = path.join(openspecDir, 'schemas')
    fs.mkdirSync(schemasDir, { recursive: true })
    for (const entry of fs.readdirSync(templateSchemas, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue
      const src = path.join(templateSchemas, entry.name)
      const dest = path.join(schemasDir, entry.name)
      fs.rmSync(dest, { recursive: true, force: true })
      copyDirRecursive(src, dest)
    }
  }

  const migrationPlan = planLegacyMigrations(projectRoot, legacyMigrationOptions)
  const migrationResult = applyLegacyMigrations(
    projectRoot,
    migrationPlan,
    legacyMigrationOptions,
  )
  const changedPaths = [...migrationResult.changedPaths]

  const configSource = path.join(templateOpenspec, 'config.yaml')
  if (fs.existsSync(configSource)) {
    const configTarget = path.join(openspecDir, 'config.yaml')
    if (fs.existsSync(configTarget)) {
      const contextChanged = syncManagedOpenspecContext(configSource, configTarget)
      if (contextChanged) {
        changedPaths.push('openspec/config.yaml')
      }
    } else {
      fs.writeFileSync(configTarget, fs.readFileSync(configSource, 'utf-8'), 'utf-8')
    }
  }

  for (const sub of ['changes', 'specs', 'archive']) {
    const subDir = path.join(openspecDir, sub)
    fs.mkdirSync(subDir, { recursive: true })
    const gitkeep = path.join(subDir, '.gitkeep')
    if (!fs.existsSync(gitkeep)) {
      fs.writeFileSync(gitkeep, '', 'utf-8')
    }
  }
  return {
    ...migrationResult,
    changedPaths: [...new Set(changedPaths)],
  }
}
