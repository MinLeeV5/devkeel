import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { describe, expect, it } from 'vitest'

const integrationDir = path.join(process.cwd(), 'tests', 'integration')

function readScenario(name: string): string {
  return fs.readFileSync(path.join(integrationDir, 'scenarios', name, 'scenario.sh'), 'utf-8')
}

describe('OPSX integration scenario coverage', () => {
  const scenarios = [
    'workflow-routing',
    'opsx-new',
    'opsx-ff',
    'opsx-lite-cycle',
    'opsx-explicit-full',
    'opsx-migrated-full',
    'opsx-full-cycle',
  ]

  it('registers every direct, lite, and full scenario in the full runner', () => {
    const runner = fs.readFileSync(path.join(integrationDir, 'run-all.sh'), 'utf-8')
    for (const scenario of scenarios) {
      expect(runner).toContain(`"${scenario}"`)
    }
  })

  it('loads the AGENTS routing contract in fixture Claude sessions', () => {
    const fixture = fs.readFileSync(path.join(integrationDir, 'lib', 'setup-fixture.sh'), 'utf-8')
    expect(fixture).toContain('templates/agents-md.md')
    expect(fixture).toContain('@AGENTS.md')
  })

  it('keeps agent transcripts outside the fixture worktree fingerprint', () => {
    const runner = fs.readFileSync(path.join(integrationDir, 'run-scenario.sh'), 'utf-8')
    expect(runner).toContain('OUTPUT_DIR="$FIXTURE_DIR/.git/harness-test-output"')
    expect(runner).not.toContain('OUTPUT_DIR="$FIXTURE_DIR/.test-output"')
  })

  it('covers direct, decision-gated lite, in-place promotion, refusal, and confirmed external full risk', () => {
    const scenario = readScenario('workflow-routing')
    expect(scenario).toContain('Obvious local edit completed directly')
    expect(scenario).toContain('Unconfirmed lite discussion')
    expect(scenario).toContain('Confirmed discussion materialized as lite')
    expect(scenario).toContain('Unconfirmed direct upgrade')
    expect(scenario).toContain('不得把没有验证的实现任务预先勾选')
    expect(scenario).toContain('Early promotion preserved brainstorm in the same change')
    expect(scenario).toContain('Promotion backfilled Full planning and preserved brainstorm plus checked/unchecked task scope')
    expect(scenario).toContain('<!-- harness:lite-to-full-promotion -->')
    expect(scenario).toContain('<!-- harness:full-tasks-reconciled -->')
    expect(scenario).toContain('Early promotion preserved Full planning and created actionable reconciled tasks')
    expect(scenario).toContain("grep -q '^## Final Verification' \"$EARLY_DIR/tasks.md\"")
    expect(scenario).toContain('Current Full marker forced recovery of missing mandatory planning')
    expect(scenario).toContain('assert_bash_called "openspec instructions apply.*--change.*current-full-planning-recovery"')
    expect(scenario).toContain('CURRENT_FULL_APPLY_TEXT')
    expect(scenario).toContain("CURRENT_FULL_APPLY_TEXT\" | grep -q 'current-full-planning-recovery'")
    expect(scenario).toContain('/opsx:continue|missing')
    expect(scenario).toContain('Apply refused current Full with incomplete mandatory planning')
    expect(scenario).toContain("grep -q 'Coordinate the verified theme rollout' \"$PROMOTION_DIR/brainstorm.md\"")
    expect(scenario).toContain("grep -q '^- \\[ \\].*Implement the coordinated rollout' \"$PROMOTION_DIR/tasks.md\"")
    expect(scenario).toContain('Interrupted promotion preserved Full planning and reconciled tasks before Apply')
    expect(scenario).toContain('Refused full recommendation remained on lite')
    expect(scenario).toContain('External contract risk recommended full')
    expect(scenario).toContain('Unconfirmed full recommendation')
  })

  it('covers contextual lite, no-context lite, and explicit full overrides', () => {
    const newScenario = readScenario('opsx-new')
    const ffScenario = readScenario('opsx-ff')
    const explicitFull = readScenario('opsx-explicit-full')
    expect(newScenario).toContain('--schema lite')
    expect(newScenario).toContain('explicit-full')
    expect(newScenario).toContain('--schema full')
    expect(ffScenario).toContain('Explicit /opsx:ff selected default lite')
    expect(ffScenario).toContain('explicitly confirmed snapshot')
    expect(ffScenario).toContain('brainstorm.md')
    expect(ffScenario).toContain('tasks.md')
    expect(ffScenario).toContain('planning-state.mjs')
    expect(ffScenario).toContain('design.md')
    expect(explicitFull).toContain('Explicit full selection was preserved')
  })

  it('covers lite failure recovery, successful archive, and all_done recovery without heavy tools', () => {
    const scenario = readScenario('opsx-lite-cycle')
    expect(scenario).toContain('brainstorm.md')
    expect(scenario).toContain('assert_bash_called "node -e.*process.exit(23)"')
    expect(scenario).toContain('assert_bash_called "test.*cat LITE_MARKER.md"')
    expect(scenario).toContain('Failed verification left the task unchecked')
    expect(scenario).toContain('Failed lite apply kept the change active')
    expect(scenario).toContain('openspec archive.* -y')
    expect(scenario).not.toContain('--skip-specs')
    expect(scenario).toContain('Successful lite apply archived the change')
    expect(scenario).toContain('all_done recovery archived the change')
    expect(scenario).toContain('ordinary lite apply invoked a heavy skill')
  })

  it('covers continue and apply after a legacy full selector migration', () => {
    const scenario = readScenario('opsx-migrated-full')
    expect(scenario).toContain('superpowers-lite')
    expect(scenario).toContain("sed 's/^schema: superpowers-lite$/schema: full/'")
    expect(scenario).toContain('Legacy full status remained equivalent after migration')
    expect(scenario).toContain('/opsx:continue')
    expect(scenario).toContain('/opsx:apply')
    expect(scenario).toContain('> mode: inline')
    expect(scenario).toContain('> commit:')
    expect(scenario).toContain('assert_skill_triggered "review-orchestrator"')
    expect(scenario).toContain('assert_skill_triggered "openspec-verify-change"')
    expect(scenario).toContain('Migrated Full ignored legacy mode and commit directives')
    expect(scenario).toContain('assert_file_exists "$FIXTURE_DIR/MIGRATED_FULL.md"')
    expect(scenario).toContain('assert_bash_called "test -f MIGRATED_FULL.md"')
    expect(scenario).toContain('preserved the full lifecycle')
  })

  it('covers the current-Agent Full apply, final review, verify, archive, and force path', () => {
    const scenario = readScenario('opsx-full-cycle')
    expect(scenario).toContain('## Final Verification')
    expect(scenario).toContain('assert_skill_triggered "review-orchestrator"')
    expect(scenario).toContain('assert_skill_triggered "openspec-verify-change"')
    expect(scenario).toContain('produced a PASS verification report')
    expect(scenario).toContain('Verify recorded reviewed closure provenance')
    expect(scenario).toContain('Full archive rejected stale verification')
    expect(scenario).toContain('assert_file_exists "$FIXTURE_DIR/FULL_CYCLE_MARKER.md"')
    expect(scenario).toContain('retrospective.md')
    expect(scenario).toContain('openspec/specs/full-cycle-marker/spec.md')
    expect(scenario).toContain('openspec/specs/force-fixture/spec.md')
    expect(scenario).toContain('openspec archive.*-y')
    expect(scenario).toContain('--force')
    expect(scenario).toContain('--no-validate')
    expect(scenario).toContain('DevKeel force mapped only to supported OpenSpec flags')
    expect(scenario).toContain('^- 用户选择：')
    expect(scenario).toContain('^- 绕过门禁：')
    expect(scenario).toContain('incomplete-tasks')
    expect(scenario).toContain('verify-missing')
    expect(scenario).toContain('final-review-missing')
    expect(scenario).toContain('openspec-validation')
    expect(scenario).toContain('^- 观察证据：')
    expect(scenario).toContain('^- 剩余风险：')
    expect(scenario).toContain('^- 恢复动作：')
    expect(scenario).toContain('every bypassed gate, evidence, risk, and recovery')
    expect(scenario).toContain('Full archive stopped before delivery actions')
    expect(scenario).not.toContain('assert_skill_triggered "executing-plans"')
  })

  it('keeps every integration script syntactically valid', () => {
    const scripts = [
      path.join(integrationDir, 'lib', 'setup-fixture.sh'),
      path.join(integrationDir, 'run-all.sh'),
      ...scenarios.map(name => path.join(integrationDir, 'scenarios', name, 'scenario.sh')),
    ]
    for (const script of scripts) {
      const result = spawnSync('bash', ['-n', script], { encoding: 'utf-8' })
      expect(result.status, `${script}: ${result.stderr}`).toBe(0)
    }
  })
})
