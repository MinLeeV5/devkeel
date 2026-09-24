import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'
import { describe, expect, it } from 'vitest'
import YAML from 'yaml'

type UpstreamSkill = {
  instructions: string
  metadata: { version: string }
}

const contracts = [
  ['openspec-new-change', 'getNewChangeSkillTemplate', ['planningHome', 'changeRoot', 'artifactPaths']],
  ['openspec-continue-change', 'getContinueChangeSkillTemplate', ['isPlanningComplete', 'skipped', 'dependencies']],
  ['openspec-update-change', 'getUpdateChangeSkillTemplate', ['artifactPaths.<id>.existingOutputPaths', 'NEVER edit implementation code']],
  ['openspec-ff-change', 'getFfChangeSkillTemplate', ['applyRequires', 'requires', 'dependencies']],
  ['openspec-apply-change', 'getApplyChangeSkillTemplate', ['contextFiles', 'operationGuidance', 'actionContext']],
  ['openspec-verify-change', 'getVerifyChangeSkillTemplate', ['Completeness', 'Correctness', 'Coherence']],
  ['openspec-sync-specs', 'getSyncSpecsSkillTemplate', ['ADDED', 'MODIFIED', 'idempotent']],
  ['openspec-archive-change', 'getArchiveChangeSkillTemplate', ['planningHome', 'artifactPaths', 'delta spec']],
  ['openspec-bulk-archive-change', 'getBulkArchiveChangeSkillTemplate', ['actionContext', 'capability']],
  ['openspec-onboard', 'getOnboardSkillTemplate', ['EXPLAIN → DO → SHOW → PAUSE', 'resolvedOutputPath']],
] as const

function readLocalSkill(name: string): string {
  return fs.readFileSync(
    path.join(process.cwd(), 'templates', 'skills', name, 'SKILL.md'),
    'utf8',
  )
}

describe('OpenSpec 1.12 skill baseline', () => {
  it('keeps OPSX explore as a thin adapter to the shared brainstorming controller', () => {
    const command = fs.readFileSync(
      path.join(process.cwd(), 'templates', 'commands', 'opsx', 'explore.md'),
      'utf8',
    )
    const dogfood = fs.readFileSync(
      path.join(process.cwd(), '.harness', 'commands', 'opsx', 'explore.md'),
      'utf8',
    )
    const reference = fs.readFileSync(
      path.join(process.cwd(), 'templates', 'skills', 'brainstorming', 'references', 'openspec-context.md'),
      'utf8',
    )

    expect(command).toContain('Load and follow the `brainstorming` skill.')
    expect(command).toContain('conditional reference-loading rules')
    expect(command).toContain('`references/openspec-context.md`')
    expect(command).toContain('`references/living-brainstorm.md`')
    expect(command).not.toContain('Enable its\n`references/openspec-context.md` mode for this invocation')
    expect(command).toContain('topic-only')
    expect(command).toContain('discussion stage')
    expect(command).toContain('key gap')
    expect(command).toContain('one next question when a gap remains')
    expect(command).toContain('otherwise request confirmation')
    expect(command).not.toContain('confidence')
    expect(command).not.toContain('openspec-explore')
    expect(dogfood).toBe(command)
    expect(reference).toContain('planning-state.mjs')
    expect(reference).toContain('`isPlanningComplete`')
    expect(reference).toContain('OpenSpec 返回 `done` 只说明文件存在')
  })

  it('pins translated skills to installed OpenSpec 1.12 and preserves its dynamic contracts', async () => {
    const packageJson = JSON.parse(
      fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf8'),
    ) as { dependencies: Record<string, string> }
    const upstreamVersion = packageJson.dependencies['@fission-ai/openspec']
    expect(upstreamVersion).toBe('1.12.0')

    const require = createRequire(import.meta.url)
    const entryPath = require.resolve('@fission-ai/openspec')
    const templatesPath = path.join(path.dirname(entryPath), 'core', 'templates', 'skill-templates.js')
    const upstream = await import(pathToFileURL(templatesPath).href) as Record<string, unknown>

    for (const [name, factoryName, upstreamInvariants] of contracts) {
      const factory = upstream[factoryName]
      expect(typeof factory, factoryName).toBe('function')
      const official = (factory as () => UpstreamSkill)()
      expect(official.instructions, name).toContain('Store selection:')
      expect(official.instructions, name).toContain('--store <id>')
      for (const invariant of upstreamInvariants) {
        expect(official.instructions, `${name}: ${invariant}`).toContain(invariant)
      }

      const local = readLocalSkill(name)
      const frontmatter = YAML.parse(local.split('---')[1] ?? '') as {
        metadata?: { upstreamVersion?: string; generatedBy?: string }
      }
      expect(frontmatter.metadata?.upstreamVersion, name).toBe('1.12.0')
      expect(frontmatter.metadata?.generatedBy, name).toBe('1.12.0')
      expect(local, name).not.toContain('workspace-planning')
    }
  })

  it('adds DevKeel semantic closure without hard-coding it into the CLI wrapper', () => {
    const newChange = readLocalSkill('openspec-new-change')
    const continueChange = readLocalSkill('openspec-continue-change')
    const ff = readLocalSkill('openspec-ff-change')
    const apply = readLocalSkill('openspec-apply-change')

    expect(newChange).toContain('Living brainstorm')
    expect(newChange).toMatch(/有 gap 时.*同一轮只询问当前最高价值/u)
    expect(newChange).toContain('已闭合时进入 Brainstorming 快照确认')
    expect(continueChange).toContain('OpenSpec 结构状态负责依赖图')
    expect(continueChange).toContain('每次都从磁盘重读')
    expect(continueChange).toContain('每次最多创建一个 artifact')
    expect(ff).toContain('调用 FF 本身不等于确认 D/A 快照')
    expect(ff).toContain('传递依赖闭包')
    expect(apply).toContain('只有 `applyReady: true`')
    expect(apply).toContain('`operationGuidance`')

    expect(fs.existsSync(path.join(process.cwd(), 'templates', 'skills', 'openspec-propose'))).toBe(false)
    expect(fs.existsSync(path.join(process.cwd(), 'templates', 'commands', 'opsx', 'propose.md'))).toBe(false)
    expect(fs.readFileSync(path.join(process.cwd(), 'src', 'commands', 'openspec.ts'), 'utf8'))
      .not.toContain('planning-state.mjs')
  })
})
