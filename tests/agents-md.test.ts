import { describe, expect, it } from 'vitest'
import { cleanAgentsMdSlots, mergeAgentsMdContent, restoreAgentsMdSlots } from '../src/lib/agents-md.js'
import { extractUserSlots, fillUserSlots, readTemplateFile, renderTemplate } from '../src/lib/templates.js'

const legacyRouting = `| 任务类型 | Skill |
|----------|-------|
| 代码审查 | \`review-orchestrator\` |
| 测试用例设计 | \`test-case-designer\` |
| 缺陷管理 | \`jira-defect-orchestrator\` |
| 调试、诊断与缺陷修复 | \`systematic-debugging\` |
| 原子提交、推送或 MR/PR | \`commit\` |`

const rootTemplate = renderTemplate(readTemplateFile('agents-md.md'), { SUBMODULE_SECTION: '' })
const domainTemplate = readTemplateFile('agents-domain-md.md')
const managedSources = [rootTemplate, domainTemplate]
const clean = (content: string) => cleanAgentsMdSlots(content, managedSources)

describe('AGENTS structure migration', () => {
  it.each([
    ['root', rootTemplate],
    ['domain', domainTemplate],
  ])('merges legacy domain links into the %s project slot', (_name, template) => {
    const existing = fillUserSlots(rootTemplate, new Map([['project', '[Project](docs/project.md)\n']]))
      .replace('<!-- harness:user:project -->', `<!-- harness:user:domain -->
[Architecture](docs/architecture.md)
<!-- /harness:user:domain -->
<!-- harness:user:project -->`)

    const merged = mergeAgentsMdContent(template, existing, managedSources)
    const slots = extractUserSlots(merged)

    expect(slots.has('domain')).toBe(false)
    expect(slots.get('project')).toContain('[Architecture](docs/architecture.md)')
    expect(slots.get('project')).toContain('[Project](docs/project.md)')
    expect(slots.get('project')).not.toContain('原 `domain` 定制区')
    expect(mergeAgentsMdContent(template, merged, managedSources)).toBe(merged)
  })

  it('moves framework routes into the customized L0 slot once', () => {
    const existing = fillUserSlots(rootTemplate, new Map([['l0-custom', '| 部署 | `project-deploy` |\n']]))
      .replace('<!-- harness:user:l0-custom -->', `${legacyRouting}\n\n<!-- harness:user:l0-custom -->`)

    const merged = mergeAgentsMdContent(rootTemplate, existing, managedSources)
    const routes = extractUserSlots(merged).get('l0-custom')!

    expect(routes).toContain(legacyRouting)
    expect(routes).toContain('| 部署 | `project-deploy` |')
    expect(merged.match(/\| 代码审查 \|/g)).toHaveLength(1)
    expect(mergeAgentsMdContent(rootTemplate, merged, managedSources)).toBe(merged)
  })

  it('preserves an already customized L0 table without restoring removed defaults', () => {
    const existing = fillUserSlots(rootTemplate, new Map([['l0-custom', `| 任务类型 | Skill |
|----------|-------|
| 代码审查 | \`project-review\` |
`]]))

    const merged = mergeAgentsMdContent(rootTemplate, existing, managedSources)

    expect(extractUserSlots(merged).get('l0-custom'))
      .toBe(extractUserSlots(existing).get('l0-custom'))
    expect(merged).not.toContain('`review-orchestrator` |')
  })

  it.each(['', '<!-- Routes intentionally cleared. -->\n'])(
    'preserves an explicitly cleared L0 slot: %j', content => {
      const existing = fillUserSlots(rootTemplate, new Map([['l0-custom', content]]))

      const merged = mergeAgentsMdContent(rootTemplate, existing, managedSources)

      expect(extractUserSlots(merged).get('l0-custom')).toBe(content)
      expect(merged).not.toContain('`review-orchestrator` |')
    },
  )

  it.each([`${legacyRouting}\n\n| 部署 | \`project-deploy\` |\n`, ''])(
    'preserves routing across root/domain/root conversion: %j', content => {
      const root = rootTemplate.replace(
        /<!-- harness:user:l0-custom -->\n[\s\S]*?<!-- \/harness:user:l0-custom -->/,
        `<!-- harness:user:l0-custom -->\n${content}<!-- /harness:user:l0-custom -->`,
      )

      const domain = mergeAgentsMdContent(domainTemplate, root, managedSources)
      const restored = mergeAgentsMdContent(rootTemplate, domain, managedSources)

      expect(extractUserSlots(restored).get('l0-custom')).toBe(content)
      expect(restored.match(/\| 代码审查 \|/g)?.length ?? 0).toBe(content ? 1 : 0)
      expect(extractUserSlots(restored).get('project')).not.toContain('project-deploy')
      expect(mergeAgentsMdContent(domainTemplate, domain, managedSources)).toBe(domain)
    },
  )

  it('preserves legacy framework defaults through domain conversion', () => {
    const legacy = fillUserSlots(rootTemplate, new Map([['l0-custom', '<!-- Custom routes may be added here. -->\n']]))
      .replace('<!-- harness:user:l0-custom -->', `${legacyRouting}\n\n<!-- harness:user:l0-custom -->`)

    const domain = mergeAgentsMdContent(domainTemplate, legacy, managedSources)
    const root = mergeAgentsMdContent(rootTemplate, domain, managedSources)

    expect(extractUserSlots(root).get('l0-custom')?.trim()).toBe(legacyRouting)
    expect(root.match(/\| 代码审查 \|/g)).toHaveLength(1)
  })
})

