import fs from 'node:fs'
import path from 'node:path'
import YAML from 'yaml'
import packageJson from '../../package.json'
import { getTemplatesDir } from './templates-dir.js'
import type { RepositoryType } from './detect.js'

function readSchemaVersion(schemaName: string, base: string): string | null {
  const schemaPath = path.join(base, 'openspec', 'schemas', schemaName, 'schema.yaml')
  if (fs.existsSync(schemaPath)) {
    const parsed = YAML.parse(fs.readFileSync(schemaPath, 'utf-8')) as Record<string, unknown>
    if (parsed?.version != null) return String(parsed.version)
  }
  return null
}

export interface VersionsRecord {
  harness: string
  skills: Record<string, string>
  agents: Record<string, string>
  rules: Record<string, string>
  schemas: Record<string, string>
}

const versionsStringifyOptions = {
  lineWidth: 0,
  defaultStringType: 'QUOTE_DOUBLE',
  defaultKeyType: 'PLAIN',
} as const

export function filterManagedVersions(
  versions: VersionsRecord,
  repoType: RepositoryType,
): VersionsRecord {
  if (repoType === 'main') {
    return {
      ...versions,
      skills: { ...versions.skills },
      agents: { ...versions.agents },
      rules: { ...versions.rules },
      schemas: { ...versions.schemas },
    }
  }
  return {
    harness: versions.harness,
    skills: {},
    agents: {},
    rules: {},
    schemas: {},
  }
}

export function readVersions(projectRoot: string): VersionsRecord | null {
  const versionsPath = path.join(projectRoot, '.harness', 'versions.yml')
  if (!fs.existsSync(versionsPath)) return null
  try {
    const content = fs.readFileSync(versionsPath, 'utf-8')
    return YAML.parse(content) as VersionsRecord
  } catch {
    return null
  }
}

export function writeVersions(projectRoot: string, versions: VersionsRecord): void {
  const versionsPath = path.join(projectRoot, '.harness', 'versions.yml')
  fs.mkdirSync(path.dirname(versionsPath), { recursive: true })
  fs.writeFileSync(versionsPath, YAML.stringify(versions, versionsStringifyOptions), 'utf-8')
}

export function getBuiltinVersions(base = getTemplatesDir()): VersionsRecord {
  const templatesPkg = path.join(base, 'package.json')
  let templatesVersion = packageJson.version
  if (fs.existsSync(templatesPkg)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(templatesPkg, 'utf-8')) as Record<string, unknown>
      if (typeof pkg['version'] === 'string') templatesVersion = pkg['version']
    } catch { /* fallback to CLI version */ }
  }
  const versionFile = path.join(base, 'versions-yml.yml')
  if (fs.existsSync(versionFile)) {
    const content = fs.readFileSync(versionFile, 'utf-8')
    const parsed = YAML.parse(content) as VersionsRecord
    parsed.harness = templatesVersion
    for (const schemaName of Object.keys(parsed.schemas ?? {})) {
      const schemaVer = readSchemaVersion(schemaName, base)
      if (schemaVer) parsed.schemas[schemaName] = schemaVer
    }
    return {
      harness: templatesVersion,
      skills: parsed.skills ?? {},
      agents: parsed.agents ?? {},
      rules: parsed.rules ?? {},
      schemas: parsed.schemas ?? {},
    }
  }
  return { harness: templatesVersion, skills: {}, agents: {}, rules: {}, schemas: {} }
}

export interface OutdatedCategories {
  skills: Set<string>
  agents: boolean
  rules: boolean
  schemas: Set<string>
}

export function computeOutdatedCategories(
  current: VersionsRecord | null,
  builtin: VersionsRecord,
): OutdatedCategories {
  if (!current) {
    return {
      skills: new Set(Object.keys(builtin.skills)),
      agents: true,
      rules: true,
      schemas: new Set(Object.keys(builtin.schemas)),
    }
  }

  const skills = new Set<string>()
  for (const [name, ver] of Object.entries(builtin.skills)) {
    if (current.skills?.[name] !== ver) skills.add(name)
  }

  const agents = Object.entries(builtin.agents).some(
    ([name, ver]) => current.agents?.[name] !== ver,
  )
  const rules = Object.entries(builtin.rules).some(
    ([name, ver]) => current.rules?.[name] !== ver,
  )

  const schemas = new Set<string>()
  for (const [name, ver] of Object.entries(builtin.schemas)) {
    if (current.schemas?.[name] !== ver) schemas.add(name)
  }

  return { skills, agents, rules, schemas }
}
