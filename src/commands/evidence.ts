import * as p from '@clack/prompts'
import { collectEvidence, writeBaseSnapshot } from '../lib/evidence.js'
import { createLog } from '../lib/log.js'

const log = createLog()

export interface EvidenceOptions {
  change?: string
  writeBase?: boolean
  json?: boolean
}

export async function runEvidence(opts: EvidenceOptions = {}): Promise<void> {
  const projectRoot = process.cwd()
  const change = opts.change

  if (!change) {
    p.cancel('缺少 --change <name>')
    process.exit(1)
  }

  const snapshot = opts.writeBase ? writeBaseSnapshot(projectRoot, change) : undefined
  if (snapshot && !snapshot.mainSha) {
    p.cancel('当前目录不是可读取 HEAD 的 git 仓库')
    process.exit(1)
  }

  const evidence = collectEvidence(projectRoot, change)
  const result = snapshot ? { snapshot, evidence } : evidence

  if (opts.json) {
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`)
  } else {
    log.intro('devkeel evidence')
    if (snapshot) log.success(`基线快照已写入: ${snapshot.baseFile}`)
    log.info(`  实现证据: ${evidence.hasImplementationEvidence ? '有' : '无'}`)
    log.info(`  提交证据: ${evidence.commitCount}`)
    log.info(
      `  工作区变更: ${evidence.workingTreeChangeCount}`
      + ` (staged ${evidence.stagedChangeCount}, unstaged ${evidence.unstagedChangeCount}, untracked ${evidence.untrackedChangeCount})`,
    )
    log.info(`  已完成任务: ${evidence.completedTasks}`)
    for (const warning of [...(snapshot?.warnings ?? []), ...evidence.warnings]) {
      log.warn(`  ${warning}`)
    }
    log.outro('')
  }

}
