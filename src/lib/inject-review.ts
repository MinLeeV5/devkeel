import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import YAML from 'yaml'

interface InjectResult {
  artifactsInjected: string[]
  cssInjected: boolean
  jsInjected: boolean
  errors: string[]
}

interface InjectReviewOptions {
  cssPath?: string
  jsPath?: string
}

const BEGIN_ARTIFACTS = '<!-- BEGIN:artifacts -->'
const END_ARTIFACTS = '<!-- END:artifacts -->'
const BEGIN_CSS = '<!-- BEGIN:css -->'
const END_CSS = '<!-- END:css -->'
const BEGIN_JS = '<!-- BEGIN:js -->'
const END_JS = '<!-- END:js -->'
const INJECT_ARTIFACTS = '<!-- INJECT:artifacts -->'
const INJECT_CSS = '<!-- INJECT:css -->'
const INJECT_JS = '<!-- INJECT:js -->'
const ARTIFACT_ORDER = [
  'brainstorm',
  'explore',
  'design',
  'proposal',
  'plan',
  'specs',
  'tasks',
  'verify',
  'retrospective',
]

export function injectReview(htmlPath: string, options?: string | InjectReviewOptions): InjectResult {
  const result: InjectResult = { artifactsInjected: [], cssInjected: false, jsInjected: false, errors: [] }
  const normalizedOptions = normalizeOptions(options)

  if (!fs.existsSync(htmlPath)) {
    result.errors.push(`HTML 文件不存在: ${htmlPath}`)
    return result
  }

  const absoluteHtmlPath = path.resolve(htmlPath)
  let html = fs.readFileSync(absoluteHtmlPath, 'utf-8')
  const changeDir = path.dirname(absoluteHtmlPath)

  html = clearPreviousInjection(html)

  html = injectArtifacts(html, changeDir, result)
  html = injectCss(html, normalizedOptions.cssPath, result)
  html = injectJs(html, normalizedOptions.jsPath, result)
  html = injectVersionMeta(html, changeDir)

  if (result.errors.length > 0) {
    return result
  }

  const validationErrors = validateHtml(html)
  if (validationErrors.length > 0) {
    result.errors.push(...validationErrors)
    return result
  }

  fs.writeFileSync(htmlPath, html, 'utf-8')
  return result
}

function clearPreviousInjection(html: string): string {
  html = html.replace(
    new RegExp(`${escapeRegex(BEGIN_ARTIFACTS)}[\\s\\S]*?${escapeRegex(END_ARTIFACTS)}`),
    INJECT_ARTIFACTS
  )
  html = html.replace(
    new RegExp(`${escapeRegex(BEGIN_CSS)}[\\s\\S]*?${escapeRegex(END_CSS)}`),
    INJECT_CSS
  )
  html = html.replace(
    new RegExp(`${escapeRegex(BEGIN_JS)}[\\s\\S]*?${escapeRegex(END_JS)}`),
    INJECT_JS
  )
  return html
}

function injectArtifacts(html: string, changeDir: string, result: InjectResult): string {
  if (!html.includes(INJECT_ARTIFACTS)) return html

  const scripts: string[] = []
  for (const artifact of collectArtifacts(changeDir)) {
    scripts.push(`<script type="text/markdown" data-artifact="${artifact.name}">\n${artifact.content}</script>`)
    result.artifactsInjected.push(artifact.name)
  }

  const block = `${BEGIN_ARTIFACTS}\n${scripts.join('\n\n')}\n${END_ARTIFACTS}`
  return html.replace(INJECT_ARTIFACTS, block)
}

function collectArtifacts(changeDir: string): Array<{ name: string; content: string }> {
  const artifacts = new Map<string, string>()

  for (const entry of fs.readdirSync(changeDir, { withFileTypes: true })) {
    if (!entry.isFile() || path.extname(entry.name) !== '.md') continue
    const artifactName = path.basename(entry.name, '.md')
    const filePath = path.join(changeDir, entry.name)
    artifacts.set(artifactName, escapeScriptContent(fs.readFileSync(filePath, 'utf-8')))
  }

  const specsDir = path.join(changeDir, 'specs')
  if (fs.existsSync(specsDir) && fs.statSync(specsDir).isDirectory()) {
    const specsContent = collectSpecs(specsDir)
    if (specsContent) artifacts.set('specs', specsContent)
  }

  return [...artifacts.entries()]
    .sort(([left], [right]) => compareArtifactNames(left, right))
    .map(([name, content]) => ({ name, content }))
}