describe('completed AGENTS slots', () => {
  it.each([rootTemplate, domainTemplate])('should clean filled slots and preserve blank placeholders', template => {
    const populated = fillUserSlots(template, new Map([
      ['project', '- Read [Project](docs/project.md).\n'],
      ['verification', '- Read [Tests](docs/testing.md).\n'],
    ]))

    const cleaned = clean(populated)

    expect(cleaned).not.toContain('harness:user:project')
    expect(cleaned).not.toContain('harness:user:verification')
    expect(cleaned).toContain('harness:user:routing')
    expect(cleaned).toContain('- Read [Project](docs/project.md).')
    expect(clean(mergeAgentsMdContent(template, cleaned, managedSources))).toBe(cleaned)
    expect(restoreAgentsMdSlots(cleaned, managedSources)).not.toBeNull()
  })

  it('should recover completely unmarked content and apply framework updates without duplicating it', () => {
    const slots = new Map([...extractUserSlots(rootTemplate).keys()].map(name => [name, `${name}: custom instructions\n`]))
    const cleaned = clean(fillUserSlots(rootTemplate, slots))
    expect(cleaned).not.toContain('harness:user:')

    const updatedTemplate = rootTemplate.replace('# AGENTS.md — Agent 执行契约', '# Updated contract')
    const updated = clean(mergeAgentsMdContent(updatedTemplate, cleaned, managedSources))

    expect(updated).toContain('# Updated contract')
    for (const [name] of slots) {
      expect(updated.split(`${name}: custom instructions`)).toHaveLength(2)
    }
    expect(updated).not.toContain('harness:user:')
  })

  it('should keep the L0 table empty after its cleaned contents are removed', () => {
    const cleared = clean(rootTemplate).replace(legacyRouting, '')
    const merged = mergeAgentsMdContent(rootTemplate, cleared, managedSources)

    expect(extractUserSlots(merged).get('l0-custom')).toBe('')
    expect(clean(merged)).not.toContain('`review-orchestrator` |')
  })

  it.each([`${legacyRouting}\n\n| 部署 | \`project-deploy\` |\n`, ''])(
    'should preserve completed routes across root/domain/root conversion: %j', content => {
      const root = clean(fillUserSlots(rootTemplate, new Map([
        ['l0-custom', content], ['project', '[Project](docs/project.md)\n'],
      ])))
      const domain = clean(mergeAgentsMdContent(domainTemplate, root, managedSources))
      const restored = clean(mergeAgentsMdContent(rootTemplate, domain, managedSources))

      expect(restored).toBe(root)
      expect(domain).toContain('### 保留的专项路由')
      expect(domain.match(/project-deploy/g)?.length ?? 0).toBe(content ? 1 : 0)
      expect(clean(mergeAgentsMdContent(domainTemplate, domain, managedSources))).toBe(domain)
      if (content) expect(domain).not.toContain('harness:user:l0-custom')
    },
  )

  it('should leave unrendered variables and unknown slot boundaries intact', () => {
    const pending = rootTemplate.replace('<!-- harness:user:scope -->\n', '<!-- harness:user:scope -->\n{{SUBMODULE_SECTION}}\n')
    const unknown = `${pending}\n<!-- harness:user:custom -->\nKeep this.\n<!-- /harness:user:custom -->\n`

    expect(clean(unknown)).toContain('<!-- harness:user:scope -->')
    expect(clean(unknown)).toContain('<!-- harness:user:custom -->')
  })

  it('should ignore example anchors inside fenced code blocks', () => {
    const example = '```markdown\n## 7. 项目知识入口\n```\n'
    const populated = fillUserSlots(rootTemplate, new Map([['project', example]]))
    const cleaned = clean(populated)

    expect(cleaned).not.toContain('harness:user:project')
    expect(clean(mergeAgentsMdContent(rootTemplate, cleaned, managedSources))).toBe(cleaned)
  })

  it.each(['```', '~~~~'])('should preserve real content around fenced slot examples (%s)', fence => {
    const body = `- Read [Project](docs/project.md).\n\n${fence}markdown\n<!-- harness:user:project -->\nExample\n<!-- /harness:user:project -->\n${fence}\n\n- Keep the production constraint.\n`
    const populated = fillUserSlots(rootTemplate, new Map([['project', body]]))
    const cleaned = clean(populated)

    expect(cleaned.match(/<!-- harness:user:project -->/g)).toHaveLength(1)
    expect(cleaned).toContain(body.trim())
    expect(clean(mergeAgentsMdContent(rootTemplate, cleaned, managedSources))).toBe(cleaned)
  })

  it.each([
    (content: string) => content.replace('## 7. 项目知识入口', '## Renamed project section'),
    (content: string) => content.replace('项目专属 skill 优先于通用 skill；专项路由仍遵守第 3 节。', 'Changed routing boundary.'),
    (content: string) => `${content}\n## 7. 项目知识入口\nDuplicate anchor.\n`,
    (content: string) => `${content}\n### 保留的专项路由\nA user-owned heading.\n`,
    (content: string) => `${content}\n### 保留的专项路由\nA\n### 保留的专项路由\nB\n`,
  ])('should preserve the entire original when cleaned boundaries become ambiguous', modify => {
    const cleaned = clean(fillUserSlots(rootTemplate, new Map([['project', '[Project](docs/project.md)\n']])))
    const ambiguous = modify(cleaned)
    expect(restoreAgentsMdSlots(ambiguous, managedSources)).toBeNull()
    const merged = clean(mergeAgentsMdContent(rootTemplate, ambiguous, managedSources))

    expect(merged).toContain('从原 AGENTS.md 保留的内容')
    expect(merged).toContain('[Project](docs/project.md)')
    expect(merged).toContain(ambiguous.trim().replaceAll('<!-- harness:user:', '<!-- migrated:harness:user:').replaceAll('<!-- /harness:user:', '<!-- /migrated:harness:user:'))
    expect(clean(mergeAgentsMdContent(rootTemplate, merged, managedSources))).toBe(merged)
  })

  it('should preserve unmarked knowledge when no framework anchors remain', () => {
    const existing = '# Custom contract\n\n<!-- harness:user:scope -->\n<!-- Unfilled -->\n<!-- /harness:user:scope -->\n\n- Read [Project](docs/project.md).\n- Keep the production constraint.\n'
    expect(restoreAgentsMdSlots(existing, managedSources)).toBeNull()

    const merged = clean(mergeAgentsMdContent(rootTemplate, existing, managedSources))

    expect(merged).toContain('# Custom contract')
    expect(merged).toContain('- Read [Project](docs/project.md).')
    expect(merged).toContain('- Keep the production constraint.')
    expect(clean(mergeAgentsMdContent(rootTemplate, merged, managedSources))).toBe(merged)
  })
})
