import * as p from '@clack/prompts'
import { migrateKnowledgeAssets } from '../lib/migrate.js'
import { createLog } from '../lib/log.js'

export async function runMigrate(sources: string[]): Promise<void> {
  const projectRoot = process.cwd()

  const log = createLog()
  log.intro('devkeel migrate')

  if (sources.length === 0) {
    p.cancel('用法: devkeel migrate <dir1> [dir2 ...]')
    process.exit(1)
  }

  const result = migrateKnowledgeAssets(sources, projectRoot)

  if (result.count === 0) {
    log.warning('未找到可迁移的文件')
  } else {
    log.success(`已迁移 ${result.count} 个文件到 openspec/archive/migrated/`)
  }

  log.outro('旧产物已归档。后续新需求请通过 openspec 流程产出。')
}
