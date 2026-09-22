import * as p from '@clack/prompts'
import { openReview } from '../lib/open-review.js'
import { createLog } from '../lib/log.js'

export async function runOpenReview(htmlPath: string): Promise<void> {
  const log = createLog()
  log.intro('devkeel open-review')

  if (!htmlPath) {
    p.cancel('请指定 human-review.html 文件路径')
    process.exit(1)
  }

  const result = await openReview(htmlPath)

  if (!result.ok) {
    log.error(result.error ?? '打开 human-review.html 失败')
    if (result.path) log.info(`文件路径: ${result.path}`)

    p.cancel('打开失败，请手动在浏览器中打开 human-review.html')
    process.exit(1)
  }

  log.success(`已打开: ${result.path}`)

  log.outro('完成')
}
