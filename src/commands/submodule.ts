import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import * as p from '@clack/prompts'
import { readConfig, writeConfig, type HarnessConfig } from '../lib/config.js'
import { createLog } from '../lib/log.js'

const log = createLog()

export interface SubmoduleInfo {
  name: string
  path: string
  url: string
  branch?: string
}

export interface SubmoduleConfig {
  name: string
  path: string
  branch?: string
  harness: boolean
}

interface HarnessConfigWithSubmodules extends HarnessConfig {
  submodules?: SubmoduleConfig[]
}

export function detectSubmodules(projectRoot: string): SubmoduleInfo[] {
  const gitmodulesPath = path.join(projectRoot, '.gitmodules')
  if (!fs.existsSync(gitmodulesPath)) return []

  const content = fs.readFileSync(gitmodulesPath, 'utf-8')
  const submodules: SubmoduleInfo[] = []
  let current: Partial<SubmoduleInfo> = {}

  for (const line of content.split('\n')) {
    const trimmed = line.trim()
    const sectionMatch = trimmed.match(/^\[submodule "(.+)"\]$/)
    if (sectionMatch) {
      if (current.name) submodules.push(current as SubmoduleInfo)
      current = { name: sectionMatch[1] }
      continue
    }
    const kvMatch = trimmed.match(/^(\w+)\s*=\s*(.+)$/)
    if (kvMatch) {
      const [, key, value] = kvMatch
      if (key === 'path') current.path = value
      else if (key === 'url') current.url = value
      else if (key === 'branch') current.branch = value
    }
  }
  if (current.name) submodules.push(current as SubmoduleInfo)

  return submodules
}

function getSubmoduleBranch(subPath: string): string | null {
  try {
    return execSync('git branch --show-current', { cwd: subPath, stdio: 'pipe' }).toString().trim() || null
  } catch {
    return null
  }
}

function hasHarness(subPath: string): boolean {
  return fs.existsSync(path.join(subPath, '.harness')) || fs.existsSync(path.join(subPath, '.agents'))
}

export async function runSubmodule(action: string, args: string[]): Promise<void> {
  const projectRoot = process.cwd()

  log.intro('devkeel submodule')

  const config = readConfig(projectRoot)
  if (!config) {
    p.cancel('未找到 .harness/config.yml，请先执行 devkeel init')
    process.exit(1)
  }

  switch (action) {
    case 'status':
      await showSubmoduleStatus(projectRoot, config)
      break
    case 'add': {
      const name = args[0]
      if (!name) {
        p.cancel('用法: devkeel submodule add <name>')
        process.exit(1)
      }
      await addSubmodule(projectRoot, config, name)
      break
    }
    default:
      log.info('用法: devkeel submodule <status|add> [args]')
  }

  log.outro('')
}

async function showSubmoduleStatus(projectRoot: string, config: HarnessConfig): Promise<void> {
  const detected = detectSubmodules(projectRoot)

  if (detected.length === 0) {
    log.info('  未检测到 git submodule')
    return
  }

  const configSubs = (config as HarnessConfigWithSubmodules).submodules

  for (const sub of detected) {
    const subPath = path.join(projectRoot, sub.path)
    const currentBranch = getSubmoduleBranch(subPath)
    const harnessReady = hasHarness(subPath)
    const configEntry = configSubs?.find(s => s.name === sub.name)

    const branchMatch = !configEntry?.branch || configEntry.branch === currentBranch
    const sym = branchMatch && harnessReady ? '✔' : harnessReady ? '⚠' : '○'

    log.info(`  ${sym} ${sub.name}`)
    log.info(`    路径: ${sub.path}`)
    log.info(`    分支: ${currentBranch ?? '未知'}${!branchMatch ? ` (期望: ${configEntry?.branch})` : ''}`)
    log.info(`    DevKeel: ${harnessReady ? '就绪' : '未配置'}`)
    log.info(`    已注册: ${configEntry ? '是' : '否'}`)
  }
}

async function addSubmodule(projectRoot: string, config: HarnessConfig, name: string): Promise<void> {
  const detected = detectSubmodules(projectRoot)
  const sub = detected.find(s => s.name === name)

  if (!sub) {
    p.cancel(`未找到 submodule: ${name}。请先使用 git submodule add 添加`)
    process.exit(1)
  }

  const configWithSubmodules = config as HarnessConfigWithSubmodules
  const subs = configWithSubmodules.submodules ?? []

  if (subs.find(s => s.name === name)) {
    log.info(`  ${name} 已在 config.yml 中注册`)
    return
  }

  const subPath = path.join(projectRoot, sub.path)
  const currentBranch = getSubmoduleBranch(subPath)

  subs.push({
    name,
    path: sub.path,
    branch: currentBranch ?? undefined,
    harness: hasHarness(subPath),
  })

  configWithSubmodules.submodules = subs
  writeConfig(projectRoot, config)
  log.success(`  ${name} 已添加到 config.yml`)
}
