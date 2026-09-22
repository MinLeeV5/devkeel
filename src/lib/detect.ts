import fs from 'node:fs'
import path from 'node:path'
import { execSync } from 'node:child_process'
import { isDirectorySafe } from './templates.js'

export interface DetectResult {
  isGitRepo: boolean
  hasHarness: boolean
  existingAssets: ExistingAsset[]
  projectName: string
}

export interface ExistingAsset {
  path: string
  type: 'file' | 'directory'
  action: string
}

export function detectEnvironment(projectRoot: string): DetectResult {
  const isGitRepo = fs.existsSync(path.join(projectRoot, '.git'))
  const hasHarness = fs.existsSync(path.join(projectRoot, '.harness'))
  const projectName = detectProjectName(projectRoot)
  const existingAssets = detectExistingAssets(projectRoot)

  return { isGitRepo, hasHarness, existingAssets, projectName }
}

function detectProjectName(projectRoot: string): string {
  const pkgPath = path.join(projectRoot, 'package.json')
  if (fs.existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8')) as Record<string, unknown>
      if (typeof pkg['name'] === 'string') return pkg['name']
    } catch { /* ignore */ }
  }
  return path.basename(projectRoot)
}

function detectExistingAssets(projectRoot: string): ExistingAsset[] {
  const assets: ExistingAsset[] = []

  const checks: Array<{ path: string; type: 'file' | 'directory'; action: string }> = [
    { path: 'CLAUDE.md', type: 'file', action: '已存在，init 将追加 @AGENTS.md 引用' },
    { path: 'AGENTS.md', type: 'file', action: '已存在，init 将覆盖为 v2 模板' },
    { path: '.agents', type: 'directory', action: '已存在，可手动迁移 skills/rules 到 .harness/' },
    { path: '.claude', type: 'directory', action: '已存在' },
    { path: '.cursor/rules', type: 'directory', action: '已存在' },
  ]

  for (const check of checks) {
    const fullPath = path.join(projectRoot, check.path)
    if (fs.existsSync(fullPath)) {
      assets.push(check)
    }
  }

  const agentsRulesDir = path.join(projectRoot, '.agents', 'rules')
  if (isDirectorySafe(agentsRulesDir)) {
    const ruleFiles = fs.readdirSync(agentsRulesDir).filter(f => f.endsWith('.md'))
    if (ruleFiles.length > 0) {
      assets.push({
        path: '.agents/rules/',
        type: 'directory',
        action: `检测到 ${ruleFiles.length} 个 rule，可迁移到 .harness/rules/`,
      })
    }
  }

  const agentsSkillsDir = path.join(projectRoot, '.agents', 'skills')
  if (isDirectorySafe(agentsSkillsDir)) {
    const skillDirs = fs.readdirSync(agentsSkillsDir).filter(f => {
      return fs.statSync(path.join(agentsSkillsDir, f)).isDirectory()
    })
    if (skillDirs.length > 0) {
      assets.push({
        path: '.agents/skills/',
        type: 'directory',
        action: `检测到 ${skillDirs.length} 个 skill，可迁移到 .harness/skills/`,
      })
    }
  }

  return assets
}

export function countDirectoryItems(dirPath: string, ext?: string): number {
  if (!isDirectorySafe(dirPath)) return 0
  const items = fs.readdirSync(dirPath)
  if (ext) return items.filter(f => f.endsWith(ext)).length
  return items.length
}

export function detectIsSubmodule(projectRoot: string): boolean {
  try {
    const result = execSync('git rev-parse --show-superproject-working-tree', {
      cwd: projectRoot,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    }).trim()
    return result.length > 0
  } catch {
    return false
  }
}
