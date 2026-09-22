import fs from 'node:fs'
import path from 'node:path'
import * as p from '@clack/prompts'
import { readConfig, writeConfig } from '../lib/config.js'
import { createPlatformLinks, detectExistingPlatformTargets, ensureGitignore, readTemplateFile, renderTemplate, writeSmartFile } from '../lib/templates.js'
import { createLog } from '../lib/log.js'
import { syncSkillLinks } from '../lib/skill-distribution.js'

export interface SyncOptions {
  targets?: string
  force?: boolean
}

export async function runSync(opts?: SyncOptions): Promise<void> {
  const projectRoot = process.cwd()
  const log = createLog()
  log.intro('同步平台配置')

  if (!fs.existsSync(path.join(projectRoot, '.harness'))) {
    p.cancel('未检测到 .harness/ 目录，请先执行 devkeel init')
    process.exit(1)
  }

  const config = readConfig(projectRoot)
  if (!config) {
    p.cancel('无法读取 .harness/config.yml，请先执行 devkeel init')
    process.exit(1)
  }

  let targets: string[]
  if (opts?.targets) {
    targets = opts.targets.split(',').map(t => t.trim())
  } else {
    const detectedTargets = detectExistingPlatformTargets(projectRoot)
    const currentTargets = config.targets || []
    const initialValues = [...new Set([...currentTargets, ...detectedTargets])]

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
      initialValues: initialValues.length > 0 ? initialValues : undefined,
    })
    if (p.isCancel(input)) { p.cancel('已取消'); process.exit(0) }
    targets = input as string[]
  }

  const skills = syncSkillLinks(projectRoot, targets, { force: opts?.force })
  if (skills.backupPath) log.info(`skills 备份位置: ${skills.backupPath}`)
  if (!skills.ok) {
    p.cancel(skills.errors.join('\n'))
    log.info('确认需覆盖冲突入口时，可使用 devkeel sync --force；覆盖前会自动备份')
    process.exitCode = 1
    return
  }

  config.targets = targets
  writeConfig(projectRoot, config)
  log.success('config.yml targets 已更新')

  if (targets.includes('claude-code') || targets.includes('cursor')) {
    const claudeMdPath = path.join(projectRoot, 'CLAUDE.md')
    if (!fs.existsSync(claudeMdPath)) {
      const claudeMd = renderTemplate(readTemplateFile('claude-md.md'), {
        PROJECT_NAME: config.project.name,
        TARGETS: targets.join(', '),
      })
      writeSmartFile(claudeMdPath, claudeMd, '@AGENTS.md')
      log.success('CLAUDE.md')
    }
  }

  if (targets.includes('gemini')) {
    const geminiMdPath = path.join(projectRoot, 'GEMINI.md')
    if (!fs.existsSync(geminiMdPath)) {
      const geminiMd = readTemplateFile('gemini-md.md')
      writeSmartFile(geminiMdPath, geminiMd, '@AGENTS.md')
      log.success('GEMINI.md')
    }
  }

  const linkedPlatforms = createPlatformLinks(projectRoot, targets)
  if (linkedPlatforms.length > 0) {
    log.success(`平台链接: ${linkedPlatforms.join(', ')}`)
  }

  ensureGitignore(projectRoot)

  log.outro(`已同步 ${targets.length} 个平台配置`)
}
