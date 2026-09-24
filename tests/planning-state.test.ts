import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

const script = path.join(
  process.cwd(),
  'templates',
  'skills',
  'brainstorming',
  'scripts',
  'planning-state.mjs',
)

describe('Living brainstorm planning state', () => {
  let tmpDir: string
  let brainstormPath: string

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'harness-planning-state-'))
    brainstormPath = path.join(tmpDir, 'brainstorm.md')
  })

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true })
  })

  function inspect(source?: string) {
    if (source !== undefined) fs.writeFileSync(brainstormPath, source, 'utf8')
    const result = spawnSync(process.execPath, [script, brainstormPath], { encoding: 'utf8' })
    expect(result.status).toBe(0)
    return JSON.parse(result.stdout) as {
      state: string
      valid: boolean
      applyReady: boolean
      stage: string | null
      needsStageMigration: boolean
      counts?: Record<string, number>
      downstream?: string
      reasons: string[]
    }
  }

  it.each(['探索中', '收敛中'])('should accept a %s Draft without allowing Apply', (stage) => {
    const result = inspect(`# 变更\n\n> **状态：** \`DRAFT\` · **阶段：** ${stage}\n\n## 当前有效决定\n\n#### D-01\n目标。\n\n#### O-01\n待确认。\n\n## Planning 状态\n\n- **下游状态：** \`STALE\`\n`)
    expect(result).toMatchObject({
      state: 'DRAFT', valid: true, applyReady: false, stage, needsStageMigration: false, downstream: 'STALE',
      counts: { D: 1, A: 0, O: 1 },
    })
  })

  it('should keep a ready-to-confirm Draft blocked until the user confirms it', () => {
    const source = '> **状态：** `DRAFT` · **阶段：** 可确认\n\n#### D-01\n目标。\n\n- **下游状态：** `CURRENT`\n'
    const result = inspect(source)
    expect(result).toMatchObject({ state: 'DRAFT', stage: '可确认', valid: true, applyReady: false })
    expect(inspect()).toEqual(result)
    expect(fs.readFileSync(brainstormPath, 'utf8')).toBe(source)
  })

  it('should reject open decisions in a ready-to-confirm Draft', () => {
    const result = inspect('> **状态：** `DRAFT` · **阶段：** 可确认\n\n#### O-01\n待决定。\n\n- **下游状态：** `CURRENT`\n')
    expect(result).toMatchObject({ state: 'DRAFT', valid: false, applyReady: false })
    expect(result.reasons).toContain('可确认阶段不能包含开放项 O-*')
  })

  it.each(['75', '95', '100'])('should read a legacy %s%% Draft without mapping its score to a stage', (score) => {
    const source = `> **状态：** \`DRAFT\` · **实施准备度：** ${score}%\n\n#### D-01\n目标。\n\n- **下游状态：** \`CURRENT\`\n`
    const result = inspect(source)
    expect(result).toMatchObject({
      state: 'DRAFT', valid: true, applyReady: false, stage: null, needsStageMigration: true,
      counts: { D: 1, A: 0, O: 0 }, downstream: 'CURRENT',
    })
    expect(result).not.toHaveProperty('readiness')
    expect(fs.readFileSync(brainstormPath, 'utf8')).toBe(source)
    const migrated = inspect(source.replace(`**实施准备度：** ${score}%`, '**阶段：** 探索中'))
    expect(migrated).toMatchObject({
      state: 'DRAFT', valid: true, applyReady: false, stage: '探索中', needsStageMigration: false,
      counts: result.counts, downstream: result.downstream,
    })
  })

  it.each(['已确认', '90%', ''])('should reject an unsupported stage %j', (stage) => {
    const result = inspect(`> **状态：** \`DRAFT\` · **阶段：** ${stage}\n\n- **下游状态：** \`CURRENT\`\n`)
    expect(result).toMatchObject({ state: 'INVALID', valid: false, applyReady: false })
    expect(result.reasons).toContain('状态行格式无效')
  })

  it('only marks a count-consistent Confirmed snapshot with current projections apply-ready', () => {
    const result = inspect(`# 变更\n\n> **状态：** \`CONFIRMED\` · **确认项：** 2 D / 1 A / 0 O\n\n## 当前有效决定\n\n#### D-01\n目标。\n\n#### D-02\n验收。\n\n## Agent 自主范围\n\n#### A-01\n命名。\n\n## 开放问题\n\n无。\n\n## Planning 状态\n\n- **下游状态：** \`CURRENT\`\n`)
    expect(result).toMatchObject({ state: 'CONFIRMED', valid: true, applyReady: true })
  })

  it.each(['NONE', 'STALE'])('should keep a Confirmed snapshot with %s projections blocked', (downstream) => {
    const result = inspect(`> **状态：** \`CONFIRMED\` · **确认项：** 1 D / 0 A / 0 O\n\n#### D-01\n目标。\n\n- **下游状态：** \`${downstream}\`\n`)
    expect(result).toMatchObject({ state: 'CONFIRMED', valid: true, applyReady: false, downstream })
  })

  it('should reject conflicting Draft and Confirmed status lines', () => {
    const result = inspect('> **状态：** `CONFIRMED` · **确认项：** 1 D / 0 A / 0 O\n> **状态：** `DRAFT` · **阶段：** 收敛中\n\n#### D-01\n目标。\n\n- **下游状态：** `CURRENT`\n')
    expect(result).toMatchObject({ valid: false, applyReady: false })
    expect(result.reasons.join('\n')).toContain('状态行数量必须为 1')
  })

  it.each([
    { status: '`DRAFT` · **阶段：** 收敛中', downstream: 'CURRENT', ready: false },
    { status: '`CONFIRMED` · **确认项：** 1 D / 0 A / 0 O', downstream: 'CURRENT', ready: true },
    { status: '`CONFIRMED` · **确认项：** 1 D / 0 A / 0 O', downstream: 'STALE', ready: false },
  ])('should preserve confirmation gates when discussion depth changes ($status / $downstream)', ({ status, downstream, ready }) => {
    const legacy = `> **状态：** ${status}\n\n#### D-01\n目标。\n\n## Planning 状态\n\n- **下游状态：** \`${downstream}\`\n`
    const baseline = inspect(legacy)
    expect(baseline).toMatchObject({ valid: true, applyReady: ready, counts: { D: 1, A: 0, O: 0 } })

    for (const depth of ['lite', 'full']) {
      for (const origin of ['用户指定', '工作流默认', '上下文默认']) {
        const source = `${legacy}- **讨论深度：** \`${depth}\`\n- **选择来源：** ${origin}\n`
        expect(inspect(source)).toEqual(baseline)
        expect(fs.readFileSync(brainstormPath, 'utf8')).toBe(source)
      }
    }
    expect(inspect(legacy)).toEqual(baseline)
  })

  it('rejects open items, duplicate ids, and mismatched snapshot counts', () => {
    const result = inspect(`# 变更\n\n> **状态：** \`CONFIRMED\` · **确认项：** 1 D / 0 A / 0 O\n\n#### D-01\n一。\n\n#### D-01\n重复。\n\n#### O-01\n未决。\n\n## Planning 状态\n\n- **下游状态：** \`CURRENT\`\n`)
    expect(result.state).toBe('CONFIRMED')
    expect(result.valid).toBe(false)
    expect(result.applyReady).toBe(false)
    expect(result.reasons.join('\n')).toMatch(/重复确认项|O 计数不一致|不能包含开放项/u)
  })

  it('marks pre-Living documents as Legacy for lazy migration', () => {
    const result = inspect('# 旧 brainstorm\n\n## 目标\n已有内容。\n')
    expect(result).toMatchObject({ state: 'LEGACY', valid: false, applyReady: false })
  })

  it('reports a missing brainstorm without writing it', () => {
    const result = inspect()
    expect(result).toMatchObject({ state: 'MISSING', valid: false, applyReady: false })
    expect(fs.existsSync(brainstormPath)).toBe(false)
  })
})
