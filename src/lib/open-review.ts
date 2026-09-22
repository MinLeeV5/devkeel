import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { openTarget, type OpenTargetOptions } from './open-target.js'

export interface ReviewTargetResult {
  ok: boolean
  path?: string
  url?: string
  error?: string
}

export interface OpenReviewResult extends ReviewTargetResult {}

export async function openReview(htmlPath: string, options?: OpenTargetOptions): Promise<OpenReviewResult> {
  const target = resolveReviewTarget(htmlPath)
  if (!target.ok || !target.url) return target

  const result = await openTarget(target.url, options)
  if (!result.ok) {
    return {
      ok: false,
      path: target.path,
      url: target.url,
      error: result.error ?? '打开 human-review.html 失败',
    }
  }

  return target
}

export function resolveReviewTarget(htmlPath: string): ReviewTargetResult {
  if (!htmlPath.trim()) {
    return { ok: false, error: '请指定 human-review.html 文件路径' }
  }

  const absolutePath = path.resolve(htmlPath)
  if (!fs.existsSync(absolutePath)) {
    return { ok: false, path: absolutePath, error: `HTML 文件不存在: ${absolutePath}` }
  }

  try {
    const stat = fs.statSync(absolutePath)
    if (!stat.isFile()) {
      return { ok: false, path: absolutePath, error: `路径不是文件: ${absolutePath}` }
    }
  } catch (error) {
    const message = error instanceof Error && error.message ? error.message : '无法读取 HTML 文件状态'
    return { ok: false, path: absolutePath, error: message }
  }

  return {
    ok: true,
    path: absolutePath,
    url: pathToFileURL(absolutePath).href,
  }
}
