#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import packageJson from '../package.json'
import { Command } from 'commander'
import { getTemplatesDir, setTemplatesDir } from './lib/templates-dir.js'
import { ensureTemplatesCache } from './lib/templates-cache.js'
import { getPublishedHarnessVersion } from './lib/release-channel.js'
import { runInit } from './commands/init.js'
import { runDoctor } from './commands/doctor.js'
import { runUpdate } from './commands/update.js'
import { runSync } from './commands/sync.js'
import { runEvidence } from './commands/evidence.js'
import { interceptOpenspec } from './commands/openspec.js'

async function showVersion(isBeta = false): Promise<void> {
  const releaseChannel = isBeta ? 'beta' : 'latest'
  const harnessVersion = getPublishedHarnessVersion(releaseChannel, packageJson.version)
  try {
    const { cacheDir } = await ensureTemplatesCache(isBeta ? { beta: true } : undefined)
    setTemplatesDir(cacheDir)
  } catch { /* 网络不可达时读本地缓存 */ }
  const pkgPath = path.join(getTemplatesDir(), 'package.json')
  let templatesVersion = 'unknown'
  if (fs.existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8')) as Record<string, unknown>
      if (typeof pkg['version'] === 'string') templatesVersion = pkg['version']
    } catch { /* ignore */ }
  }
  const channelLabel = isBeta ? ' (beta)' : ''
  process.stdout.write(`devkeel ${harnessVersion}${channelLabel}\ntemplates ${templatesVersion}${channelLabel}\n`)
}

function isTopLevelVersionFlag(): boolean {
  for (let i = 2; i < process.argv.length; i++) {
    const arg = process.argv[i]
    if (!arg) continue
    if (arg === '-V' || arg === '--version') return true
    if (!arg.startsWith('-')) return false
  }
  return false
}

if (isTopLevelVersionFlag()) {
  await showVersion(process.argv.includes('--beta'))
  process.exit(0)
}

const program = new Command()

program
  .name('devkeel')
  .description('项目知识框架 CLI')

program
  .command('init')
  .description('初始化项目协作资产')
  .option('--name <name>', '项目名称')
  .option('--targets <targets>', '目标平台（逗号分隔：claude-code,codex,cursor,copilot,gemini,opencode）')
  .option('-y, --yes', '跳过确认提示，使用默认行为')
  .option('--force', '备份并覆盖冲突的技能入口')
  .action((opts) => runInit(opts))

program
  .command('doctor')
  .description('检查项目协作资产完整性')
  .option('--fix', '自动修复可修复的问题')
  .action((opts) => runDoctor(opts))

program
  .command('update')
  .description('更新 DevKeel 内置资产')
  .argument('[templateVersion]', '指定模板版本')
  .option('--force', '强制覆盖全部受管组件')
  .option('--dry-run', '仅预览')
  .option('--template-version <version>', '指定模板版本')
  .option('--beta', '使用 beta 渠道模板版本')
  .action((templateVersion, opts) => runUpdate({
    ...opts,
    positionalTemplateVersion: templateVersion,
  }))

program
  .command('sync')
  .description('同步平台配置链接')
  .option('--targets <targets>', '目标平台（逗号分隔：claude-code,codex,cursor,copilot,gemini,opencode）')
  .option('--force', '备份并覆盖冲突的技能入口')
  .action((opts) => runSync(opts))

program
  .command('evidence')
  .description('收集 OpenSpec 实现证据')
  .requiredOption('--change <name>', 'OpenSpec change 名称')
  .option('--write-base', '写入当前基线快照')
  .option('--json', '输出 JSON')
  .action((opts) => runEvidence(opts))

await interceptOpenspec()

program.parse()
