import * as p from '@clack/prompts'
import { injectReview } from '../lib/inject-review.js'
import { createLog } from '../lib/log.js'
import { checkAndNotify } from '../lib/update-notifier.js'

export async function runInjectReview(htmlPath: string): Promise<void> {
  const log = createLog()
  log.intro('devkeel inject-review')

  if (!htmlPath) {
    p.cancel('请指定 human-review.html 文件路径')
    process.exit(1)
  }

  const result = injectReview(htmlPath)

  if (result.errors.length > 0) {
    for (const err of result.errors) {
      log.error(err)
    }

    p.cancel('注入失败，HTML 可能已损坏')
    process.exit(1)
  }

  if (result.artifactsInjected.length > 0) {
    log.success(`注入 ${result.artifactsInjected.length} 个 artifact: ${result.artifactsInjected.join(', ')}`)
  }

  if (result.cssInjected) {
    log.success('注入通用 CSS')
  }

  if (result.jsInjected) {
    log.success('注入交互 JS')
  }

  log.outro('完成')

  const updateMsg = await checkAndNotify()
  if (updateMsg) log.info(updateMsg)
}
