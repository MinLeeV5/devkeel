import { describe, expect, it } from 'vitest'
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import YAML from 'yaml'

import packageJson from '../package.json'

const RELEASE_WORKFLOW_PATH = path.resolve('.harness/skills/release-workflow/SKILL.md')
const TEMPLATE_VERSIONS_PATH = path.resolve('templates/versions-yml.yml')
const TEMPLATE_SCHEMA_PATHS = [
  path.resolve('templates/openspec/schemas/full/schema.yaml'),
  path.resolve('templates/openspec/schemas/lite/schema.yaml'),
]

function readSkillMetadataVersion(skillPath: string): string {
  const source = fs.readFileSync(skillPath, 'utf-8')
  const frontmatter = source.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/)
  if (!frontmatter) throw new Error(`Missing YAML frontmatter: ${skillPath}`)

  const metadata = YAML.parse(frontmatter[1]!) as { metadata?: { version?: string | number } }
  if (metadata.metadata?.version === undefined) {
    throw new Error(`Missing metadata.version: ${skillPath}`)
  }
  return String(metadata.metadata.version)
}

describe('release workflow skill', () => {
  it('should define independent CLI and Templates release contracts', () => {
    const skill = fs.readFileSync(RELEASE_WORKFLOW_PATH, 'utf-8')

    expect(skill).toContain('version: "1.2.2"')
    expect(skill).toContain('### CLI 发布')
    expect(skill).toContain('### Templates 发布')

    const cliSection = skill.slice(skill.indexOf('### CLI 发布'), skill.indexOf('### Templates 发布'))
    const templatesSection = skill.slice(skill.indexOf('### Templates 发布'))

    expect(cliSection).toContain('CLI_VERSION=$(pnpm pkg get version')
    expect(cliSection).toContain('web/public/versions/cli/${CLI_VERSION}.json')
    expect(cliSection).toContain('git add package.json pnpm-lock.yaml "$CHANGELOG_JSON"')
    expect(cliSection).toContain('git tag "v${CLI_VERSION}"')
    expect(cliSection).toContain('npm publish')
    expect(cliSection).not.toContain('pnpm publish')
    expect(cliSection).toContain('pnpm view devkeel version')

    expect(templatesSection).toContain('npm --prefix templates version "$BUMP" --no-git-tag-version')
    expect(templatesSection).toContain('TEMPLATES_VERSION=$(npm --prefix templates pkg get version')
    expect(templatesSection).not.toContain('pnpm --dir templates version')
    expect(templatesSection).not.toContain('pnpm --dir templates pkg get version')
    expect(templatesSection).toContain('web/public/versions/templates/${TEMPLATES_VERSION}.json')
    expect(templatesSection).toContain('harness: "{{HARNESS_VERSION}}"')
    expect(templatesSection).toContain('metadata.version')
    expect(templatesSection).toContain('schemas.full')
    expect(templatesSection).toContain('git add templates/package.json templates/versions-yml.yml "$CHANGELOG_JSON"')
    expect(templatesSection).not.toContain('git add package.json')
    expect(templatesSection).toContain('git tag "templates-v${TEMPLATES_VERSION}"')
    expect(templatesSection).toContain('pnpm release:templates')
    expect(templatesSection).toContain('pnpm view devkeel-templates version')
    expect(packageJson.scripts['release:templates']).toBe('cd templates && npm run release')
  })

  it('should keep the packaged schema registry aligned with schema.yaml', () => {
    const versions = YAML.parse(fs.readFileSync(TEMPLATE_VERSIONS_PATH, 'utf-8')) as {
      harness: string
      schemas: Record<string, string>
    }
    expect(versions.harness).toBe('{{HARNESS_VERSION}}')
    for (const schemaPath of TEMPLATE_SCHEMA_PATHS) {
      const schema = YAML.parse(fs.readFileSync(schemaPath, 'utf-8')) as { name: string; version: number }
      expect(versions.schemas[schema.name]).toBe(String(schema.version))
    }
    expect(versions.schemas['superpowers-lite']).toBeUndefined()
  })

  it('should keep every managed skill registry entry aligned with packaged and dogfood metadata', () => {
    const versions = YAML.parse(fs.readFileSync(TEMPLATE_VERSIONS_PATH, 'utf-8')) as {
      skills: Record<string, string>
    }

    for (const [skillName, registeredVersion] of Object.entries(versions.skills)) {
      const packagedSkill = path.resolve('templates', 'skills', skillName, 'SKILL.md')
      const dogfoodSkill = path.resolve('.harness', 'skills', skillName, 'SKILL.md')

      expect(fs.existsSync(packagedSkill), `missing packaged skill: ${skillName}`).toBe(true)
      expect(fs.existsSync(dogfoodSkill), `missing dogfood skill: ${skillName}`).toBe(true)
      expect(readSkillMetadataVersion(packagedSkill), `${skillName} packaged metadata`).toBe(registeredVersion)
      expect(readSkillMetadataVersion(dogfoodSkill), `${skillName} dogfood metadata`).toBe(registeredVersion)
    }
  })

  it('should use executable read-only npm commands for the Templates package', () => {
    const templatesPackageJson = JSON.parse(
      fs.readFileSync(path.resolve('templates/package.json'), 'utf-8'),
    ) as { version: string; files: string[] }
    const actualVersion = JSON.parse(
      execFileSync('npm', ['--prefix', 'templates', 'pkg', 'get', 'version'], {
        cwd: path.resolve('.'),
        encoding: 'utf-8',
      }),
    ) as string

    expect(actualVersion).toBe(templatesPackageJson.version)
    expect(templatesPackageJson.files).not.toContain('retired-assets.yml')
    expect(() => execFileSync('npm', ['--prefix', 'templates', 'version', '--help'], {
      cwd: path.resolve('.'),
      stdio: 'ignore',
    })).not.toThrow()
  })
})
