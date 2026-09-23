import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { extractFrameworkContent, readTemplateFile, renderTemplate } from '../src/lib/templates.js'
import { restoreAgentsMdSlots } from '../src/lib/agents-md.js'

describe('progressive workflow routing contract', () => {
  const template = readTemplateFile('agents-md.md')
  const workflowRouting = fs.readFileSync(
    path.join(process.cwd(), 'templates', 'skills', 'workflow-routing', 'SKILL.md'),
    'utf-8',
  )
  const brainstorming = fs.readFileSync(
    path.join(process.cwd(), 'templates', 'skills', 'brainstorming', 'SKILL.md'),
    'utf-8',
  )
  const continueSkill = fs.readFileSync(
    path.join(process.cwd(), 'templates', 'skills', 'openspec-continue-change', 'SKILL.md'),
    'utf-8',
  )
  const brainstormingSpec = fs.readFileSync(
    path.join(process.cwd(), 'openspec', 'specs', 'brainstorming-workflow', 'spec.md'),
    'utf-8',
  )
  const routingSpec = fs.readFileSync(
    path.join(process.cwd(), 'openspec', 'specs', 'workflow-routing', 'spec.md'),
    'utf-8',
  )
  const managedSkillsSpec = fs.readFileSync(
    path.join(process.cwd(), 'openspec', 'specs', 'embed-superpowers-skills', 'spec.md'),
    'utf-8',
  )

  it('keeps authorization visible before every mutable route', () => {
    const authorization = template.indexOf('## 3. 授权与方案对齐')
    const l0 = template.indexOf('### L0:')
    const l1 = template.indexOf('### L1:')
    const gate = template.slice(authorization, l0)

    expect(authorization).toBeGreaterThan(-1)
    expect(authorization).toBeLessThan(l0)
    expect(authorization).toBeLessThan(l1)
    expect(gate).toContain('仅分析、讨论或请求方案时保持只读')
    expect(gate).toContain('授权不跨目标')
    expect(gate).toContain('用户认可已说明动作与范围的实施方案')
    expect(gate).toContain('普通的实现、修改或修复请求仍需方案对齐')
    expect(gate).toContain('单纯认可方向或补充范围不构成实施授权')
    expect(gate).toContain('已有同范围的方案确认与实施授权')
    expect(gate).toContain('本节适用于所有实现入口')
  })

  it('keeps the L0 discovery index without duplicating specialist algorithms', () => {
    expect(template).toContain('| 代码审查 | `review-orchestrator` |')
    expect(template).toContain('| 测试用例设计 | `test-case-designer` |')
    expect(template).toContain('| 缺陷管理 | `jira-defect-orchestrator` |')
    expect(template).toContain('| 调试、诊断与缺陷修复 | `systematic-debugging` |')
    expect(template).toContain('| 原子提交、推送或 MR/PR | `commit` |')
    expect(template).toContain('专项路由仍遵守第 3 节')
  })

  it('uses AGENTS as a compact bootstrap and lazy routing index', () => {
    expect(template.split('\n').length).toBeLessThanOrEqual(120)
    expect(template).toContain('输入与方案明确时只做基于仓库事实的 Gap Check')
    expect(template).toContain('加载 `brainstorming`')
    expect(template).toContain('加载\n  `workflow-routing`')
    expect(template).toContain('明确的低风险 Direct 不加载它')
    expect(template).toContain('与 Lite 难分时偏向 Direct')
    expect(template).toContain('说明具体价值并取得用户同意')
    expect(template).toContain('说明风险并取得确认')
    expect(template).not.toContain('实施准备度达到 95%')
    expect(template).not.toContain('边界置信度约 80%')
    expect(template).not.toContain('`applyRequires`')
    expect(template).not.toContain('Lite 原地升级 Full')
  })

  it('loads workflow-routing only for ambiguous persistence or governance decisions', () => {
    expect(workflowRouting).toContain('不授予写权限、不创建 change')
    expect(workflowRouting).toContain('Direct 与 Lite\n边界不明确时偏向 Direct')
    expect(workflowRouting).toContain('跨会话恢复')
    expect(workflowRouting).toContain('外部契约风险同时满足')
    expect(workflowRouting).toContain('仅触及 API、CLI、数据库或共享代码不等于 Full 风险')
    expect(workflowRouting).toContain('### Direct → Lite')
    expect(workflowRouting).toContain('### Lite → Full')
    expect(workflowRouting).toContain('回滚 selector')
    expect(workflowRouting).toContain('低成本 diff 自审和完成证据')
    expect(workflowRouting).toContain('明确 Direct 或已由专项 skill 接管的请求不加载')
  })

  it('leaves interview and OpenSpec state machines in their owning skills', () => {
    expect(brainstorming).toContain('边界置信度达到约 80%')
    expect(brainstorming).toContain('实施准备度达到 95%')
    expect(brainstorming).toContain('`D-*`')
    expect(brainstorming).toContain('`A-*`')
    expect(brainstorming).toContain('`O-*`')
    expect(continueSkill).toContain('`DRAFT`')
    expect(continueSkill).toContain('`CONFIRMED`')
    expect(continueSkill).toContain('`applyRequires`')
    expect(continueSkill).toContain('每次投影一个 artifact')
    expect(template).toContain('具体状态、依赖、迁移和恢复算法由 OPSX skills 与 schema 负责')
  })

  it('should distinguish boundary evidence from implementation readiness in score bands', () => {
    const rows = brainstorming.split('\n')
      .filter(line => /^\| (?:\d+–)?\d+% \|/u.test(line))
      .map(line => line.split('|').slice(1, -1).map(cell => cell.trim()))
    const bands = Object.fromEntries(rows.map(([score, ...criteria]) => [score, criteria]))

    expect(Object.keys(bands)).toEqual(['0–55%', '60–75%', '80–85%', '90%', '95%'])
    expect(bands['60–75%'][0]).toMatch(/范围.*职责/u)
    expect(bands['60–75%'][1]).toMatch(/核心链路.*外部能力.*未.*证实/u)
    expect(bands['80–85%'][1]).toMatch(/契约.*恢复.*验证.*未闭合/u)
    expect(bands['90%'][1]).toMatch(/方案.*契约.*闭环.*局部决定/u)
    expect(bands['95%'][1]).toMatch(/无阻塞 O-\*.*确认快照/u)
  })

  it('should require fresh evidence for phase transitions and score changes', () => {
    expect(brainstorming).toMatch(/切换阶段时重新评估，禁止直接沿用上一阶段数值/u)
    expect(brainstorming).toMatch(/不把两个指标写成\s*同一条涨跌轨迹/u)
    expect(brainstorming).toMatch(/范围扩大、新增依赖或假设被推翻.*重估[\s\S]*原分档不再满足时降档/u)
    expect(brainstorming).toMatch(/不得按对话轮数、D\/O 条数或已确认决定数量加分/u)
    expect(brainstorming).toMatch(/分数不变时也要说明\s*本轮进展与限制升档的缺口/u)
    expect(brainstorming).toMatch(/留待实施后执行的验证不自动成为当前阻塞项/u)
    expect(brainstorming).toMatch(/未知\s*能力若可能推翻主方案.*核心可行性缺口/u)
    expect(brainstorming).toContain('数值不单独决定推进')
    expect(brainstorming).toMatch(/100% 仅在用户确认完整快照后使用/u)
  })

  it('preserves cross-entry OpenSpec and quality boundaries in AGENTS', () => {
    expect(template).toContain('OpenSpec 是持久化协调层，不是普通开发的默认前置流程')
    expect(template).toContain('Brainstorming 默认保持 topic-only')
    expect(template).toContain('创建 change、选择 FF、Apply、Archive 和交付动作的授权')
    expect(template).toContain('`brainstorm.md` 是共同设计的唯一语义源')
    expect(template).toContain('已有 active change 按其 selector 继续')
    expect(template).toContain('先运行与改动最接近的验证')
    expect(template).toContain('commit 仅由用户显式选择')
    expect(template).toContain('`docs/` 保存项目知识，`openspec/` 保存任务过程')
  })

  it('keeps persisted specifications aligned with lazy routing ownership', () => {
    expect(brainstormingSpec).toContain('Brainstorming MUST 每轮只处理一个决定')
    expect(brainstormingSpec).toContain('Living brainstorm MUST 是共同设计的唯一语义源')
    expect(routingSpec).toContain('普通开发请求 MUST 按输入成熟度完成共同设计')
    expect(routingSpec).toContain('明确的低风险 Direct SHALL 直接')
    expect(routingSpec).toContain('加载只读\n`workflow-routing` skill')
    expect(routingSpec).toContain('AGENTS MUST 只保留跨入口门禁与按需路由索引')
    expect(managedSkillsSpec).toContain('`workflow-routing` MUST 只在普通开发的')
  })

  it('keeps the dogfood AGENTS and skill synchronized with distributable templates', () => {
    const dogfood = fs.readFileSync(path.join(process.cwd(), 'AGENTS.md'), 'utf-8')
    const dogfoodSkill = fs.readFileSync(
      path.join(process.cwd(), '.harness', 'skills', 'workflow-routing', 'SKILL.md'),
      'utf-8',
    )
    const rendered = renderTemplate(template, { SUBMODULE_SECTION: '<!-- 无子项目 -->' })
    const restored = restoreAgentsMdSlots(dogfood, [rendered])

    expect(restored).not.toBeNull()
    expect(extractFrameworkContent(restored!)).toBe(extractFrameworkContent(rendered))
    expect(dogfoodSkill).toBe(workflowRouting)
  })

  it('documents progressive routing and optional closure actions', () => {
    const readme = fs.readFileSync(path.join(process.cwd(), 'README.md'), 'utf-8')

    expect(readme).toContain('Direct / Lite / Full 渐进工作流')
    expect(readme).toContain('`workflow-routing@1.0.0` 只在 Direct、Lite、Full 边界不清')
    expect(readme).toContain('Living brainstorm → tasks → apply')
    expect(readme).toContain('同一 change 原地升级 Full')
    expect(readme).toContain('一次最终 Review → Verify 报告')
    expect(readme).toContain('用户拒绝 Full 建议后仍可继续 Lite')
    expect(readme).toContain('默认不创建 worktree、不分派实现 subagent')
    expect(readme).toContain('OpenSpec 是持久化协调层')
  })
})
