import fs from 'node:fs'
import path from 'node:path'
import YAML from 'yaml'

interface OpenspecCheckResult {
  name: string
  status: 'pass' | 'warn' | 'fail'
  detail: string
}

export function validateOpenspecConfig(projectRoot: string): OpenspecCheckResult[] {
  const results: OpenspecCheckResult[] = []
  const openspecDir = path.join(projectRoot, 'openspec')

  if (!fs.existsSync(openspecDir)) {
    results.push({ name: 'openspec/', status: 'warn', detail: '未初始化，建议执行 devkeel init' })
    return results
  }

  results.push({ name: 'openspec/', status: 'pass', detail: '已初始化' })

  const configPath = path.join(openspecDir, 'config.yaml')
  if (!fs.existsSync(configPath)) {
    results.push({ name: 'openspec/config.yaml', status: 'fail', detail: '文件缺失' })
    return results
  }

  let config: Record<string, unknown> | null = null
  try {
    config = YAML.parse(fs.readFileSync(configPath, 'utf-8')) as Record<string, unknown>
  } catch {
    results.push({ name: 'openspec/config.yaml', status: 'fail', detail: 'YAML 解析失败' })
    return results
  }

  if (!config) {
    results.push({ name: 'openspec/config.yaml', status: 'fail', detail: '文件内容为空' })
    return results
  }

  const schemaName = config['schema']
  if (!schemaName || typeof schemaName !== 'string') {
    results.push({ name: 'openspec/config.yaml', status: 'fail', detail: 'schema 字段缺失或为空' })
    return results
  }

  results.push({ name: 'openspec/config.yaml', status: 'pass', detail: `schema: ${schemaName}` })

  const schemaPath = path.join(openspecDir, 'schemas', schemaName, 'schema.yaml')
  if (!fs.existsSync(schemaPath)) {
    results.push({ name: `openspec/schemas/${schemaName}`, status: 'fail', detail: 'schema 目录或 schema.yaml 不存在' })
    return results
  }

  try {
    const schemaParsed = YAML.parse(fs.readFileSync(schemaPath, 'utf-8')) as Record<string, unknown>
    if (!schemaParsed?.['name']) {
      results.push({ name: `openspec/schemas/${schemaName}`, status: 'warn', detail: 'schema.yaml 缺少 name 字段' })
    } else {
      results.push({ name: `openspec/schemas/${schemaName}`, status: 'pass', detail: `v${schemaParsed['version'] ?? '?'}` })
    }
  } catch {
    results.push({ name: `openspec/schemas/${schemaName}`, status: 'fail', detail: 'schema.yaml 解析失败' })
    return results
  }

  return results
}
