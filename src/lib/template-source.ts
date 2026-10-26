import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { createHash } from 'node:crypto'
import { execNpmSync } from './npm-command.js'

export const DEFAULT_TEMPLATE_PACKAGE = 'devkeel-templates'
const SOURCE_FILE = '.harness/template-source.json'

export interface TemplateSourceOptions {
  templatePackage?: string
  templateRegistry?: string
}

export interface TemplateSource {
  packageName: string
  registry: string
  configuredRegistry?: string
  projectConfig?: SavedTemplateSource
}

interface SavedTemplateSource {
  packageName?: string
  registry?: string
}

function validatePackage(value: unknown): string {
  if (typeof value !== 'string' || value.length > 214
    || !/^(?:@[a-z0-9][a-z0-9._-]*\/)?[a-z0-9][a-z0-9._-]*$/.test(value)) {
    throw new Error('模板包名必须是 npm 包名（可带 @scope），不能包含版本或路径')
  }
  return value
}

function validateRegistry(value: unknown): string {
  if (typeof value !== 'string') throw new Error('模板 registry 必须是 HTTP(S) URL')
  let url: URL
  try { url = new URL(value) } catch { throw new Error('模板 registry 必须是 HTTP(S) URL') }
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password
    || url.search || url.hash || /[\s\\%"!()^&|<>]/.test(value)) {
    throw new Error('模板 registry 必须是无凭据、查询参数和片段的 HTTP(S) URL；认证请配置在 .npmrc')
  }
  return url.href.replace(/\/+$/, '') + '/'
}

function readSourceFile(file: string): SavedTemplateSource | null {
  if (!fs.existsSync(file)) return null
  try {
    const parsed = JSON.parse(fs.readFileSync(file, 'utf-8')) as Record<string, unknown>
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)
      || (parsed['packageName'] === undefined && parsed['registry'] === undefined)) throw new Error('empty source')
    return {
      ...(parsed['packageName'] === undefined ? {} : { packageName: validatePackage(parsed['packageName']) }),
      ...(parsed['registry'] === undefined ? {} : { registry: validateRegistry(parsed['registry']) }),
    }
  } catch {
    throw new Error(`${file} 无效，请检查 packageName 和 registry（不要在文件中保存凭据）`)
  }
}

export function readTemplateSource(projectRoot = process.cwd()): SavedTemplateSource | null {
  return readSourceFile(path.join(projectRoot, SOURCE_FILE))
}

export function readUserTemplateSource(homeDir = os.homedir()): SavedTemplateSource | null {
  return readSourceFile(path.join(homeDir, '.harness', 'template-source.json'))
}

export function resolveTemplateSource(
  projectRoot = process.cwd(),
  options: TemplateSourceOptions = {},
  homeDir = os.homedir(),
): TemplateSource {
  const user = readUserTemplateSource(homeDir)
  const project = readTemplateSource(projectRoot)
  const packageName = validatePackage(options.templatePackage ?? project?.packageName ?? user?.packageName ?? DEFAULT_TEMPLATE_PACKAGE)
  const configured = options.templateRegistry ?? project?.registry ?? user?.registry
  const projectConfig = project || options.templatePackage !== undefined || options.templateRegistry !== undefined
    ? {
        ...project,
        ...(options.templatePackage === undefined ? {} : { packageName }),
        ...(options.templateRegistry === undefined ? {} : { registry: validateRegistry(options.templateRegistry) }),
      }
    : undefined
  const persistence = projectConfig ? { projectConfig } : {}
  if (configured !== undefined) {
    const registry = validateRegistry(configured)
    return { packageName, registry, configuredRegistry: registry, ...persistence }
  }
  const configGet = (key: string): string => execNpmSync(['config', 'get', key], {
    cwd: projectRoot, encoding: 'utf-8', timeout: 3000, stdio: ['ignore', 'pipe', 'pipe'],
  }).trim()
  try {
    const scope = packageName.startsWith('@') ? packageName.split('/')[0] : undefined
    const scopedRegistry = scope ? configGet(`${scope}:registry`) : undefined
    const registry = scopedRegistry && scopedRegistry !== 'undefined' && scopedRegistry !== 'null'
      ? scopedRegistry : configGet('registry')
    return { packageName, registry: validateRegistry(registry), ...persistence }
  } catch {
    throw new Error('无法解析模板 npm registry，请检查 npm 配置或指定 --template-registry')
  }
}

export function templateSourceKey(source: TemplateSource): string {
  return createHash('sha256').update(JSON.stringify([source.packageName, source.registry])).digest('hex')
}

export function hasTemplateSourceChanged(installedKey: string | undefined, source: TemplateSource): boolean {
  // Legacy projects used the default package through npm configuration, without provenance.
  if (installedKey === undefined) {
    return source.packageName !== DEFAULT_TEMPLATE_PACKAGE || source.configuredRegistry !== undefined
  }
  return installedKey !== templateSourceKey(source)
}

export function templateRegistryArgs(source: TemplateSource): string[] {
  const args = [`--registry=${source.registry}`]
  if (source.packageName.startsWith('@')) args.push(`--${source.packageName.split('/')[0]}:registry=${source.registry}`)
  return args
}

export function writeTemplateSource(projectRoot: string, source: TemplateSource): void {
  if (!source.projectConfig) return
  const file = path.join(projectRoot, SOURCE_FILE)
  fs.mkdirSync(path.dirname(file), { recursive: true })
  const temp = `${file}.${process.pid}.tmp`
  try {
    fs.writeFileSync(temp, JSON.stringify(source.projectConfig, null, 2) + '\n', 'utf-8')
    fs.renameSync(temp, file)
  } finally {
    fs.rmSync(temp, { force: true })
  }
}