function collectSpecs(specsDir: string): string | null {
  const parts: string[] = []
  const dirs = fs.readdirSync(specsDir).sort()

  for (const dir of dirs) {
    const specPath = path.join(specsDir, dir, 'spec.md')
    if (!fs.existsSync(specPath)) continue
    const content = fs.readFileSync(specPath, 'utf-8')
    parts.push(`# ${dir}\n\n${content}`)
  }

  if (parts.length === 0) return null
  return escapeScriptContent(parts.join('\n---\n\n'))
}

function injectCss(html: string, cssPath: string | undefined, result: InjectResult): string {
  if (!html.includes(INJECT_CSS)) return html

  const resolvedCssPath = cssPath ?? resolveBundledAssetPath('human-review.css')

  if (!resolvedCssPath || !fs.existsSync(resolvedCssPath)) {
    result.errors.push(`CSS 资源不存在: ${resolvedCssPath ?? 'web/human-review.css'}`)
    return html
  }

  const css = fs.readFileSync(resolvedCssPath, 'utf-8')
  const block = `${BEGIN_CSS}\n<style>\n${css}\n</style>\n${END_CSS}`
  html = html.replace(INJECT_CSS, block)
  result.cssInjected = true
  return html
}

function injectJs(html: string, jsPath: string | undefined, result: InjectResult): string {
  if (!html.includes(INJECT_JS)) return html

  const resolvedJsPath = jsPath ?? resolveBundledAssetPath('human-review.js')

  if (!resolvedJsPath || !fs.existsSync(resolvedJsPath)) {
    result.errors.push(`JS 资源不存在: ${resolvedJsPath ?? 'web/human-review.js'}`)
    return html
  }

  const js = fs.readFileSync(resolvedJsPath, 'utf-8')
  const block = `${BEGIN_JS}\n<script>\n${js}\n</script>\n${END_JS}`
  html = html.replace(INJECT_JS, block)
  result.jsInjected = true
  return html
}

export function validateHtml(html: string): string[] {
  const errors: string[] = []
  if (!html.includes('<!DOCTYPE html>') && !html.includes('<!doctype html>')) {
    errors.push('缺少 DOCTYPE 声明')
  }
  if (!html.includes('</html>')) {
    errors.push('缺少 </html> 闭合标签')
  }

  const openTags = (html.match(/<script[\s>]/g) || []).length
  const closeTags = (html.match(/<\/script>/g) || []).length
  if (openTags > closeTags) {
    errors.push(`存在未闭合的 script 标签 (open: ${openTags}, close: ${closeTags})`)
  }

  return errors
}

function escapeScriptContent(content: string): string {
  return content
    .replace(/<\/script>/gi, '<\\/script>')
    .replace(/<script/gi, '<\\script')
    .replace(/<!-- INJECT:/g, '<!-- ESC-INJECT:')
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export function resolveBundledAssetPath(fileName: string, moduleUrl: string = import.meta.url): string | null {
  for (const candidate of getBundledAssetCandidates(fileName, moduleUrl)) {
    if (fs.existsSync(candidate)) return candidate
  }

  return null
}

function getBundledAssetCandidates(fileName: string, moduleUrl: string): string[] {
  const moduleDir = path.dirname(fileURLToPath(moduleUrl))
  return [
    path.resolve(moduleDir, '..', 'web', fileName),
    path.resolve(moduleDir, '..', '..', 'web', fileName),
  ]
}

function compareArtifactNames(left: string, right: string): number {
  const leftIndex = ARTIFACT_ORDER.indexOf(left)
  const rightIndex = ARTIFACT_ORDER.indexOf(right)

  if (leftIndex !== -1 || rightIndex !== -1) {
    if (leftIndex === -1) return 1
    if (rightIndex === -1) return -1
    return leftIndex - rightIndex
  }

  return left.localeCompare(right)
}

function injectVersionMeta(html: string, changeDir: string): string {
  const version = findHarnessVersion(changeDir)
  if (!version) return html

  const meta = `<meta name="harness-version" content="${version}">`
  if (html.includes('name="harness-version"')) {
    return html.replace(/<meta name="harness-version"[^>]*>/, meta)
  }

  return html.replace(/<meta charset="[^"]*">/, (match) => `${match}\n  ${meta}`)
}

function findHarnessVersion(startDir: string): string | null {
  let dir = path.resolve(startDir)
  for (let i = 0; i < 10; i++) {
    const versionsPath = path.join(dir, '.harness', 'versions.yml')
    if (fs.existsSync(versionsPath)) {
      try {
        const content = fs.readFileSync(versionsPath, 'utf-8')
        const data = YAML.parse(content)
        return data?.harness ?? null
      } catch {
        return null
      }
    }
    const parent = path.dirname(dir)
    if (parent === dir) break
    dir = parent
  }
  return null
}

function normalizeOptions(options?: string | InjectReviewOptions): InjectReviewOptions {
  if (typeof options === 'string') {
    return { cssPath: options }
  }

  return options ?? {}
}
