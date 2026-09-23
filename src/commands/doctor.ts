import path from 'node:path'
import fs from 'node:fs'
import * as p from '@clack/prompts'
import { detectRepositoryType, detectSubmodules, type RepositoryType } from '../lib/detect.js'
import { createPlatformLinks, detectExistingPlatformTargets } from '../lib/templates.js'
import { validateOpenspecConfig } from '../lib/openspec.js'
import { createLog } from '../lib/log.js'
import { checkAndNotify } from '../lib/update-notifier.js'
import { syncSkillLinks } from '../lib/skill-distribution.js'
import { checkSkillLinks, checkSkillPackages } from '../lib/skill-checks.js'

interface CheckResult {
  name: string
  status: 'pass' | 'warn' | 'fail'
  detail: string
}

export function shouldValidateRootAssets(repoType: RepositoryType): boolean {
  return repoType === 'main'
}

export function getRequiredHarnessDirs(repoType: RepositoryType): string[] {
  const dirs = ['rules', 'skills', 'agents']
  return shouldValidateRootAssets(repoType) ? [...dirs, 'commands'] : dirs
}

export function checkProjectAssets(projectRoot: string, fix = false): CheckResult[] {
  const log = createLog()
  const results: CheckResult[] = []

  const repoType = detectRepositoryType(projectRoot)
  const targets = detectExistingPlatformTargets(projectRoot)

  const requiredDirs = getRequiredHarnessDirs(repoType)
  for (const dir of requiredDirs) {
    const dirPath = path.join(projectRoot, '.harness', dir)
    if (fs.existsSync(dirPath)) {
      results.push({ name: `.harness/${dir}/`, status: 'pass', detail: '目录存在' })
    } else {
      results.push({ name: `.harness/${dir}/`, status: 'fail', detail: '目录缺失' })
    }
  }

  const agentsMd = path.join(projectRoot, 'AGENTS.md')
  if (fs.existsSync(agentsMd)) {
    results.push({ name: 'AGENTS.md', status: 'pass', detail: '文件存在' })
  } else {
    results.push({ name: 'AGENTS.md', status: 'fail', detail: '文件缺失' })
  }

  if (targets.includes('claude-code')) {
    const claudeMd = path.join(projectRoot, 'CLAUDE.md')
    if (fs.existsSync(claudeMd)) {
      const content = fs.readFileSync(claudeMd, 'utf-8')
      if (content.includes('@AGENTS.md')) {
        results.push({ name: 'CLAUDE.md', status: 'pass', detail: '包含 @AGENTS.md 引用' })
      } else {
        results.push({ name: 'CLAUDE.md', status: 'warn', detail: '缺少 @AGENTS.md 引用' })
      }
    } else {
      results.push({ name: 'CLAUDE.md', status: 'fail', detail: '文件缺失' })
    }
  }

  if (targets.length > 0) {
    let skillsFixAllowed = true
    if (fix) {
      const skills = syncSkillLinks(projectRoot, targets)
      if (!skills.ok) {
        skillsFixAllowed = false
        results.push({ name: 'skills 修复', status: 'fail', detail: skills.errors.join('；') })
        log.warning(`skills 修复已停止: ${skills.errors.join('；')}`)
        log.info('如需覆盖冲突入口，请显式运行 devkeel sync --force；覆盖前会备份')
      }
    }
    results.push(...checkSkillLinks(projectRoot, targets))
    if (targets.some(target => target === 'claude-code' || target === 'codex')) {
      results.push(...checkSkillPackages(projectRoot))
    }
    const hasCommands = fs.existsSync(path.join(projectRoot, '.harness', 'commands'))
    const baseLinks = ['skills', 'rules', 'agents']
    const withCommands = hasCommands ? [...baseLinks, 'commands'] : baseLinks
    const platformLinks: Array<{ target: string; dir: string; links: string[] }> = [
      { target: 'claude-code', dir: '.claude', links: withCommands },
      { target: 'cursor', dir: '.cursor', links: ['rules'] },
      { target: 'codex', dir: '.agents', links: withCommands },
      { target: 'opencode', dir: '.opencode', links: withCommands },
    ]
    let hasBrokenLinks = false
    for (const pl of platformLinks) {
      if (!targets.includes(pl.target)) continue
      for (const link of pl.links) {
        if (link === 'skills' && (pl.target === 'claude-code' || pl.target === 'codex')) continue
        const linkPath = path.join(projectRoot, pl.dir, link)
        if (!fs.existsSync(linkPath)) {
          results.push({ name: `${pl.dir}/${link}`, status: 'warn', detail: '链接缺失' })
          hasBrokenLinks = true
        } else {
          const stat = fs.lstatSync(linkPath)
          if (stat.isSymbolicLink() || stat.isDirectory()) {
            results.push({ name: `${pl.dir}/${link}`, status: 'pass', detail: 'symlink 正常' })
          } else {
            results.push({ name: `${pl.dir}/${link}`, status: 'fail', detail: '损坏的 symlink（跨平台克隆）' })
            hasBrokenLinks = true
          }
        }
      }
    }
    if (hasBrokenLinks && fix && skillsFixAllowed) {
      createPlatformLinks(projectRoot, targets)
      log.success('已处理缺失的平台链接；Codex / Claude 现有内容保持原样')
    } else if (hasBrokenLinks) {
      log.info('提示：执行 devkeel doctor --fix 自动修复链接问题')
    }
  }

  if (shouldValidateRootAssets(repoType)) {
    results.push(...validateOpenspecConfig(projectRoot))
  }

  const versionsPath = path.join(projectRoot, '.harness', 'versions.yml')
  if (fs.existsSync(versionsPath)) {
    results.push({ name: 'versions.yml', status: 'pass', detail: '文件存在' })
  } else {
    results.push({ name: 'versions.yml', status: 'warn', detail: '文件缺失' })
  }

  const detected = shouldValidateRootAssets(repoType)
    ? detectSubmodules(projectRoot)
    : []
  if (detected.length > 0) {
    for (const sub of detected) {
      const subPath = path.join(projectRoot, sub.path)
      if (!fs.existsSync(subPath)) {
        results.push({ name: `submodule/${sub.name}`, status: 'fail', detail: '目录不存在' })
        continue
      }
      const hasAgentsMd = fs.existsSync(path.join(subPath, 'AGENTS.md'))
      const hasHarness = fs.existsSync(path.join(subPath, '.harness'))
      if (hasAgentsMd || hasHarness) {
        results.push({ name: `submodule/${sub.name}`, status: 'pass', detail: '已配置' })
      } else {
        results.push({ name: `submodule/${sub.name}`, status: 'warn', detail: '未初始化，请进入子模块目录运行 devkeel init' })
      }
    }
  }

  return results
}

export async function runDoctor(opts?: { fix?: boolean }): Promise<void> {
  const projectRoot = process.cwd()
  const fix = opts?.fix ?? false

  const log = createLog()
  log.intro('devkeel doctor')

  if (!fs.existsSync(path.join(projectRoot, '.harness'))) {
    p.cancel('未检测到 .harness/ 目录，请先执行 devkeel init')
    process.exit(1)
  }

  const results = checkProjectAssets(projectRoot, fix)
  const updateMsg = await checkAndNotify()

  const symbols = { pass: '✔', warn: '⚠', fail: '✘' }
  const hasErrors = results.some(r => r.status === 'fail')

  for (const r of results) {
    const sym = symbols[r.status]
    const msg = `${sym} ${r.name.padEnd(25)} ${r.detail}`
    if (r.status === 'fail') log.error(msg)
    else if (r.status === 'warn') log.warn(msg)
    else log.success(msg)
  }

  log.outro(hasErrors ? 'doctor 发现问题，请修复后重新检查' : 'doctor 检查通过 ✔')
  if (updateMsg) log.info(updateMsg)
  process.exit(hasErrors ? 1 : 0)
}
