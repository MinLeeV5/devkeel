import fs from 'node:fs'
import path from 'node:path'
import YAML from 'yaml'
import { planSkillLinks } from './skill-distribution.js'

export interface SkillCheck {
  name: string
  status: 'pass' | 'warn' | 'fail'
  detail: string
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}

function parseMapping(content: string): Record<string, unknown> | null {
  const document = YAML.parseDocument(content)
  if (document.errors.length > 0) return null
  const value: unknown = document.toJSON()
  return isRecord(value) ? value : null
}

function frontmatterProblems(value: Record<string, unknown>): string[] {
  const errors: string[] = []
  const name = value['name']
  if (typeof name !== 'string' || name.length > 64 || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(name)) {
    errors.push('name 必须是 1–64 字符的小写连字符名称')
  }
  if (typeof value['description'] !== 'string' || !value['description'].trim()) {
    errors.push('description 必须是非空字符串')
  }
  for (const field of ['disable-model-invocation', 'user-invocable']) {
    if (value[field] !== undefined && typeof value[field] !== 'boolean') errors.push(`${field} 必须为布尔值`)
  }
  const tools = value['allowed-tools']
  if (tools !== undefined && typeof tools !== 'string'
    && !(Array.isArray(tools) && tools.every(tool => typeof tool === 'string'))) {
    errors.push('allowed-tools 必须是字符串或字符串列表')
  }
  return errors
}

function metadataProblems(value: Record<string, unknown>): string[] {
  const errors: string[] = []
  for (const section of ['interface', 'policy', 'dependencies']) {
    if (value[section] !== undefined && !isRecord(value[section])) errors.push(`${section} 必须是对象`)
  }
  const ui = value['interface']
  if (isRecord(ui)) {
    for (const field of ['display_name', 'short_description', 'default_prompt', 'icon_small', 'icon_large', 'brand_color']) {
      if (ui[field] !== undefined && typeof ui[field] !== 'string') errors.push(`interface.${field} 必须是字符串`)
    }
  }
  const policy = value['policy']
  if (isRecord(policy) && policy['allow_implicit_invocation'] !== undefined
    && typeof policy['allow_implicit_invocation'] !== 'boolean') {
    errors.push('policy.allow_implicit_invocation 必须为布尔值')
  }
  const dependencies = value['dependencies']
  if (isRecord(dependencies) && dependencies['tools'] !== undefined) {
    const tools = dependencies['tools']
    if (!Array.isArray(tools) || tools.some(tool => !isRecord(tool)
      || tool['type'] !== 'mcp' || typeof tool['value'] !== 'string' || !tool['value'].trim())) {
      errors.push('dependencies.tools 必须包含有效的 MCP type/value 条目')
    }
  }
  return errors
}

export function checkSkillPackages(projectRoot: string): SkillCheck[] {
  const root = path.join(projectRoot, '.harness/skills')
  const results: SkillCheck[] = []
  try {
    if (!fs.statSync(root, { throwIfNoEntry: false })?.isDirectory()) {
      return [{ name: '.harness/skills', status: 'fail', detail: '共享技能源目录缺失或不可读' }]
    }
    for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
      if (entry.name.startsWith('.') || (!entry.isDirectory() && !entry.isSymbolicLink())) continue
      const relative = `.harness/skills/${entry.name}`
      const file = path.join(projectRoot, relative, 'SKILL.md')
      try {
        const content = fs.readFileSync(file, 'utf8')
        const frontmatter = content.match(/^\uFEFF?---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/)?.[1]
        const value = frontmatter ? parseMapping(frontmatter) : null
        const errors = value ? frontmatterProblems(value) : ['缺少有效的 YAML frontmatter']
        results.push({ name: `${relative}/SKILL.md`, status: errors.length ? 'fail' : 'pass', detail: errors.join('；') || '技能入口格式有效' })
        if (value?.['triggers'] !== undefined) {
          results.push({ name: relative, status: 'warn', detail: 'triggers 不是原生触发配置，请在 description 中描述适用场景' })
        }
        if (value?.['user-invocable'] === false) {
          results.push({ name: relative, status: 'warn', detail: 'user-invocable: false 禁用了 Claude 手动调用' })
        }
      } catch {
        results.push({ name: `${relative}/SKILL.md`, status: 'fail', detail: '技能入口缺失、不可读或解析失败' })
      }
      const metadataPath = path.join(projectRoot, relative, 'agents/openai.yaml')
      try {
        if (!fs.lstatSync(metadataPath, { throwIfNoEntry: false })) continue
        const value = parseMapping(fs.readFileSync(metadataPath, 'utf8'))
        const errors = value ? metadataProblems(value) : ['Codex 元数据必须是有效的 YAML 对象']
        results.push({ name: `${relative}/agents/openai.yaml`, status: errors.length ? 'fail' : 'pass', detail: errors.join('；') || 'Codex 元数据格式有效' })
      } catch {
        results.push({ name: `${relative}/agents/openai.yaml`, status: 'fail', detail: 'Codex 元数据不可读或解析失败' })
      }
    }
  } catch {
    results.push({ name: '.harness/skills', status: 'fail', detail: '无法扫描共享技能源目录' })
  }
  return results
}

export function checkSkillLinks(projectRoot: string, targets: readonly string[]): SkillCheck[] {
  const plan = planSkillLinks(projectRoot, targets)
  const results: SkillCheck[] = plan.errors.map(detail => ({ name: 'skills', status: 'fail', detail }))
  for (const link of plan.links) {
    let detail = link.detail
    let status: SkillCheck['status'] = link.status === 'linked' ? 'pass' : 'fail'
    if (link.status === 'linked') {
      try {
        if (!fs.statSync(path.join(projectRoot, link.path), { throwIfNoEntry: false })?.isDirectory()) {
          status = 'fail'
          detail = '链接目标目录缺失或不可读'
        }
      } catch {
        status = 'fail'
        detail = '链接目标不可读'
      }
    }
    results.push({ name: link.path, status, detail })
  }
  return results
}
